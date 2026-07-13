-- Enable realtime for relevant tables
BEGIN;

-- Remove the publication if it exists to safely recreate it
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create the publication for realtime tracking
CREATE PUBLICATION supabase_realtime FOR TABLE
  social_dev_stats,
  population_stats,
  econ_dev_stats,
  infra_stats,
  governance_stats,
  justice_stats,
  gad_stats,
  dynamic_data,
  dynamic_schemas,
  data_approvals;

COMMIT;
