import { getDefaultYear } from '@/utils/yearUtils';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { ExportColumn } from '../../components/common/DataExportImport';
import type { Database } from '../../types/database';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../hooks/useAuth';
import { submitForApproval, getLatestApproval, notifySuperAdminsOfDirectSave } from '../../utils/approvalUtils';
import { useDataEntryStats } from '@/hooks/queries/useDataEntryStats';
import DataEntryLayout from '@/components/layout/DataEntryLayout';
import { MobileDataCard } from '@/components/common/MobileDataCard';
import { MobileDataInput, SplitInputWrapper } from '@/components/common/MobileDataInput';

type GovStat = Database['public']['Tables']['governance_stats']['Row'];
type TabType = string;

export default function GovernanceDataEntry() {
  const { isSuperAdmin, canWrite } = useRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [stats, setStats] = useState<Record<string, Partial<GovStat>>>({});
  const [originalStats, setOriginalStats] = useState<Record<string, Partial<GovStat>>>({});
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [year, setYear] = useState(getDefaultYear(`Local Governance_${'main'}`));

  useEffect(() => {
    setYear(getDefaultYear('Local Governance_' + activeTab));
  }, [activeTab]);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any> | null>(null);

  const nativeTabs = [{ key: 'main', label: 'Leadership & Participation' }];

  const { data: dynamicSchemas = [] } = useQuery({
    queryKey: ['dynamic_schemas', 'Local Governance'],
    queryFn: async () => {
      const { data } = await supabase.from('dynamic_schemas').select('*').eq('department', 'Local Governance');
      return data || [];
    }
  });

  const tabLabel = activeTab === 'main' ? 'Leadership & Participation' : (dynamicSchemas.find(d => d.id === activeTab)?.tab_name || '');

  const { data: latestApproval } = useQuery({
    queryKey: ['latest_approval', 'Local Governance', tabLabel, year],
    queryFn: () => getLatestApproval('Local Governance', tabLabel, year)
  });

  const isLocked = latestApproval && latestApproval.status === 'pending' && !isSuperAdmin;

  const { data: fetchedData, isLoading } = useDataEntryStats('Governance', 'governance_stats', year);

  useEffect(() => {
    if (fetchedData) {
      setStats(fetchedData.stats);
      setOriginalStats(JSON.parse(JSON.stringify(fetchedData.stats)));
    }
  }, [fetchedData]);

  const barangays = fetchedData?.barangays || [];

  const handleChange = (barangayId: string, field: keyof GovStat, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    const prefix = field.toString().replace(/_[mf]$/, '');
    const keyTotal = `${prefix}_total` as keyof GovStat;

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
    const keyTotal = `${prefix}_total` as keyof GovStat;
    const keyM = `${prefix}_m` as keyof GovStat;
    const keyF = `${prefix}_f` as keyof GovStat;

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
    const fields = columns.map(c => c.key);
    setStats(prev => {
      const updated = { ...prev };
      importedData.forEach((row) => {
        const bName = (row.barangay_name || '').trim().toLowerCase();
        const b = barangays.find(b => b.name.trim().toLowerCase() === bName);
        if (b) {
          const currentBStats: any = { ...(updated[b.id] || {}) };
          fields.forEach((f: string) => {
            if (row[f] !== undefined) {
              currentBStats[f] = Number(row[f]) || 0;
            }
          });
          updated[b.id] = currentBStats;
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
             rowChanges[k] = changedData[bId][k].new;
           });
           return {
             barangay_id: bId,
             year,
             month_updated: new Date().getMonth() + 1,
             ...rowChanges
           };
        });
        
        const { error } = await supabase.from('governance_stats').upsert(upsertData, { onConflict: 'barangay_id,year' });
        if (error) throw error;
        
        await notifySuperAdminsOfDirectSave('Local Governance', 'Leadership & Participation', year, user!.id);
      } else {
        await submitForApproval('Local Governance', 'Leadership & Participation', year, changedData, user!.id);
      }
    },
    onSuccess: () => {
      toast.success(isSuperAdmin ? `Local Governance data saved directly!` : `Changes submitted for approval!`);
      queryClient.invalidateQueries({ queryKey: ['native_data', 'Local Governance', year] });
      queryClient.invalidateQueries({ queryKey: ['latest_approval', 'Local Governance', tabLabel, year] });
      queryClient.invalidateQueries({ queryKey: ['governance_stats', year] });
      queryClient.invalidateQueries({ queryKey: ['main_dashboard_stats'] });
      setShowConfirmModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save data');
    }
  });

  const handleSaveAll = () => {
    const changedData: Record<string, any> = {};
    const fields = ['elected_officials_m', 'elected_officials_f', 'elected_officials_total', 'appointed_heads_m', 'appointed_heads_f', 'appointed_heads_total'];
    
    barangays.forEach(b => {
      const row = stats[b.id] || {};
      const originalRow = originalStats[b.id] || {};
      
      let hasChanges = false;
      const currentChanges: any = {};
      
      fields.forEach(f => {
        const key = f as keyof GovStat;
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
    { header: 'Elected Officials (M)', key: 'elected_officials_m' },
    { header: 'Elected Officials (F)', key: 'elected_officials_f' },
    { header: 'Elected Officials (Total)', key: 'elected_officials_total' },
    { header: 'Appointed Heads (M)', key: 'appointed_heads_m' },
    { header: 'Appointed Heads (F)', key: 'appointed_heads_f' },
    { header: 'Appointed Heads (Total)', key: 'appointed_heads_total' },
  ];

  return (
    <DataEntryLayout
      moduleName="Local Governance"
      pageTitle="Local Governance Data Entry"
      pageDescription="Manage Governance stats"
      breadcrumbTitle={`Local Governance ${!canWrite ? 'View Data' : 'Data Entry'}`}
      gridTitle="Leadership & Participation Grid"
      gridDescription={`Manage leadership data for ${barangays.length} barangays. Enter Sex-Disaggregated Data.`}
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
      exportData={barangays.map(b => ({ barangay_name: b.name, ...stats[b.id] }))}
      exportColumns={columns}
      exportTitle={`Local Governance (${year})`}
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
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-blue-600 dark:text-blue-400" colSpan={3}>Elected Officials</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l border-r dark:border-gray-800 text-indigo-600 dark:text-indigo-400" colSpan={3}>Appointed Sectoral Heads</th>
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
            
            return (
              <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white ">
                  {b.name}
                </td>
                
                {renderIndicatorCells(b.id, row, 'elected_officials', false)}
                {renderIndicatorCells(b.id, row, 'appointed_heads', true)}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-amber-50/80 dark:bg-amber-950/30 font-bold border-t-2 border-amber-300 dark:border-amber-800 text-gray-900 dark:text-white">
          {(() => {
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

            const e = calc('elected_officials');
            const a = calc('appointed_heads');

            return (
              <tr>
                <td className="whitespace-nowrap px-4 py-3 font-extrabold text-brand-700 dark:text-brand-300">Total</td>
                <td className="px-2 py-3 text-center border-l dark:border-gray-800 text-blue-700 dark:text-blue-300 font-bold">{e.mSum.toLocaleString()}</td>
                <td className="px-2 py-3 text-center text-blue-700 dark:text-blue-300 font-bold">{e.fSum.toLocaleString()}</td>
                <td className="px-4 py-3 text-center font-extrabold bg-amber-100/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200">{e.totSum.toLocaleString()}</td>

                <td className="px-2 py-3 text-center border-l dark:border-gray-800 text-indigo-700 dark:text-indigo-300 font-bold">{a.mSum.toLocaleString()}</td>
                <td className="px-2 py-3 text-center text-indigo-700 dark:text-indigo-300 font-bold">{a.fSum.toLocaleString()}</td>
                <td className="px-4 py-3 text-center font-extrabold bg-amber-100/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border-r dark:border-gray-800">{a.totSum.toLocaleString()}</td>
              </tr>
            );
          })()}
        </tfoot>
        </table>
      </div>
      <div className="block lg:hidden mt-2">
        {barangays.map((b) => {
          const row = stats[b.id] || {};
          return (
            <MobileDataCard key={b.id} title={b.name}>
              <MobileDataInput label="Elected Officials" type="split">
                <SplitInputWrapper
                  inputMale={<input type="number" min="0" value={row['elected_officials_m'] || ''} onChange={(e) => handleChange(b.id, 'elected_officials_m', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  inputFemale={<input type="number" min="0" value={row['elected_officials_f'] || ''} onChange={(e) => handleChange(b.id, 'elected_officials_f', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  total={(row.elected_officials_m || 0) + (row.elected_officials_f || 0)}
                />
              </MobileDataInput>
              <MobileDataInput label="Appointed Sectoral Heads" type="split">
                <SplitInputWrapper
                  inputMale={<input type="number" min="0" value={row['appointed_heads_m'] || ''} onChange={(e) => handleChange(b.id, 'appointed_heads_m', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  inputFemale={<input type="number" min="0" value={row['appointed_heads_f'] || ''} onChange={(e) => handleChange(b.id, 'appointed_heads_f', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  total={(row.appointed_heads_m || 0) + (row.appointed_heads_f || 0)}
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
