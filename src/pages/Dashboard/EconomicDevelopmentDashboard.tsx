import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DynamicDashboardCharts from '@/components/common/DynamicDashboardCharts';
import DynamicBudgetCharts from '@/components/common/DynamicBudgetCharts';

export default function EconomicDevelopmentDashboard() {
  return (
    <>
      <PageMeta title="Economic Development Dashboard" description="Economic Development Metrics & Dynamic Charts" />
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Economic Development Dashboard" hideNav={true} />
      </div>

      <DynamicDashboardCharts department="Economic Development" />
      <DynamicBudgetCharts department="Economic Development" />
    </>
  );
}
