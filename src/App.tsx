import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AppLayout from "./layout/AppLayout";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ModuleGuard from "./components/auth/ModuleGuard";
import HomeRedirect from "./components/auth/HomeRedirect";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Lazy Loaded Pages
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const DashboardPage = lazy(() => import("./pages/Dashboard/DashboardPage"));
const BarangayListPage = lazy(() => import("./pages/Barangays/BarangayListPage"));
const BarangayViewPage = lazy(() => import("./pages/Barangays/BarangayViewPage"));
const UserManagementPage = lazy(() => import("./pages/Settings/UserManagementPage"));
const ApprovalsPage = lazy(() => import("./pages/Settings/ApprovalsPage"));
const ProfilePage = lazy(() => import("./pages/Settings/ProfilePage"));
const AuditLogPage = lazy(() => import("./pages/Settings/AuditLogPage"));
const DynamicTablesPage = lazy(() => import("./pages/Settings/DynamicTablesPage"));
const DataManagementPage = lazy(() => import("./pages/Settings/DataManagementPage"));
const FeedbackManagementPage = lazy(() => import("./pages/Feedback/FeedbackManagementPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const PublicLandingPage = lazy(() => import("./pages/PublicLandingPage"));

// Sector Hubs (Data Entry Hubs)
const SocialDevelopmentHub = lazy(() => import("./pages/DataEntry/SocialDevelopmentHub"));
const EconomicDevelopmentHub = lazy(() => import("./pages/DataEntry/EconomicDevelopmentHub"));
const InfrastructureHub = lazy(() => import("./pages/DataEntry/InfrastructureHub"));
const EnvironmentHub = lazy(() => import("./pages/DataEntry/EnvironmentHub"));
const InstitutionalHub = lazy(() => import("./pages/DataEntry/InstitutionalHub"));
const SubsectorDataEntry = lazy(() => import("./pages/DataEntry/SubsectorDataEntry"));

// Sector Dashboards
const SocialDevelopmentDashboard = lazy(() => import("./pages/Dashboard/SocialDevelopmentDashboard"));
const EconomicDevelopmentDashboard = lazy(() => import("./pages/Dashboard/EconomicDevelopmentDashboard"));
const InfrastructureDashboard = lazy(() => import("./pages/Dashboard/InfrastructureDashboard"));
const EnvironmentDashboard = lazy(() => import("./pages/Dashboard/EnvironmentDashboard"));
const InstitutionalDashboard = lazy(() => import("./pages/Dashboard/InstitutionalDashboard"));

// GAD Reports (Annex D, Annex E, GFPS, Compliance, HGDG)
const GPBFormPage = lazy(() => import("./pages/GADReports/GPBFormPage"));
const GADARPage = lazy(() => import("./pages/GADReports/GADARPage"));
const GFPSTrackerPage = lazy(() => import("./pages/GADReports/GFPSTrackerPage"));
const ComplianceDashboardPage = lazy(() => import("./pages/GADReports/ComplianceDashboardPage"));
const HGDGScoringPage = lazy(() => import("./pages/GADReports/HGDGScoringPage"));

const SuspenseFallback = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

import { useRealtimeSync } from "./hooks/useRealtimeSync";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function RealtimeSyncManager() {
  const { user } = useAuthStore();
  useRealtimeSync(user?.email);
  return null;
}

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<SuspenseFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <NotificationProvider>
                      <AppLayout />
                    </NotificationProvider>
                  </ProtectedRoute>
                }
              >
                {/* Main Overview Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['superadmin', 'senior_encoder', 'senior_viewer', 'viewer']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* 5 Sector Dashboards */}
                <Route
                  path="/dashboard/social-development"
                  element={
                    <ModuleGuard module="Social Development">
                      <SocialDevelopmentDashboard />
                    </ModuleGuard>
                  }
                />
                <Route
                  path="/dashboard/economic-development"
                  element={
                    <ModuleGuard module="Economic Development">
                      <EconomicDevelopmentDashboard />
                    </ModuleGuard>
                  }
                />
                <Route
                  path="/dashboard/infrastructure"
                  element={
                    <ModuleGuard module="Infrastructure">
                      <InfrastructureDashboard />
                    </ModuleGuard>
                  }
                />
                <Route
                  path="/dashboard/environment"
                  element={
                    <ModuleGuard module="Environment">
                      <EnvironmentDashboard />
                    </ModuleGuard>
                  }
                />
                <Route
                  path="/dashboard/institutional"
                  element={
                    <ModuleGuard module="Institutional">
                      <InstitutionalDashboard />
                    </ModuleGuard>
                  }
                />

                {/* Barangays & Administration */}
                <Route path="/barangays" element={<BarangayListPage />} />
                <Route path="/barangays/:id" element={<BarangayViewPage />} />
                <Route path="/users" element={<ProtectedRoute allowedRoles={['superadmin']}><UserManagementPage /></ProtectedRoute>} />
                <Route path="/approvals" element={<ProtectedRoute allowedRoles={['superadmin', 'senior_encoder', 'dept_admin']}><ApprovalsPage /></ProtectedRoute>} />
                <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['superadmin']}><AuditLogPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProfilePage />} />
                <Route path="/settings/dynamic-tables" element={<ProtectedRoute allowedRoles={['superadmin']}><DynamicTablesPage /></ProtectedRoute>} />
                <Route path="/settings/data-management" element={<ProtectedRoute allowedRoles={['superadmin']}><DataManagementPage /></ProtectedRoute>} />

                {/* 5 Sector Hubs */}
                <Route
                  path="/data-entry/social-development"
                  element={
                    <ModuleGuard module="Social Development">
                      <SocialDevelopmentHub />
                    </ModuleGuard>
                  }
                />
                <Route
                  path="/data-entry/economic-development"
                  element={
                    <ModuleGuard module="Economic Development">
                      <EconomicDevelopmentHub />
                    </ModuleGuard>
                  }
                />
                <Route
                  path="/data-entry/infrastructure"
                  element={
                    <ModuleGuard module="Infrastructure">
                      <InfrastructureHub />
                    </ModuleGuard>
                  }
                />
                <Route
                  path="/data-entry/environment"
                  element={
                    <ModuleGuard module="Environment">
                      <EnvironmentHub />
                    </ModuleGuard>
                  }
                />
                <Route
                  path="/data-entry/institutional"
                  element={
                    <ModuleGuard module="Institutional">
                      <InstitutionalHub />
                    </ModuleGuard>
                  }
                />

                {/* Subsector Data Entry Route (e.g. /data-entry/social-development/health) */}
                <Route
                  path="/data-entry/:sectorSlug/:subsectorId"
                  element={<SubsectorDataEntry />}
                />

                {/* GAD Reports Routes */}
                <Route path="/gad-reports" element={<Navigate to="/gad-reports/gpb" replace />} />
                <Route path="/gad-reports/gpb" element={<GPBFormPage />} />
                <Route path="/gad-reports/gad-ar" element={<GADARPage />} />
                <Route path="/gad-reports/gfps" element={<GFPSTrackerPage />} />
                <Route path="/gad-reports/compliance" element={<ComplianceDashboardPage />} />
                <Route path="/gad-reports/hgdg" element={<HGDGScoringPage />} />

                {/* Feedback, Critiques & Suggestions Hub (Superadmin Only) */}
                <Route
                  path="/feedback"
                  element={
                    <ProtectedRoute allowedRoles={['superadmin']}>
                      <FeedbackManagementPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="/login-redirect" element={<HomeRedirect />} />
              <Route path="/" element={<PublicLandingPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Router>
        <RealtimeSyncManager />
        <Toaster position="top-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
