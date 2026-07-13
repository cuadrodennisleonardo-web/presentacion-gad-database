# Presentacion Municipal Centralized Database — Agent Rules

> This file ensures all AI agents maintain consistency when working on this project.
> Read this ENTIRELY before making any changes to the codebase.

---

## Project Identity

- **Project**: Presentacion Municipal Centralized Database PWA
- **Municipality**: Presentacion, Camarines Sur, Philippines
- **Purpose**: Centralized government database for managing residents, households, and departmental records across 18 barangays
- **Language**: English only (no i18n needed)

---

## Tech Stack (DO NOT CHANGE)

| Layer       | Technology                    | Version |
| ----------- | ----------------------------- | ------- |
| Frontend    | React                         | 19.x    |
| Language    | TypeScript                    | ~5.7    |
| Build       | Vite                          | 6.x     |
| Styling     | Tailwind CSS                  | 4.x     |
| UI Base     | TailAdmin Free (adapted)      | 2.3.0   |
| Backend/DB  | Supabase (PostgreSQL)         | —       |
| Auth        | Supabase Auth                 | —       |
| PWA         | vite-plugin-pwa               | —       |
| Charts      | ApexCharts (react-apexcharts) | —       |
| Data Tables | TanStack Table                | v8      |
| Forms       | React Hook Form + Zod         | —       |
| State       | Zustand                       | —       |
| Dates       | date-fns                      | —       |
| Router      | react-router                  | v7      |

---

## Directory Structure Rules

1. **The project root is `Municipal Database/Presentacion Database/`** — all source code lives here.
2. **`Municipal Database/_reference/`** contains the TailAdmin reference dashboard. **DO NOT MODIFY** anything in `_reference/`.
3. **`Municipal Database/`** root also contains planning documents (PDF, XLSX). Do not move or delete them.
4. Follow the established folder structure:
   - `src/components/` — Reusable components grouped by domain (auth/, common/, charts/, forms/, dashboard/, header/, tables/, ui/)
   - `src/pages/` — Page-level components grouped by module (Auth/, Dashboard/, Residents/, Households/, Barangays/, SocialDevelopment/, EconomicDevelopment/, Infrastructure/, Governance/, GAD/, Users/, AuditLog/, Settings/)
   - `src/hooks/` — Custom React hooks
   - `src/store/` — Zustand stores
   - `src/lib/` — Utility functions, validators (Zod schemas), constants
   - `src/types/` — TypeScript type definitions
   - `src/config/` — Configuration (Supabase client, etc.)
   - `src/layout/` — Layout components (AppLayout, AppSidebar, AppHeader)
   - `src/icons/` — SVG icon components
   - `supabase/migrations/` — SQL migration files (numbered sequentially)

---

## Supabase Configuration

