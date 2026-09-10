import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import toast from 'react-hot-toast';

const TABLE_MODULE_MAP: Record<string, { queryKey: string, moduleName: string }> = {
  social_dev_stats: { queryKey: 'social_dev_stats', moduleName: 'Social Development' },
  population_stats: { queryKey: 'demographics_stats', moduleName: 'Demographics' },
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
            queryClient.invalidateQueries({ queryKey: ['dynamic_data'] });
            queryClient.invalidateQueries({ queryKey: ['dynamic_schema_data'] });
            queryClient.invalidateQueries({ queryKey: ['main_dashboard_stats'] });
            queryClient.invalidateQueries({ queryKey: ['demographics_stats'] });
            queryClient.invalidateQueries({ queryKey: ['social_dev_stats'] });
            
            if (payload.eventType === 'INSERT') {
              const newRecord = payload.new as any;
              if (newRecord.submitted_by !== currentUserEmail) {
                toast(`New data submitted for review by ${newRecord.submitted_by}`, { id: 'approval-toast' });
              }
            } else if (payload.eventType === 'UPDATE') {
               const newRecord = payload.new as any;
               toast(`Approval status for ${newRecord.module_name} updated to ${newRecord.status}`, { id: 'approval-status-toast' });
            }
          }

          // Module tables change (Native tables)
          if (TABLE_MODULE_MAP[table]) {
            const { queryKey, moduleName } = TABLE_MODULE_MAP[table];
            
            // Invalidate the Dashboard stats query
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            // Invalidate the Data Entry query
            queryClient.invalidateQueries({ queryKey: ['native_data', moduleName] });

            if (table === 'population_stats') {
              queryClient.invalidateQueries({ queryKey: ['population_stats'] });
              queryClient.invalidateQueries({ queryKey: ['barangays'] });
              queryClient.invalidateQueries({ queryKey: ['main_dashboard_stats'] });
            }
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              // We don't have the user who made the change in the payload directly unless it's in the row (e.g. updated_by).
              toast(`${moduleName} data was updated!`, { id: `sync-${table}` });
            }
          }

          // Dynamic tables change
          if (table === 'dynamic_data') {
            queryClient.invalidateQueries({ queryKey: ['dynamic_data'] });
            queryClient.invalidateQueries({ queryKey: ['dynamic_schema_data'] });
            queryClient.invalidateQueries({ queryKey: ['dynamic_dashboard_schemas'] });
            queryClient.invalidateQueries({ queryKey: ['main_dashboard_stats'] });
            queryClient.invalidateQueries({ queryKey: ['demographics_stats'] });
            queryClient.invalidateQueries({ queryKey: ['social_dev_stats'] });
            queryClient.invalidateQueries({ queryKey: ['economic_stats'] });
            queryClient.invalidateQueries({ queryKey: ['infrastructure_stats'] });
            queryClient.invalidateQueries({ queryKey: ['governance_stats'] });
            queryClient.invalidateQueries({ queryKey: ['justice_stats'] });
            queryClient.invalidateQueries({ queryKey: ['barangay_dynamic_data'] });
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              toast(`A dynamic table data was updated!`, { id: `sync-${table}` });
            }
          }

          if (table === 'dynamic_schemas') {
            queryClient.invalidateQueries({ queryKey: ['dynamic_schemas'] });
            queryClient.invalidateQueries({ queryKey: ['dynamic_dashboard_schemas'] });
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              toast(`Dynamic tables definition updated!`, { id: `sync-${table}` });
            }
          }

          // Feedback comments change
          if (table === 'feedback_comments') {
            queryClient.invalidateQueries({ queryKey: ['feedback_comments'] });
            if (payload.eventType === 'INSERT') {
              const record = payload.new as any;
              if (record.author_email !== currentUserEmail) {
                toast(`New critique / suggestion posted by ${record.author_name || 'a reviewer'}`, { id: 'feedback-new-toast' });
              }
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
