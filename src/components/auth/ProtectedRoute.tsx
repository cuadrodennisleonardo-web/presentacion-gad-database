import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

/**
 * Route guard component that redirects unauthenticated users to login.
 * Optionally restricts access to specific roles.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, isInitialized, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth initializes
  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user?.profile?.role) {
    if (!allowedRoles.includes(user.profile.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
