import { getDefaultYear } from '@/utils/yearUtils';
import YearSelector from '@/components/common/YearSelector';
import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import MultiSeriesChart from "@/components/charts/MultiSeriesChart";
import DynamicDashboardCharts from '@/components/common/DynamicDashboardCharts';
import DynamicBudgetCharts from '@/components/common/DynamicBudgetCharts';
import { useGADStats } from "@/hooks/queries/useGADStats";


export default function GADDashboard() {
  const [year, setYear] = useState(getDefaultYear('GAD_Dashboard'));
  const { data: stats, isLoading } = useGADStats(year);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(val);
  };

  const statCards = [
    { title: "Total LGU Budget", value: formatCurrency(stats?.lguBudget || 0), icon: "Budget", bg: "bg-blue-50 dark:bg-blue-500/10", color: "text-blue-600" },
    { title: "GAD Allocated", value: formatCurrency(stats?.gadAllocated || 0), icon: "Allocated", bg: "bg-indigo-50 dark:bg-indigo-500/10", color: "text-indigo-600" },
    { title: "GAD Utilized", value: formatCurrency(stats?.gadUtilized || 0), icon: "Utilized", bg: "bg-emerald-50 dark:bg-emerald-500/10", color: "text-emerald-600" },
  ];

  return (
    <>
      <PageMeta title="Institutional GAD Dashboard" description="GAD Overview" />
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Institutional GAD Dashboard" hideNav={true} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">Overview Metrics</h3>
        <YearSelector year={year} setYear={setYear} scopeKey="GAD_Dashboard" />
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
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">{card.value}</p>
                  <p className={`text-sm font-semibold ${card.color} ${card.bg} px-2 py-1 rounded`}>{card.icon}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
             <div className="lg:col-span-1">
               <MultiSeriesChart 
                  title="Overall Budget Breakdown"
                  type="donut"
                  categories={stats?.budgetLabels || []}
                  series={stats?.budgetSeries || []}
                  colors={["#94a3b8", "#10b981", "#fbbf24"]}
               />
             </div>
             
             <div className="lg:col-span-1 grid grid-cols-1 gap-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02] flex flex-col justify-center items-center text-center">
                   <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">GAD Trainings Conducted</h2>
                   <p className="text-6xl font-black text-brand-500">{stats?.trainings || 0}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02] flex flex-col justify-center items-center text-center">
                   <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">Total Participants Trained</h2>
                   <p className="text-6xl font-black text-rose-500">{stats?.participants || 0}</p>
                </div>
             </div>
          </div>

          <DynamicDashboardCharts department="Institutional GAD" />
          <DynamicBudgetCharts department="Institutional GAD" />

        </>
      )}
    </>
  );
}

