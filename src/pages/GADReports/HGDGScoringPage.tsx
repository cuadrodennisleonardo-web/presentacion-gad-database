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

type HGDGRow = Database['public']['Tables']['hgdg_scores']['Row'];

export default function HGDGScoringPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { canWrite, isSuperAdmin } = useRole();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    program_name: '',
    implementing_office: '',
    checklist_type: 'generic_box7a',
    raw_score: 15,
    program_budget: 0,
    assessment_notes: '',
  });

  const { data: scores = [], isLoading } = useQuery<HGDGRow[]>({
    queryKey: ['hgdg_scores', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hgdg_scores')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const calculateAttribution = (score: number) => {
    if (score >= 15.0) return { pct: 100, rating: 'gender_responsive', label: 'Gender-Responsive (100%)' };
    if (score >= 8.0) return { pct: 75, rating: 'gender_sensitive', label: 'Gender-Sensitive (75%)' };
    if (score >= 4.0) return { pct: 50, rating: 'conditional', label: 'Promising GAD (50%)' };
    return { pct: 0, rating: 'gender_blind', label: 'Gender-Blind (0%)' };
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const attr = calculateAttribution(Number(data.raw_score) || 0);
      const programBudget = Number(data.program_budget) || 0;
      const attributedBudget = (programBudget * attr.pct) / 100;

      const { error } = await supabase.from('hgdg_scores').insert([
        {
          year,
          program_name: data.program_name,
          implementing_office: data.implementing_office,
          checklist_type: data.checklist_type,
          raw_score: Number(data.raw_score) || 0,
          gender_rating: attr.rating,
          budget_attribution_pct: attr.pct,
          program_budget: programBudget,
          attributed_gad_budget: attributedBudget,
          assessment_notes: data.assessment_notes,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hgdg_scores', year] });
      toast.success('HGDG Program assessment recorded');
      setShowAddModal(false);
      setFormData({
        program_name: '',
        implementing_office: '',
        checklist_type: 'generic_box7a',
        raw_score: 15,
        program_budget: 0,
        assessment_notes: '',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save HGDG score');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hgdg_scores').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hgdg_scores', year] });
      toast.success('Assessment removed');
    },
  });

  const totalProgramBudget = scores.reduce((acc, curr) => acc + (Number(curr.program_budget) || 0), 0);
  const totalAttributedBudget = scores.reduce((acc, curr) => acc + (Number(curr.attributed_gad_budget) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <PageMeta
        title="HGDG Scoring Tool"
        description="Harmonized Gender & Development Guidelines Program Checklist & Budget Attribution"
      />
      <PageBreadcrumb pageTitle="HGDG Scoring Tool" hideNav={false} />

      {/* Header Banner */}
      <div className="rounded-2xl bg-white dark:bg-gray-800/90 p-6 sm:p-7 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 dark:bg-teal-900/30 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
            Harmonized GAD Guidelines
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">HGDG Scoring & Budget Attribution Tool</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
            Evaluate regular municipal programs using HGDG Box checklists (0-20 scale) to calculate attributable budget eligible for the 5% GAD expenditure mandate.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <YearSelector year={year} setYear={setYear} scopeKey="hgdg" />
          {canWrite && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Score New Project
            </button>
          )}
        </div>
      </div>

      {/* Attribution Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assessed Programs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{scores.length}</p>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Total scored for FY {year}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Program Budgets</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            ₱{totalProgramBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across evaluated projects</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attributed GAD Budget</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            ₱{totalAttributedBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Creditable to 5% GAD quota</p>
        </div>
      </div>

      {/* Scoring Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Assessed Projects & Attribution Roster</h2>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : scores.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No projects scored yet for {year}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click "Score New Project" to apply the HGDG rating tool.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3 min-w-[160px]">Program / Project Name</th>
                  <th className="p-3 min-w-[120px]">Office</th>
                  <th className="p-3 min-w-[90px] text-center">HGDG Score</th>
                  <th className="p-3 min-w-[130px]">Gender Rating</th>
                  <th className="p-3 min-w-[100px] text-center">Attribution %</th>
                  <th className="p-3 min-w-[120px] text-right">Program Cost (₱)</th>
                  <th className="p-3 min-w-[130px] text-right">Attributed GAD (₱)</th>
                  {isSuperAdmin && <th className="p-3 w-16 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-gray-800 dark:text-gray-200">
                {scores.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                    <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{row.program_name}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{row.implementing_office || '-'}</td>
                    <td className="p-3 text-center font-bold text-teal-600 dark:text-teal-400">{row.raw_score.toFixed(2)}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center rounded-full bg-teal-50 dark:bg-teal-900/30 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                        {row.gender_rating.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">{row.budget_attribution_pct}%</td>
                    <td className="p-3 text-right">
                      ₱{(Number(row.program_budget) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      ₱{(Number(row.attributed_gad_budget) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    {isSuperAdmin && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => deleteMutation.mutate(row.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Remove"
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

      {/* Add Assessment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Score Program / Project (HGDG)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Harmonized Gender and Development Guidelines 0-20 rating scale.</p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Program / Project Name *</label>
                <input
                  type="text"
                  value={formData.program_name}
                  onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                  placeholder="e.g. Municipal Agricultural Livelihood Expansion Project"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Implementing Office</label>
                <input
                  type="text"
                  value={formData.implementing_office}
                  onChange={(e) => setFormData({ ...formData, implementing_office: e.target.value })}
                  placeholder="e.g. Municipal Agriculture Office (MAO)"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Total Program Budget (₱) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.program_budget || ''}
                    onChange={(e) => setFormData({ ...formData, program_budget: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">HGDG Score (0.00 - 20.00) *</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.01"
                    value={formData.raw_score}
                    onChange={(e) => setFormData({ ...formData, raw_score: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Attribution Preview */}
              <div className="rounded-xl bg-teal-50/70 dark:bg-teal-900/20 p-3 border border-teal-200/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-teal-800 dark:text-teal-300">
                    Result: {calculateAttribution(formData.raw_score).label}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Attributed: ₱{(((Number(formData.program_budget) || 0) * calculateAttribution(formData.raw_score).pct) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Assessment Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={formData.assessment_notes}
                  onChange={(e) => setFormData({ ...formData, assessment_notes: e.target.value })}
                  placeholder="Key findings from the gender analysis..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
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
                disabled={!formData.program_name || createMutation.isPending}
                onClick={() => createMutation.mutate(formData)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving...' : 'Save Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
