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

export default function EconomicDevelopmentDashboard() {
  const [year, setYear] = useState(getDefaultYear('EconomicDevelopment_Dashboard'));
  const [activeSubSector, setActiveSubSector] = useState<string>('all');

  // Fetch subsectors for Economic Development
  const { data: subsectors = [] } = useQuery({
    queryKey: ['subsectors_econ_dev'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subsectors')
        .select('*')
        .eq('sector', 'Economic Development')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="space-y-6 pb-12">
      <PageMeta title="Economic Development Dashboard" description="Economic Development Sex-Disaggregated Analytics & Indicators" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageBreadcrumb pageTitle="Economic Development Dashboard" hideNav={true} />
        <div className="flex items-center gap-3">
          <Link
            to="/data-entry/economic-development"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition-colors border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Economic Dev Hub
          </Link>
          <YearSelector year={year} setYear={setYear} scopeKey="EconomicDevelopment_Dashboard" />
        </div>
      </div>

      {/* Sub-Sector Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 bg-white dark:bg-gray-800 p-2.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80">
        <button
          onClick={() => setActiveSubSector('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeSubSector === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
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
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* Dynamic Sector Charts & Budget Tracking */}
      <DynamicDashboardCharts department="Economic Development" subSector={activeSubSector} year={year} />
      <DynamicBudgetCharts department="Economic Development" subSector={activeSubSector} year={year} />
    </div>
  );
}
