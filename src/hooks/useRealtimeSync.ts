import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import toast from 'react-hot-toast';

const TABLE_MODULE_MAP: Record<string, { queryKey: string, moduleName: string }> = {
  social_dev_stats: { queryKey: 'social_dev_stats', moduleName: 'Social Development' },
  population_stats: { queryKey: 'demographics_stats', moduleName: 'Demographics & Population' },
  econ_dev_stats: { queryKey: 'economic_stats', moduleName: 'Economic Development' },
  infra_stats: { queryKey: 'infrastructure_stats', moduleName: 'Infrastructure' },
  governance_stats: { queryKey: 'governance_stats', moduleName: 'Local Governance' },
  justice_stats: { queryKey: 'justice_stats', moduleName: 'Justice & Safety' },
  gad_stats: { queryKey: 'gad_stats', moduleName: 'Institutional GAD' }
};

export function useRealtimeSync(currentUserEmail?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('global_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const table = payload.table;
          
          // Approvals table change
          if (table === 'data_approvals') {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['latest_approval'] });
            
            if (payload.eventType === 'INSERT') {
              const newRecord = payload.new as any;
              if (newRecord.submitted_by !== currentUserEmail) {
                toast(`New data submitted for review by ${newRecord.submitted_by}`, { icon: '🔒', id: 'approval-toast' });
              }
            } else if (payload.eventType === 'UPDATE') {
               const newRecord = payload.new as any;
               toast(`Approval status for ${newRecord.module_name} updated to ${newRecord.status}`, { icon: newRecord.status === 'approved' ? '✅' : '❌', id: 'approval-status-toast' });
            }
          }

          // Module tables change (Native tables)
          if (TABLE_MODULE_MAP[table]) {
            const { queryKey, moduleName } = TABLE_MODULE_MAP[table];
            
            // Invalidate the Dashboard stats query
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            // Invalidate the Data Entry query
            queryClient.invalidateQueries({ queryKey: ['native_data', moduleName] });
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              // We don't have the user who made the change in the payload directly unless it's in the row (e.g. updated_by).
              toast(`${moduleName} data was updated!`, { icon: '🔄', id: `sync-${table}` });
            }
          }

          // Dynamic tables change
          if (table === 'dynamic_data') {
            queryClient.invalidateQueries({ queryKey: ['dynamic_data'] });
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              toast(`A dynamic table data was updated!`, { icon: '🔄', id: `sync-${table}` });
            }
          }

          if (table === 'dynamic_schemas') {
            queryClient.invalidateQueries({ queryKey: ['dynamic_schemas'] });
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              toast(`Dynamic tables definition updated!`, { icon: '📋', id: `sync-${table}` });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, currentUserEmail]);
}
