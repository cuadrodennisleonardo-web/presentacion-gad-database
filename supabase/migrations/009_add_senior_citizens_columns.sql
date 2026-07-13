-- 009: Add senior_citizens columns to population_stats
-- Keeps welfare SDD fields (PWD, 4Ps, Senior Citizens) together in population_stats

ALTER TABLE public.population_stats
ADD COLUMN IF NOT EXISTS senior_citizens_m INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS senior_citizens_f INT DEFAULT 0;
