-- ============================================================
-- DIAGNOSTIC: Check all triggers on auth.users
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. List ALL triggers currently attached to auth.users
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled,
  pg_proc.proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal
ORDER BY tgname;
