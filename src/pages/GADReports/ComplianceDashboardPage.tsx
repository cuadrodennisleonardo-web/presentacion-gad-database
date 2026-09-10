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

type ComplianceRow = Database['public']['Tables']['compliance_status']['Row'];

const DEFAULT_INDICATORS = [
  { id: 'gpb_formulation', title: '1. Annual GAD Plan & Budget (GPB) Formulation & Timely Submission to DILG' },
  { id: 'gad_budget_5pct', title: '2. Minimum 5% GAD Budget Allocation & Utilization from Total LGU Budget' },
  { id: 'gad_code', title: '3. Enactment and Implementation of Local GAD Code & IRR' },
  { id: 'gfps_functionality', title: '4. GAD Focal Point System (GFPS) Creation & Quarterly Meetings' },
  { id: 'gad_database', title: '5. Establishment of Sex-Disaggregated GAD Database (Presentacion GAD System)' },
  { id: 'lcpc_functionality', title: '6. Local Council for the Protection of Children (LCPC) Organization & Functionality' },
  { id: 'vawc_desk_shelter', title: '7. Barangay VAWC Desks Institutionalization & Women Support Facility' },
  { id: 'gender_in_plans', title: '8. Gender Mainstreaming in CLUP, CDP, ELA, and Local DRRM Plans' },
  { id: 'gad_office_unit', title: '9. GAD Office / Unit Functionality & Technical Capacity Development' },
  { id: 'local_media_board', title: '10. Local Media Board Creation / Monitoring of Gender Stereotyping' },
];

export default function ComplianceDashboardPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { canWrite } = useRole();
  const queryClient = useQueryClient();

  const { data: dbRecords = [], isLoading } = useQuery<ComplianceRow[]>({
    queryKey: ['compliance_status', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_status')
        .select('*')
        .eq('year', year);
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ indicatorId, title, status, score, evidenceNotes }: { indicatorId: string; title: string; status: string; score: number; evidenceNotes: string }) => {
      const { error } = await supabase.from('compliance_status').upsert(
        {
          year,
          indicator_id: indicatorId,
          indicator_title: title,
          status,
          score,
          evidence_notes: evidenceNotes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'year,indicator_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance_status', year] });
      toast.success('Compliance indicator updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update compliance');
    },
  });

  // Merge default list with DB records
  const indicatorsList = DEFAULT_INDICATORS.map((ind) => {
    const found = dbRecords.find((r) => r.indicator_id === ind.id);
    return {
      id: ind.id,
      title: ind.title,
      status: found?.status || 'non_compliant',
      score: found?.score || 0,
      evidence_notes: found?.evidence_notes || '',
      updated_at: found?.updated_at || null,
    };
  });

  const compliantCount = indicatorsList.filter((i) => i.status === 'compliant').length;
  const inProgressCount = indicatorsList.filter((i) => i.status === 'in_progress').length;
  const nonCompliantCount = indicatorsList.filter((i) => i.status === 'non_compliant').length;
  const overallScore = Math.round(
    indicatorsList.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / indicatorsList.length
  );

  return (
    <div className="space-y-6 pb-12">
      <PageMeta
        title="MCW / DILG Compliance Scorecard"
        description="10-indicator compliance scorecard based on Magna Carta of Women & JMC 2013-01"
      />
      <PageBreadcrumb pageTitle="MCW Compliance Scorecard" hideNav={false} />

      {/* Header Banner */}
      <div className="rounded-2xl bg-white dark:bg-gray-800/90 p-6 sm:p-7 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            DILG / PCW Scorecard
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Magna Carta of Women (MCW) Compliance</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
            10 key compliance indicators monitored annually for DILG inspection, GAD Seal assessment, and statutory municipal reporting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <YearSelector year={year} setYear={setYear} scopeKey="compliance" />
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overall Compliance</p>
          <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{overallScore}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Average compliance index</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Compliant</p>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{compliantCount} / 10</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fully implemented</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">In Progress</p>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{inProgressCount} / 10</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ongoing initiatives</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Non-Compliant</p>
          <p className="text-3xl font-extrabold text-red-500 mt-1">{nonCompliantCount} / 10</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Action required</p>
        </div>
      </div>

      {/* 10 Indicators Checklist */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          indicatorsList.map((ind, idx) => (
            <div
              key={ind.id}
              className="rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs font-bold text-blue-700 dark:text-blue-300">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{ind.title}</h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 pl-8">
                  {ind.evidence_notes || 'No evidence notes recorded.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pl-8 md:pl-0">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    ind.status === 'compliant'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                      : ind.status === 'in_progress'
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200'
                  }`}
                >
                  {ind.status === 'compliant' ? 'Compliant' : ind.status === 'in_progress' ? 'In Progress' : 'Non-Compliant'}
                </span>

                {canWrite && (
                  <select
                    value={ind.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      const newScore = newStatus === 'compliant' ? 100 : newStatus === 'in_progress' ? 50 : 0;
                      updateMutation.mutate({
                        indicatorId: ind.id,
                        title: ind.title,
                        status: newStatus,
                        score: newScore,
                        evidenceNotes: ind.evidence_notes,
                      });
                    }}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-2.5 py-1 text-xs text-gray-800 dark:text-gray-200 focus:outline-none"
                  >
                    <option value="compliant">Set: Compliant (100%)</option>
                    <option value="in_progress">Set: In Progress (50%)</option>
                    <option value="non_compliant">Set: Non-Compliant (0%)</option>
                  </select>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
