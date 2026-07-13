import React, { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DeptKPIChart from "@/components/charts/DeptKPIChart";
import { supabase } from "@/config/supabase";

const EconomicDevDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    employment: {} as Record<string, number>,
    sectors: {} as Record<string, number>,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      const year = new Date().getFullYear();
      
      const { data } = await supabase
        .from('econ_dev_stats')
        .select('*')
        .eq('year', year);

      if (data) {
        let emp = 0, unemp = 0, farmers = 0, fisherfolks = 0, biz = 0;
        data.forEach(row => {
          emp += (row.employed_m || 0) + (row.employed_f || 0);
          unemp += (row.unemployed_m || 0) + (row.unemployed_f || 0);
          farmers += (row.farmers_m || 0) + (row.farmers_f || 0);
          fisherfolks += (row.fisherfolks_m || 0) + (row.fisherfolks_f || 0);
          biz += (row.business_owners_m || 0) + (row.business_owners_f || 0);
        });

        setStats({
          employment: {
            Employed: emp,
            Unemployed: unemp,
          },
          sectors: {
            Farmers: farmers,
            Fisherfolks: fisherfolks,
            Businesses: biz,
          }
        });
      }
      setIsLoading(false);
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  // Prepare chart data
  const empLabels = Object.keys(stats.employment);
  const empData = Object.values(stats.employment);

  const sectorLabels = Object.keys(stats.sectors);
  const sectorData = Object.values(stats.sectors);

  return (
    <>
      <PageMeta
        title="Economic Development Dashboard"
        description="KPIs and metrics for Economic Development"
      />
      <PageBreadcrumb pageTitle="Economic Development Dashboard" />

      <div className="mb-8 rounded-2xl bg-white p-6 shadow-theme-sm dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Economic Development Analytics
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Real-time aggregated data across Employment, Agriculture, and Business sectors.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DeptKPIChart 
          title="Employment Status"
          categories={empLabels.length > 0 ? empLabels : ["No Data"]}
          seriesData={empData.length > 0 ? empData : [0]}
          type="donut"
        />
        
        <DeptKPIChart 
          title="Economic Sectors"
          categories={sectorLabels.length > 0 ? sectorLabels : ["No Data"]}
          seriesData={sectorData.length > 0 ? sectorData : [0]}
          type="bar"
          color="#10b981"
        />
      </div>
    </>
  );
};

export default EconomicDevDashboard;
