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

export default function EnvironmentDashboard() {
  const [year, setYear] = useState(getDefaultYear('Environment_Dashboard'));
  const [activeSubSector, setActiveSubSector] = useState<string>('all');

  // Fetch subsectors for Environment
  const { data: subsectors = [] } = useQuery({
    queryKey: ['subsectors_environment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subsectors')
        .select('*')
        .eq('sector', 'Environment')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="space-y-6 pb-12">
      <PageMeta title="Environment Dashboard" description="Environment & Climate Resilience Metrics & Indicators" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageBreadcrumb pageTitle="Environment Dashboard" hideNav={true} />
        <div className="flex items-center gap-3">
          <Link
            to="/data-entry/environment"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-semibold transition-colors border border-teal-200/60 dark:border-teal-800/40 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Environment Hub
          </Link>
          <YearSelector year={year} setYear={setYear} scopeKey="Environment_Dashboard" />
        </div>
      </div>

      {/* Sub-Sector Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 bg-white dark:bg-gray-800 p-2.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80">
        <button
          onClick={() => setActiveSubSector('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeSubSector === 'all'
              ? 'bg-teal-600 text-white shadow-sm'
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
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* Dynamic Sector Charts & Budget Tracking */}
      <DynamicDashboardCharts department="Environment" subSector={activeSubSector} year={year} />
      <DynamicBudgetCharts department="Environment" subSector={activeSubSector} year={year} />
    </div>
  );
}
