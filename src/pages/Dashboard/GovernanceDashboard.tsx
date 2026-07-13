import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import MultiSeriesChart from "@/components/charts/MultiSeriesChart";
import DynamicDashboardCharts from '@/components/common/DynamicDashboardCharts';
import { CHART_COLORS } from "@/config/chartColors";
import { useGovernanceStats } from "@/hooks/queries/useGovernanceStats";


export default function GovernanceDashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedBarangay, setSelectedBarangay] = useState("all");
  const { data: stats, isLoading } = useGovernanceStats(year);

  const statCards = [
    { title: "Total Elected Officials", value: stats?.elected || 0, icon: "Officials", bg: "bg-blue-50 dark:bg-blue-500/10", color: "text-blue-600" },
    { title: "Total Appointed Heads", value: (stats?.appointedM || 0) + (stats?.appointedF || 0), icon: "Heads", bg: "bg-teal-50 dark:bg-teal-500/10", color: "text-teal-600" },
  ];

  const pieIndex = selectedBarangay === "all" ? -1 : (stats?.barangayIds.indexOf(selectedBarangay) ?? -1);
  const displayElectedM = pieIndex === -1 ? (stats?.electedM || 0) : (stats?.rawElectedM[pieIndex] || 0);
  const displayElectedF = pieIndex === -1 ? (stats?.electedF || 0) : (stats?.rawElectedF[pieIndex] || 0);
  const displayAppointedM = pieIndex === -1 ? (stats?.appointedM || 0) : (stats?.rawAppointedM[pieIndex] || 0);
  const displayAppointedF = pieIndex === -1 ? (stats?.appointedF || 0) : (stats?.rawAppointedF[pieIndex] || 0);
  const pieBarangayName = pieIndex === -1 ? "Overall" : (stats?.barangays[pieIndex] || "");

  return (
    <>
      <PageMeta title="Local Governance Dashboard" description="Local Governance Overview" />
      <div className="flex items-center justify-between mb-6">
        <PageBreadcrumb pageTitle="Local Governance Dashboard" hideNav={true} />
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

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Officials Breakdown</h2>
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

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
             <div className="lg:col-span-1">
               <MultiSeriesChart 
                  title={`${pieBarangayName} Elected Officials`}
                  type="pie"
                  categories={["Male", "Female"]}
                  series={[displayElectedM, displayElectedF]}
                  colors={[CHART_COLORS.male, CHART_COLORS.female]}
               />
             </div>
             <div className="lg:col-span-1">
               <MultiSeriesChart 
                  title={`${pieBarangayName} Appointed Heads`}
                  type="pie"
                  categories={["Male", "Female"]}
                  series={[displayAppointedM, displayAppointedF]}
                  colors={[CHART_COLORS.male, CHART_COLORS.female]}
               />
              </div>
           </div>

           <DynamicDashboardCharts department="Local Governance" year={year} />
        </>
      )}
    </>
  );
}
