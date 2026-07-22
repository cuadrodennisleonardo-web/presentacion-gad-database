import { getDefaultYear } from '@/utils/yearUtils';
import YearSelector from '@/components/common/YearSelector';
import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import MultiSeriesChart from "@/components/charts/MultiSeriesChart";
import DynamicDashboardCharts from '@/components/common/DynamicDashboardCharts';
import DynamicBudgetCharts from '@/components/common/DynamicBudgetCharts';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { CHART_COLORS } from "@/config/chartColors";
import { useEconomicDevStats } from "@/hooks/queries/useEconomicDevStats";


export default function EconomicDevelopmentDashboard() {
  const [year, setYear] = useState(getDefaultYear('EconomicDevelopment_Dashboard'));
  const [selectedBarangay, setSelectedBarangay] = useState("all");
  const { data: stats, isLoading } = useEconomicDevStats(year);

  const statCards = [
    { title: "Total Employed", value: stats?.employed || 0, icon: "Employed", bg: "bg-emerald-50 dark:bg-emerald-500/10", color: "text-emerald-600" },
    { title: "Total Unemployed", value: stats?.unemployed || 0, icon: "Unemployed", bg: "bg-rose-50 dark:bg-rose-500/10", color: "text-rose-600" },
    { title: "Total Farmers", value: stats?.farmers || 0, icon: "Farmers", bg: "bg-amber-50 dark:bg-amber-500/10", color: "text-amber-600" },
  ];

  const pieIndex = selectedBarangay === "all" ? -1 : (stats?.barangayIds.indexOf(selectedBarangay) ?? -1);
  const displayFarmers = pieIndex === -1 ? (stats?.farmers || 0) : (stats?.rawFarmers[pieIndex] || 0);
  const displayFisherfolks = pieIndex === -1 ? (stats?.fisherfolks || 0) : (stats?.rawFisherfolks[pieIndex] || 0);
  const displayBusiness = pieIndex === -1 ? (stats?.business || 0) : (stats?.rawBusiness[pieIndex] || 0);
  const displayAmbulantVendors = pieIndex === -1 ? (stats?.ambulantVendors || 0) : (stats?.rawAmbulantVendors[pieIndex] || 0);
  const pieBarangayName = pieIndex === -1 ? "Overall" : (stats?.barangays[pieIndex] || "");

  return (
    <>
      <PageMeta title="Economic Development Dashboard" description="Economic Development Overview" />
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Economic Development Dashboard" hideNav={true} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">Overview Metrics</h3>
        <YearSelector year={year} setYear={setYear} scopeKey="EconomicDevelopment_Dashboard" />
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
            <ErrorBoundary>
              <MultiSeriesChart 
                title={stats?.empHasTotalOnly ? "Employed by Barangay (Total)" : "Employed by Barangay (M vs F)"}
                type="bar"
                stacked={false}
                categories={stats?.barangays || []}
                series={stats?.employedSeries || []}
                colors={stats?.empHasTotalOnly ? ["#10b981"] : [CHART_COLORS.male, CHART_COLORS.female]}
              />
            </ErrorBoundary>
            
            <ErrorBoundary>
              <MultiSeriesChart 
                title={stats?.unempHasTotalOnly ? "Unemployed by Barangay (Total)" : "Unemployed by Barangay (M vs F)"}
                type="bar"
                stacked={!stats?.unempHasTotalOnly}
                categories={stats?.barangays || []}
                series={stats?.unemployedSeries || []}
                colors={stats?.unempHasTotalOnly ? ["#ef4444"] : [CHART_COLORS.male, CHART_COLORS.female]}
              />
            </ErrorBoundary>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Livelihood Breakdown</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Barangay:</label>
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
              >
                <option value="all">All Barangays (Overall)</option>
                {stats?.barangayIds.map((id, idx) => (
                  <option key={id} value={id}>{stats.barangays[idx]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
             <ErrorBoundary>
               <MultiSeriesChart 
                  title={`${pieBarangayName} Livelihood Distribution`}
                  type="pie"
                  categories={["Farmers", "Fisherfolks", "MSME Owners", "Ambulant Vendors (OFW)"]}
                  series={[displayFarmers, displayFisherfolks, displayBusiness, displayAmbulantVendors]}
                  colors={["#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899"]}
               />
             </ErrorBoundary>
          </div>

          <DynamicDashboardCharts department="Economic Development" />
          <DynamicBudgetCharts department="Economic Development" />
        </>
      )}
    </>
  );
}

