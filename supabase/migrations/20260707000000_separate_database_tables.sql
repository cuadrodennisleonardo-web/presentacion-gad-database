-- ==============================================================================
-- 1. Create NEW justice_stats table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.justice_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month_updated INT,
    
    vawc_cases_reported INT DEFAULT 0,
    cicl_m INT DEFAULT 0,
    cicl_f INT DEFAULT 0,
    sexual_assault_m INT DEFAULT 0,
    sexual_assault_f INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(barangay_id, year)
);

-- ==============================================================================
-- 2. Migrate Justice data from governance_stats to justice_stats
-- ==============================================================================
INSERT INTO public.justice_stats (
  barangay_id, year, month_updated, vawc_cases_reported, cicl_m, cicl_f, sexual_assault_m, sexual_assault_f
)
SELECT 
  barangay_id, year, month_updated, vawc_cases_reported, cicl_m, cicl_f, sexual_assault_m, sexual_assault_f
FROM public.governance_stats
ON CONFLICT (barangay_id, year) DO UPDATE SET
  vawc_cases_reported = EXCLUDED.vawc_cases_reported,
  cicl_m = EXCLUDED.cicl_m,
  cicl_f = EXCLUDED.cicl_f,
  sexual_assault_m = EXCLUDED.sexual_assault_m,
  sexual_assault_f = EXCLUDED.sexual_assault_f,
  month_updated = EXCLUDED.month_updated;

-- Drop justice columns from governance_stats
ALTER TABLE public.governance_stats
  DROP COLUMN IF EXISTS vawc_cases_reported,
  DROP COLUMN IF EXISTS cicl_m,
  DROP COLUMN IF EXISTS cicl_f,
  DROP COLUMN IF EXISTS sexual_assault_m,
  DROP COLUMN IF EXISTS sexual_assault_f;

-- ==============================================================================
-- 3. Add Welfare columns to social_dev_stats
-- ==============================================================================
ALTER TABLE public.social_dev_stats
  ADD COLUMN IF NOT EXISTS pwd_m INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pwd_f INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS four_ps_m INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS four_ps_f INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS senior_citizens_m INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS senior_citizens_f INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS solo_parents_m INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS solo_parents_f INT DEFAULT 0;

-- ==============================================================================
-- 4. Migrate Welfare data from population_stats to social_dev_stats
-- ==============================================================================
-- First, ensure all barangay+year pairs in population_stats exist in social_dev_stats
INSERT INTO public.social_dev_stats (barangay_id, year, month_updated)
SELECT barangay_id, year, month_updated FROM public.population_stats
ON CONFLICT (barangay_id, year) DO NOTHING;

-- Now update social_dev_stats with the welfare data
UPDATE public.social_dev_stats sds
SET 
  pwd_m = ps.pwd_m,
  pwd_f = ps.pwd_f,
  four_ps_m = ps.four_ps_m,
  four_ps_f = ps.four_ps_f,
  senior_citizens_m = ps.senior_citizens_m,
  senior_citizens_f = ps.senior_citizens_f,
  solo_parents_m = ps.solo_parents_m,
  solo_parents_f = ps.solo_parents_f
FROM public.population_stats ps
WHERE sds.barangay_id = ps.barangay_id AND sds.year = ps.year;

-- Drop welfare columns from population_stats
ALTER TABLE public.population_stats
  DROP COLUMN IF EXISTS pwd_m,
  DROP COLUMN IF EXISTS pwd_f,
  DROP COLUMN IF EXISTS four_ps_m,
  DROP COLUMN IF EXISTS four_ps_f,
  DROP COLUMN IF EXISTS senior_citizens_m,
  DROP COLUMN IF EXISTS senior_citizens_f,
  DROP COLUMN IF EXISTS solo_parents_m,
  DROP COLUMN IF EXISTS solo_parents_f;

-- ==============================================================================
-- 5. Enable RLS and Create Policies for all updated/new tables
-- ==============================================================================
ALTER TABLE public.justice_stats ENABLE ROW LEVEL SECURITY;

-- POPULATION STATS
DROP POLICY IF EXISTS "Population stats modifiable by admin" ON public.population_stats;
CREATE POLICY "Population stats modifiable by admin" ON public.population_stats 
  FOR ALL 
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() IN ('Social Development', 'Demographics & Population'))
  );

-- SOCIAL DEV STATS
DROP POLICY IF EXISTS "Social Dev modifiable by Social Dev Admin" ON public.social_dev_stats;
CREATE POLICY "Social Dev modifiable by Social Dev Admin" ON public.social_dev_stats
  FOR ALL
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() = 'Social Development')
  );

-- GOVERNANCE STATS
DROP POLICY IF EXISTS "Governance Stats viewable by restricted roles" ON public.governance_stats;
DROP POLICY IF EXISTS "Governance Stats modifiable by Governance Admin" ON public.governance_stats;

CREATE POLICY "Governance Stats viewable by restricted roles" ON public.governance_stats
  FOR SELECT
  USING (
    public.is_superadmin() OR 
    public.get_user_role() = 'senior_viewer' OR 
    (public.get_user_role() IN ('dept_admin', 'dept_viewer') AND public.get_user_department() = 'Local Governance')
  );

CREATE POLICY "Governance Stats modifiable by Governance Admin" ON public.governance_stats
  FOR ALL
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() = 'Local Governance')
  );

-- JUSTICE STATS
CREATE POLICY "Justice Stats viewable by restricted roles" ON public.justice_stats
  FOR SELECT
  USING (
    public.is_superadmin() OR 
    public.get_user_role() = 'senior_viewer' OR 
    (public.get_user_role() IN ('dept_admin', 'dept_viewer') AND public.get_user_department() = 'Justice & Safety')
  );

CREATE POLICY "Justice Stats modifiable by Justice Admin" ON public.justice_stats
  FOR ALL
  USING (
    public.is_superadmin() OR 
    (public.get_user_role() = 'dept_admin' AND public.get_user_department() = 'Justice & Safety')
  );

-- ==============================================================================
-- 6. Update user profiles matching 'Governance' to 'Local Governance'
-- ==============================================================================
UPDATE public.user_profiles
SET department = 'Local Governance'
WHERE department = 'Governance';
