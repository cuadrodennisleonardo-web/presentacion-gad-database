-- 015_data_validation_constraints.sql
-- Add CHECK constraints to ensure data integrity at the database level.
-- Negative values for population, budget, and cases are logically invalid.

-- 1. POPULATION STATS
ALTER TABLE public.population_stats
  ADD CONSTRAINT chk_population_stats_positive
  CHECK (
    total_population >= 0 AND
    male_count >= 0 AND
    female_count >= 0 AND
    household_heads_m >= 0 AND
    household_heads_f >= 0 AND
    solo_parents_m >= 0 AND
    solo_parents_f >= 0 AND
    pwd_m >= 0 AND
    pwd_f >= 0 AND
    four_ps_m >= 0 AND
    four_ps_f >= 0 AND
    senior_citizens_m >= 0 AND
    senior_citizens_f >= 0
  );

-- 2. SOCIAL DEVELOPMENT STATS
ALTER TABLE public.social_dev_stats
  ADD CONSTRAINT chk_social_dev_stats_positive
  CHECK (
    student_enrollment_m >= 0 AND
    student_enrollment_f >= 0 AND
    drop_out_m >= 0 AND
    drop_out_f >= 0 AND
    osy_m >= 0 AND
    osy_f >= 0 AND
    malnourished_m >= 0 AND
    malnourished_f >= 0 AND
    teenage_pregnancy >= 0 AND
    maternal_mortality >= 0
  );

-- 3. ECONOMIC DEVELOPMENT STATS
ALTER TABLE public.econ_dev_stats
  ADD CONSTRAINT chk_econ_dev_stats_positive
  CHECK (
    employed_m >= 0 AND
    employed_f >= 0 AND
    unemployed_m >= 0 AND
    unemployed_f >= 0 AND
    farmers_m >= 0 AND
    farmers_f >= 0 AND
    fisherfolks_m >= 0 AND
    fisherfolks_f >= 0 AND
    business_owners_m >= 0 AND
    business_owners_f >= 0 AND
    ambulant_vendors_m >= 0 AND
    ambulant_vendors_f >= 0
  );

-- 4. INFRASTRUCTURE STATS
ALTER TABLE public.infra_stats
  ADD CONSTRAINT chk_infra_stats_positive
  CHECK (
    safe_water_m >= 0 AND
    safe_water_f >= 0 AND
    sanitary_toilet_m >= 0 AND
    sanitary_toilet_f >= 0 AND
    informal_settlers_m >= 0 AND
    informal_settlers_f >= 0
  );

-- 5. GOVERNANCE STATS
ALTER TABLE public.governance_stats
  ADD CONSTRAINT chk_governance_stats_positive
  CHECK (
    vawc_cases_reported >= 0 AND
    cicl_m >= 0 AND
    cicl_f >= 0 AND
    sexual_assault_m >= 0 AND
    sexual_assault_f >= 0 AND
    elected_officials_m >= 0 AND
    elected_officials_f >= 0 AND
    appointed_heads_m >= 0 AND
    appointed_heads_f >= 0
  );

-- 6. INSTITUTIONAL GAD STATS
ALTER TABLE public.gad_stats
  ADD CONSTRAINT chk_gad_stats_positive
  CHECK (
    total_lgu_budget >= 0 AND
    gad_allocated_amount >= 0 AND
    gad_utilized_amount >= 0 AND
    number_of_gad_trainings >= 0 AND
    participants_trained >= 0
  );
