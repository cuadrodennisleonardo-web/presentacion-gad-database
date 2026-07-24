import React from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import SexDistributionChart from "./SexDistributionChart";
import PopulationByBarangayChart from "./PopulationByBarangayChart";
import MultiSeriesChart from "@/components/charts/MultiSeriesChart";
import { Link } from "react-router";
import { useMainDashboardStats } from "@/hooks/queries/useMainDashboardStats";


const DashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useMainDashboardStats();

  const getGreeting = () => {
    const month = new Date().getMonth();
    const date = new Date().getDate();
    const hour = new Date().getHours();

    // Check for Christmas season
    if (month === 11 && date >= 20 && date <= 25) {
      return "Merry Christmas! Welcome to the Presentacion GAD Database";
    }

    let timeGreeting = "Good morning";
    if (hour >= 12 && hour < 17) {
      timeGreeting = "Good afternoon";
    } else if (hour >= 17) {
      timeGreeting = "Good evening";
    }

    return `${timeGreeting}! Welcome to the Presentacion GAD Database`;
  };

  const statCards = [
    {
      title: "Total Population",
      value: stats?.residents || 0,
      icon: "users",
      color: "text-brand-500",
      bg: "bg-brand-50 dark:bg-brand-500/10",
      link: "/data-entry/demographics",
    },
    {
      title: "Total Households",
      value: stats?.households || 0,
      icon: "home",
      color: "text-blue-light-600",
      bg: "bg-blue-light-50 dark:bg-blue-light-500/10",
      link: "/data-entry/demographics",
    },
    {
      title: "Registered PWDs",
      value: stats?.pwds || 0,
      icon: "check-circle",
      color: "text-success-600",
      bg: "bg-success-50 dark:bg-success-500/10",
      link: "/data-entry/social-development",
    },
    {
      title: "Total Barangays",
      value: 18,
      icon: "map",
      color: "text-theme-pink-600",
      bg: "bg-theme-pink-50 dark:bg-theme-pink-500/10",
      link: "/barangays",
    },
  ];

  if (isLoading) {
    return (
      <>
        <PageMeta title="Dashboard" description="Loading dashboard..." />
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
          <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Dashboard"
        description="Overview of Presentacion municipal statistics"
      />
      <PageBreadcrumb pageTitle="Dashboard" hideNav={true} />

      {/* Hero / Welcome */}
      <div className="mb-8 rounded-2xl bg-white p-6 shadow-theme-sm dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          {getGreeting()}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Here is an overview of the current municipal statistics based on the latest aggregate data.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.bg} ${card.color} transition-transform group-hover:scale-110`}
              >
                {card.icon === "users" && (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                )}
                {card.icon === "home" && (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                )}
                {card.icon === "check-circle" && (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                )}
                {card.icon === "map" && (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Population by Barangay */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Population by Barangay
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Distribution of population across barangays
              </p>
            </div>
            {stats?.years?.demographics && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800/40">
                Default Year: {stats.years.demographics}
              </span>
            )}
          </div>
          <ErrorBoundary>
            <PopulationByBarangayChart data={stats?.barangayPop || []} />
          </ErrorBoundary>
        </div>

        {/* Sex Distribution */}
        <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Sex Distribution
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Overall male to female ratio
              </p>
            </div>
            {stats?.years?.demographics && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {stats.years.demographics}
              </span>
            )}
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

      {/* Additional Department Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
         <div className="lg:col-span-1">
            <ErrorBoundary>
              <MultiSeriesChart 
                title={`Livelihood (${stats?.years?.econDev || ''})`}
                type="pie"
                categories={["Farmers", "Fisherfolks", "MSME Owners", "Ambulant Vendors"]}
                series={[stats?.livelihood.farmers || 0, stats?.livelihood.fisherfolks || 0, stats?.livelihood.business || 0, stats?.livelihood.ambulantVendors || 0]}
                colors={["#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899"]}
             />
            </ErrorBoundary>
         </div>
         <div className="lg:col-span-1">
            <ErrorBoundary>
              <MultiSeriesChart 
                title={`Justice & Safety (${stats?.years?.justice || ''})`}
                type="pie"
                categories={["VAWC", "CICL", "Sexual Assault"]}
                series={[stats?.justice.vawc || 0, stats?.justice.cicl || 0, stats?.justice.assault || 0]}
                colors={["#ef4444", "#a855f7", "#f43f5e"]}
             />
            </ErrorBoundary>
         </div>
         <div className="lg:col-span-1">
            <ErrorBoundary>
              <MultiSeriesChart 
                title={`Infrastructure (${stats?.years?.infrastructure || ''})`}
                type="pie"
                categories={["Safe Water", "Sanitary Toilets", "Informal Settlers"]}
                series={[stats?.infrastructure.safeWater || 0, stats?.infrastructure.sanitaryToilet || 0, stats?.infrastructure.informalSettlers || 0]}
                colors={["#3b82f6", "#10b981", "#64748b"]}
             />
            </ErrorBoundary>
         </div>
         <div className="lg:col-span-1">
            <ErrorBoundary>
              <MultiSeriesChart 
                title={`Governance (${stats?.years?.governance || ''})`}
                type="pie"
                categories={["Elected Officials", "Appointed Heads"]}
                series={[stats?.governance.elected || 0, stats?.governance.appointed || 0]}
                colors={["#8b5cf6", "#f59e0b"]}
             />
            </ErrorBoundary>
         </div>
      </div>
    </>
  );
};

export default DashboardPage;
