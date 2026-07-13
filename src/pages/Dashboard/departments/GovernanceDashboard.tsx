import React from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DeptKPIChart from "@/components/charts/DeptKPIChart";

const GovernanceDashboard: React.FC = () => {
  return (
    <>
      <PageMeta
        title="Governance Dashboard"
        description="KPIs and metrics for Governance"
      />
      <PageBreadcrumb pageTitle="Governance Dashboard" />

      <div className="mb-8 rounded-2xl bg-white p-6 shadow-theme-sm dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Governance Analytics
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          This dashboard shows placeholder data for Officials and Cases.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DeptKPIChart 
          title="Reported Cases (Mock)"
          categories={["VAWC", "CICL", "Sexual Assault", "Others"]}
          seriesData={[15, 8, 2, 5]}
          type="bar"
          color="#ef4444"
        />
        
        <DeptKPIChart 
          title="Case Resolution Status (Mock)"
          categories={["Resolved", "Ongoing", "Dismissed"]}
          seriesData={[60, 30, 10]}
          type="pie"
        />
      </div>
    </>
  );
};

export default GovernanceDashboard;
