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

type InfraStat = Database['public']['Tables']['infra_stats']['Row'];
type TabType = string;

export default function InfrastructureDataEntry() {
  const { isSuperAdmin, canWrite } = useRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [stats, setStats] = useState<Record<string, Partial<InfraStat>>>({});
  const [originalStats, setOriginalStats] = useState<Record<string, Partial<InfraStat>>>({});
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any> | null>(null);

  const nativeTabs = [{ key: 'main', label: 'Basic Utilities & Housing' }];

  const { data: dynamicSchemas = [] } = useQuery({
    queryKey: ['dynamic_schemas', 'Infrastructure'],
    queryFn: async () => {
      const { data } = await supabase.from('dynamic_schemas').select('*').eq('department', 'Infrastructure');
      return data || [];
    }
  });

  const tabLabel = activeTab === 'main' ? 'Basic Utilities & Housing' : (dynamicSchemas.find(d => d.id === activeTab)?.tab_name || '');

  const { data: latestApproval } = useQuery({
    queryKey: ['latest_approval', 'Infrastructure', tabLabel, year],
    queryFn: () => getLatestApproval('Infrastructure', tabLabel, year)
  });

  const isLocked = latestApproval && latestApproval.status === 'pending' && !isSuperAdmin;

  const { data: fetchedData, isLoading } = useDataEntryStats('Infrastructure', 'infra_stats', year);

  useEffect(() => {
    if (fetchedData) {
      setStats(fetchedData.stats);
      setOriginalStats(JSON.parse(JSON.stringify(fetchedData.stats)));
    }
  }, [fetchedData]);

  const barangays = fetchedData?.barangays || [];

  const handleChange = (barangayId: string, field: keyof InfraStat, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setStats((prev) => ({
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
            if (['safe_water_m', 'safe_water_f', 'sanitary_toilet_m', 'sanitary_toilet_f', 'informal_settlers_m', 'informal_settlers_f'].includes(key)) {
              handleChange(b.id, key as keyof InfraStat, String(row[key]));
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
           return {
             barangay_id: bId,
             year,
             month_updated: new Date().getMonth() + 1,
             ...rowChanges
           };
        });
        
        const { error } = await supabase.from('infra_stats').upsert(upsertData, { onConflict: 'barangay_id,year' });
        if (error) throw error;
        
        await notifySuperAdminsOfDirectSave('Infrastructure', 'Basic Utilities & Housing', year, user!.id);
      } else {
        await submitForApproval('Infrastructure', 'Basic Utilities & Housing', year, changedData, user!.id);
      }
    },
    onSuccess: () => {
      toast.success(isSuperAdmin ? `Infrastructure data saved directly!` : `Changes submitted for approval!`);
      queryClient.invalidateQueries({ queryKey: ['native_data', 'Infrastructure', year] });
      queryClient.invalidateQueries({ queryKey: ['latest_approval', 'Infrastructure', tabLabel, year] });
      queryClient.invalidateQueries({ queryKey: ['infra_stats', year] });
      queryClient.invalidateQueries({ queryKey: ['main_dashboard_stats'] });
      setShowConfirmModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save data');
    }
  });

  const handleSaveAll = () => {
    const changedData: Record<string, any> = {};
    const fields = ['safe_water_m', 'safe_water_f', 'sanitary_toilet_m', 'sanitary_toilet_f', 'informal_settlers_m', 'informal_settlers_f'];
    
    barangays.forEach(b => {
      const row = stats[b.id] || {};
      const originalRow = originalStats[b.id] || {};
      
      let hasChanges = false;
      const currentChanges: any = {};
      
      fields.forEach(f => {
        const key = f as keyof InfraStat;
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
    { header: 'Safe Water (M)', key: 'safe_water_m' },
    { header: 'Safe Water (F)', key: 'safe_water_f' },
    { header: 'Sanitary Toilet (M)', key: 'sanitary_toilet_m' },
    { header: 'Sanitary Toilet (F)', key: 'sanitary_toilet_f' },
    { header: 'Informal Settlers (M)', key: 'informal_settlers_m' },
    { header: 'Informal Settlers (F)', key: 'informal_settlers_f' }
  ];

  return (
    <DataEntryLayout
      moduleName="Infrastructure"
      pageTitle="Infrastructure Data Entry"
      pageDescription="Manage Infrastructure stats"
      breadcrumbTitle={`Infrastructure ${!canWrite ? 'View Data' : 'Data Entry'}`}
      gridTitle="Basic Utilities & Housing Grid"
      gridDescription={`Manage infrastructure and housing data for ${barangays.length} barangays. Enter Sex-Disaggregated Data.`}
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
      exportTitle={`Infrastructure (${year})`}
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
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-blue-600 dark:text-blue-400" colSpan={3}>Access to Safe Water</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l border-r dark:border-gray-800 text-indigo-600 dark:text-indigo-400" colSpan={3}>Access to Sanitary Toilet</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-r dark:border-gray-800 text-emerald-600 dark:text-emerald-400" colSpan={3}>Informal Settlers</th>
               </tr>
             <tr>
               <th className="px-2 py-2 text-center border-l dark:border-gray-800">M</th>
               <th className="px-2 py-2 text-center">F</th>
               <th className="px-2 py-2 text-center bg-gray-100 dark:bg-gray-800/50">Total</th>
               
               <th className="px-2 py-2 text-center border-l dark:border-gray-800">M</th>
               <th className="px-2 py-2 text-center">F</th>
               <th className="px-2 py-2 text-center bg-gray-100 dark:bg-gray-800/50 border-r dark:border-gray-800">Total</th>
               
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
                
                {/* Safe Water */}
                <td className="px-0 py-0 border-l dark:border-gray-800 bg-blue-50/30 dark:bg-blue-900/10">
                  <input 
                    type="number" min="0" 
                    value={row['safe_water_m'] || ''} 
                    onChange={(e) => handleChange(b.id, 'safe_water_m', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                  />
                </td>
                <td className="px-0 py-0  bg-blue-50/30 dark:bg-blue-900/10">
                  <input 
                    type="number" min="0" 
                    value={row['safe_water_f'] || ''} 
                    onChange={(e) => handleChange(b.id, 'safe_water_f', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                  />
                </td>
                <td className="px-4 py-3 border-r dark:border-gray-800 text-center font-medium bg-gray-100 dark:bg-gray-800/50">
                  {(row.safe_water_m || 0) + (row.safe_water_f || 0)}
                </td>

                {/* Sanitary Toilet */}
                <td className="px-0 py-0  bg-indigo-50/30 dark:bg-indigo-900/10">
                  <input 
                    type="number" min="0" 
                    value={row['sanitary_toilet_m'] || ''} 
                    onChange={(e) => handleChange(b.id, 'sanitary_toilet_m', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                  />
                </td>
                <td className="px-0 py-0  bg-indigo-50/30 dark:bg-indigo-900/10">
                  <input 
                    type="number" min="0" 
                    value={row['sanitary_toilet_f'] || ''} 
                    onChange={(e) => handleChange(b.id, 'sanitary_toilet_f', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                  />
                </td>
                <td className="px-4 py-3  text-center font-medium bg-gray-100 dark:bg-gray-800/50 border-r dark:border-gray-800">
                  {(row.sanitary_toilet_m || 0) + (row.sanitary_toilet_f || 0)}
                </td>
                
                {/* Informal Settlers */}
                <td className="px-0 py-0  bg-emerald-50/30 dark:bg-emerald-900/10">
                  <input 
                    type="number" min="0" 
                    value={row['informal_settlers_m'] || ''} 
                    onChange={(e) => handleChange(b.id, 'informal_settlers_m', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                  />
                </td>
                <td className="px-0 py-0  bg-emerald-50/30 dark:bg-emerald-900/10">
                  <input 
                    type="number" min="0" 
                    value={row['informal_settlers_f'] || ''} 
                    onChange={(e) => handleChange(b.id, 'informal_settlers_f', e.target.value)} 
                    disabled={!canWrite || isLocked} 
                    className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                  />
                </td>
                <td className="px-4 py-3  text-center font-medium bg-gray-100 dark:bg-gray-800/50 border-r dark:border-gray-800">
                  {(row.informal_settlers_m || 0) + (row.informal_settlers_f || 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      
        </table>
      </div>
      <div className="block lg:hidden mt-2">
        {barangays.map((b) => {
          const row = stats[b.id] || {};
          return (
            <MobileDataCard key={b.id} title={b.name}>
              <MobileDataInput label="Safe Water Supply" type="split">
                <SplitInputWrapper
                  inputMale={<input type="number" min="0" value={row['safe_water_m'] || ''} onChange={(e) => handleChange(b.id, 'safe_water_m', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  inputFemale={<input type="number" min="0" value={row['safe_water_f'] || ''} onChange={(e) => handleChange(b.id, 'safe_water_f', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  total={(row.safe_water_m || 0) + (row.safe_water_f || 0)}
                />
              </MobileDataInput>
              <MobileDataInput label="Sanitary Toilet" type="split">
                <SplitInputWrapper
                  inputMale={<input type="number" min="0" value={row['sanitary_toilet_m'] || ''} onChange={(e) => handleChange(b.id, 'sanitary_toilet_m', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  inputFemale={<input type="number" min="0" value={row['sanitary_toilet_f'] || ''} onChange={(e) => handleChange(b.id, 'sanitary_toilet_f', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  total={(row.sanitary_toilet_m || 0) + (row.sanitary_toilet_f || 0)}
                />
              </MobileDataInput>
              <MobileDataInput label="Informal Settlers" type="split">
                <SplitInputWrapper
                  inputMale={<input type="number" min="0" value={row['informal_settlers_m'] || ''} onChange={(e) => handleChange(b.id, 'informal_settlers_m', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  inputFemale={<input type="number" min="0" value={row['informal_settlers_f'] || ''} onChange={(e) => handleChange(b.id, 'informal_settlers_f', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                  total={(row.informal_settlers_m || 0) + (row.informal_settlers_f || 0)}
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
