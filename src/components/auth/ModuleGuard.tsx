import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import type { Department } from "@/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface ModuleGuardProps {
  children: React.ReactNode;
  module: Department;
  requireWrite?: boolean;
}

const ModuleGuard: React.FC<ModuleGuardProps> = ({ children, module, requireWrite = false }) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const { canAccessModule, canWrite } = useRole();
  const location = useLocation();

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canAccessModule(module)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If write access is required, enforce it.
  if (requireWrite && !canWrite) {
    return <Navigate to={`/dashboard`} replace />;
  }

  return <>{children}</>;
};

export default ModuleGuard;
