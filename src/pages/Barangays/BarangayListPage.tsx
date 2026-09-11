import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import { getBarangays, type BarangayWithStats } from "@/services/barangayService";
import toast from "react-hot-toast";

const BarangayListPage: React.FC = () => {
  const navigate = useNavigate();
  const [barangays, setBarangays] = useState<BarangayWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchBarangays() {
      setIsLoading(true);
      const { data, error } = await getBarangays();
      if (error) {
        toast.error(error);
      } else {
        setBarangays(data);
      }
      setIsLoading(false);
    }
    fetchBarangays();
  }, []);

  const filteredBarangays = barangays.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMunicipalPop = barangays.reduce((sum, b) => sum + (b.population_count || 0), 0);
  const totalMunicipalHH = barangays.reduce((sum, b) => sum + (b.household_count || 0), 0);

  return (
    <div className="space-y-4 pb-10">
      <PageMeta title="Barangays" description="Municipal barangay directory" />
      
      {/* Compact Bento Header */}
      <div className="rounded-2xl border border-gray-200/80 bg-white/90 dark:border-gray-800 dark:bg-gray-800/90 p-4 sm:p-5 shadow-xs backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                18 Barangays
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Municipality of Presentacion</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white mt-1">
              Barangay Directory
            </h1>
          </div>

          {/* Search & Header Stats */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 px-3 py-1.5 border border-gray-200/70 dark:border-gray-700/60 text-xs">
                <span className="text-gray-500 dark:text-gray-400 text-[11px]">Total Pop:</span>
                <span className="font-extrabold text-gray-900 dark:text-white">{totalMunicipalPop.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 border border-indigo-200/70 dark:border-indigo-800/40 text-xs">
                <span className="text-indigo-700/80 dark:text-indigo-400/80 text-[11px]">Total HH:</span>
                <span className="font-extrabold text-indigo-700 dark:text-indigo-400">{totalMunicipalHH.toLocaleString()}</span>
              </div>
            </div>

            <div className="relative w-full sm:w-56">
              <svg
                className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="9" r="6" />
                <path d="M13.5 13.5L17 17" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search barangay..."
                className="h-9 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 pl-8 pr-7 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500/20 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* High-Density 6-Column Bento Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/60"
            />
          ))}
        </div>
      ) : filteredBarangays.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredBarangays.map((brgy) => (
            <div
              key={brgy.id}
              onClick={() => navigate(`/barangays/${brgy.id}`)}
              className="group relative flex flex-col justify-between cursor-pointer rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/90 dark:hover:border-blue-500/50"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all text-xs font-bold">
                    →
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {brgy.name}
                </h3>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700/60 space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                  <span>Pop:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {brgy.population_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                  <span>Households:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {brgy.household_count.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 p-6 text-center">
          <svg className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            No barangays found matching "{searchQuery}"
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Check spelling or clear the search field.</p>
        </div>
      )}
    </div>
  );
};

export default BarangayListPage;
