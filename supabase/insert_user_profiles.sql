-- Run this to give your logged-in account superadmin access!
-- Instructions:
-- 1. Go to your Supabase Dashboard -> Authentication -> Users.
-- 2. Copy the "User UID" for your email.
-- 3. Replace 'YOUR-USER-ID-HERE' and 'your.email@example.com' below with your actual details.
-- 4. Run this in the Supabase SQL Editor.

INSERT INTO public.user_profiles (id, email, full_name, role, department, is_active)
VALUES (
  'YOUR-USER-ID-HERE', 
  'your.email@example.com', 
  'System Admin', 
  'superadmin', 
  NULL, 
  true
)
ON CONFLICT (id) DO UPDATE SET role = 'superadmin';
