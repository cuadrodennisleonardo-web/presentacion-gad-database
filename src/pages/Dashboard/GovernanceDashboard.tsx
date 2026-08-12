import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DynamicDashboardCharts from '@/components/common/DynamicDashboardCharts';
import DynamicBudgetCharts from '@/components/common/DynamicBudgetCharts';

export default function GovernanceDashboard() {
  return (
    <>
      <PageMeta title="Local Governance Dashboard" description="Local Governance Metrics & Dynamic Charts" />
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Local Governance Dashboard" hideNav={true} />
      </div>

      <DynamicDashboardCharts department="Local Governance" />
      <DynamicBudgetCharts department="Local Governance" />
    </>
  );
}
