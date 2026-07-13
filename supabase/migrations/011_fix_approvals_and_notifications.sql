-- 011_fix_approvals_and_notifications.sql

-- Enable realtime for data_approvals so the UI badges update instantly
ALTER PUBLICATION supabase_realtime ADD TABLE data_approvals;

-- Allow all authenticated users to read profiles so that department admins can find superadmin IDs for notifications
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.user_profiles;

CREATE POLICY "All users can view profiles" 
  ON public.user_profiles 
  FOR SELECT 
  USING (true);
