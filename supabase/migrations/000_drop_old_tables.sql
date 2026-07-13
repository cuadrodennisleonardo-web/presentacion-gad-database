-- 000_drop_old_tables.sql
-- Run this first to clean up the old CRM tables before applying the new aggregate schema

DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Governance
DROP TABLE IF EXISTS public.vawc_cases CASCADE;
DROP TABLE IF EXISTS public.cicl_cases CASCADE;
DROP TABLE IF EXISTS public.sexual_assault_cases CASCADE;
DROP TABLE IF EXISTS public.department_heads CASCADE;
DROP TABLE IF EXISTS public.officials CASCADE;

-- Infrastructure
DROP TABLE IF EXISTS public.household_utilities CASCADE;

-- Economic Development
DROP TABLE IF EXISTS public.informal_workers CASCADE;
DROP TABLE IF EXISTS public.business_owners CASCADE;
DROP TABLE IF EXISTS public.fisherfolk CASCADE;
DROP TABLE IF EXISTS public.farmers CASCADE;
DROP TABLE IF EXISTS public.employment_records CASCADE;

-- Social Development
DROP TABLE IF EXISTS public.solo_parents CASCADE;
DROP TABLE IF EXISTS public.health_records CASCADE;
DROP TABLE IF EXISTS public.education_records CASCADE;

-- GAD
DROP TABLE IF EXISTS public.gst_training CASCADE;
DROP TABLE IF EXISTS public.gad_ordinances CASCADE;
DROP TABLE IF EXISTS public.gad_budget_utilization CASCADE;
DROP TABLE IF EXISTS public.gad_budget CASCADE;

-- Core (People)
DROP TABLE IF EXISTS public.residents CASCADE;
DROP TABLE IF EXISTS public.households CASCADE;
DROP TABLE IF EXISTS public.barangays CASCADE;

-- Also drop any new aggregate tables just in case we are resetting them
DROP TABLE IF EXISTS public.population_stats CASCADE;
DROP TABLE IF EXISTS public.social_dev_stats CASCADE;
DROP TABLE IF EXISTS public.econ_dev_stats CASCADE;
DROP TABLE IF EXISTS public.infra_stats CASCADE;
DROP TABLE IF EXISTS public.governance_stats CASCADE;
DROP TABLE IF EXISTS public.gad_stats CASCADE;

-- Drop functions if any
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS public.is_superadmin CASCADE;
