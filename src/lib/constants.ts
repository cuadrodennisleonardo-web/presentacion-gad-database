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
  "Pagsangahan",
  "Patrocinio",
  "Pili",
  "Santa Maria (Pob.)",
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

// ─── Dropdown Options ───────────────────────────────────────
export const SEX_OPTIONS = ["Male", "Female"] as const;

export const CIVIL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Widowed",
  "Separated",
  "Divorced",
] as const;

export const RESIDENT_STATUS_OPTIONS = [
  "active",
  "deceased",
  "migrated",
] as const;

export const HOUSE_TYPE_OPTIONS = ["owned", "rented", "informal"] as const;

export const BLOOD_TYPE_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const EMPLOYMENT_STATUS_OPTIONS = [
  "employed",
  "unemployed",
  "self-employed",
] as const;

export const EMPLOYMENT_TYPE_OPTIONS = [
  "regular",
  "contractual",
  "seasonal",
] as const;

export const NUTRITIONAL_STATUS_OPTIONS = [
  "normal",
  "malnourished",
  "stunted",
  "wasted",
  "obese",
] as const;

export const SCHOOL_LEVEL_OPTIONS = [
  "Elementary",
  "Junior High School",
  "Senior High School",
  "College",
  "Vocational",
  "Post-Graduate",
  "ALS",
] as const;

export const FARM_TYPE_OPTIONS = [
  "rice",
  "corn",
  "vegetable",
  "livestock",
  "mixed",
] as const;

export const FISHING_TYPE_OPTIONS = [
  "municipal",
  "commercial",
  "aquaculture",
] as const;

export const INFORMAL_SECTOR_OPTIONS = [
  "vendor",
  "domestic",
  "transport",
  "construction",
  "other",
] as const;

export const OFFICIAL_LEVEL_OPTIONS = ["municipal", "barangay"] as const;

// ─── Inactivity Settings ───────────────────────────────────
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ─── Pagination ─────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
