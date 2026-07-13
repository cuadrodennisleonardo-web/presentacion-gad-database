-- 1. Update population_stats to include Demographic SDD fields
ALTER TABLE public.population_stats
ADD COLUMN IF NOT EXISTS household_heads_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS household_heads_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS solo_parents_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS solo_parents_f INT DEFAULT 0;

-- 2. Update social_dev_stats to include Education and Health SDD fields
ALTER TABLE public.social_dev_stats
ADD COLUMN IF NOT EXISTS student_enrollment_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS student_enrollment_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS drop_out_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS drop_out_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS osy_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS osy_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS malnourished_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS malnourished_f INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS teenage_pregnancy INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS maternal_mortality INT DEFAULT 0;

-- 3. Drop obsolete columns from social_dev_stats
ALTER TABLE public.social_dev_stats
DROP COLUMN IF EXISTS enrolled_students,
DROP COLUMN IF EXISTS out_of_school_youth,
DROP COLUMN IF EXISTS malnourished_children,
DROP COLUMN IF EXISTS registered_solo_parents;
