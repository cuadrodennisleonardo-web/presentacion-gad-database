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

  const totalPop = stats?.residents || 0;
  const malePop = stats?.sexDist.male || 0;
  const femalePop = stats?.sexDist.female || 0;
  const malePct = totalPop > 0 ? ((malePop / totalPop) * 100).toFixed(0) : "0";
  const femalePct = totalPop > 0 ? ((femalePop / totalPop) * 100).toFixed(0) : "0";
  const totalHh = stats?.households || 0;
  const avgHhSize = totalHh > 0 ? (totalPop / totalHh).toFixed(1) : "0.0";
  const utilizationRate = totalGpbBudget > 0 ? ((totalGpbActual / totalGpbBudget) * 100).toFixed(1) : "0.0";

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
    <div className="space-y-5 pb-10">
      <PageMeta
        title="Main Dashboard"
        description="Overview of Presentacion municipal statistics & JMC 2013-01 Compliance"
      />
      <PageBreadcrumb pageTitle="Dashboard" hideNav={true} />

      {/* BENTO ROW 1: Hero Command & Primary Demographics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Bento Tile 1: Hero Welcome & Quick Actions */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-800/90">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                PCW-DILG-DBM-NEDA JMC 2013-01
              </span>
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Cycle: {currentYear}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {getGreeting()}
            </h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Sex-disaggregated database and gender mainstreaming monitoring system for the Municipality of Presentacion, Camarines Sur.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center gap-2">
            <Link
              to="/data-entry/social-development/demography"
              className="inline-flex items-center gap-1 rounded-lg bg-brand-500 hover:bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition"
            >
              <span>Demography Grid</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/barangays"
              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/60 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 transition"
            >
              <span>18 Barangays</span>
            </Link>
            <Link
              to="/gad-reports/gpb"
              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/60 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 transition"
            >
              <span>GPB Form</span>
            </Link>
          </div>
        </div>

        {/* Bento Tile 2: Total Population */}
        <Link
          to="/data-entry/social-development/demography"
          className="lg:col-span-3 flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/90 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Population
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>

          <div className="my-2">
            <div className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {totalPop.toLocaleString()}
            </div>
          </div>

          <div>
            {/* Visual Sex Split Bar */}
            <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex mb-1.5">
              <div style={{ width: `${malePct}%` }} className="h-full bg-blue-500" title={`Male: ${malePct}%`} />
              <div style={{ width: `${femalePct}%` }} className="h-full bg-pink-500" title={`Female: ${femalePct}%`} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">M: {malePop.toLocaleString()} ({malePct}%)</span>
              <span className="text-pink-600 dark:text-pink-400 font-semibold">F: {femalePop.toLocaleString()} ({femalePct}%)</span>
            </div>
          </div>
        </Link>

        {/* Bento Tile 3: Total Households */}
        <Link
          to="/data-entry/social-development/demography"
          className="lg:col-span-3 flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/90 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Households
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          </div>

          <div className="my-2">
            <div className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {totalHh.toLocaleString()}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>Avg Size: <strong className="text-gray-800 dark:text-gray-200 font-bold">{avgHhSize}</strong> / HH</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">18 Barangays</span>
          </div>
        </Link>
      </div>

      {/* BENTO ROW 2: Demographics Visuals Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Population by Barangay Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-800/90">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                Population by Barangay
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Official population counts across all 18 barangays
              </p>
            </div>
            {stats?.years?.demographics && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                Year: {stats.years.demographics}
              </span>
            )}
          </div>
          <ErrorBoundary>
            <PopulationByBarangayChart data={stats?.barangayPop || []} height={250} />
          </ErrorBoundary>
        </div>

        {/* Sex Distribution Donut Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-800/90 flex flex-col justify-between">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                Sex Distribution &amp; Ratio
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Overall municipal gender balance
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center my-auto">
            <ErrorBoundary>
              <SexDistributionChart
                male={malePop}
                female={femalePop}
                height={210}
              />
            </ErrorBoundary>
          </div>
          <div className="pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-around text-xs font-semibold">
            <span className="text-blue-600 dark:text-blue-400">Male: {malePop.toLocaleString()} ({malePct}%)</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span className="text-pink-600 dark:text-pink-400">Female: {femalePop.toLocaleString()} ({femalePct}%)</span>
          </div>
        </div>
      </div>

      {/* BENTO ROW 3: JMC Compliance & Statutory GAD Budget */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Compliance Widget */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">MCW / DILG Compliance</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">10 Statutory JMC 2013-01 Indicators ({currentYear})</p>
            </div>
            <Link
              to="/gad-reports/compliance"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Full Tracker →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Compliant</span>
              </div>
              <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {compliantCount} <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">/ {totalComplianceIndicators}</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">In Progress</span>
              </div>
              <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
                {inProgressCount} <span className="text-xs font-normal text-amber-600 dark:text-amber-400">/ {totalComplianceIndicators}</span>
              </p>
            </div>
          </div>
        </div>

        {/* GAD Plan & Budget Utilization Widget */}
        <div className="lg:col-span-7 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Annual GAD Budget &amp; Utilization</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Statutory 5% Allocation vs Actual Expenditures ({currentYear})</p>
            </div>
            <Link
              to="/gad-reports/gpb"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              GPB Form →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Planned GAD Budget</span>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                ₱{totalGpbBudget > 0 ? totalGpbBudget.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "5% Mandate"}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Formulated via JMC GPB Module</p>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Actual Utilization</span>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                ₱{totalGpbActual > 0 ? totalGpbActual.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
              </p>
              <p className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold mt-0.5">
                {totalGpbBudget > 0 ? `${utilizationRate}% Utilization Rate` : "Tracks GAD AR actuals"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BENTO ROW 4: 5 Development Sectors Quick Hub */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">5 Development Sectors</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Direct access to subsectors, indicators, and data entry workflows</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {SECTORS_INFO.map((sec) => (
            <Link
              key={sec.slug}
              to={`/data-entry/${sec.slug}`}
              className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800/90 p-4 shadow-xs hover:shadow-md border border-gray-200/80 dark:border-gray-700/80 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`h-9 w-9 rounded-xl ${sec.lightBg} ${sec.textColor} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    {sec.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {sec.count} Subsectors
                  </span>
                </div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {sec.name}
                </h3>
                <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {sec.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-gray-400 dark:text-gray-500">Access Hub</span>
                <span className="font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Hub
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* BENTO ROW 5: Cross-Sectoral GAD Analytics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Sectoral Distribution Analytics</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Live sectoral ratios and gender-responsive indicators across the municipality</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Economic & Livelihood */}
          <div className="rounded-2xl border border-gray-200/80 bg-white dark:bg-gray-800/90 p-4 shadow-xs flex flex-col justify-between">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">Livelihood &amp; Economic</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Producers &amp; Business Profile ({stats?.years?.econDev || currentYear})</p>
              </div>
              <Link to="/data-entry/economic-development" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                View →
              </Link>
            </div>
            <div className="my-auto py-1">
              <ErrorBoundary>
                <MultiSeriesChart 
                  noCard={true}
                  type="donut"
                  height={200}
                  categories={["Farmers", "Fisherfolks", "MSMEs", "Vendors"]}
                  series={[
                    stats?.livelihood.farmers || 0,
                    stats?.livelihood.fisherfolks || 0,
                    stats?.livelihood.business || 0,
                    stats?.livelihood.ambulantVendors || 0
                  ]}
                  colors={["#f59e0b", "#06b6d4", "#8b5cf6", "#ec4899"]}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* Card 2: GBV & Protection */}
          <div className="rounded-2xl border border-gray-200/80 bg-white dark:bg-gray-800/90 p-4 shadow-xs flex flex-col justify-between">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">GBV &amp; Protection</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">VAWC &amp; Juvenile Cases ({stats?.years?.justice || currentYear})</p>
              </div>
              <Link to="/data-entry/social-development" className="text-[10px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400">
                View →
              </Link>
            </div>
            <div className="my-auto py-1">
              <ErrorBoundary>
                <MultiSeriesChart 
                  noCard={true}
                  type="donut"
                  height={200}
                  categories={["VAWC Reported", "CICL Cases", "Assault Cases"]}
                  series={[
                    stats?.justice.vawc || 0,
                    stats?.justice.cicl || 0,
                    stats?.justice.assault || 0
                  ]}
                  colors={["#ef4444", "#a855f7", "#f43f5e"]}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* Card 3: Basic Infrastructure */}
          <div className="rounded-2xl border border-gray-200/80 bg-white dark:bg-gray-800/90 p-4 shadow-xs flex flex-col justify-between">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">Basic Infrastructure</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Utilities &amp; Housing Access ({stats?.years?.infrastructure || currentYear})</p>
              </div>
              <Link to="/data-entry/infrastructure" className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400">
                View →
              </Link>
            </div>
            <div className="my-auto py-1">
              <ErrorBoundary>
                <MultiSeriesChart 
                  noCard={true}
                  type="donut"
                  height={200}
                  categories={["Safe Water", "Sanitary Toilet", "Informal Settlers"]}
                  series={[
                    stats?.infrastructure.safeWater || 0,
                    stats?.infrastructure.sanitaryToilet || 0,
                    stats?.infrastructure.informalSettlers || 0
                  ]}
                  colors={["#3b82f6", "#10b981", "#64748b"]}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* Card 4: Leadership & Governance */}
          <div className="rounded-2xl border border-gray-200/80 bg-white dark:bg-gray-800/90 p-4 shadow-xs flex flex-col justify-between">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">Leadership &amp; Governance</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Officials &amp; Appointed Heads ({stats?.years?.governance || currentYear})</p>
              </div>
              <Link to="/data-entry/institutional" className="text-[10px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400">
                View →
              </Link>
            </div>
            <div className="my-auto py-1">
              <ErrorBoundary>
                <MultiSeriesChart 
                  noCard={true}
                  type="donut"
                  height={200}
                  categories={["Elected Officials", "Appointed Heads"]}
                  series={[
                    stats?.governance.elected || 0,
                    stats?.governance.appointed || 0
                  ]}
                  colors={["#8b5cf6", "#f59e0b"]}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
