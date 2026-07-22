import { getDefaultYear } from '@/utils/yearUtils';
import YearSelector from '@/components/common/YearSelector';
import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import MultiSeriesChart from "@/components/charts/MultiSeriesChart";
import DynamicDashboardCharts from "@/components/common/DynamicDashboardCharts";
import DynamicBudgetCharts from '@/components/common/DynamicBudgetCharts';
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { CHART_COLORS } from "@/config/chartColors";
import { useSocialDevStats } from "@/hooks/queries/useSocialDevStats";


export default function SocialDevelopmentDashboard() {
  const [year, setYear] = useState(getDefaultYear('SocialDevelopment_Dashboard'));

  const { data: stats, isLoading } = useSocialDevStats(year);

  const statCards = [
    { 
      title: "Total Student Enrollment", 
      value: stats?.enrolledTotal || 0, 
      icon: stats?.enrolledHasTotalOnly ? "" : `M: ${stats?.enrolledM || 0} | F: ${stats?.enrolledF || 0}`, 
      bg: "bg-blue-50 dark:bg-blue-500/10", 
      color: "text-blue-600" 
    },
    { title: "School Drop-outs", value: stats?.dropOuts || 0, icon: "", bg: "bg-orange-50 dark:bg-orange-500/10", color: "text-orange-600" },
    { title: "Out-of-School Youth", value: stats?.osy || 0, icon: "", bg: "bg-red-50 dark:bg-red-500/10", color: "text-red-600" },
    { title: "Teenage Pregnancies", value: stats?.teenPregnancy || 0, icon: "", bg: "bg-pink-50 dark:bg-pink-500/10", color: "text-pink-600" },
    { title: "Maternal Mortality", value: stats?.maternalMortality || 0, icon: "", bg: "bg-rose-50 dark:bg-rose-500/10", color: "text-rose-600" },
    { title: "Total PWDs", value: stats?.pwds || 0, icon: "", bg: "bg-purple-50 dark:bg-purple-500/10", color: "text-purple-600" },
    { title: "Total 4Ps Beneficiaries", value: stats?.fourPs || 0, icon: "", bg: "bg-emerald-50 dark:bg-emerald-500/10", color: "text-emerald-600" },
    { title: "Senior Citizens", value: stats?.seniorCitizens || 0, icon: "", bg: "bg-amber-50 dark:bg-amber-500/10", color: "text-amber-600" },
    { title: "Solo Parents", value: stats?.soloParents || 0, icon: "", bg: "bg-rose-50 dark:bg-rose-500/10", color: "text-rose-600" },
  ];



  return (
    <>
      <PageMeta title="Social Development Dashboard" description="Social Development Overview" />
      <div className="flex items-center justify-between mb-6">
        <PageBreadcrumb pageTitle="Social Development Dashboard" hideNav={true} />
        <YearSelector year={year} setYear={setYear} scopeKey="SocialDevelopment_Dashboard" />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {statCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-3xl font-bold text-gray-800 dark:text-white/90">{card.value.toLocaleString()}</p>
                  {card.icon && <p className={`text-sm font-semibold ${card.color} ${card.bg} px-2 py-1 rounded`}>{card.icon}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ErrorBoundary>
              <MultiSeriesChart 
                title={stats?.enrolledHasTotalOnly 
                  ? `Student Enrollment by School (Total) (${year}-${year + 1})` 
                  : `Student Enrollment by School (M vs F) (${year}-${year + 1})`}
                type="bar"
                categories={stats?.schools || []}
                series={stats?.enrolledSeries || []}
                colors={stats?.enrolledHasTotalOnly ? ["#3b82f6"] : [CHART_COLORS.male, CHART_COLORS.female]}
              />
            </ErrorBoundary>
            
            <ErrorBoundary>
              <MultiSeriesChart 
                title={stats?.malHasTotalOnly 
                  ? "Malnourished / Stunted by Barangay (Total)" 
                  : "Malnourished / Stunted by Barangay (M vs F)"}
                type="line"
                categories={stats?.barangays || []}
                series={stats?.malnourishedSeries || []}
                colors={stats?.malHasTotalOnly ? ["#f97316"] : [CHART_COLORS.male, CHART_COLORS.female]}
              />
            </ErrorBoundary>
          </div>

          <DynamicDashboardCharts department="Social Development" />
          <DynamicBudgetCharts department="Social Development" />

        </>
      )}
    </>
  );
}


