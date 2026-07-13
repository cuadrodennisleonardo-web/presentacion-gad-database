-- 1. Update population_stats to include PWD and 4Ps SDD fields
ALTER TABLE public.population_stats
ADD COLUMN IF NOT EXISTS pwd_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS pwd_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS four_ps_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS four_ps_f INT DEFAULT 0;

ALTER TABLE public.population_stats
DROP COLUMN IF EXISTS pwd_count,
DROP COLUMN IF EXISTS four_ps_beneficiaries_count;

-- 2. Update econ_dev_stats for full SDD
ALTER TABLE public.econ_dev_stats
ADD COLUMN IF NOT EXISTS employed_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS employed_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS unemployed_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS unemployed_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS farmers_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS farmers_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS fisherfolks_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS fisherfolks_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_owners_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_owners_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ambulant_vendors_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ambulant_vendors_f INT DEFAULT 0;

ALTER TABLE public.econ_dev_stats
DROP COLUMN IF EXISTS employed_count,
DROP COLUMN IF EXISTS unemployed_count,
DROP COLUMN IF EXISTS registered_farmers,
DROP COLUMN IF EXISTS registered_fisherfolk,
DROP COLUMN IF EXISTS registered_businesses;

-- 3. Update infra_stats for full SDD (Male/Female-Led Households)
ALTER TABLE public.infra_stats
ADD COLUMN IF NOT EXISTS safe_water_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS safe_water_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sanitary_toilet_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sanitary_toilet_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS informal_settlers_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS informal_settlers_f INT DEFAULT 0;

ALTER TABLE public.infra_stats
DROP COLUMN IF EXISTS households_with_safe_water,
DROP COLUMN IF EXISTS households_with_electricity,
DROP COLUMN IF EXISTS informal_settler_families;

-- 4. Update governance_stats for full SDD
ALTER TABLE public.governance_stats
ADD COLUMN IF NOT EXISTS elected_officials_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS elected_officials_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS appointed_heads_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS appointed_heads_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cicl_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cicl_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sexual_assault_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sexual_assault_f INT DEFAULT 0;

ALTER TABLE public.governance_stats
DROP COLUMN IF EXISTS cicl_cases_reported,
DROP COLUMN IF EXISTS sexual_assault_cases_reported;
