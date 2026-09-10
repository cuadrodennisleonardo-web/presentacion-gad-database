import React from "react";
import { Navigate } from "react-router";
import { useRole } from "@/hooks/useRole";

const HomeRedirect: React.FC = () => {
  const { role, department } = useRole();

  if (role === "dept_admin" || role === "dept_viewer") {
    switch (department) {
      case "Social Development":
        return <Navigate to="/dashboard/social-development" replace />;
      case "Economic Development":
        return <Navigate to="/dashboard/economic-development" replace />;
      case "Infrastructure":
        return <Navigate to="/dashboard/infrastructure" replace />;
      case "Environment":
        return <Navigate to="/dashboard/environment" replace />;
      case "Institutional":
        return <Navigate to="/dashboard/institutional" replace />;
      default:
        // Fallback if department is somehow missing or unknown
        return <Navigate to="/dashboard" replace />;
    }
  }

  // Superadmin, Senior Viewer, Viewer go to main dashboard
  return <Navigate to="/dashboard" replace />;
};

export default HomeRedirect;
