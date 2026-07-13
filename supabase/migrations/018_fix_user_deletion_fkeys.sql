-- Fix foreign keys referencing auth.users so users can be deleted from the Supabase dashboard
-- Copy this exactly into your SQL Editor and click Run.

DO $$
BEGIN
  -- 1. Fix audit_logs changed_by
  ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_changed_by_fkey;
  ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_changed_by_fkey 
    FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

  -- 2. Ensure data_approvals can be deleted when a user is deleted
  ALTER TABLE public.data_approvals DROP CONSTRAINT IF EXISTS data_approvals_submitted_by_fkey;
  ALTER TABLE public.data_approvals ADD CONSTRAINT data_approvals_submitted_by_fkey 
    FOREIGN KEY (submitted_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

  -- 3. Ensure notifications can be deleted when a user is deleted
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

END $$;
