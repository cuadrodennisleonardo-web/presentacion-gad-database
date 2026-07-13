-- Run this to give a new user access to the system!
-- Instructions:
-- 1. Have the user sign up in the application OR invite them via Supabase Dashboard -> Authentication.
-- 2. Once they are in Authentication, copy their "User UID".
-- 3. Replace 'THEIR-USER-ID-HERE', 'their.email@example.com', and 'Full Name' below with their actual details.
-- 4. Select the correct role and department.
--    - Roles: 'superadmin', 'senior_viewer', 'dept_admin', 'dept_viewer', 'viewer'
--    - Departments: 'Social Development', 'Economic Development', 'Infrastructure', 'Governance', 'Institutional GAD'
--      (Leave department as NULL for superadmin or senior_viewer)
-- 5. Run this in the Supabase SQL Editor.

-- EXAMPLE 1: Creating a Department Admin for Social Development
INSERT INTO public.user_profiles (id, email, full_name, role, department, is_active)
VALUES (
  'THEIR-USER-ID-HERE', 
  'social.admin@example.com', 
  'Social Dev Admin', 
  'dept_admin', 
  'Social Development', 
  true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, department = EXCLUDED.department;

-- EXAMPLE 2: Creating a Department Admin for Economic Development
/*
INSERT INTO public.user_profiles (id, email, full_name, role, department, is_active)
VALUES (
  'THEIR-USER-ID-HERE', 'econ.admin@example.com', 'Econ Dev Admin', 'dept_admin', 'Economic Development', true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, department = EXCLUDED.department;
*/

-- EXAMPLE 3: Creating a Department Admin for Infrastructure
/*
INSERT INTO public.user_profiles (id, email, full_name, role, department, is_active)
VALUES (
  'THEIR-USER-ID-HERE', 'infra.admin@example.com', 'Infra Admin', 'dept_admin', 'Infrastructure', true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, department = EXCLUDED.department;
*/

-- EXAMPLE 4: Creating a Department Admin for Governance
/*
INSERT INTO public.user_profiles (id, email, full_name, role, department, is_active)
VALUES (
  'THEIR-USER-ID-HERE', 'gov.admin@example.com', 'Governance Admin', 'dept_admin', 'Governance', true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, department = EXCLUDED.department;
*/

-- EXAMPLE 5: Creating a Department Admin for Institutional GAD
/*
INSERT INTO public.user_profiles (id, email, full_name, role, department, is_active)
VALUES (
  'THEIR-USER-ID-HERE', 'gad.admin@example.com', 'GAD Admin', 'dept_admin', 'Institutional GAD', true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, department = EXCLUDED.department;
*/

-- EXAMPLE 6: Creating a general Viewer
/*
INSERT INTO public.user_profiles (id, email, full_name, role, department, is_active)
VALUES (
  'THEIR-USER-ID-HERE', 'viewer@example.com', 'General Viewer', 'viewer', NULL, true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, department = EXCLUDED.department;
*/
