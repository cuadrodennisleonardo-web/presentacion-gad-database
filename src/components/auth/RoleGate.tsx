import React from "react";
import { useRole } from "@/hooks/useRole";
import type { Role, Department } from "@/types";

interface RoleGateProps {
  children: React.ReactNode;
  /** Show children only for these roles */
  allowedRoles?: Role[];
  /** Show children only if user can access this department/module */
  requiredModule?: Department;
  /** Fallback content when access is denied */
  fallback?: React.ReactNode;
}

/**
 * Conditional rendering based on user role.
 * Use this to show/hide UI elements based on permissions.
 */
const RoleGate: React.FC<RoleGateProps> = ({
  children,
  allowedRoles,
  requiredModule,
  fallback = null,
}) => {
  const { role, canAccessModule } = useRole();

  if (!role) return <>{fallback}</>;

  // Check allowed roles
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  // Check module access
  if (requiredModule && !canAccessModule(requiredModule)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGate;
