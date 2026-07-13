-- Drop obsolete columns from population_stats
ALTER TABLE public.population_stats
DROP COLUMN IF EXISTS total_households,
DROP COLUMN IF EXISTS age_under_18,
DROP COLUMN IF EXISTS age_19_to_59,
DROP COLUMN IF EXISTS age_60_plus;
