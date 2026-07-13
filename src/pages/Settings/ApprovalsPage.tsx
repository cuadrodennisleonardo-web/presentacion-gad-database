import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { supabase } from '@/config/supabase';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import ActionModal from '@/components/common/ActionModal';
import ReviewChangesModal from '@/components/common/ReviewChangesModal';
import { useNotifications } from '@/context/NotificationContext';

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSuperAdmin } = useRole();
  const queryClient = useQueryClient();

  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const { data: approvals = [], isLoading: loading } = useQuery({
    queryKey: ['data_approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_approvals')
        .select(`
          *,
          user_profiles!submitted_by(full_name, email, department)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });
  const { markAsRead } = useNotifications();

  const markNotificationReadForApproval = async (approvalId: string) => {
    if (!user) return;
    
    // First get the notification ID to optimistically update the context
    const { data: notifs } = await supabase.from('notifications')
      .select('id')
      .eq('reference_id', approvalId)
      .eq('user_id', user.id)
      .eq('is_read', false);
      
    if (notifs && notifs.length > 0) {
      notifs.forEach(n => markAsRead(n.id));
    }
  };

  const handleApproveClick = (approval: any) => {
    setSelectedApproval(approval);
    setActionType('approve');
    setActionModalOpen(true);
    markNotificationReadForApproval(approval.id);
  };

  const handleRejectClick = (approval: any) => {
    setSelectedApproval(approval);
    setActionType('reject');
    setActionModalOpen(true);
    markNotificationReadForApproval(approval.id);
  };

  const handleReviewClick = (approval: any) => {
    setSelectedApproval(approval);
    setReviewModalOpen(true);
    markNotificationReadForApproval(approval.id);
  };

  const handleResubmit = (approval: any) => {
    markNotificationReadForApproval(approval.id);
    let modulePath = '';
    if (approval.module === 'Institutional GAD') modulePath = 'gad';
    else if (approval.module === 'Demographics & Population') modulePath = 'demographics';
    else if (approval.module === 'Justice & Safety') modulePath = 'justice-safety';
    else if (approval.module === 'Local Governance') modulePath = 'governance';
    else modulePath = approval.module.toLowerCase().replace(/ /g, '-');
    navigate(`/data-entry/${modulePath}?resubmit=${approval.id}`);
  };

  const mutation = useMutation({
    mutationFn: async ({ action, comment, approval }: { action: 'approve' | 'reject', comment: string, approval: any }) => {
      if (action === 'approve') {
        const changes = approval.changes as any;
        const year = approval.year;
        // Check if this is a dynamic table approval by inspecting the keys (UUIDs)
        const firstBId = Object.keys(changes)[0];
        const firstField = Object.keys(changes[firstBId] || {})[0];
        const isDynamic = firstField && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(firstField);

        if (isDynamic) {
          let dynamicSchema = null;
          
          if (approval.tab) {
            const { data } = await supabase
              .from('dynamic_schemas')
              .select('id')
              .eq('department', approval.module)
              .eq('tab_name', approval.tab)
              .maybeSingle();
            dynamicSchema = data;
          }

          if (!dynamicSchema) {
            // Fallback: Find schema by checking which schema in the module contains the field UUID
            const { data: schemas } = await supabase
              .from('dynamic_schemas')
              .select('id, schema')
              .eq('department', approval.module);
              
            if (schemas) {
               const matchedSchema = schemas.find(s => {
                  const schemaFields = (s.schema as any[]) || [];
                  return schemaFields.some(f => f.id === firstField);
               });
               if (matchedSchema) {
                  dynamicSchema = { id: matchedSchema.id };
               }
            }
          }

          if (!dynamicSchema) {
             throw new Error("Could not locate the dynamic schema for this approval. It may have been deleted.");
          }

          // It's a dynamic table approval
          const { data: existingData } = await supabase
            .from('dynamic_data')
            .select('barangay_id, data')
            .eq('schema_id', dynamicSchema.id)
            .eq('year', year);
            
          const existingMap: Record<string, any> = {};
          if (existingData) {
            existingData.forEach(row => {
              existingMap[row.barangay_id] = row.data;
            });
          }

          const upsertData = Object.keys(changes).map(bId => {
            const currentData = { ...(existingMap[bId] || {}) };
            const bChanges = changes[bId];
            
            Object.keys(bChanges).forEach(fieldId => {
              currentData[fieldId] = bChanges[fieldId].new;
            });

            return {
              schema_id: dynamicSchema.id,
              barangay_id: bId,
              year: year,
              month_updated: new Date().getMonth() + 1 + '',
              data: currentData
            };
          });

          const { error: upsertError } = await supabase
            .from('dynamic_data')
            .upsert(upsertData, { onConflict: 'barangay_id,year,schema_id' });
            
          if (upsertError) throw upsertError;

        } else {
          // Native table approval
          let tableName = '';

          if (approval.module === 'Demographics & Population') {
            tableName = 'population_stats';
          } else if (approval.module === 'Social Development') {
            tableName = 'social_dev_stats';
          } else if (approval.module === 'Economic Development') {
            tableName = 'econ_dev_stats';
          } else if (approval.module === 'Infrastructure') {
            tableName = 'infra_stats';
          } else if (approval.module === 'Local Governance') {
            tableName = 'governance_stats';
          } else if (approval.module === 'Justice & Safety') {
            tableName = 'justice_stats';
          } else if (approval.module === 'Institutional GAD') {
            tableName = 'gad_stats';
          }

          if (!tableName) {
            throw new Error("Could not determine target table for module: " + approval.module);
          }

          // Fields that are computed/virtual — must NOT be sent to the DB
          const EXCLUDED_FIELDS = ['total_population'];

          const upsertData = Object.keys(changes).map(barangayId => {
            const rowChanges: any = {};
            // Ensure we extract the 'new' value from the { old, new } structure if it exists, otherwise fallback to raw value
            Object.keys(changes[barangayId]).forEach(k => {
              if (EXCLUDED_FIELDS.includes(k)) return; // Skip computed fields
              const val = changes[barangayId][k];
              rowChanges[k] = (val && typeof val === 'object' && 'new' in val) ? val.new : val;
            });

            if (barangayId === 'municipal') {
               return {
                 year: year,
                 month_updated: new Date().getMonth() + 1,
                 ...rowChanges
               }
            }
            return {
              barangay_id: barangayId,
              year: year,
              month_updated: new Date().getMonth() + 1,
              ...rowChanges
            }
          });

          const onConflict = tableName === 'gad_stats' ? 'year' : 'barangay_id, year';
          
          const { error: upsertError } = await supabase
            .from(tableName as any)
            .upsert(upsertData, { onConflict });

          if (upsertError) throw upsertError;
        }

        const { error: statusError } = await supabase
          .from('data_approvals')
          .update({ status: 'approved', comments: comment })
          .eq('id', approval.id);

        if (statusError) throw statusError;

        await supabase.from('notifications').insert({
          user_id: approval.submitted_by,
          title: 'Data Approved',
          message: `Your data submission for ${approval.module} (${approval.tab}) has been approved!${comment ? ' Comment: ' + comment : ''}`,
          type: 'approval_approved',
          reference_id: approval.id
        });

        toast.success('Data approved successfully');
      } else {
        const { error: statusError } = await supabase
          .from('data_approvals')
          .update({ status: 'rejected', comments: comment })
          .eq('id', approval.id);

        if (statusError) throw statusError;

        await supabase.from('notifications').insert({
          user_id: approval.submitted_by,
          title: 'Data Rejected',
          message: `Your data submission for ${approval.module} (${approval.tab}) was rejected. Reason: ${comment}`,
          type: 'approval_rejected',
          reference_id: approval.id
        });

        toast.success('Data rejected successfully');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data_approvals'] });
      setActionModalOpen(false);
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || `Failed to process approval`);
    }
  });

  const handleActionConfirm = (comment: string) => {
    if (!selectedApproval) return;
    mutation.mutate({ action: actionType, comment, approval: selectedApproval });
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const pastApprovals = approvals.filter(a => a.status !== 'pending');

  return (
    <>
      <PageMeta title="Data Approvals" description="Review and approve data submissions" />
      <PageBreadcrumb pageTitle="Data Approvals" rootLabel="Administration" rootPath={null} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pending Approvals ({pendingApprovals.length})</h2>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-gray-500">No pending approvals.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pendingApprovals.map(approval => (
              <div key={approval.id} className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                      {approval.module}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {approval.tab}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-1">
                    Submitted by: {approval.user_profiles?.full_name || 'Unknown'}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {new Date(approval.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  
                  <div className="mb-4 text-xs text-gray-600 dark:text-gray-400">
                    <p><strong>Year:</strong> {approval.year}</p>
                    <p><strong>Barangays Modified:</strong> {Object.keys(approval.changes).length}</p>
                  </div>
                  
                  <button
                    onClick={() => handleReviewClick(approval)}
                    className="mb-4 w-full rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                  >
                    Review Changes
                  </button>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <button
                      onClick={() => handleApproveClick(approval)}
                      disabled={mutation.isPending && mutation.variables?.approval.id === approval.id}
                      className="flex-1 rounded-lg bg-success-500 px-3 py-2 text-sm font-medium text-white hover:bg-success-600 disabled:opacity-50"
                    >
                      {(mutation.isPending && mutation.variables?.approval.id === approval.id && actionType === 'approve') ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleRejectClick(approval)}
                      disabled={mutation.isPending && mutation.variables?.approval.id === approval.id}
                      className="flex-1 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm font-medium text-error-700 hover:bg-error-100 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 disabled:opacity-50"
                    >
                      {(mutation.isPending && mutation.variables?.approval.id === approval.id && actionType === 'reject') ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pastApprovals.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Past Approvals</h2>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Module / Tab</th>
                    <th className="px-6 py-4 font-medium">Submitted By</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Comments</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {pastApprovals.map(approval => (
                    <tr key={approval.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800 dark:text-white/90">{approval.module}</div>
                        <div className="text-xs">{approval.tab}</div>
                      </td>
                      <td className="px-6 py-4">{approval.user_profiles?.full_name}</td>
                      <td className="px-6 py-4">{new Date(approval.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          approval.status === 'approved' 
                            ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400' 
                            : 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400'
                        }`}>
                          {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{approval.comments || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReviewClick(approval)}
                            className="text-brand-600 hover:text-brand-800 text-xs font-medium dark:text-brand-400 dark:hover:text-brand-300 transition"
                          >
                            View
                          </button>
                          {approval.status === 'rejected' && user?.id === approval.submitted_by && (
                            <button
                              onClick={() => handleResubmit(approval)}
                              className="text-warning-600 hover:text-warning-800 text-xs font-medium dark:text-warning-400 dark:hover:text-warning-300 transition"
                            >
                              Resubmit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ActionModal
        isOpen={actionModalOpen}
        actionType={actionType}
        onClose={() => setActionModalOpen(false)}
        onConfirm={handleActionConfirm}
        loading={mutation.isPending}
      />
      
      <ReviewChangesModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        approval={selectedApproval}
      />
    </>
  );
}
