-- 001_create_aggregate_tables.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. USER PROFILES
-- ==========================================
-- Supabase handles logins in `auth.users`, but we need a public table
-- to store roles, departments, and names so the UI and RLS can read them easily.
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'senior_viewer', 'dept_admin', 'dept_viewer', 'viewer')),
    department TEXT, -- e.g., 'Social Development', 'Governance'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 1. CORE TABLES
-- ==========================================

CREATE TABLE public.barangays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    district TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. POPULATION STATS
-- ==========================================

CREATE TABLE public.population_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month_updated INT, -- 1-12 representing the last month updated
    
    total_population INT DEFAULT 0,
    total_households INT DEFAULT 0,
    
    -- Sex
    male_count INT DEFAULT 0,
    female_count INT DEFAULT 0,
    
    -- Age Groups (Granularity defined by user)
    age_under_18 INT DEFAULT 0,
    age_19_to_59 INT DEFAULT 0,
    age_60_plus INT DEFAULT 0,
    
    -- Special Sectors
    pwd_count INT DEFAULT 0,
    four_ps_beneficiaries_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure only one record per barangay per year
    UNIQUE(barangay_id, year)
);

-- ==========================================
-- 3. SOCIAL DEVELOPMENT STATS
-- ==========================================

CREATE TABLE public.social_dev_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month_updated INT,
    
    enrolled_students INT DEFAULT 0,
    out_of_school_youth INT DEFAULT 0,
    malnourished_children INT DEFAULT 0,
    registered_solo_parents INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(barangay_id, year)
);

-- ==========================================
-- 4. ECONOMIC DEVELOPMENT STATS
-- ==========================================

CREATE TABLE public.econ_dev_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month_updated INT,
    
    employed_count INT DEFAULT 0,
    unemployed_count INT DEFAULT 0,
    registered_farmers INT DEFAULT 0,
    registered_fisherfolk INT DEFAULT 0,
    registered_businesses INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(barangay_id, year)
);

-- ==========================================
-- 5. INFRASTRUCTURE STATS
-- ==========================================

CREATE TABLE public.infra_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month_updated INT,
    
    households_with_safe_water INT DEFAULT 0,
    households_with_electricity INT DEFAULT 0,
    informal_settler_families INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(barangay_id, year)
);

-- ==========================================
-- 6. GOVERNANCE STATS
-- ==========================================

CREATE TABLE public.governance_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month_updated INT,
    
    vawc_cases_reported INT DEFAULT 0,
    cicl_cases_reported INT DEFAULT 0,
    sexual_assault_cases_reported INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(barangay_id, year)
);

-- ==========================================
-- 7. INSTITUTIONAL GAD STATS (Municipal Level)
-- ==========================================

CREATE TABLE public.gad_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INT NOT NULL UNIQUE, -- Not per barangay
    month_updated INT,
    
    total_lgu_budget DECIMAL(15, 2) DEFAULT 0.00,
    gad_allocated_amount DECIMAL(15, 2) DEFAULT 0.00,
    gad_utilized_amount DECIMAL(15, 2) DEFAULT 0.00,
    
    number_of_gad_trainings INT DEFAULT 0,
    participants_trained INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_barangays_updated_at BEFORE UPDATE ON public.barangays FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_population_stats_updated_at BEFORE UPDATE ON public.population_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_social_dev_stats_updated_at BEFORE UPDATE ON public.social_dev_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_econ_dev_stats_updated_at BEFORE UPDATE ON public.econ_dev_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_infra_stats_updated_at BEFORE UPDATE ON public.infra_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_governance_stats_updated_at BEFORE UPDATE ON public.governance_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_gad_stats_updated_at BEFORE UPDATE ON public.gad_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
