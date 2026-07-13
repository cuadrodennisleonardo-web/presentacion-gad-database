import { useMemo } from "react";
import type { Role, Department } from "@/types";
import { useAuth } from "./useAuth";
import { DEPARTMENT_TABLES, SENSITIVE_TABLES } from "@/lib/constants";

/**
 * Hook for role-based access control checks.
 * Provides helper methods to check if the current user has access to specific resources.
 */
export function useRole() {
  const { user } = useAuth();

  const role = user?.profile?.role ?? null;
  const department = user?.profile?.department ?? null;

  const permissions = useMemo(() => {
    if (!role) {
      return {
        role: null as Role | null,
        department: null as Department | null,
        isSuperAdmin: false,
        isSeniorViewer: false,
        isDeptAdmin: false,
        isDeptViewer: false,
        isViewer: false,
        canWrite: false,
        canManageUsers: false,
        canViewAuditLog: false,
        canAccessSensitive: false,
        canAccessModule: (_module: Department) => false,
        canWriteToTable: (_table: string) => false,
        canReadTable: (_table: string) => false,
      };
    }

    const isSuperAdmin = role === "superadmin";
    const isSeniorViewer = role === "senior_viewer";
    const isDeptAdmin = role === "dept_admin";
    const isDeptViewer = role === "dept_viewer";
    const isViewer = role === "viewer";

    // Super admin and dept_admin can write
    const canWrite = isSuperAdmin || isDeptAdmin;

    // Only superadmin can manage users
    const canManageUsers = isSuperAdmin;

    // Only superadmin can view audit log
    const canViewAuditLog = isSuperAdmin;

    // Sensitive tables accessible to superadmin, senior_viewer, and governance dept
    const canAccessSensitive =
      isSuperAdmin ||
      isSeniorViewer ||
      ((isDeptAdmin || isDeptViewer) && department === "Justice & Safety");

    /**
     * Check if user can access a module (department)
     */
    const canAccessModule = (module: Department): boolean => {
      if (isSuperAdmin || isSeniorViewer) return true;
      if (isViewer) {
        // Viewers can see all non-sensitive
        return module !== "Justice & Safety";
      }
      if (isDeptAdmin || isDeptViewer) {
        return department === module;
      }
      return false;
    };

    /**
     * Check if user can write to a specific table
     */
    const canWriteToTable = (table: string): boolean => {
      if (isSuperAdmin) return true;
      if (!isDeptAdmin || !department) return false;

      const deptTables = DEPARTMENT_TABLES[department] ?? [];
      return deptTables.includes(table);
    };

    /**
     * Check if user can read from a specific table
     */
    const canReadTable = (table: string): boolean => {
      // All roles can read core tables
      const coreTables = ["barangays", "households", "residents"];
      if (coreTables.includes(table)) return true;

      if (isSuperAdmin || isSeniorViewer) return true;

      // Check sensitive tables
      if ((SENSITIVE_TABLES as readonly string[]).includes(table)) {
        return canAccessSensitive;
      }

      // Viewers can read non-sensitive tables
      if (isViewer) return true;

      // Dept admin/viewer can read their department tables
      if ((isDeptAdmin || isDeptViewer) && department) {
        const deptTables = DEPARTMENT_TABLES[department] ?? [];
        return deptTables.includes(table);
      }

      return false;
    };

    return {
      role,
      department,
      isSuperAdmin,
      isSeniorViewer,
      isDeptAdmin,
      isDeptViewer,
      isViewer,
      canWrite,
      canManageUsers,
      canViewAuditLog,
      canAccessSensitive,
      canAccessModule,
      canWriteToTable,
      canReadTable,
    };
  }, [role, department]);

  return permissions;
}
