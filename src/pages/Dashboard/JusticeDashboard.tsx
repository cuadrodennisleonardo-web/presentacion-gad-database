import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DynamicDashboardCharts from '@/components/common/DynamicDashboardCharts';
import DynamicBudgetCharts from '@/components/common/DynamicBudgetCharts';

export default function JusticeDashboard() {
  return (
    <>
      <PageMeta title="Justice & Safety Dashboard" description="Justice & Safety Metrics & Dynamic Charts" />
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Justice & Safety Dashboard" hideNav={true} />
      </div>

      <DynamicDashboardCharts department="Justice & Safety" />
      <DynamicBudgetCharts department="Justice & Safety" />
    </>
  );
}
