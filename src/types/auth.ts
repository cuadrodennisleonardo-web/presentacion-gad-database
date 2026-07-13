// ─── Role Types ─────────────────────────────────────────────
export type Role =
  | "superadmin"
  | "senior_viewer"
  | "dept_admin"
  | "dept_viewer"
  | "viewer";

export type Department =
  | "Social Development"
  | "Economic Development"
  | "Infrastructure"
  | "Local Governance"
  | "Institutional GAD"
  | "Demographics & Population"
  | "Justice & Safety";

export interface UserProfile {
  id: string;
  full_name: string;
  role: Role;
  department: Department | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
}
