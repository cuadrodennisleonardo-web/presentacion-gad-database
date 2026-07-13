import React from "react";
import { Navigate } from "react-router";
import { useRole } from "@/hooks/useRole";

const HomeRedirect: React.FC = () => {
  const { role, department } = useRole();

  if (role === "dept_admin" || role === "dept_viewer") {
    switch (department) {
      case "Demographics & Population":
        return <Navigate to="/dashboard/demographics" replace />;
      case "Social Development":
        return <Navigate to="/dashboard/social-development" replace />;
      case "Economic Development":
        return <Navigate to="/dashboard/economic-development" replace />;
      case "Infrastructure":
        return <Navigate to="/dashboard/infrastructure" replace />;
      case "Local Governance":
        return <Navigate to="/dashboard/governance" replace />;
      case "Justice & Safety":
        return <Navigate to="/dashboard/justice-safety" replace />;
      case "Institutional GAD":
        return <Navigate to="/dashboard/gad" replace />;
      default:
        // Fallback if department is somehow missing or unknown
        return <Navigate to="/dashboard" replace />;
    }
  }

  // Superadmin, Senior Viewer, Viewer go to main dashboard
  return <Navigate to="/dashboard" replace />;
};

export default HomeRedirect;
