import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import { supabase } from "@/config/supabase";
import { useRole } from "@/hooks/useRole";
import DeptKPIChart from "@/components/charts/DeptKPIChart";
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
  const pwdCount = (popStats?.pwd_m || 0) + (popStats?.pwd_f || 0);
  const fourPsCount = (popStats?.four_ps_m || 0) + (popStats?.four_ps_f || 0);

  const activeSectorInfo = SECTORS.find(s => s.id === activeSector);

  return (
    <div className="space-y-6 pb-12">
      <PageMeta title={`Barangay ${barangayName}`} description={`Profile and 5-sector statistics for Barangay ${barangayName}`} />
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageBreadcrumb 
          pageTitle={barangayName} 
          rootLabel="Menu"
          rootPath={null}
          items={[{ label: "Barangays", path: "/barangays" }]} 
        />
        <div className="flex items-center gap-3">
          {activeSectorInfo && canWrite && (
            <Link
              to={`/data-entry/${activeSectorInfo.slug}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold transition-colors border border-blue-200/60 dark:border-blue-800/40 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Enter Data for Sector
            </Link>
          )}
          <YearSelector year={year} setYear={setYear} scopeKey="Barangay_View" />
        </div>
      </div>

      {/* Hero Banner */}
      <div className="rounded-2xl bg-white dark:bg-gray-800/90 p-6 sm:p-7 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            Barangay Profile • Municipality of Presentacion
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Barangay {barangayName}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
            Complete sex-disaggregated indicators and multi-sector development monitoring for calendar year {year}.
          </p>
        </div>
      </div>

      {/* Core Demographic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Population</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {totalPop.toLocaleString()}
            </p>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
              M: {maleCount.toLocaleString()} | F: {femaleCount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Households</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {totalHH.toLocaleString()}
            </p>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
              Families
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Registered PWDs</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {pwdCount.toLocaleString()}
            </p>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
              Persons
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">4Ps Beneficiaries</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {fourPsCount.toLocaleString()}
            </p>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-md">
              Beneficiaries
            </span>
          </div>
        </div>
      </div>

      {/* 5-Sector Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {SECTORS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSector(sec.id)}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeSector === sec.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
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
        <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm max-w-md">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Sex Ratio ({year})</h3>
          <DeptKPIChart 
            title={`Sex Distribution - ${barangayName}`}
            categories={["Male", "Female"]}
            seriesData={[maleCount, femaleCount]}
            type="pie"
          />
        </div>
      )}
    </div>
  );
};

export default BarangayViewPage;
