-- Drop the trigger on auth.users which is causing a 500 error during user creation
-- Supabase GoTrue throws an Internal Server Error if a trigger on auth.users 
-- executes with insufficient privileges or encounters a runtime error.

DROP TRIGGER IF EXISTS audit_auth_users_login_trigger ON auth.users;
