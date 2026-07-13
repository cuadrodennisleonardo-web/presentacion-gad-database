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
  const [year, setYear] = useState(new Date().getFullYear());
  
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
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setPopStats((prev) => ({
      ...prev,
      [barangayId]: {
        ...prev[barangayId],
        [field]: numValue,
      },
    }));
  };

  const handleImport = (importedData: any[]) => {
    importedData.forEach((row) => {
      const b = barangays.find(b => b.name.toLowerCase() === row.barangay_name?.toLowerCase());
      if (b) {
        Object.keys(row).forEach(key => {
          if (key !== 'barangay_name') {
            if (['male_count', 'female_count', 'household_heads_m', 'household_heads_f'].includes(key)) {
              handlePopChange(b.id, key as keyof PopStat, String(row[key]));
            }
          }
        });
      }
    });
    toast.success('Data imported successfully!');
  };

  const mutation = useMutation({
    mutationFn: async (changedData: Record<string, any>) => {
      if (isSuperAdmin) {
        const upsertData = Object.keys(changedData).map(bId => {
           const rowChanges: any = {};
           Object.keys(changedData[bId]).forEach(k => {
             rowChanges[k] = changedData[bId][k].new;
           });
           // Derive total_population from male + female counts so dashboards show correct totals
           const maleCount = rowChanges.male_count ?? (popStats[bId]?.male_count || 0);
           const femaleCount = rowChanges.female_count ?? (popStats[bId]?.female_count || 0);
           return {
             barangay_id: bId,
             year,
             month_updated: new Date().getMonth() + 1,
             ...rowChanges,
             total_population: (maleCount || 0) + (femaleCount || 0),
           };
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
      // Also refresh the dashboard caches so charts update immediately
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
    const fields = ['male_count', 'female_count', 'household_heads_m', 'household_heads_f'];

    barangays.forEach(b => {
      const row = popStats[b.id] || {};
      const originalRow = originalPopStats[b.id] || {};
      
      let hasChanges = false;
      const currentChanges: any = {};
      
      fields.forEach(f => {
        const key = f as any;
        const oldVal = (originalRow as any)[key] || 0;
        const newVal = (row as any)[key] || 0;
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
    { header: 'Household Heads (M)', key: 'household_heads_m' },
    { header: 'Household Heads (F)', key: 'household_heads_f' },
  ];

  return (
    <DataEntryLayout
      moduleName="Demographics & Population"
      pageTitle="Demographics Data Entry"
      pageDescription="Manage Demographics stats"
      breadcrumbTitle={`Demographics & Population ${!canWrite ? 'View Data' : 'Data Entry'}`}
      gridTitle="Demographics Grid"
      gridDescription={`Manage population and household data for ${barangays.length} barangays. Enter Sex-Disaggregated Data.`}
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
      exportData={barangays.map(b => ({ barangay_name: b.name, ...popStats[b.id] }))}
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
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
               <tr>
                 <th className="whitespace-nowrap px-4 py-3 font-medium border-b dark:border-gray-800" rowSpan={2}>Barangay</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-blue-600 dark:text-blue-400" colSpan={3}>Total Population</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l border-r dark:border-gray-800 text-indigo-600 dark:text-indigo-400" colSpan={3}>Household Heads</th>
               </tr>
             <tr>
               <th className="px-2 py-2 text-center border-l dark:border-gray-800">M</th>
               <th className="px-2 py-2 text-center">F</th>
               <th className="px-2 py-2 text-center bg-gray-100 dark:bg-gray-800/50">Total</th>
               
               <th className="px-2 py-2 text-center border-l dark:border-gray-800">M</th>
               <th className="px-2 py-2 text-center">F</th>
               <th className="px-2 py-2 text-center bg-gray-100 dark:bg-gray-800/50 border-r dark:border-gray-800">Total</th>
             </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {barangays.map((b) => {
            const pRow = popStats[b.id] || {};
            
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
                <td className="px-0 py-0  bg-blue-50/30 dark:bg-blue-900/10">
                  <input 
                    type="number" min="0" 
                    value={pRow['female_count'] || ''} 
                    onChange={(e) => handlePopChange(b.id, 'female_count', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                  />
                </td>
                <td className="px-4 py-3 border-r dark:border-gray-800 text-center font-medium bg-gray-100 dark:bg-gray-800/50">
                  {(pRow.male_count || 0) + (pRow.female_count || 0)}
                </td>

                <td className="px-0 py-0  bg-indigo-50/30 dark:bg-indigo-900/10">
                  <input 
                    type="number" min="0" 
                    value={pRow.household_heads_m || ''} 
                    onChange={(e) => handlePopChange(b.id, 'household_heads_m', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                  />
                </td>
                <td className="px-0 py-0  bg-indigo-50/30 dark:bg-indigo-900/10">
                  <input 
                    type="number" min="0" 
                    value={pRow.household_heads_f || ''} 
                    onChange={(e) => handlePopChange(b.id, 'household_heads_f', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                  />
                </td>
                <td className="px-4 py-3  text-center font-medium bg-gray-100 dark:bg-gray-800/50 border-r dark:border-gray-800">
                  {(pRow.household_heads_m || 0) + (pRow.household_heads_f || 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      
        </table>
      </div>
      <div className="block lg:hidden mt-2">
        {barangays.map((b) => {
          const pRow = popStats[b.id] || {};
          const maleCount = pRow.male_count || 0;
          const femaleCount = pRow.female_count || 0;
          const hhMale = pRow.household_heads_m || 0;
          const hhFemale = pRow.household_heads_f || 0;

          return (
            <MobileDataCard key={b.id} title={b.name}>
              <MobileDataInput label="Total Population" type="split">
                <SplitInputWrapper
                  inputMale={<input type="number" min="0" value={pRow.male_count || ''} onChange={(e) => handlePopChange(b.id, 'male_count', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  inputFemale={<input type="number" min="0" value={pRow.female_count || ''} onChange={(e) => handlePopChange(b.id, 'female_count', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  total={maleCount + femaleCount}
                />
              </MobileDataInput>
              <MobileDataInput label="Household Heads" type="split">
                <SplitInputWrapper
                  inputMale={<input type="number" min="0" value={pRow.household_heads_m || ''} onChange={(e) => handlePopChange(b.id, 'household_heads_m', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  inputFemale={<input type="number" min="0" value={pRow.household_heads_f || ''} onChange={(e) => handlePopChange(b.id, 'household_heads_f', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  total={hhMale + hhFemale}
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
