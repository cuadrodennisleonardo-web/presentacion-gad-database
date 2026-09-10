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
import ErrorBoundary from '@/components/common/ErrorBoundary';
import MultiSeriesChart from '@/components/charts/MultiSeriesChart';
import { CHART_COLORS } from '@/config/chartColors';
import { useSocialDevStats } from '@/hooks/queries/useSocialDevStats';
import { useDemographicsStats } from '@/hooks/queries/useDemographicsStats';

export default function SocialDevelopmentDashboard() {
  const [year, setYear] = useState(getDefaultYear('SocialDevelopment_Dashboard'));
  const [activeSubSector, setActiveSubSector] = useState<string>('all');

  const { data: stats, isLoading: isLoadingStats } = useSocialDevStats(year);
  const { data: demoStats, isLoading: isLoadingDemo } = useDemographicsStats(year);

  // Fetch subsectors for Social Development
  const { data: subsectors = [] } = useQuery({
    queryKey: ['subsectors_social_dev'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subsectors')
        .select('*')
        .eq('sector', 'Social Development')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const allStatCards = [
    { 
      subSector: 'demography',
      title: "Total Municipal Population", 
      value: demoStats?.residents || 0, 
      icon: `M: ${(demoStats?.sexDist?.male || 0).toLocaleString()} | F: ${(demoStats?.sexDist?.female || 0).toLocaleString()}`, 
      bg: "bg-blue-50 dark:bg-blue-500/10", 
      color: "text-blue-600 dark:text-blue-400" 
    },
    { 
      subSector: 'education',
      title: "Student Enrollment", 
      value: stats?.enrolledTotal || 0, 
      icon: stats?.enrolledHasTotalOnly ? "" : `M: ${(stats?.enrolledM || 0).toLocaleString()} | F: ${(stats?.enrolledF || 0).toLocaleString()}`, 
      bg: "bg-indigo-50 dark:bg-indigo-500/10", 
      color: "text-indigo-600 dark:text-indigo-400" 
    },
    { subSector: 'education', title: "Out-of-School Youth (OSY)", value: stats?.osy || 0, icon: "", bg: "bg-red-50 dark:bg-red-500/10", color: "text-red-600 dark:text-red-400" },
    { subSector: 'health', title: "Maternal Health Concerns", value: stats?.maternalMortality || 0, icon: "Maternal Cases", bg: "bg-rose-50 dark:bg-rose-500/10", color: "text-rose-600 dark:text-rose-400" },
    { subSector: 'health', title: "Teenage Pregnancies", value: stats?.teenPregnancy || 0, icon: "Adolescent (10-19)", bg: "bg-pink-50 dark:bg-pink-500/10", color: "text-pink-600 dark:text-pink-400" },
    { subSector: 'social-protection', title: "Persons with Disabilities (PWD)", value: stats?.pwds || 0, icon: "", bg: "bg-purple-50 dark:bg-purple-500/10", color: "text-purple-600 dark:text-purple-400" },
    { subSector: 'social-protection', title: "4Ps Beneficiary Households", value: stats?.fourPs || 0, icon: "", bg: "bg-emerald-50 dark:bg-emerald-500/10", color: "text-emerald-600 dark:text-emerald-400" },
    { subSector: 'senior-citizens', title: "Senior Citizens (60+ yrs)", value: stats?.seniorCitizens || 0, icon: "Indigent Pensioners", bg: "bg-amber-50 dark:bg-amber-500/10", color: "text-amber-600 dark:text-amber-400" },
    { subSector: 'social-protection', title: "Solo Parents Registered", value: stats?.soloParents || 0, icon: "", bg: "bg-teal-50 dark:bg-teal-500/10", color: "text-teal-600 dark:text-teal-400" },
  ];

  const visibleStatCards = activeSubSector === 'all' 
    ? allStatCards.slice(0, 6)
    : allStatCards.filter(c => c.subSector === activeSubSector);

  return (
    <div className="space-y-6 pb-12">
      <PageMeta title="Social Development Dashboard" description="Social Development Sex-Disaggregated Analytics & Indicators" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageBreadcrumb pageTitle="Social Development Dashboard" hideNav={true} />
        <div className="flex items-center gap-3">
          <Link
            to="/data-entry/social-development"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold transition-colors border border-blue-200/60 dark:border-blue-800/40 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Social Dev Hub
          </Link>
          <YearSelector year={year} setYear={setYear} scopeKey="SocialDevelopment_Dashboard" />
        </div>
      </div>

      {/* Sub-Sector Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 bg-white dark:bg-gray-800 p-2.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80">
        <button
          onClick={() => setActiveSubSector('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeSubSector === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
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
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* KPI Stat Cards */}
      {visibleStatCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleStatCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{card.title}</p>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {(isLoadingStats || isLoadingDemo) ? '...' : (card.value || 0).toLocaleString()}
                </p>
                {card.icon && (
                  <span className={`text-[11px] font-semibold ${card.color} ${card.bg} px-2.5 py-1 rounded-lg`}>
                    {card.icon}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Core Built-in School Enrollment MultiSeries Charts */}
      {(activeSubSector === 'all' || activeSubSector === 'education') && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorBoundary>
            <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
              <MultiSeriesChart 
                title={stats.primaryHasTotalOnly 
                  ? `Primary School Enrollment (Total) (${year})` 
                  : `Primary School Enrollment (Male vs Female) (${year})`}
                type="bar"
                categories={stats.primarySchools || []}
                series={stats.primaryEnrolledSeries || []}
                colors={stats.primaryHasTotalOnly ? ["#3b82f6"] : [CHART_COLORS.male, CHART_COLORS.female]}
              />
            </div>
          </ErrorBoundary>
          
          <ErrorBoundary>
            <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
              <MultiSeriesChart 
                title={stats.secondaryHasTotalOnly 
                  ? `Secondary School Enrollment (Total) (${year})` 
                  : `Secondary School Enrollment (Male vs Female) (${year})`}
                type="bar"
                categories={stats.secondarySchools || []}
                series={stats.secondaryEnrolledSeries || []}
                colors={stats.secondaryHasTotalOnly ? ["#6366f1"] : [CHART_COLORS.male, CHART_COLORS.female]}
              />
            </div>
          </ErrorBoundary>
        </div>
      )}

      {/* Health Indicator Chart */}
      {(activeSubSector === 'all' || activeSubSector === 'health') && stats && (
        <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <ErrorBoundary>
            <MultiSeriesChart 
              title={stats.malHasTotalOnly 
                ? `Malnourished / Stunted Under-5 by Barangay (Total) (${year})` 
                : `Malnourished / Stunted Under-5 by Barangay (Male vs Female) (${year})`}
              type="bar"
              categories={stats.barangays || []}
              series={stats.malnourishedSeries || []}
              colors={stats.malHasTotalOnly ? ["#f97316"] : [CHART_COLORS.male, CHART_COLORS.female]}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Dynamic Sector Charts & Budget Tracking */}
      <DynamicDashboardCharts department="Social Development" subSector={activeSubSector} year={year} />
      <DynamicBudgetCharts department="Social Development" subSector={activeSubSector} year={year} />
    </div>
  );
}
