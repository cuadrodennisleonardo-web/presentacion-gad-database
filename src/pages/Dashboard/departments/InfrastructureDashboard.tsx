import React from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DeptKPIChart from "@/components/charts/DeptKPIChart";

const InfrastructureDashboard: React.FC = () => {
  return (
    <>
      <PageMeta
        title="Infrastructure Dashboard"
        description="KPIs and metrics for Infrastructure"
      />
      <PageBreadcrumb pageTitle="Infrastructure Dashboard" />

      <div className="mb-8 rounded-2xl bg-white p-6 shadow-theme-sm dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Infrastructure Analytics
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          This dashboard shows placeholder data for Household Utilities.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DeptKPIChart 
          title="Safe Drinking Water Access (Mock)"
          categories={["With Access", "Without Access"]}
          seriesData={[85, 15]}
          type="pie"
        />
        
        <DeptKPIChart 
          title="Electricity Connectivity (Mock)"
          categories={["Connected", "Not Connected"]}
          seriesData={[92, 8]}
          type="donut"
        />
      </div>
    </>
  );
};

export default InfrastructureDashboard;
