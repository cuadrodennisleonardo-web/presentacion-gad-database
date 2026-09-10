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

export default function GPBFormPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { canWrite, isSuperAdmin } = useRole();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<GPBEntry>>({
    gender_issue: '',
    cause: '',
    gad_objective: '',
    relevant_ppa: '',
    gad_activity: '',
    performance_indicator: '',
    performance_target: '',
    gad_budget: 0,
    budget_source: 'MOOE',
    opr: '',
    status: 'planned',
  });

  const { data: entries = [], isLoading } = useQuery<GPBEntry[]>({
    queryKey: ['gpb_entries', year],
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

  const createMutation = useMutation({
    mutationFn: async (newEntry: Partial<GPBEntry>) => {
      const { data, error } = await supabase.from('gpb_entries').insert([
        {
          year,
          gender_issue: newEntry.gender_issue || '',
          cause: newEntry.cause || '',
          gad_objective: newEntry.gad_objective || '',
          relevant_ppa: newEntry.relevant_ppa || '',
          gad_activity: newEntry.gad_activity || '',
          performance_indicator: newEntry.performance_indicator || '',
          performance_target: newEntry.performance_target || '',
          gad_budget: Number(newEntry.gad_budget) || 0,
          budget_source: newEntry.budget_source || 'MOOE',
          opr: newEntry.opr || '',
          status: 'planned',
        },
      ]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpb_entries', year] });
      toast.success('GPB Activity added successfully');
      setShowAddModal(false);
      setFormData({
        gender_issue: '',
        cause: '',
        gad_objective: '',
        relevant_ppa: '',
        gad_activity: '',
        performance_indicator: '',
        performance_target: '',
        gad_budget: 0,
        budget_source: 'MOOE',
        opr: '',
        status: 'planned',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add GPB entry');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gpb_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpb_entries', year] });
      toast.success('GPB entry deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete entry');
    },
  });

  const totalPlannedBudget = entries.reduce((acc, curr) => acc + (Number(curr.gad_budget) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <PageMeta
        title="GAD Plan & Budget (GPB)"
        description="Formulate annual Gender and Development Plan & Budget (PCW-DILG-DBM-NEDA JMC Annex D)"
      />
      <PageBreadcrumb pageTitle="GAD Plan & Budget (GPB)" hideNav={false} />

      {/* Header Banner */}
      <div className="rounded-2xl bg-white dark:bg-gray-800/90 p-6 sm:p-7 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            JMC 2013-01 Annex D
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Annual GAD Plan & Budget (GPB)</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
            Official 9-column DILG / PCW template for identifying gender issues, mandates, PPA activities, targets, and statutory budget allocations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <YearSelector year={year} setYear={setYear} scopeKey="gpb" />
          {canWrite && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add GAD Activity
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Activities</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{entries.length}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Planned for FY {year}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total GAD Budget</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ₱{totalPlannedBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Earmarked GAD allocation</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submission Status</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">Draft Formulation</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Under GFPS review</p>
        </div>
      </div>

      {/* 9-Column GPB Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">GPB Activities Matrix (FY {year})</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">9-column standard layout per Annex D</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No GPB activities added yet for {year}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click "Add GAD Activity" to begin formulating the GAD Plan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3 min-w-[160px]">1. Gender Issue / Mandate</th>
                  <th className="p-3 min-w-[140px]">2. Cause of Issue</th>
                  <th className="p-3 min-w-[140px]">3. GAD Objective</th>
                  <th className="p-3 min-w-[140px]">4. Relevant PPA</th>
                  <th className="p-3 min-w-[160px]">5. GAD Activity</th>
                  <th className="p-3 min-w-[140px]">6. Performance Indicator</th>
                  <th className="p-3 min-w-[120px]">7. Target</th>
                  <th className="p-3 min-w-[130px] text-right">8. GAD Budget (₱)</th>
                  <th className="p-3 min-w-[100px]">9. OPR</th>
                  {isSuperAdmin && <th className="p-3 w-16 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-gray-800 dark:text-gray-200">
                {entries.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="p-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                    <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{item.gender_issue}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{item.cause || '-'}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{item.gad_objective || '-'}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{item.relevant_ppa || '-'}</td>
                    <td className="p-3 font-medium text-blue-600 dark:text-blue-400">{item.gad_activity}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{item.performance_indicator || '-'}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{item.performance_target || '-'}</td>
                    <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      ₱{(Number(item.gad_budget) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300 font-medium">{item.opr || '-'}</td>
                    {isSuperAdmin && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Delete entry"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-100 dark:border-gray-700 my-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Add GAD Plan & Budget Activity</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Fill in the 9 mandated columns per Annex D guidelines.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  1. Gender Issue / GAD Mandate *
                </label>
                <textarea
                  rows={2}
                  value={formData.gender_issue || ''}
                  onChange={(e) => setFormData({ ...formData, gender_issue: e.target.value })}
                  placeholder="e.g. Low economic participation of women in barangay agri-cooperatives"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  2. Cause of the Gender Issue
                </label>
                <input
                  type="text"
                  value={formData.cause || ''}
                  onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                  placeholder="e.g. Lack of technical skills & microcredit"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  3. GAD Objective
                </label>
                <input
                  type="text"
                  value={formData.gad_objective || ''}
                  onChange={(e) => setFormData({ ...formData, gad_objective: e.target.value })}
                  placeholder="e.g. Increase women entrepreneurs by 30%"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  4. Relevant LGU PPA
                </label>
                <input
                  type="text"
                  value={formData.relevant_ppa || ''}
                  onChange={(e) => setFormData({ ...formData, relevant_ppa: e.target.value })}
                  placeholder="e.g. Municipal Livelihood Assistance Project"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  5. GAD Activity *
                </label>
                <input
                  type="text"
                  value={formData.gad_activity || ''}
                  onChange={(e) => setFormData({ ...formData, gad_activity: e.target.value })}
                  placeholder="e.g. Conduct Skills Training on Food Processing"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  6. Performance Indicator
                </label>
                <input
                  type="text"
                  value={formData.performance_indicator || ''}
                  onChange={(e) => setFormData({ ...formData, performance_indicator: e.target.value })}
                  placeholder="e.g. Number of women trained and starting business"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  7. Performance Target
                </label>
                <input
                  type="text"
                  value={formData.performance_target || ''}
                  onChange={(e) => setFormData({ ...formData, performance_target: e.target.value })}
                  placeholder="e.g. 150 women across 18 barangays"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  8. GAD Budget (₱) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.gad_budget || ''}
                  onChange={(e) => setFormData({ ...formData, gad_budget: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Budget Source
                </label>
                <select
                  value={formData.budget_source || 'MOOE'}
                  onChange={(e) => setFormData({ ...formData, budget_source: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="MOOE">MOOE</option>
                  <option value="CO">Capital Outlay (CO)</option>
                  <option value="PS">Personnel Services (PS)</option>
                  <option value="External">External / ODA</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  9. Office of Primary Responsibility (OPR)
                </label>
                <input
                  type="text"
                  value={formData.opr || ''}
                  onChange={(e) => setFormData({ ...formData, opr: e.target.value })}
                  placeholder="e.g. MSWDO / MPDO / MAO"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!formData.gender_issue || !formData.gad_activity || createMutation.isPending}
                onClick={() => createMutation.mutate(formData)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving...' : 'Save Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
