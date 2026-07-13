import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
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
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const PublicLandingPage = lazy(() => import("./pages/PublicLandingPage"));

// Data Entry Hub
const DemographicsDataEntry = lazy(() => import("./pages/DataEntry/DemographicsDataEntry"));
const SocialDevelopmentDataEntry = lazy(() => import("./pages/DataEntry/SocialDevelopmentDataEntry"));
const EconomicDevelopmentDataEntry = lazy(() => import("./pages/DataEntry/EconomicDevelopmentDataEntry"));
const InfrastructureDataEntry = lazy(() => import("./pages/DataEntry/InfrastructureDataEntry"));
const GovernanceDataEntry = lazy(() => import("./pages/DataEntry/GovernanceDataEntry"));
const JusticeDataEntry = lazy(() => import("./pages/DataEntry/JusticeDataEntry"));
const GADDataEntry = lazy(() => import("./pages/DataEntry/GADDataEntry"));

// Department Dashboards
const DemographicsDashboard = lazy(() => import("./pages/Dashboard/DemographicsDashboard"));
const SocialDevelopmentDashboard = lazy(() => import("./pages/Dashboard/SocialDevelopmentDashboard"));
const EconomicDevelopmentDashboard = lazy(() => import("./pages/Dashboard/EconomicDevelopmentDashboard"));
const InfrastructureDashboard = lazy(() => import("./pages/Dashboard/InfrastructureDashboard"));
const GovernanceDashboard = lazy(() => import("./pages/Dashboard/GovernanceDashboard"));
const JusticeDashboard = lazy(() => import("./pages/Dashboard/JusticeDashboard"));
const GADDashboard = lazy(() => import("./pages/Dashboard/GADDashboard"));

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
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['superadmin', 'senior_viewer', 'viewer']}><DashboardPage /></ProtectedRoute>} />
              
              <Route path="/dashboard/demographics" element={<ModuleGuard module="Demographics & Population"><DemographicsDashboard /></ModuleGuard>} />
              <Route path="/dashboard/social-development" element={<ModuleGuard module="Social Development"><SocialDevelopmentDashboard /></ModuleGuard>} />
              <Route path="/dashboard/economic-development" element={<ModuleGuard module="Economic Development"><EconomicDevelopmentDashboard /></ModuleGuard>} />
              <Route path="/dashboard/infrastructure" element={<ModuleGuard module="Infrastructure"><InfrastructureDashboard /></ModuleGuard>} />
              <Route path="/dashboard/governance" element={<ModuleGuard module="Local Governance"><GovernanceDashboard /></ModuleGuard>} />
              <Route path="/dashboard/justice-safety" element={<ModuleGuard module="Justice & Safety"><JusticeDashboard /></ModuleGuard>} />
              <Route path="/dashboard/gad" element={<ModuleGuard module="Institutional GAD"><GADDashboard /></ModuleGuard>} />

              <Route path="/barangays" element={<BarangayListPage />} />
              <Route path="/barangays/:id" element={<BarangayViewPage />} />
              <Route path="/users" element={<ProtectedRoute allowedRoles={['superadmin']}><UserManagementPage /></ProtectedRoute>} />
              <Route path="/approvals" element={<ProtectedRoute allowedRoles={['superadmin', 'dept_admin']}><ApprovalsPage /></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['superadmin']}><AuditLogPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProfilePage />} />
              <Route path="/settings/dynamic-tables" element={<ProtectedRoute allowedRoles={['superadmin']}><DynamicTablesPage /></ProtectedRoute>} />
              <Route path="/settings/data-management" element={<ProtectedRoute allowedRoles={['superadmin']}><DataManagementPage /></ProtectedRoute>} />

              <Route path="/data-entry/demographics" element={<ModuleGuard module="Demographics & Population"><DemographicsDataEntry /></ModuleGuard>} />
              <Route path="/data-entry/social-development" element={<ModuleGuard module="Social Development"><SocialDevelopmentDataEntry /></ModuleGuard>} />
              <Route path="/data-entry/economic-development" element={<ModuleGuard module="Economic Development"><EconomicDevelopmentDataEntry /></ModuleGuard>} />
              <Route path="/data-entry/infrastructure" element={<ModuleGuard module="Infrastructure"><InfrastructureDataEntry /></ModuleGuard>} />
              <Route path="/data-entry/governance" element={<ModuleGuard module="Local Governance"><GovernanceDataEntry /></ModuleGuard>} />
              <Route path="/data-entry/justice-safety" element={<ModuleGuard module="Justice & Safety"><JusticeDataEntry /></ModuleGuard>} />
              <Route path="/data-entry/gad" element={<ModuleGuard module="Institutional GAD"><GADDataEntry /></ModuleGuard>} />
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
