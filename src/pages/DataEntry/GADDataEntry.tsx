import { getDefaultYear } from '@/utils/yearUtils';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import type { Database } from '../../types/database';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../hooks/useAuth';
import { submitForApproval, getLatestApproval, notifySuperAdminsOfDirectSave } from '../../utils/approvalUtils';
import DataEntryLayout from '@/components/layout/DataEntryLayout';

type GadStat = Database['public']['Tables']['gad_stats']['Row'];
type TabType = string;

export default function GADDataEntry() {
  const { isSuperAdmin, canWrite } = useRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [year, setYear] = useState(getDefaultYear(`Institutional GAD_${'main'}`));

  useEffect(() => {
    setYear(getDefaultYear('Institutional GAD_' + activeTab));
  }, [activeTab]);
  const [stat, setStat] = useState<Partial<GadStat>>({});
  const [originalStat, setOriginalStat] = useState<Partial<GadStat>>({});
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any> | null>(null);

  const nativeTabs = [{ key: 'main', label: 'Municipal Data' }];

  const { data: dynamicSchemas = [] } = useQuery({
    queryKey: ['dynamic_schemas', 'Institutional GAD'],
    queryFn: async () => {
      const { data } = await supabase.from('dynamic_schemas').select('*').eq('department', 'Institutional GAD');
      return data || [];
    }
  });

  const tabLabel = activeTab === 'main' ? 'Municipal Data' : (dynamicSchemas.find(d => d.id === activeTab)?.tab_name || '');

  const { data: latestApproval } = useQuery({
    queryKey: ['latest_approval', 'Institutional GAD', tabLabel, year],
    queryFn: () => getLatestApproval('Institutional GAD', tabLabel, year)
  });

  const isLocked = latestApproval && latestApproval.status === 'pending' && !isSuperAdmin;

  const { data: fetchedData, isLoading } = useQuery({
    queryKey: ['native_data', 'Institutional GAD', year],
    queryFn: async () => {
      const { data: gData, error: gError } = await supabase.from('gad_stats').select('*').eq('year', year).maybeSingle();
      if (gError) throw gError;

      let statData = gData || {};

      const searchParams = new URLSearchParams(window.location.search);
      const resubmitId = searchParams.get('resubmit');
      
      if (resubmitId) {
        const { data: approval } = await supabase.from('data_approvals').select('changes').eq('id', resubmitId).single();
        if (approval && approval.changes) {
          const changes = approval.changes as any;
          Object.keys(changes).forEach(field => {
            const val = changes[field];
            statData[field] = (val && typeof val === 'object' && 'new' in val) ? val.new : val;
          });
          toast.success("Loaded rejected data for resubmission", { icon: '🔄' });
        }
      }

      return statData;
    }
  });

  useEffect(() => {
    if (fetchedData) {
      setStat(fetchedData);
      setOriginalStat(JSON.parse(JSON.stringify(fetchedData)));
    }
  }, [fetchedData]);

  const barangays: any[] = []; // Institutional GAD has no barangays

  const handleInputChange = (field: keyof GadStat, value: string, isFloat = false) => {
    const numValue = value === '' ? 0 : (isFloat ? parseFloat(value) : parseInt(value, 10));
    setStat((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const mutation = useMutation({
    mutationFn: async (changedData: Record<string, any>) => {
      const currentChanges = changedData['municipal'];

      if (isSuperAdmin) {
        const rowChanges: any = {};
        Object.keys(currentChanges).forEach(k => {
          rowChanges[k] = currentChanges[k].new;
        });

        const upsertData = {
          year,
          month_updated: new Date().getMonth() + 1,
          ...rowChanges
        };

        const { error } = await supabase
          .from('gad_stats')
          .upsert(upsertData, { onConflict: 'year' });

        if (error) throw error;
        await notifySuperAdminsOfDirectSave('Institutional GAD', 'Municipal Data', year, user!.id);
      } else {
        await submitForApproval('Institutional GAD', 'Municipal Data', year, changedData, user!.id);
      }
    },
    onSuccess: () => {
      toast.success(isSuperAdmin ? 'GAD data saved directly!' : 'Changes submitted for approval!');
      queryClient.invalidateQueries({ queryKey: ['native_data', 'Institutional GAD', year] });
      queryClient.invalidateQueries({ queryKey: ['latest_approval', 'Institutional GAD', tabLabel, year] });
      queryClient.invalidateQueries({ queryKey: ['gad_stats', year] });
      queryClient.invalidateQueries({ queryKey: ['main_dashboard_stats'] });
      setShowConfirmModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save data');
    }
  });

  const handleSave = () => {
    const fields = [
      'total_lgu_budget', 
      'gad_allocated_amount', 
      'gad_utilized_amount', 
      'number_of_gad_trainings', 
      'participants_trained'
    ];
    
    let hasChanges = false;
    const currentChanges: any = {};
    
    fields.forEach(f => {
      const key = f as keyof GadStat;
      const oldVal = originalStat[key] || 0;
      const newVal = stat[key] || 0;
      if (newVal !== oldVal) {
        hasChanges = true;
      }
      currentChanges[f] = { old: oldVal, new: newVal };
    });

    if (!hasChanges) {
       toast('No changes to save.', { icon: 'ℹ️' });
       return;
    }

    const changedData = {
      'municipal': currentChanges
    };

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

  return (
    <DataEntryLayout
      moduleName="Institutional GAD"
      pageTitle="GAD Data Entry"
      pageDescription="Manage Gender and Development stats"
      breadcrumbTitle={`Institutional GAD ${!canWrite ? 'View Data' : 'Data Entry'}`}
      gridTitle="Municipal GAD Data"
      gridDescription="Enter municipality-wide institutional GAD metrics."
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
      onSave={handleSave}
      isSaving={mutation.isPending}
      isLoading={isLoading}
      showConfirmModal={showConfirmModal}
      setShowConfirmModal={setShowConfirmModal}
      onConfirmSave={() => { if(pendingChanges) mutation.mutate(pendingChanges) }}
    >
      <div className="max-w-3xl space-y-8">
        {/* Budget Allocation */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
             <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </span>
             Budget Allocation (₱)
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Total LGU Budget</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">₱</span>
                <input 
                  type="number" min="0" step="0.01"
                  value={stat.total_lgu_budget || ''}
                  onChange={(e) => handleInputChange('total_lgu_budget', e.target.value, true)}
                  disabled={!canWrite || isLocked}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">GAD Allocated Amount</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">₱</span>
                <input 
                  type="number" min="0" step="0.01"
                  value={stat.gad_allocated_amount || ''}
                  onChange={(e) => handleInputChange('gad_allocated_amount', e.target.value, true)}
                  disabled={!canWrite || isLocked}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">GAD Utilized Amount</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">₱</span>
                <input 
                  type="number" min="0" step="0.01"
                  value={stat.gad_utilized_amount || ''}
                  onChange={(e) => handleInputChange('gad_utilized_amount', e.target.value, true)}
                  disabled={!canWrite || isLocked}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-800" />

        {/* Capacity Development */}
        <div>
           <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
             <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
             </span>
             Capacity Development
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Number of GAD Trainings</label>
              <input 
                type="number" min="0" 
                value={stat.number_of_gad_trainings || ''}
                onChange={(e) => handleInputChange('number_of_gad_trainings', e.target.value)}
                disabled={!canWrite || isLocked}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Participants Trained</label>
              <input 
                type="number" min="0" 
                value={stat.participants_trained || ''}
                onChange={(e) => handleInputChange('participants_trained', e.target.value)}
                disabled={!canWrite || isLocked}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
    </DataEntryLayout>
  );
}
