import { getDefaultYear } from '@/utils/yearUtils';
import YearSelector from '@/components/common/YearSelector';
import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";

import PopulationByBarangayChart from "./PopulationByBarangayChart";
import SexDistributionChart from "./SexDistributionChart";
import DynamicDashboardCharts from "@/components/common/DynamicDashboardCharts";
import DynamicBudgetCharts from '@/components/common/DynamicBudgetCharts';
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { useDemographicsStats } from "@/hooks/queries/useDemographicsStats";


export default function DemographicsDashboard() {
  const [year, setYear] = useState(getDefaultYear('Demographics_Dashboard'));

  const { data: stats, isLoading } = useDemographicsStats(year);

  const statCards = [
    { title: "Total Population", value: stats?.residents || 0, bg: "bg-blue-50 dark:bg-blue-500/10", color: "text-blue-600" },
    { title: "Total Households", value: stats?.households || 0, bg: "bg-teal-50 dark:bg-teal-500/10", color: "text-teal-600" },
  ];


  return (
    <>
      <PageMeta title="Demographics Dashboard" description="Demographics & Population Overview" />
      <div className="flex items-center justify-between mb-6">
        <PageBreadcrumb pageTitle="Demographics & Population Dashboard" hideNav={true} />
        <YearSelector year={year} setYear={setYear} scopeKey="Demographics_Dashboard" />
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
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {statCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-3xl font-bold text-gray-800 dark:text-white/90">{card.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Population by Barangay
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Distribution of population across barangays
                </p>
              </div>
              <ErrorBoundary>
                <PopulationByBarangayChart data={stats?.barangayPop || []} />
              </ErrorBoundary>
            </div>

            <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Sex Distribution
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Overall male to female ratio
                </p>
              </div>
              <div className="flex items-center justify-center">
                <ErrorBoundary>
                  <SexDistributionChart
                    male={stats?.sexDist.male || 0}
                    female={stats?.sexDist.female || 0}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>

          <DynamicDashboardCharts department="Demographics & Population" year={year} />
          <DynamicBudgetCharts department="Demographics & Population" year={year} />

        </>
      )}
    </>
  );
}


