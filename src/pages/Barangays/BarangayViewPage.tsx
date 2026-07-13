import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import { supabase } from "@/config/supabase";
import { useRole } from "@/hooks/useRole";
import DeptKPIChart from "@/components/charts/DeptKPIChart";
import MultiSeriesChart from "@/components/charts/MultiSeriesChart";

const BarangayViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin, role, department } = useRole();

  const [isLoading, setIsLoading] = useState(true);
  
  const [barangayName, setBarangayName] = useState("");
  const [stats, setStats] = useState({
    population: 0,
    households: 0,
    pwd: 0,
    four_ps: 0,
    male: 0,
    female: 0,
    livelihood: { farmers: 0, fisherfolks: 0, business: 0 }
  });

  useEffect(() => {
    async function fetchBarangayData() {
      if (!id) return;
      setIsLoading(true);
      
      try {
        const year = new Date().getFullYear();
        
        // 1. Fetch Barangay Name
        const { data: bData, error: bError } = await supabase
          .from("barangays")
          .select("name")
          .eq("id", id)
          .single();
          
        if (bError || !bData) {
          toast.error("Barangay not found");
          navigate("/barangays");
          return;
        }
        
        setBarangayName(bData.name);
        
        // 2. Fetch Population Stats
        const { data: pData } = await supabase
          .from("population_stats")
          .select("*")
          .eq("barangay_id", id)
          .eq("year", year)
          .single();
          
        // 3. Fetch Econ Stats
        const { data: eData } = await supabase
          .from("econ_dev_stats")
          .select("*")
          .eq("barangay_id", id)
          .eq("year", year)
          .single();

        setStats({
          population: pData?.total_population || 0,
          households: (pData?.household_heads_m || 0) + (pData?.household_heads_f || 0),
          pwd: (pData?.pwd_m || 0) + (pData?.pwd_f || 0),
          four_ps: (pData?.four_ps_m || 0) + (pData?.four_ps_f || 0),
          male: pData?.male_count || 0,
          female: pData?.female_count || 0,
          livelihood: {
            farmers: (eData?.farmers_m || 0) + (eData?.farmers_f || 0),
            fisherfolks: (eData?.fisherfolks_m || 0) + (eData?.fisherfolks_f || 0),
            business: (eData?.business_owners_m || 0) + (eData?.business_owners_f || 0)
          }
        });
        
      } catch (err) {
        console.error(err);
        toast.error("Failed to load barangay data");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBarangayData();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <>
        <PageMeta title="Loading..." description="" />
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
          <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      </>
    );
  }

  const showAll = isSuperAdmin || !role?.startsWith("dept_");
  const showSocialDev = showAll || department === "Social Development";
  const showEconDev = showAll || department === "Economic Development";

  const statCards = [];
  
  if (showSocialDev) {
    statCards.push(
      { label: "Total Population", value: stats.population, icon: "users", color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-500/10" },
      { label: "Households", value: stats.households, icon: "home", color: "text-blue-light-600", bg: "bg-blue-light-50 dark:bg-blue-light-500/10" },
      { label: "Registered PWDs", value: stats.pwd, icon: "check-circle", color: "text-success-600", bg: "bg-success-50 dark:bg-success-500/10" },
      { label: "4Ps Beneficiaries", value: stats.four_ps, icon: "star", color: "text-warning-600", bg: "bg-warning-50 dark:bg-warning-500/10" }
    );
  }

  return (
    <>
      <PageMeta title={barangayName} description={`Barangay profile for ${barangayName}`} />
      <PageBreadcrumb 
        pageTitle={barangayName} 
        rootLabel="Menu"
        rootPath={null}
        items={[{ label: "Barangays", path: "/barangays" }]} 
      />

      {/* Hero Section */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-400 p-8 text-white shadow-theme-md">
        <h1 className="text-3xl font-bold">{barangayName}</h1>
        <p className="mt-2 text-white/80">Municipal Barangay Registry & Statistics</p>
      </div>

      {/* Stats Grid */}
      {statCards.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                  {stat.icon === "users" && (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  )}
                  {stat.icon === "home" && (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  )}
                  {stat.icon === "check-circle" && (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  )}
                  {stat.icon === "star" && (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white/90">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Barangay Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {showSocialDev && (
          <DeptKPIChart 
            title="Sex Distribution"
            categories={["Male", "Female"]}
            seriesData={[stats.male, stats.female]}
            type="pie"
          />
        )}
        
        {showEconDev && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
              <MultiSeriesChart 
                title="Livelihood Distribution"
                type="pie"
                categories={["Farmers", "Fisherfolks", "MSME Owners"]}
                series={[stats.livelihood.farmers, stats.livelihood.fisherfolks, stats.livelihood.business]}
                colors={["#f59e0b", "#06b6d4", "#8b5cf6"]}
              />
          </div>
        )}
      </div>
    </>
  );
};

export default BarangayViewPage;
