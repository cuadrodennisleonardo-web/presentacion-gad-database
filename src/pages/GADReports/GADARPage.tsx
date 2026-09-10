import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useRole } from '@/hooks/useRole';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import YearSelector from '@/components/common/YearSelector';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import type { Database } from '@/types/database';

type GPBEntry = Database['public']['Tables']['gpb_entries']['Row'];

export default function GADARPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { canWrite } = useRole();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ actual_result: string; actual_cost: number; variance_remarks: string }>({
    actual_result: '',
    actual_cost: 0,
    variance_remarks: '',
  });

  const { data: entries = [], isLoading } = useQuery<GPBEntry[]>({
    queryKey: ['gpb_entries_ar', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gpb_entries')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GPBEntry> }) => {
      const { error } = await supabase
        .from('gpb_entries')
        .update({
          actual_result: data.actual_result,
          actual_cost: Number(data.actual_cost) || 0,
          variance_remarks: data.variance_remarks,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpb_entries_ar', year] });
      toast.success('Accomplishment saved successfully');
      setEditingId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update accomplishment');
    },
  });

  const totalPlannedBudget = entries.reduce((acc, curr) => acc + (Number(curr.gad_budget) || 0), 0);
  const totalActualCost = entries.reduce((acc, curr) => acc + (Number(curr.actual_cost) || 0), 0);
  const utilizationRate = totalPlannedBudget > 0 ? (totalActualCost / totalPlannedBudget) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      <PageMeta
        title="GAD Accomplishment Report (GAD AR)"
        description="Monitor actual GAD expenditures and results (PCW-DILG-DBM-NEDA JMC Annex E)"
      />
      <PageBreadcrumb pageTitle="GAD Accomplishment Report (GAD AR)" hideNav={false} />

      {/* Header Banner */}
      <div className="rounded-2xl bg-white dark:bg-gray-800/90 p-6 sm:p-7 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            JMC 2013-01 Annex E
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Annual GAD Accomplishment Report (AR)</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
            Official DILG/PCW accomplishment tracking: record actual results, actual costs incurred, variance analysis, and GAD budget utilization rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <YearSelector year={year} setYear={setYear} scopeKey="gadar" />
        </div>
      </div>

      {/* Utilization Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Approved GAD Budget</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            ₱{totalPlannedBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From approved GPB (FY {year})</p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actual GAD Expenditure</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ₱{totalActualCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total actual disbursements</p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Budget Utilization Rate</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {utilizationRate.toFixed(1)}%
          </p>
          <div className="mt-2 h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${utilizationRate >= 85 ? 'bg-emerald-500' : utilizationRate >= 50 ? 'bg-blue-500' : 'bg-amber-500'} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, utilizationRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Accomplishment Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Annex E Accomplishment Tracker (FY {year})</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Match planned targets with actual results</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No GPB activities found for {year}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please add planned activities in the GPB Form first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3 min-w-[150px]">GAD Activity</th>
                  <th className="p-3 min-w-[120px]">Target</th>
                  <th className="p-3 min-w-[110px] text-right">Approved Budget</th>
                  <th className="p-3 min-w-[160px]">Actual Results / Output</th>
                  <th className="p-3 min-w-[120px] text-right">Actual Cost (₱)</th>
                  <th className="p-3 min-w-[120px] text-right">Variance (₱)</th>
                  <th className="p-3 min-w-[150px]">Remarks</th>
                  {canWrite && <th className="p-3 w-20 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-gray-800 dark:text-gray-200">
                {entries.map((item, idx) => {
                  const variance = (Number(item.gad_budget) || 0) - (Number(item.actual_cost) || 0);
                  const isEditing = editingId === item.id;

                  if (isEditing) {
                    return (
                      <tr key={item.id} className="bg-blue-50/50 dark:bg-blue-900/20">
                        <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                        <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{item.gad_activity}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{item.performance_target || '-'}</td>
                        <td className="p-3 text-right font-medium">
                          ₱{(Number(item.gad_budget) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3">
                          <textarea
                            rows={2}
                            value={editForm.actual_result}
                            onChange={(e) => setEditForm({ ...editForm, actual_result: e.target.value })}
                            placeholder="Describe actual outputs and beneficiaries..."
                            className="w-full rounded border border-blue-300 bg-white p-1.5 text-xs text-gray-800 focus:outline-none"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.actual_cost}
                            onChange={(e) => setEditForm({ ...editForm, actual_cost: parseFloat(e.target.value) || 0 })}
                            className="w-full rounded border border-blue-300 bg-white p-1.5 text-xs text-right text-gray-800 focus:outline-none"
                          />
                        </td>
                        <td className="p-3 text-right text-gray-500">-</td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={editForm.variance_remarks}
                            onChange={(e) => setEditForm({ ...editForm, variance_remarks: e.target.value })}
                            placeholder="Reasons for variance..."
                            className="w-full rounded border border-blue-300 bg-white p-1.5 text-xs text-gray-800 focus:outline-none"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => updateMutation.mutate({ id: item.id, data: editForm })}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                      <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{item.gad_activity}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{item.performance_target || '-'}</td>
                      <td className="p-3 text-right font-medium">
                        ₱{(Number(item.gad_budget) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-200">
                        {item.actual_result ? (
                          <span>{item.actual_result}</span>
                        ) : (
                          <span className="text-gray-400 italic">Pending entry</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        ₱{(Number(item.actual_cost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-3 text-right font-medium ${variance < 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                        ₱{variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{item.variance_remarks || '-'}</td>
                      {canWrite && (
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditForm({
                                actual_result: item.actual_result || '',
                                actual_cost: Number(item.actual_cost) || 0,
                                variance_remarks: item.variance_remarks || '',
                              });
                            }}
                            className="px-2.5 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-xs font-medium transition-colors"
                          >
                            Update
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
