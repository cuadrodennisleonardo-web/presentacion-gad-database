import React from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DeptKPIChart from "@/components/charts/DeptKPIChart";

const GADDashboard: React.FC = () => {
  return (
    <>
      <PageMeta
        title="GAD Dashboard"
        description="KPIs and metrics for Institutional GAD"
      />
      <PageBreadcrumb pageTitle="GAD Dashboard" />

      <div className="mb-8 rounded-2xl bg-white p-6 shadow-theme-sm dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          GAD Analytics
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          This dashboard shows placeholder data for GAD Budget and Trainings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DeptKPIChart 
          title="GAD Budget Utilization (Mock)"
          categories={["Q1", "Q2", "Q3", "Q4"]}
          seriesData={[25, 45, 65, 80]}
          type="line"
          color="#8b5cf6"
        />
        
        <DeptKPIChart 
          title="GST Training Participants (Mock)"
          categories={["LGU Staff", "Barangay Officials", "Civil Society", "Others"]}
          seriesData={[120, 340, 50, 30]}
          type="bar"
          color="#f43f5e"
        />
      </div>
    </>
  );
};

export default GADDashboard;
