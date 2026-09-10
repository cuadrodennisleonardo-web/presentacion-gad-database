import React from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import SexDistributionChart from "./SexDistributionChart";
import PopulationByBarangayChart from "./PopulationByBarangayChart";
import MultiSeriesChart from "@/components/charts/MultiSeriesChart";
import { useMainDashboardStats } from "@/hooks/queries/useMainDashboardStats";

const SECTORS_INFO = [
  {
    name: "Social Development",
    slug: "social-development",
    count: 14,
    description: "Demography, Education, Health, GBV, Social Protection, Senior Citizens",
    color: "from-blue-600 to-indigo-700",
    lightBg: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/40",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    name: "Economic Development",
    slug: "economic-development",
    count: 7,
    description: "Labor & Employment, Agriculture, Fishery, MSMEs, Poverty",
    color: "from-emerald-600 to-teal-700",
    lightBg: "bg-emerald-50 dark:bg-emerald-900/20",
    textColor: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/40",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
  {
    name: "Infrastructure",
    slug: "infrastructure",
    count: 7,
    description: "Water & Utilities, Roads, Public Facilities, Flood Control, Safety",
    color: "from-cyan-600 to-blue-700",
    lightBg: "bg-cyan-50 dark:bg-cyan-900/20",
    textColor: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800/40",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    name: "Environment",
    slug: "environment",
    count: 6,
    description: "Solid Waste Management, Land Productivity, Protected Resources",
    color: "from-teal-600 to-emerald-800",
    lightBg: "bg-teal-50 dark:bg-teal-900/20",
    textColor: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800/40",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    name: "Institutional",
    slug: "institutional",
    count: 9,
    description: "5% GAD Budget, GFPS, Leadership, Participation, Peace & Ordinances",
    color: "from-purple-600 to-indigo-800",
    lightBg: "bg-purple-50 dark:bg-purple-900/20",
    textColor: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/40",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
];

const DashboardPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { data: stats, isLoading } = useMainDashboardStats();

  // Fetch compliance summary
  const { data: complianceList = [] } = useQuery({
    queryKey: ['compliance_summary', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_status')
        .select('*')
        .eq('year', currentYear);
      if (error) return [];
      return data || [];
    }
  });

  // Fetch GPB budget summary
  const { data: gpbEntries = [] } = useQuery({
    queryKey: ['gpb_budget_summary', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gpb_entries')
        .select('gad_budget, actual_cost')
        .eq('year', currentYear);
      if (error) return [];
      return data || [];
    }
  });

  const compliantCount = complianceList.filter(c => c.status === 'compliant').length;
  const inProgressCount = complianceList.filter(c => c.status === 'in_progress').length;
  const totalComplianceIndicators = 10;

  const totalGpbBudget = gpbEntries.reduce((acc, curr) => acc + Number(curr.gad_budget || 0), 0);
  const totalGpbActual = gpbEntries.reduce((acc, curr) => acc + Number(curr.actual_cost || 0), 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "Good morning";
    if (hour >= 12 && hour < 17) {
      timeGreeting = "Good afternoon";
    } else if (hour >= 17) {
      timeGreeting = "Good evening";
    }
    return `${timeGreeting}! Welcome to the Presentacion Municipal GAD Database`;
  };

  const statCards = [
    {
      title: "Total Population",
      value: stats?.residents || 0,
      icon: "users",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/30",
      link: "/data-entry/social-development/demography",
    },
    {
      title: "Total Households",
      value: stats?.households || 0,
      icon: "home",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
      link: "/data-entry/social-development/demography",
    },
    {
      title: "Registered PWDs",
      value: stats?.pwds || 0,
      icon: "check-circle",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      link: "/data-entry/social-development/social-protection",
    },
    {
      title: "Total Barangays",
      value: 18,
      icon: "map",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/30",
      link: "/barangays",
    },
  ];

  if (isLoading) {
    return (
      <>
        <PageMeta title="Dashboard" description="Loading dashboard..." />
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
          <svg className="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <PageMeta
        title="Main Dashboard"
        description="Overview of Presentacion municipal statistics & JMC 2013-01 Compliance"
      />
      <PageBreadcrumb pageTitle="Dashboard" hideNav={true} />

      {/* Hero Welcome Banner */}
      <div className="rounded-2xl bg-white dark:bg-gray-800/90 p-6 sm:p-7 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            PCW-DILG-DBM-NEDA JMC 2013-01 Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            {getGreeting()}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
            Sex-disaggregated database and gender mainstreaming monitoring system for the Municipality of Presentacion, Camarines Sur.
          </p>
        </div>
      </div>

      {/* High-Level Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-5 transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg} ${card.color} transition-transform group-hover:scale-110`}
              >
                {card.icon === "users" && (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                )}
                {card.icon === "home" && (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                )}
                {card.icon === "check-circle" && (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                )}
                {card.icon === "map" && (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 5-Sector Quick Hub Navigation */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">5 Development Sectors</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Direct access to subsectors and data entry workflows</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {SECTORS_INFO.map((sec) => (
            <Link
              key={sec.slug}
              to={`/data-entry/${sec.slug}`}
              className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700/80 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div>
                <div className={`h-10 w-10 rounded-xl ${sec.lightBg} ${sec.textColor} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                  {sec.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {sec.name}
                </h3>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                  {sec.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-500 dark:text-gray-400">{sec.count} Subsectors</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  Hub →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* JMC Compliance & GAD Budget Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Widget */}
        <div className="lg:col-span-1 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">MCW / DILG Compliance</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">10 JMC 2013-01 Indicators ({currentYear})</p>
            </div>
            <Link
              to="/gad-reports/compliance"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Full Tracker →
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Compliant</span>
              </div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {compliantCount} / {totalComplianceIndicators}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">In Progress</span>
              </div>
              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {inProgressCount} / {totalComplianceIndicators}
              </span>
            </div>
          </div>
        </div>

        {/* GAD Plan & Budget Utilization Widget */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Annual GAD Budget & Utilization</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Statutory 5% GAD Allocation vs Expenditures ({currentYear})</p>
            </div>
            <Link
              to="/gad-reports/gpb"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              GPB Form →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Planned GAD Budget</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₱{totalGpbBudget > 0 ? totalGpbBudget.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "5% Mandate"}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Formulated via JMC GPB Module</p>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Actual Utilization</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₱{totalGpbActual > 0 ? totalGpbActual.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                {totalGpbBudget > 0 ? `${((totalGpbActual / totalGpbBudget) * 100).toFixed(1)}% Utilization Rate` : "Tracks GAD AR actuals"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Population & Sex Ratio Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Population by Barangay */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Population by Barangay
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total population across all 18 barangays
              </p>
            </div>
            {stats?.years?.demographics && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                Year: {stats.years.demographics}
              </span>
            )}
          </div>
          <ErrorBoundary>
            <PopulationByBarangayChart data={stats?.barangayPop || []} />
          </ErrorBoundary>
        </div>

        {/* Sex Distribution */}
        <div className="lg:col-span-1 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Sex Distribution
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Overall municipal male to female ratio
              </p>
            </div>
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

      {/* 5-Sector Overview Charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-5 shadow-sm">
          <ErrorBoundary>
            <MultiSeriesChart 
              title={`Livelihood & Economic (${stats?.years?.econDev || ''})`}
              type="pie"
              categories={["Farmers", "Fisherfolks", "MSME Owners", "Ambulant Vendors"]}
              series={[stats?.livelihood.farmers || 0, stats?.livelihood.fisherfolks || 0, stats?.livelihood.business || 0, stats?.livelihood.ambulantVendors || 0]}
              colors={["#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899"]}
            />
          </ErrorBoundary>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-5 shadow-sm">
          <ErrorBoundary>
            <MultiSeriesChart 
              title={`GBV & Protection (${stats?.years?.justice || ''})`}
              type="pie"
              categories={["VAWC Desks", "CICL Cases", "Other Abuse"]}
              series={[stats?.justice.vawc || 0, stats?.justice.cicl || 0, stats?.justice.assault || 0]}
              colors={["#ef4444", "#a855f7", "#f43f5e"]}
            />
          </ErrorBoundary>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-5 shadow-sm">
          <ErrorBoundary>
            <MultiSeriesChart 
              title={`Basic Infrastructure (${stats?.years?.infrastructure || ''})`}
              type="pie"
              categories={["Safe Water", "Sanitary Toilets", "Informal Settlers"]}
              series={[stats?.infrastructure.safeWater || 0, stats?.infrastructure.sanitaryToilet || 0, stats?.infrastructure.informalSettlers || 0]}
              colors={["#3b82f6", "#10b981", "#64748b"]}
            />
          </ErrorBoundary>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-5 shadow-sm">
          <ErrorBoundary>
            <MultiSeriesChart 
              title={`Leadership & Governance (${stats?.years?.governance || ''})`}
              type="pie"
              categories={["Elected Officials", "Appointed Heads"]}
              series={[stats?.governance.elected || 0, stats?.governance.appointed || 0]}
              colors={["#8b5cf6", "#f59e0b"]}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
