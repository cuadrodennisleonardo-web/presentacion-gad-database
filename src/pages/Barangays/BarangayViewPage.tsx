import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import PageMeta from "@/components/common/PageMeta";
import { supabase } from "@/config/supabase";
import { useRole } from "@/hooks/useRole";
import MultiSeriesChart from "@/components/charts/MultiSeriesChart";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import YearSelector from "@/components/common/YearSelector";
import { getDefaultYear } from "@/utils/yearUtils";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { Database } from "@/types/database";

type DynamicSchema = Database['public']['Tables']['dynamic_schemas']['Row'];

const SECTORS = [
  { id: "Social Development", slug: "social-development", label: "I. Social Development" },
  { id: "Economic Development", slug: "economic-development", label: "II. Economic Development" },
  { id: "Infrastructure", slug: "infrastructure", label: "III. Infrastructure" },
  { id: "Environment", slug: "environment", label: "IV. Environment" },
  { id: "Institutional", slug: "institutional", label: "V. Institutional" }
];

const BarangayViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canWrite } = useRole();

  const [year, setYear] = useState(getDefaultYear("Barangay_View"));
  const [activeSector, setActiveSector] = useState<string>("Social Development");

  // 1. Fetch Barangay Details
  const { data: barangay, isLoading: isLoadingBarangay } = useQuery({
    queryKey: ["barangay_detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("barangays")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // 2. Fetch Population Stats for this Barangay
  const { data: popStats } = useQuery({
    queryKey: ["barangay_pop_stats", id, year],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("population_stats")
        .select("*")
        .eq("barangay_id", id)
        .eq("year", year)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!id
  });

  // 3. Fetch Dynamic Schemas for the Active Sector
  const { data: schemas = [] } = useQuery<DynamicSchema[]>({
    queryKey: ["dynamic_schemas_sector", activeSector],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dynamic_schemas")
        .select("*")
        .eq("department", activeSector)
        .order("tab_name", { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  // 4. Fetch Dynamic Data for this Barangay & Year in the Active Sector
  const schemaIds = schemas.map(s => s.id);
  const { data: dynamicDataRows = [] } = useQuery({
    queryKey: ["barangay_dynamic_data", id, year, activeSector, schemaIds],
    queryFn: async () => {
      if (!id || schemaIds.length === 0) return [];
      const { data, error } = await supabase
        .from("dynamic_data")
        .select("*")
        .eq("barangay_id", id)
        .eq("year", year)
        .in("schema_id", schemaIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && schemaIds.length > 0
  });

  if (isLoadingBarangay) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!barangay) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Barangay Not Found</h2>
        <button
          onClick={() => navigate("/barangays")}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium"
        >
          ← Back to Barangays List
        </button>
      </div>
    );
  }

  const barangayName = barangay.name;
  const totalPop = popStats?.total_population || 0;
  const totalHH = popStats?.total_households || popStats?.household_heads_total || 0;
  const maleCount = popStats?.male_count || 0;
  const femaleCount = popStats?.female_count || 0;

  const activeSectorInfo = SECTORS.find(s => s.id === activeSector);

  return (
    <div className="space-y-4 pb-10">
      <PageMeta title={`Barangay ${barangayName}`} description={`Profile and 5-sector statistics for Barangay ${barangayName}`} />
      
      {/* Compact Bento Profile Header & Controls */}
      <div className="rounded-2xl border border-gray-200/80 bg-white/90 dark:border-gray-800 dark:bg-gray-800/90 p-4 sm:p-5 shadow-xs backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3.5 border-b border-gray-100 dark:border-gray-700/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                Barangay Profile
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
              <Link to="/barangays" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Barangays Directory
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white mt-1">
              Barangay {barangayName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Complete sex-disaggregated indicators and multi-sector development monitoring for calendar year {year}.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {activeSectorInfo && canWrite && (
              <Link
                to={`/data-entry/${activeSectorInfo.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold transition-colors border border-blue-200/60 dark:border-blue-800/40 shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Enter Data for Sector
              </Link>
            )}
            <YearSelector year={year} setYear={setYear} scopeKey="Barangay_View" />
          </div>
        </div>

        {/* Native Demographic Bento KPI Cards (Total Population & Total Households only) */}
        <div className="pt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40 p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Population</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                  {totalPop.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                  M: {maleCount.toLocaleString()} | F: {femaleCount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40 p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Households</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                  {totalHH.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                  Families
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Sector Pill Navigation */}
      <div className="bg-white/90 dark:bg-gray-800/90 p-1.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {SECTORS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSector(sec.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeSector === sec.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sector Content Breakdown */}
      <div className="space-y-6">
        {schemas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center bg-white dark:bg-gray-800/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No dynamic indicator schemas configured for <span className="font-semibold text-gray-900 dark:text-white">{activeSector}</span> yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schemas.map((schema) => {
              const row = dynamicDataRows.find(d => d.schema_id === schema.id);
              const sData = schema.schema as any;
              const fields = (Array.isArray(sData) ? sData : (sData?.fields || [])) as any[];
              const isPercentage = sData?.isPercentage || sData?.tableCategory === 'percentage';
              const isBudget = sData?.isBudget || sData?.tableCategory === 'budget';
              const groups = (sData?.groups || []) as any[];

              return (
                <div
                  key={schema.id}
                  className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-700/60 pb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      {schema.tab_name}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {schema.subsector || "General"}
                    </span>
                  </div>

                  {!row ? (
                    <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                      No data entered for {barangayName} ({year})
                    </div>
                  ) : isPercentage ? (
                    <div className="space-y-3">
                      {groups.map((g: any) => {
                        const total = Number(row.data?.[`total_${g.id}`] || 0);
                        return (
                          <div key={g.id} className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                              <span>{g.groupTitle || g.totalTitle}:</span>
                              <span>{total.toLocaleString()}</span>
                            </div>
                            {g.fields.map((f: any) => {
                              const val = Number(row.data?.[f.id] || 0);
                              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
                              return (
                                <div key={f.id} className="space-y-1">
                                  <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-400">
                                    <span>{f.name}</span>
                                    <span className="font-semibold">{val.toLocaleString()} ({pct}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Number(pct))}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50 text-xs">
                      {fields.map((f: any) => {
                        const val = row.data?.[f.id];
                        if (f.type === 'gender_split') {
                          const m = Number(val?.m || 0);
                          const fVal = Number(val?.f || 0);
                          const tot = Number(val?.total || (m + fVal));
                          return (
                            <div key={f.id} className="py-2 flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-300 font-medium">{f.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-white">{tot.toLocaleString()}</span>
                                <span className="text-[10px] text-gray-400">
                                  (M: {m} | F: {fVal})
                                </span>
                              </div>
                            </div>
                          );
                        } else {
                          const singleVal = typeof val === 'object' ? val?.value : val;
                          const formatted = typeof singleVal === 'number'
                            ? (isBudget ? `₱${singleVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : singleVal.toLocaleString())
                            : (singleVal || "0");
                          return (
                            <div key={f.id} className="py-2 flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-300 font-medium">{f.name}</span>
                              <span className="font-bold text-gray-900 dark:text-white">{formatted}</span>
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sex Ratio Donut Chart for Social Development */}
      {activeSector === "Social Development" && (
        <div className="rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-800/90 p-4 sm:p-5 shadow-xs max-w-md">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sex Distribution ({year})</h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">Barangay {barangayName} male to female ratio</p>
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
              Demography
            </span>
          </div>
          <div className="py-2">
            <ErrorBoundary>
              <MultiSeriesChart 
                noCard={true}
                type="donut"
                height={220}
                categories={["Male", "Female"]}
                series={[maleCount, femaleCount]}
                colors={["#3b82f6", "#ec4899"]}
              />
            </ErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarangayViewPage;
