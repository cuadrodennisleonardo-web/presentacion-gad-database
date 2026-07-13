-- 002_create_aggregate_rls.sql

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barangays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.population_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_dev_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.econ_dev_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infra_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gad_stats ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HELPER FUNCTIONS FOR RLS
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  u_role text;
BEGIN
  SELECT role INTO u_role FROM public.user_profiles WHERE id = auth.uid();
  RETURN COALESCE(u_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_department()
RETURNS text AS $$
DECLARE
  u_dept text;
BEGIN
  SELECT department INTO u_dept FROM public.user_profiles WHERE id = auth.uid();
  RETURN COALESCE(u_dept, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- USER PROFILES
-- ==========================================
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Superadmins can view all profiles" ON public.user_profiles FOR SELECT USING (public.is_superadmin());
CREATE POLICY "Superadmins can insert profiles" ON public.user_profiles FOR INSERT WITH CHECK (public.is_superadmin());
CREATE POLICY "Superadmins can update profiles" ON public.user_profiles FOR UPDATE USING (public.is_superadmin());
CREATE POLICY "Superadmins can delete profiles" ON public.user_profiles FOR DELETE USING (public.is_superadmin());

-- ==========================================
-- BARANGAYS (Core)
-- ==========================================
-- Everyone can read barangays
CREATE POLICY "Barangays are viewable by everyone" ON public.barangays FOR SELECT USING (true);
CREATE POLICY "Barangays insertable by superadmin" ON public.barangays FOR INSERT WITH CHECK (public.is_superadmin());
CREATE POLICY "Barangays updatable by superadmin" ON public.barangays FOR UPDATE USING (public.is_superadmin());
CREATE POLICY "Barangays deletable by superadmin" ON public.barangays FOR DELETE USING (public.is_superadmin());

-- ==========================================
-- POPULATION STATS (Core/General)
-- ==========================================
-- Everyone can read population stats
CREATE POLICY "Population stats viewable by everyone" ON public.population_stats FOR SELECT USING (true);
CREATE POLICY "Population stats modifiable by admin" ON public.population_stats 
  FOR ALL 
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() = 'Social Development')
  );

-- ==========================================
-- SOCIAL DEVELOPMENT STATS
-- ==========================================
CREATE POLICY "Social Dev viewable by everyone" ON public.social_dev_stats FOR SELECT USING (true);
CREATE POLICY "Social Dev modifiable by Social Dev Admin" ON public.social_dev_stats
  FOR ALL
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() = 'Social Development')
  );

-- ==========================================
-- ECONOMIC DEVELOPMENT STATS
-- ==========================================
CREATE POLICY "Econ Dev viewable by everyone" ON public.econ_dev_stats FOR SELECT USING (true);
CREATE POLICY "Econ Dev modifiable by Econ Dev Admin" ON public.econ_dev_stats
  FOR ALL
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() = 'Economic Development')
  );

-- ==========================================
-- INFRASTRUCTURE STATS
-- ==========================================
CREATE POLICY "Infra viewable by everyone" ON public.infra_stats FOR SELECT USING (true);
CREATE POLICY "Infra modifiable by Infra Admin" ON public.infra_stats
  FOR ALL
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() = 'Infrastructure')
  );

-- ==========================================
-- INSTITUTIONAL GAD STATS
-- ==========================================
CREATE POLICY "GAD viewable by everyone" ON public.gad_stats FOR SELECT USING (true);
CREATE POLICY "GAD modifiable by GAD Admin" ON public.gad_stats
  FOR ALL
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() = 'Institutional GAD')
  );

-- ==========================================
-- GOVERNANCE STATS (RESTRICTED / SENSITIVE)
-- ==========================================
-- Visible ONLY to superadmin and senior_viewer, and governance admins/viewers
CREATE POLICY "Governance Stats viewable by restricted roles" ON public.governance_stats
  FOR SELECT
  USING (
    public.is_superadmin() OR 
    public.get_user_role() = 'senior_viewer' OR 
    (public.get_user_role() IN ('dept_admin', 'dept_viewer') AND public.get_user_department() = 'Governance')
  );

CREATE POLICY "Governance Stats modifiable by Governance Admin" ON public.governance_stats
  FOR ALL
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() = 'Governance')
  );
