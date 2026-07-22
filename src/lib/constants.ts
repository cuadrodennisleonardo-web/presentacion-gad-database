import type { Department, Role } from "@/types";

// ─── Barangays ──────────────────────────────────────────────
export const BARANGAYS = [
  "Ayugao",
  "Bagong Sirang",
  "Baliguian",
  "Bantugan",
  "Bicalen",
  "Bitaogan",
  "Buenavista",
  "Bulalacao",
  "Cagnipa",
  "Lagha",
  "Lidong",
  "Liwacsa",
  "Maangas",
  "Pagsangaan",
  "Patrocinio",
  "Pili",
  "Sta. Maria",
  "Tanawan",
] as const;

// ─── Role Permissions ───────────────────────────────────────
export const ROLES: Role[] = [
  "superadmin",
  "senior_viewer",
  "dept_admin",
  "dept_viewer",
  "viewer",
];

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Super Admin",
  senior_viewer: "Senior Viewer",
  dept_admin: "Department Admin",
  dept_viewer: "Department Viewer",
  viewer: "Viewer",
};

// ─── Department Names ───────────────────────────────────────
export const DEPARTMENTS: Department[] = [
  "Demographics & Population",
  "Social Development",
  "Economic Development",
  "Infrastructure",
  "Local Governance",
  "Justice & Safety",
  "Institutional GAD",
];

export const DEPARTMENT_TABLES: Record<Department, string[]> = {
  "Demographics & Population": ["population_stats"],
  "Social Development": ["social_dev_stats", "population_stats"],
  "Economic Development": ["econ_dev_stats"],
  Infrastructure: ["infra_stats"],
  "Local Governance": ["governance_stats"],
  "Justice & Safety": ["justice_stats"],
  "Institutional GAD": ["gad_stats"],
};

// ─── Sensitive Tables ───────────────────────────────────────
export const SENSITIVE_TABLES = [
  "justice_stats", // Contains VAWC, CICL, Sexual Assault counts
] as const;

// ─── Inactivity Settings ───────────────────────────────────
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ─── Pagination ─────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
