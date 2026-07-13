-- Remove the problematic trigger on auth.users that crashes GoTrue logins
DROP TRIGGER IF EXISTS audit_auth_users_login_trigger ON auth.users;

-- Also remove the function since it's no longer used by the trigger
DROP FUNCTION IF EXISTS public.log_auth_login();
