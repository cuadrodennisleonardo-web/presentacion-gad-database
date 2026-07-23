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

type EconStat = Database['public']['Tables']['econ_dev_stats']['Row'];
type TabType = string;

export default function EconomicDevelopmentDataEntry() {
  const { isSuperAdmin, canWrite } = useRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<TabType>('labor');
  const [year, setYear] = useState(getDefaultYear(`Economic Development_${'labor'}`));

  useEffect(() => {
    setYear(getDefaultYear('Economic Development_' + activeTab));
  }, [activeTab]);
  const [stats, setStats] = useState<Record<string, Partial<EconStat>>>({});
  const [originalStats, setOriginalStats] = useState<Record<string, Partial<EconStat>>>({});
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any> | null>(null);

  const nativeTabs = [
    { key: 'labor', label: 'Labor Force' },
    { key: 'agriculture', label: 'Agriculture & Fisheries' },
    { key: 'commerce', label: 'Commerce & Trade' }
  ];

  const { data: dynamicSchemas = [] } = useQuery({
    queryKey: ['dynamic_schemas', 'Economic Development'],
    queryFn: async () => {
      const { data } = await supabase.from('dynamic_schemas').select('*').eq('department', 'Economic Development');
      return data || [];
    }
  });

  const tabLabel = nativeTabs.find(t => t.key === activeTab)?.label || 
                   dynamicSchemas.find(d => d.id === activeTab)?.tab_name || '';

  const { data: latestApproval } = useQuery({
    queryKey: ['latest_approval', 'Economic Development', tabLabel, year],
    queryFn: () => getLatestApproval('Economic Development', tabLabel, year)
  });

  const isLocked = latestApproval && latestApproval.status === 'pending' && !isSuperAdmin;

  const { data: fetchedData, isLoading } = useDataEntryStats('Economic Development', 'econ_dev_stats', year);

  useEffect(() => {
    if (fetchedData) {
      setStats(fetchedData.stats);
      setOriginalStats(JSON.parse(JSON.stringify(fetchedData.stats)));
    }
  }, [fetchedData]);

  const barangays = fetchedData?.barangays || [];

  const handleChange = (barangayId: string, field: keyof EconStat, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    const prefix = field.toString().replace(/_[mf]$/, '');
    const keyTotal = `${prefix}_total` as keyof EconStat;

    setStats((prev) => ({
      ...prev,
      [barangayId]: {
        ...prev[barangayId],
        [field]: numValue,
        [keyTotal]: null,
      },
    }));
  };

  const handleTotalChange = (barangayId: string, prefix: string, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    const keyTotal = `${prefix}_total` as keyof EconStat;
    const keyM = `${prefix}_m` as keyof EconStat;
    const keyF = `${prefix}_f` as keyof EconStat;

    setStats((prev) => ({
      ...prev,
      [barangayId]: {
        ...prev[barangayId],
        [keyTotal]: numValue,
        [keyM]: 0,
        [keyF]: 0,
      },
    }));
  };

  const getExportColumns = (): ExportColumn[] => {
    if (activeTab === 'labor') return [
      { header: 'Employed (M)', key: 'employed_m' },
      { header: 'Employed (F)', key: 'employed_f' },
      { header: 'Employed (Total)', key: 'employed_total' },
      { header: 'Unemployed (M)', key: 'unemployed_m' },
      { header: 'Unemployed (F)', key: 'unemployed_f' },
      { header: 'Unemployed (Total)', key: 'unemployed_total' },
    ];
    if (activeTab === 'agriculture') return [
      { header: 'Farmers (M)', key: 'farmers_m' },
      { header: 'Farmers (F)', key: 'farmers_f' },
      { header: 'Farmers (Total)', key: 'farmers_total' },
      { header: 'Fisherfolks (M)', key: 'fisherfolks_m' },
      { header: 'Fisherfolks (F)', key: 'fisherfolks_f' },
      { header: 'Fisherfolks (Total)', key: 'fisherfolks_total' },
    ];
    return [
      { header: 'Business Owners (M)', key: 'business_owners_m' },
      { header: 'Business Owners (F)', key: 'business_owners_f' },
      { header: 'Business Owners (Total)', key: 'business_owners_total' },
      { header: 'Ambulant Vendors (M)', key: 'ambulant_vendors_m' },
      { header: 'Ambulant Vendors (F)', key: 'ambulant_vendors_f' },
      { header: 'Ambulant Vendors (Total)', key: 'ambulant_vendors_total' },
    ];
  };

  const renderIndicatorCells = (barangayId: string, row: any, prefix: string, isLastInGroup: boolean) => {
    const kM = prefix + '_m';
    const kF = prefix + '_f';
    const kTot = prefix + '_total';

    const mM = Number(row[kM] || 0);
    const fF = Number(row[kF] || 0);
    const rawTot = row[kTot];

    const hasMF = mM > 0 || fF > 0;
    const borderRight = isLastInGroup ? 'border-r dark:border-gray-800' : '';

    return (
      <>
        <td className="px-0 py-0 border-l dark:border-gray-800 bg-blue-50/30 dark:bg-blue-900/10">
          <input 
            type="number" min="0" 
            value={row[kM] || ''} 
            onChange={(e) => handleChange(barangayId, kM as any, e.target.value)} 
            disabled={!canWrite || isLocked} 
            className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
          />
        </td>
        <td className="px-0 py-0 bg-blue-50/30 dark:bg-blue-900/10">
          <input 
            type="number" min="0" 
            value={row[kF] || ''} 
            onChange={(e) => handleChange(barangayId, kF as any, e.target.value)} 
            disabled={!canWrite || isLocked} 
            className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
          />
        </td>
        {hasMF ? (
          <td className={`px-4 py-3 text-center font-medium bg-gray-100 dark:bg-gray-800/50 ${borderRight}`}>
            {mM + fF}
          </td>
        ) : (
          <td className={`px-0 py-0 text-center font-medium bg-amber-50/40 dark:bg-amber-900/10 ${borderRight}`}>
            <input 
              type="number" min="0" 
              placeholder="Total"
              value={rawTot ?? ''} 
              onChange={(e) => handleTotalChange(barangayId, prefix, e.target.value)} 
              disabled={!canWrite || isLocked} 
              className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center text-brand-600 dark:text-brand-400 font-semibold outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 placeholder:text-gray-400 placeholder:font-normal" 
            />
          </td>
        )}
      </>
    );
  };

  const handleImport = (importedData: any[]) => {
    const fields = getExportColumns().map(c => c.key);
    importedData.forEach((row) => {
      const b = barangays.find(b => b.name.toLowerCase() === row.barangay_name?.toLowerCase());
      if (b) {
        Object.keys(row).forEach(key => {
          if (key !== 'barangay_name' && fields.includes(key)) {
            handleChange(b.id, key as keyof EconStat, String(row[key]));
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
           return {
             barangay_id: bId,
             year,
             month_updated: new Date().getMonth() + 1,
             ...rowChanges
           };
        });
        
        const { error } = await supabase.from('econ_dev_stats').upsert(upsertData, { onConflict: 'barangay_id,year' });
        if (error) throw error;
        
        await notifySuperAdminsOfDirectSave('Economic Development', tabLabel, year, user!.id);
      } else {
        await submitForApproval('Economic Development', tabLabel, year, changedData, user!.id);
      }
    },
    onSuccess: () => {
      toast.success(isSuperAdmin ? `Economic Development data saved directly!` : `Changes submitted for approval!`);
      queryClient.invalidateQueries({ queryKey: ['native_data', 'Economic Development', year] });
      queryClient.invalidateQueries({ queryKey: ['latest_approval', 'Economic Development', tabLabel, year] });
      queryClient.invalidateQueries({ queryKey: ['econ_dev_stats', year] });
      queryClient.invalidateQueries({ queryKey: ['main_dashboard_stats'] });
      setShowConfirmModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save data');
    }
  });

  const handleSaveAll = () => {
    const changedData: Record<string, any> = {};
    const fields = getExportColumns().map(c => c.key);

    barangays.forEach(b => {
      const row = stats[b.id] || {};
      const originalRow = originalStats[b.id] || {};
      
      let hasChanges = false;
      const currentChanges: any = {};
      
      fields.forEach(f => {
        const key = f as keyof EconStat;
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

  const isDynamic = !nativeTabs.some(t => t.key === activeTab);

  return (
    <DataEntryLayout
      moduleName="Economic Development"
      pageTitle="Economic Development Data Entry"
      pageDescription="Manage Economic stats"
      breadcrumbTitle={`Economic Development ${!canWrite ? 'View Data' : 'Data Entry'}`}
      gridTitle={`${tabLabel} Grid`}
      gridDescription={`Manage economic and livelihood data for ${barangays.length} barangays. Enter Sex-Disaggregated Data.`}
      year={year}
      setYear={setYear}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      dynamicSchemas={dynamicSchemas}
      barangays={barangays}
      nativeTabs={nativeTabs}
      isLocked={isLocked}
      latestApproval={latestApproval}
      isSuperAdmin={isSuperAdmin}
      canWrite={canWrite}
      exportData={isDynamic ? undefined : barangays.map(b => ({ barangay_name: b.name, ...stats[b.id] }))}
      exportColumns={isDynamic ? undefined : getExportColumns()}
      exportTitle={`${tabLabel} (${year})`}
      onImport={isDynamic ? undefined : handleImport}
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
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-blue-600 dark:text-blue-400" colSpan={3}>
                   {activeTab === 'labor' && 'Employed Persons'}
                   {activeTab === 'agriculture' && 'Farmers'}
                   {activeTab === 'commerce' && 'Registered Business Owners'}
                 </th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l border-r dark:border-gray-800 text-indigo-600 dark:text-indigo-400" colSpan={3}>
                   {activeTab === 'labor' && 'Unemployed Persons'}
                   {activeTab === 'agriculture' && 'Fisherfolks'}
                   {activeTab === 'commerce' && 'Ambulant Vendors'}
                 </th>
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
            const row = stats[b.id] || {};
            let p1 = '', p2 = '';
            
            if (activeTab === 'labor') {
              p1 = 'employed'; p2 = 'unemployed';
            } else if (activeTab === 'agriculture') {
              p1 = 'farmers'; p2 = 'fisherfolks';
            } else if (activeTab === 'commerce') {
              p1 = 'business_owners'; p2 = 'ambulant_vendors';
            }
            
            return (
              <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white ">
                  {b.name}
                </td>
                
                {renderIndicatorCells(b.id, row, p1, false)}
                {renderIndicatorCells(b.id, row, p2, true)}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-amber-50/80 dark:bg-amber-950/30 font-bold border-t-2 border-amber-300 dark:border-amber-800 text-gray-900 dark:text-white">
          {(() => {
            let p1 = '', p2 = '';
            if (activeTab === 'labor') {
              p1 = 'employed'; p2 = 'unemployed';
            } else if (activeTab === 'agriculture') {
              p1 = 'farmers'; p2 = 'fisherfolks';
            } else if (activeTab === 'commerce') {
              p1 = 'business_owners'; p2 = 'ambulant_vendors';
            }

            const calc = (prefix: string) => {
              let mSum = 0, fSum = 0, totSum = 0;
              barangays.forEach(b => {
                const r = stats[b.id] || {};
                const m = Number((r as any)[`${prefix}_m`] || 0);
                const f = Number((r as any)[`${prefix}_f`] || 0);
                const t = (r as any)[`${prefix}_total`] != null ? Number((r as any)[`${prefix}_total`]) : null;
                mSum += m; fSum += f; totSum += (t ?? (m + f));
              });
              return { mSum, fSum, totSum };
            };

            const t1 = calc(p1);
            const t2 = calc(p2);

            return (
              <tr>
                <td className="whitespace-nowrap px-4 py-3 font-extrabold text-brand-700 dark:text-brand-300">Total</td>
                <td className="px-2 py-3 text-center border-l dark:border-gray-800 text-blue-700 dark:text-blue-300 font-bold">{t1.mSum}</td>
                <td className="px-2 py-3 text-center text-blue-700 dark:text-blue-300 font-bold">{t1.fSum}</td>
                <td className="px-4 py-3 text-center font-extrabold bg-amber-100/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200">{t1.totSum}</td>

                <td className="px-2 py-3 text-center border-l dark:border-gray-800 text-blue-700 dark:text-blue-300 font-bold">{t2.mSum}</td>
                <td className="px-2 py-3 text-center text-blue-700 dark:text-blue-300 font-bold">{t2.fSum}</td>
                <td className="px-4 py-3 text-center font-extrabold bg-amber-100/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border-r dark:border-gray-800">{t2.totSum}</td>
              </tr>
            );
          })()}
        </tfoot>
        </table>
      </div>
      <div className="block lg:hidden mt-2">
        {barangays.map((b) => {
          const row = stats[b.id] || {};
          let f1_m = 0, f1_f = 0, f2_m = 0, f2_f = 0;
          let label1 = '', label2 = '';
          let k1_m = '', k1_f = '', k2_m = '', k2_f = '';

          if (activeTab === 'labor') {
            f1_m = row.employed_m || 0; f1_f = row.employed_f || 0;
            f2_m = row.unemployed_m || 0; f2_f = row.unemployed_f || 0;
            label1 = 'Employed'; label2 = 'Unemployed';
            k1_m = 'employed_m'; k1_f = 'employed_f'; k2_m = 'unemployed_m'; k2_f = 'unemployed_f';
          } else if (activeTab === 'agriculture') {
            f1_m = row.farmers_m || 0; f1_f = row.farmers_f || 0;
            f2_m = row.fisherfolks_m || 0; f2_f = row.fisherfolks_f || 0;
            label1 = 'Registered Farmers'; label2 = 'Registered Fisherfolks';
            k1_m = 'farmers_m'; k1_f = 'farmers_f'; k2_m = 'fisherfolks_m'; k2_f = 'fisherfolks_f';
          } else if (activeTab === 'commerce') {
            f1_m = row.business_owners_m || 0; f1_f = row.business_owners_f || 0;
            f2_m = row.ambulant_vendors_m || 0; f2_f = row.ambulant_vendors_f || 0;
            label1 = 'Business Owners'; label2 = 'Ambulant Vendors';
            k1_m = 'business_owners_m'; k1_f = 'business_owners_f'; k2_m = 'ambulant_vendors_m'; k2_f = 'ambulant_vendors_f';
          }

          return (
            <MobileDataCard key={b.id} title={b.name}>
              <MobileDataInput label={label1} type="split">
                <SplitInputWrapper
                  inputMale={<input type="number" min="0" value={(row as any)[k1_m] || ''} onChange={(e) => handleChange(b.id, k1_m as any, e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  inputFemale={<input type="number" min="0" value={(row as any)[k1_f] || ''} onChange={(e) => handleChange(b.id, k1_f as any, e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  total={f1_m + f1_f}
                />
              </MobileDataInput>
              <MobileDataInput label={label2} type="split">
                <SplitInputWrapper
                  inputMale={<input type="number" min="0" value={(row as any)[k2_m] || ''} onChange={(e) => handleChange(b.id, k2_m as any, e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  inputFemale={<input type="number" min="0" value={(row as any)[k2_f] || ''} onChange={(e) => handleChange(b.id, k2_f as any, e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  total={f2_m + f2_f}
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
