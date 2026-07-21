import { getDefaultYear } from '@/utils/yearUtils';
import YearSelector from '@/components/common/YearSelector';
import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import MultiSeriesChart from "@/components/charts/MultiSeriesChart";
import DynamicDashboardCharts from '@/components/common/DynamicDashboardCharts';
import DynamicBudgetCharts from '@/components/common/DynamicBudgetCharts';
import { useJusticeStats } from "@/hooks/queries/useJusticeStats";


export default function JusticeDashboard() {
  const [year, setYear] = useState(getDefaultYear('Justice_Dashboard'));
  const { data: stats, isLoading } = useJusticeStats(year);

  const statCards = [
    { title: "Reported VAWC Cases", value: stats?.vawc || 0, icon: "Cases", bg: "bg-red-50 dark:bg-red-500/10", color: "text-red-600" },
    { title: "Total CICL Cases", value: stats?.cicl || 0, icon: "Cases", bg: "bg-purple-50 dark:bg-purple-500/10", color: "text-purple-600" },
    { title: "Total Sexual Assault Cases", value: stats?.assault || 0, icon: "Cases", bg: "bg-orange-50 dark:bg-orange-500/10", color: "text-orange-600" },
  ];

  return (
    <>
      <PageMeta title="Justice & Safety Dashboard" description="Justice & Safety Overview" />
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Justice & Safety Dashboard" hideNav={true} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">Overview Metrics</h3>
        <YearSelector year={year} setYear={setYear} scopeKey="Justice_Dashboard" />
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
                  <p className={`text-sm font-semibold ${card.color} ${card.bg} px-2 py-1 rounded`}>{card.icon}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-1">
             <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
               <MultiSeriesChart 
                 title="Justice & Safety Cases by Barangay"
                 type="bar"
                 categories={stats?.barangays || []}
                 series={[
                   { name: "VAWC Cases", data: stats?.vawc_series || [] },
                   { name: "CICL Cases", data: stats?.cicl_series || [] },
                   { name: "Sexual Assault", data: stats?.assault_series || [] }
                 ]}
                 colors={["#ef4444", "#a855f7", "#f43f5e"]}
               />
             </div>
          </div>
          
          <DynamicDashboardCharts department="Justice & Safety" />
          <DynamicBudgetCharts department="Justice & Safety" />

        </>
      )}
    </>
  );
}

