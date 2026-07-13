-- Creates a SECURITY DEFINER function so superadmin can delete dynamic_data bypassing RLS
CREATE OR REPLACE FUNCTION delete_dynamic_data_by_year(
  p_year INTEGER,
  p_schema_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow superadmin role to call this
  IF (SELECT role FROM user_profiles WHERE id = auth.uid()) != 'superadmin' THEN
    RAISE EXCEPTION 'Access denied: superadmin only';
  END IF;

  DELETE FROM dynamic_data
  WHERE year = p_year
    AND schema_id = ANY(p_schema_ids);
END;
$$;

-- Grant execute to authenticated users (the function restricts to superadmin internally)
GRANT EXECUTE ON FUNCTION delete_dynamic_data_by_year(INTEGER, UUID[]) TO authenticated;
