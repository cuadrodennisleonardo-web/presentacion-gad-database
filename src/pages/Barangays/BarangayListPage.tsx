import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
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

  return (
    <>
      <PageMeta title="Barangays" description="Municipal barangay directory" />
      <PageBreadcrumb pageTitle="Barangays" rootLabel="Menu" rootPath={null} />

      {/* Header & Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Barangay Directory
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of the 18 barangays in the municipality
          </p>
        </div>
        <div className="relative sm:w-64">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
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
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500 dark:focus:border-brand-400"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl bg-white dark:bg-white/[0.03]"
            />
          ))}
        </div>
      ) : filteredBarangays.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBarangays.map((brgy) => (
            <div
              key={brgy.id}
              onClick={() => navigate(`/barangays/${brgy.id}`)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-theme-md hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-500/50 dark:hover:bg-brand-500/5"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 opacity-0 transition-all group-hover:opacity-100 group-hover:bg-brand-50 group-hover:text-brand-500 dark:bg-gray-800 dark:group-hover:bg-brand-500/20 dark:group-hover:text-brand-400">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10h12M10 4l6 6-6 6" />
                  </svg>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
                  {brgy.name}
                </h3>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 dark:border-gray-800/50">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Population</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-white/90">
                    {brgy.population_count.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Households</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-white/90">
                    {brgy.household_count.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <svg className="h-12 w-12 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No barangays found matching "{searchQuery}"
          </p>
        </div>
      )}
    </>
  );
};

export default BarangayListPage;
