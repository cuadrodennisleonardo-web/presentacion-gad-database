import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DynamicDashboardCharts from '@/components/common/DynamicDashboardCharts';
import DynamicBudgetCharts from '@/components/common/DynamicBudgetCharts';

export default function InfrastructureDashboard() {
  return (
    <>
      <PageMeta title="Infrastructure Dashboard" description="Infrastructure Metrics & Dynamic Charts" />
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Infrastructure Dashboard" hideNav={true} />
      </div>

      <DynamicDashboardCharts department="Infrastructure" />
      <DynamicBudgetCharts department="Infrastructure" />
    </>
  );
}
