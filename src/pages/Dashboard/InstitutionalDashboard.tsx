import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { getDefaultYear } from '@/utils/yearUtils';
import YearSelector from '@/components/common/YearSelector';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import DynamicDashboardCharts from '@/components/common/DynamicDashboardCharts';
import DynamicBudgetCharts from '@/components/common/DynamicBudgetCharts';

export default function InstitutionalDashboard() {
  const [year, setYear] = useState(getDefaultYear('Institutional_Dashboard'));
  const [activeSubSector, setActiveSubSector] = useState<string>('all');

  // Fetch subsectors for Institutional
  const { data: subsectors = [] } = useQuery({
    queryKey: ['subsectors_institutional'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subsectors')
        .select('*')
        .eq('sector', 'Institutional')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="space-y-6 pb-12">
      <PageMeta title="Institutional Dashboard" description="Institutional Governance & GAD Compliance Analytics" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageBreadcrumb pageTitle="Institutional Dashboard" hideNav={true} />
        <div className="flex items-center gap-3">
          <Link
            to="/gad-reports"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-semibold transition-colors border border-purple-200/60 dark:border-purple-800/40 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            GAD Reports
          </Link>
          <Link
            to="/data-entry/institutional"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition-colors border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Institutional Hub
          </Link>
          <YearSelector year={year} setYear={setYear} scopeKey="Institutional_Dashboard" />
        </div>
      </div>

      {/* Sub-Sector Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 bg-white dark:bg-gray-800 p-2.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80">
        <button
          onClick={() => setActiveSubSector('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeSubSector === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
          }`}
        >
          All Subsectors ({subsectors.length})
        </button>
        {subsectors.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveSubSector(sub.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubSector === sub.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* Dynamic Sector Charts & Budget Tracking */}
      <DynamicDashboardCharts department="Institutional" subSector={activeSubSector} year={year} />
      <DynamicBudgetCharts department="Institutional" subSector={activeSubSector} year={year} />
    </div>
  );
}
