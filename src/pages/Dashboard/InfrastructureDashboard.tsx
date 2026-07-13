import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import MultiSeriesChart from "@/components/charts/MultiSeriesChart";
import DynamicDashboardCharts from '@/components/common/DynamicDashboardCharts';
import { useInfrastructureStats } from "@/hooks/queries/useInfrastructureStats";


export default function InfrastructureDashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: stats, isLoading } = useInfrastructureStats(year);

  const statCards = [
    { title: "Safe Water Access (HH)", value: stats?.safeWater || 0, icon: "Households", bg: "bg-blue-50 dark:bg-blue-500/10", color: "text-blue-600" },
    { title: "Sanitary Toilets (HH)", value: stats?.sanitaryToilet || 0, icon: "Households", bg: "bg-teal-50 dark:bg-teal-500/10", color: "text-teal-600" },
    { title: "Informal Settlers (HH)", value: stats?.informalSettlers || 0, icon: "Households", bg: "bg-orange-50 dark:bg-orange-500/10", color: "text-orange-600" },
  ];

  return (
    <>
      <PageMeta title="Infrastructure Dashboard" description="Infrastructure Overview" />
      <div className="flex items-center justify-between mb-6">
        <PageBreadcrumb pageTitle="Infrastructure Dashboard" hideNav={true} />
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year Filter:</label>
          <input 
            type="number" 
            className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
          />
        </div>
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MultiSeriesChart 
              title="Safe Drinking Water (M-Led vs F-Led)"
              type="bar"
              categories={stats?.barangays || []}
              series={[
                { name: "Male-Led HH", data: stats?.waterM_series || [] },
                { name: "Female-Led HH", data: stats?.waterF_series || [] }
              ]}
              colors={["#3b82f6", "#2dd4bf"]}
            />
            
            <MultiSeriesChart 
              title="Sanitary Toilet Facilities (M-Led vs F-Led)"
              type="bar"
              categories={stats?.barangays || []}
              series={[
                { name: "Male-Led HH", data: stats?.toiletM_series || [] },
                { name: "Female-Led HH", data: stats?.toiletF_series || [] }
              ]}
              colors={["#0ea5e9", "#14b8a6"]}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
             <MultiSeriesChart 
               title="Informal Settlers (M-Led vs F-Led)"
               type="area"
               categories={stats?.barangays || []}
               series={[
                 { name: "Male-Led HH", data: stats?.informalM_series || [] },
                 { name: "Female-Led HH", data: stats?.informalF_series || [] }
               ]}
               colors={["#f97316", "#fbbf24"]}
             />
          </div>
          
          <DynamicDashboardCharts department="Infrastructure" year={year} />

        </>
      )}
    </>
  );
}
