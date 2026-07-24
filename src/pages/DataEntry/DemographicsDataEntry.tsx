import { getDefaultYear } from '@/utils/yearUtils';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { ExportColumn } from '@/components/common/DataExportImport';
import type { Database } from '../../types/database';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../hooks/useAuth';
import { submitForApproval, getLatestApproval, notifySuperAdminsOfDirectSave } from '../../utils/approvalUtils';
import { useDataEntryStats } from '@/hooks/queries/useDataEntryStats';
import DataEntryLayout from '@/components/layout/DataEntryLayout';
import { MobileDataCard } from '@/components/common/MobileDataCard';
import { MobileDataInput, SplitInputWrapper } from '@/components/common/MobileDataInput';

type PopStat = Database['public']['Tables']['population_stats']['Row'];

export default function DemographicsDataEntry() {
  const { isSuperAdmin, canWrite } = useRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [popStats, setPopStats] = useState<Record<string, Partial<PopStat>>>({});
  const [originalPopStats, setOriginalPopStats] = useState<Record<string, Partial<PopStat>>>({});
  const [activeTab, setActiveTab] = useState('main');
  const [year, setYear] = useState(getDefaultYear(`Demographics & Population_${'main'}`));

  useEffect(() => {
    setYear(getDefaultYear('Demographics & Population_' + activeTab));
  }, [activeTab]);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any> | null>(null);

  const { data: dynamicSchemas = [] } = useQuery({
    queryKey: ['dynamic_schemas', 'Demographics & Population'],
    queryFn: async () => {
      const { data } = await supabase.from('dynamic_schemas').select('*').eq('department', 'Demographics & Population');
      return data || [];
    }
  });

  const tabLabel = activeTab === 'main' ? 'Demographics' : (dynamicSchemas.find(d => d.id === activeTab)?.tab_name || 'Demographics');

  const { data: latestApproval } = useQuery({
    queryKey: ['latest_approval', 'Demographics & Population', tabLabel, year],
    queryFn: () => getLatestApproval('Demographics & Population', tabLabel, year)
  });

  const isLocked = latestApproval && latestApproval.status === 'pending' && !isSuperAdmin;

  const { data: fetchedData, isLoading } = useDataEntryStats('Demographics', 'population_stats', year);

  useEffect(() => {
    if (fetchedData) {
      setPopStats(fetchedData.stats);
      setOriginalPopStats(JSON.parse(JSON.stringify(fetchedData.stats)));
    }
  }, [fetchedData]);

  const barangays = fetchedData?.barangays || [];

  const handlePopChange = (barangayId: string, field: keyof PopStat, value: string) => {
    const numValue = value === '' ? (field === 'total_population' || field === 'total_households' ? null : 0) : parseInt(value, 10);

    setPopStats((prev) => {
      const prevRow = prev[barangayId] || {};
      if (field === 'total_population') {
        return {
          ...prev,
          [barangayId]: {
            ...prevRow,
            total_population: numValue,
            male_count: 0,
            female_count: 0,
          },
        };
      }
      if (field === 'total_households') {
        return {
          ...prev,
          [barangayId]: {
            ...prevRow,
            total_households: numValue,
            household_heads_total: numValue,
          },
        };
      }
      return {
        ...prev,
        [barangayId]: {
          ...prevRow,
          [field]: numValue,
          ...(field === 'male_count' || field === 'female_count' ? { total_population: null } : {}),
        },
      };
    });
  };

  const handleImport = (importedData: any[]) => {
    setPopStats(prev => {
      const updated = { ...prev };
      importedData.forEach((row) => {
        const bName = (row.barangay_name || '').trim().toLowerCase();
        const b = barangays.find(b => b.name.trim().toLowerCase() === bName);
        if (b) {
          const m = Number(row.male_count || 0);
          const f = Number(row.female_count || 0);
          const totPop = row.total_population != null && row.total_population !== '' ? Number(row.total_population) : null;
          const totHh = row.total_households != null && row.total_households !== '' ? Number(row.total_households) : (row.household_heads_total != null ? Number(row.household_heads_total) : null);

          const hasMF = m > 0 || f > 0;
          updated[b.id] = {
            ...updated[b.id],
            male_count: m,
            female_count: f,
            total_population: hasMF ? null : totPop,
            total_households: totHh,
            household_heads_total: totHh,
          };
        }
      });
      return updated;
    });
    toast.success('Data imported successfully!');
  };

  const mutation = useMutation({
    mutationFn: async (changedData: Record<string, any>) => {
      if (isSuperAdmin) {
        const upsertData = Object.keys(changedData).map(bId => {
           const rowChanges: any = {};
           Object.keys(changedData[bId]).forEach(k => {
             if (k !== 'total_households') {
               rowChanges[k] = changedData[bId][k].new;
             }
           });
           const maleCount = rowChanges.male_count ?? (popStats[bId]?.male_count || 0);
           const femaleCount = rowChanges.female_count ?? (popStats[bId]?.female_count || 0);
           const hasMF = (maleCount > 0) || (femaleCount > 0);
           const finalTotPop = hasMF ? (maleCount + femaleCount) : (rowChanges.total_population ?? popStats[bId]?.total_population ?? null);
           const totHouseholds = changedData[bId].total_households?.new ?? changedData[bId].household_heads_total?.new ?? popStats[bId]?.total_households ?? popStats[bId]?.household_heads_total ?? null;

           const rowPayload: any = {
             barangay_id: bId,
             year,
             month_updated: new Date().getMonth() + 1,
             ...rowChanges,
             total_population: finalTotPop,
             household_heads_total: totHouseholds,
           };
           delete rowPayload.total_households;
           return rowPayload;
        });
        
        const { error } = await supabase.from('population_stats').upsert(upsertData, { onConflict: 'barangay_id,year' });
        if (error) throw error;
        
        await notifySuperAdminsOfDirectSave('Demographics & Population', 'Demographics', year, user!.id);
      } else {
        await submitForApproval('Demographics & Population', 'Demographics', year, changedData, user!.id);
      }
    },
    onSuccess: () => {
      toast.success(isSuperAdmin ? `Demographics & Population data saved directly!` : `Changes submitted for approval!`);
      queryClient.invalidateQueries({ queryKey: ['native_data', 'Demographics', year] });
      queryClient.invalidateQueries({ queryKey: ['latest_approval', 'Demographics & Population', tabLabel, year] });
      queryClient.invalidateQueries({ queryKey: ['demographics_stats', year] });
      queryClient.invalidateQueries({ queryKey: ['main_dashboard_stats'] });
      setShowConfirmModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save data');
    }
  });

  const handleSaveAll = () => {
    const changedData: Record<string, any> = {};
    const fields = ['male_count', 'female_count', 'total_population', 'total_households', 'household_heads_total'];

    barangays.forEach(b => {
      const row = popStats[b.id] || {};
      const originalRow = originalPopStats[b.id] || {};
      
      let hasChanges = false;
      const currentChanges: any = {};
      
      fields.forEach(f => {
        const key = f as any;
        const oldVal = (originalRow as any)[key] ?? null;
        const newVal = (row as any)[key] ?? null;
        if (newVal !== oldVal) {
          hasChanges = true;
        }
        currentChanges[f] = { old: oldVal, new: newVal };
      });

      if (hasChanges) {
        changedData[b.id] = currentChanges;
      }
    });

    if (Object.keys(changedData).length === 0) {
       toast('No changes to save.', { icon: 'ℹ️' });
       return;
    }

    if (isLocked) {
       toast.error('Data is locked pending approval.');
       return;
    }

    if (latestApproval?.status === 'pending' && !isSuperAdmin) {
      setPendingChanges(changedData);
      setShowConfirmModal(true);
      return;
    }

    mutation.mutate(changedData);
  };

  const columns: ExportColumn[] = [
    { header: 'Total Population (M)', key: 'male_count' },
    { header: 'Total Population (F)', key: 'female_count' },
    { header: 'Total Population (Total)', key: 'total_population' },
    { header: 'Total Households', key: 'total_households' },
  ];

  return (
    <DataEntryLayout
      moduleName="Demographics & Population"
      pageTitle="Demographics Data Entry"
      pageDescription="Manage Demographics stats"
      breadcrumbTitle={`Demographics & Population ${!canWrite ? 'View Data' : 'Data Entry'}`}
      gridTitle="Demographics Grid"
      gridDescription={`Manage population and household data for ${barangays.length} barangays.`}
      year={year}
      setYear={setYear}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      dynamicSchemas={dynamicSchemas}
      barangays={barangays}
      nativeTabs={[{ key: 'main', label: 'Demographics Overview' }]}
      isLocked={isLocked}
      latestApproval={latestApproval}
      isSuperAdmin={isSuperAdmin}
      canWrite={canWrite}
      exportData={barangays.map(b => {
        const pRow = popStats[b.id] || {};
        const mM = pRow.male_count != null ? Number(pRow.male_count) : 0;
        const fF = pRow.female_count != null ? Number(pRow.female_count) : 0;
        const totP = pRow.total_population ?? ((mM + fF) || 0);
        const totHh = pRow.total_households ?? pRow.household_heads_total ?? 0;
        return {
          barangay_name: b.name,
          male_count: mM,
          female_count: fF,
          total_population: totP,
          total_households: totHh,
        };
      })}
      exportColumns={columns}
      exportTitle={`Demographics & Population (${year})`}
      onImport={handleImport}
      onSave={handleSaveAll}
      isSaving={mutation.isPending}
      isLoading={isLoading}
      showConfirmModal={showConfirmModal}
      setShowConfirmModal={setShowConfirmModal}
      onConfirmSave={() => { if(pendingChanges) mutation.mutate(pendingChanges) }}
    >
      <>
      <div className="hidden lg:block w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[750px] text-left text-sm text-gray-600 dark:text-gray-300">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
               <tr>
                 <th className="whitespace-nowrap px-4 py-3 font-medium border-b dark:border-gray-800" rowSpan={2}>Barangay</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-blue-600 dark:text-blue-400" colSpan={3}>Total Population</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l border-r dark:border-gray-800 text-indigo-600 dark:text-indigo-400" colSpan={1} rowSpan={2}>Total Households</th>
               </tr>
             <tr>
               <th className="px-2 py-2 text-center border-l dark:border-gray-800">M</th>
               <th className="px-2 py-2 text-center">F</th>
               <th className="px-2 py-2 text-center bg-gray-100 dark:bg-gray-800/50 border-r dark:border-gray-800">Total</th>
             </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {barangays.map((b) => {
            const pRow = popStats[b.id] || {};
            const mM = Number(pRow.male_count || 0);
            const fF = Number(pRow.female_count || 0);
            const totPop = pRow.total_population;
            const hasMF = mM > 0 || fF > 0;

            return (
              <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white ">
                  {b.name}
                </td>
                
                <td className="px-0 py-0 border-l dark:border-gray-800 bg-blue-50/30 dark:bg-blue-900/10">
                  <input 
                    type="number" min="0" 
                    value={pRow['male_count'] || ''} 
                    onChange={(e) => handlePopChange(b.id, 'male_count', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                  />
                </td>
                <td className="px-0 py-0 bg-blue-50/30 dark:bg-blue-900/10">
                  <input 
                    type="number" min="0" 
                    value={pRow['female_count'] || ''} 
                    onChange={(e) => handlePopChange(b.id, 'female_count', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                  />
                </td>
                {hasMF ? (
                  <td className="px-4 py-3 border-r dark:border-gray-800 text-center font-medium bg-gray-100 dark:bg-gray-800/50">
                    {mM + fF}
                  </td>
                ) : (
                  <td className="px-0 py-0 text-center font-medium bg-amber-50/40 dark:bg-amber-900/10 border-r dark:border-gray-800">
                    <input 
                      type="number" min="0" 
                      placeholder="Total"
                      value={totPop ?? ''} 
                      onChange={(e) => handlePopChange(b.id, 'total_population', e.target.value)} 
                      disabled={!canWrite || isLocked} 
                      className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center text-brand-600 dark:text-brand-400 font-semibold outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 placeholder:text-gray-400 placeholder:font-normal" 
                    />
                  </td>
                )}

                <td className="px-0 py-0 border-l border-r dark:border-gray-800 bg-indigo-50/30 dark:bg-indigo-900/10">
                  <input 
                    type="number" min="0" 
                    value={pRow.total_households ?? pRow.household_heads_total ?? ''} 
                    onChange={(e) => handlePopChange(b.id, 'total_households', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[100px] bg-transparent px-3 py-2 text-center text-indigo-700 dark:text-indigo-300 font-semibold outline-none focus:bg-indigo-100 dark:focus:bg-indigo-900/40 disabled:opacity-100" 
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-amber-50/80 dark:bg-amber-950/30 font-bold border-t-2 border-amber-300 dark:border-amber-800 text-gray-900 dark:text-white">
          {(() => {
            let popM = 0; let popF = 0; let popTot = 0;
            let hhTot = 0;

            barangays.forEach(b => {
              const pRow = popStats[b.id] || {};
              const mM = Number(pRow.male_count || 0);
              const fF = Number(pRow.female_count || 0);
              const totP = pRow.total_population != null ? Number(pRow.total_population) : null;
              popM += mM;
              popF += fF;
              popTot += (totP ?? (mM + fF));

              const hVal = pRow.total_households ?? pRow.household_heads_total ?? ((pRow.household_heads_m || 0) + (pRow.household_heads_f || 0));
              hhTot += Number(hVal || 0);
            });

            return (
              <tr>
                <td className="whitespace-nowrap px-4 py-3 font-extrabold text-brand-700 dark:text-brand-300">Total</td>
                <td className="px-2 py-3 text-center border-l dark:border-gray-800 text-blue-700 dark:text-blue-300 font-bold">{popM.toLocaleString()}</td>
                <td className="px-2 py-3 text-center text-blue-700 dark:text-blue-300 font-bold">{popF.toLocaleString()}</td>
                <td className="px-4 py-3 text-center font-extrabold bg-amber-100/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border-r dark:border-gray-800">{popTot.toLocaleString()}</td>
                <td className="px-4 py-3 text-center font-extrabold bg-amber-100/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border-l border-r dark:border-gray-800">{hhTot.toLocaleString()}</td>
              </tr>
            );
          })()}
        </tfoot>
        </table>
      </div>
      <div className="block lg:hidden mt-2">
        {barangays.map((b) => {
          const pRow = popStats[b.id] || {};
          const maleCount = pRow.male_count || 0;
          const femaleCount = pRow.female_count || 0;

          return (
            <MobileDataCard key={b.id} title={b.name}>
              <MobileDataInput label="Total Population" type="split">
                <SplitInputWrapper
                  inputMale={<input type="number" min="0" value={pRow.male_count || ''} onChange={(e) => handlePopChange(b.id, 'male_count', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  inputFemale={<input type="number" min="0" value={pRow.female_count || ''} onChange={(e) => handlePopChange(b.id, 'female_count', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  total={maleCount + femaleCount}
                />
              </MobileDataInput>
              <MobileDataInput label="Total Households">
                <input 
                  type="number" min="0" 
                  value={pRow.total_households ?? pRow.household_heads_total ?? ''} 
                  onChange={(e) => handlePopChange(b.id, 'total_households', e.target.value)} 
                  disabled={!canWrite || isLocked} 
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" 
                />
              </MobileDataInput>
            </MobileDataCard>
          );
        })}
      </div>
      </>
    </DataEntryLayout>
  );
}