- **URL**: `https://gjqeaggkyfxkhqzmkyfd.supabase.co`
- **Anon Key**: `sb_publishable_3NlVxxEondnz8YhYS57tZg_LSzfODAN`
- These are stored in `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **NEVER hardcode Supabase credentials** in source files. Always use `import.meta.env`.

---

## Database Schema Rules

### Core Principle

The `residents` table is the **central hub**. Every departmental record links back to a resident via `resident_id` (UUID foreign key).

### 18 Barangays (alphabetical)

Ayugao, Bagong Sirang, Baliguian, Bantugan, Bicalen, Bitaogan, Buenavista, Bulalacao, Cagnipa, Lagha, Lidong, Liwacsa, Maangas, Pagsangahan, Patrocinio, Pili, Santa Maria (Pob.), Tanawan

### Table Modules

| Module                   | Tables                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **Core**                 | `barangays`, `households`, `residents`                                               |
| **Social Development**   | `education_records`, `health_records`, `solo_parents`                                |
| **Economic Development** | `employment_records`, `farmers`, `fisherfolk`, `business_owners`, `informal_workers` |
| **Infrastructure**       | `household_utilities`                                                                |
| **Governance**           | `officials`, `department_heads`, `vawc_cases`, `cicl_cases`, `sexual_assault_cases`  |
| **Institutional GAD**    | `gad_budget`, `gad_budget_utilization`, `gst_training`, `gad_ordinances`             |
| **Utility**              | `audit_log`, `user_profiles`                                                         |

### Schema Conventions

- All tables use `UUID` primary keys generated with `gen_random_uuid()`
- All tables include `created_at` and `updated_at` timestamps (TIMESTAMPTZ, DEFAULT now())
- Use `updated_at` trigger to auto-update on row modification
- Foreign keys use the pattern `[entity]_id` (e.g., `resident_id`, `household_id`, `barangay_id`)
- Use soft deletes (status field) instead of hard deletes for ALL record types
- Age is computed dynamically from `birthdate`, never stored
- `is_senior_citizen` is a generated column: `birthdate + interval '60 years' <= now()`

---

## Authentication & RBAC Rules

### 5 Roles (strict hierarchy)

| Role            | Scope                       | Permissions                                   |
| --------------- | --------------------------- | --------------------------------------------- |
| `superadmin`    | All modules                 | Full CRUD + user management + audit log       |
| `senior_viewer` | All modules incl. sensitive | Read-only on ALL tables                       |
| `dept_admin`    | Assigned department         | Full CRUD on dept tables + read core tables   |
| `dept_viewer`   | Assigned department         | Read-only on dept tables + read core tables   |
| `viewer`        | All non-sensitive           | Read-only on core + non-sensitive dept tables |

### Initial User Count: 14

- 2 superadmin
- 1 senior_viewer
- 5 dept_admin (one per department)
- 5 dept_viewer (one per department)
- 1 viewer

### Role Enforcement

1. **Row Level Security (RLS)** must be enabled on EVERY table — no exceptions.
2. Role is stored in `user_profiles.role` and synced to Supabase Auth JWT custom claims.
3. The frontend uses `<ProtectedRoute>` and `<RoleGate>` components for route/UI guards.
4. **Never rely solely on frontend guards** — all access control must be enforced at the database level via RLS.

### Sensitive Tables

`vawc_cases`, `cicl_cases`, `sexual_assault_cases` are **highly restricted**:

- Accessible only to: `superadmin`, `senior_viewer`, and `dept_admin`/`dept_viewer` assigned to the Governance department.
- These tables must have the strictest RLS policies.

---

## Data Privacy (RA 10173) Rules

- Every resident record includes consent tracking fields: `consent_given`, `consent_date`, `consent_purpose`
- All data modifications are logged in the `audit_log` table (who, when, what changed, old value, new value)
- Use soft delete for all records — permanent deletion only by superadmin with audit trail
- Auto-logout after 30 minutes of inactivity
- Never expose sensitive data (VAWC, CICL, sexual assault) in API responses unless the user has explicit permission via RLS

---

## Code Style & Conventions

### TypeScript

- Strict mode enabled (`"strict": true`)
- No `any` types — use proper typing or `unknown` with type guards
- Export types/interfaces from `src/types/`
- Use `type` for object shapes, `enum` (or const objects) for fixed sets of values

### React Components

- Use functional components with hooks (no class components)
- Use React Hook Form + Zod for all forms
- Every form must have client-side validation AND server-side validation (Supabase constraints)
- Use `React.FC` or explicit return types
- Destructure props in function parameters

### Naming Conventions

- **Files**: PascalCase for components/pages (`ResidentForm.tsx`), camelCase for hooks/utils (`useAuth.ts`, `utils.ts`)
- **Components**: PascalCase (`<DataTable />`, `<ResidentForm />`)
- **Hooks**: camelCase, prefixed with `use` (`useAuth`, `useResidents`)
- **Stores**: camelCase, suffixed with `Store` (`authStore.ts`)
- **Database columns**: snake_case (`first_name`, `created_at`)
- **TypeScript types**: PascalCase (`Resident`, `UserProfile`, `Role`)
- **Constants**: UPPER_SNAKE_CASE for enums/constants (`DEPARTMENT_NAMES`, `ROLE_PERMISSIONS`)

### Tailwind CSS

- Use Tailwind utility classes for styling (matching TailAdmin patterns)
- Dark mode is supported via Tailwind's `dark:` prefix
- Use `clsx` or `tailwind-merge` for conditional class merging
- Keep custom CSS minimal — prefer Tailwind utilities
- Responsive design: mobile-first approach (`sm:`, `md:`, `lg:`, `xl:` breakpoints)

### Data Tables (TanStack Table)

- All data tables must support: sorting, filtering, search, pagination
- Use a shared `<DataTable>` component for consistency
- Export to CSV/Excel buttons on all tables
- Row actions (edit/delete/view) as a dropdown or icon buttons in the last column

### Charts (ApexCharts)

- Use consistent color palette across all charts
- Charts must support dark mode
- Always include proper labels, legends, and tooltips
- Responsive charts that work on mobile

---

## Resident Linking Workflow

When a department admin adds a new record (e.g., health record, employment record):

1. Show a **resident search** component (search by name, ID, or barangay)
2. If resident is found → link the record to that `resident_id`
3. If resident is NOT found → offer option to create a new resident first, then link
4. The search component is `ResidentLinkSearch.tsx` — reuse it across all department forms

---

## Resident 360° Profile

When viewing a resident (`/residents/:id`), display ALL linked records across departments in a tabbed interface:

- Tab 1: Personal Info (from `residents` table)
- Tab 2: Household Info (from `households` table)
- Tab 3: Education (from `education_records`)
- Tab 4: Health (from `health_records`)
- Tab 5: Employment & Economy (from `employment_records`, `farmers`, `fisherfolk`, `business_owners`, `informal_workers`)
- Tab 6: Solo Parent (from `solo_parents`)
- Tab 7: Governance (from `officials`, `department_heads`) — only if applicable
- Only show tabs the user's role has access to

---

## Dashboard Rules

- **Super Admin Dashboard** (`/dashboard`): Municipality-wide stats — total population, sex ratio, age pyramid, voter stats, per-barangay breakdowns
- **Department Dashboards**: Show department-specific KPIs (e.g., employment rate, malnutrition rate, dropout rate)
- **Barangay Dashboard** (`/barangays/:id`): Per-barangay demographics with linked department data
- Use `<StatCard>` components for key metrics
- Charts: Population Pyramid, Sex Distribution Pie, Barangay Population Bar, Department KPI Line/Bar charts
- All dashboard data fetched via Supabase queries with appropriate RLS filtering

---

## SQL Migration Rules

- Migrations are in `supabase/migrations/` and numbered sequentially: `001_`, `002_`, etc.
- Each migration file should be idempotent where possible (use `IF NOT EXISTS`)
- RLS policies are in a dedicated migration file (`008_create_rls_policies.sql`)
- Audit triggers are in a dedicated migration file (`009_create_audit_triggers.sql`)
- Seed data (barangays, initial users) is in `supabase/seed.sql`

---

## PWA Rules

- Service worker configured via `vite-plugin-pwa`
- Manifest includes app name: "Presentacion Municipal Database"
- Cache strategy: NetworkFirst for API calls, CacheFirst for static assets
- App must be installable on Android/iOS/Desktop
- Offline mode: Show cached data with a "You are offline" banner

---

## Error Handling

- All Supabase queries must have error handling (try/catch or `.error` checking)
- Show user-friendly error messages via toast notifications
- Log errors to console in development, suppress in production
- Network errors should trigger the offline banner

---

## Testing & Verification

- Test all 5 role types with separate accounts
- Verify RLS prevents unauthorized access at the database level (not just UI)
- Test resident linking workflow end-to-end
- Test PWA install on mobile
- Verify audit log captures all data changes
- Test responsive design across screen sizes (mobile, tablet, desktop)

---

## Git Conventions

- Commit messages: `type(scope): description` (e.g., `feat(residents): add CRUD operations`, `fix(auth): handle session expiry`)
- Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`
- One feature per commit when possible
