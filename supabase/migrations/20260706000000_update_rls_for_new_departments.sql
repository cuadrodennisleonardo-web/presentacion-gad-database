-- Update RLS Policies to support new departments:
-- "Demographics & Population", "Local Governance", and "Justice & Safety"

-- 1. Population Stats (now shared between Social Development and Demographics & Population)
DROP POLICY IF EXISTS "Population stats modifiable by admin" ON public.population_stats;

CREATE POLICY "Population stats modifiable by admin" ON public.population_stats 
  FOR ALL 
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() IN ('Social Development', 'Demographics & Population'))
  );

-- 2. Governance Stats (now shared between Local Governance and Justice & Safety)
DROP POLICY IF EXISTS "Governance Stats viewable by restricted roles" ON public.governance_stats;
DROP POLICY IF EXISTS "Governance Stats modifiable by Governance Admin" ON public.governance_stats;

CREATE POLICY "Governance Stats viewable by restricted roles" ON public.governance_stats
  FOR SELECT
  USING (
    public.is_superadmin() OR 
    public.get_user_role() = 'senior_viewer' OR 
    (public.get_user_role() IN ('dept_admin', 'dept_viewer') AND public.get_user_department() IN ('Governance', 'Local Governance', 'Justice & Safety'))
  );

CREATE POLICY "Governance Stats modifiable by Governance Admin" ON public.governance_stats
  FOR ALL
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() IN ('Governance', 'Local Governance', 'Justice & Safety'))
  );

-- Also update existing profiles if they had 'Governance' assigned, rename to 'Local Governance'
UPDATE public.user_profiles
SET department = 'Local Governance'
WHERE department = 'Governance';
