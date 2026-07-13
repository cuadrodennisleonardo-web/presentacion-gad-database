-- 016_fix_auth_identities.sql
-- Fixes an issue where manually created users via RPC had their email set as provider_id
-- instead of their user_id, which causes Supabase GoTrue to throw a 500 error on login.

-- 1. Fix existing broken identities
UPDATE auth.identities
SET provider_id = user_id::text
WHERE provider = 'email' AND provider_id != user_id::text;

-- 2. Update the RPC function to correctly use user_id::text for provider_id
CREATE OR REPLACE FUNCTION public.create_app_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT DEFAULT 'viewer',
  p_department TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  new_user_id UUID;
  result jsonb;
BEGIN
  -- Only superadmins can create users
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Permission denied: only superadmins can create users';
  END IF;

  -- Validate role
  IF p_role NOT IN ('superadmin', 'senior_viewer', 'dept_admin', 'dept_viewer', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Validate email format (basic check)
  IF p_email IS NULL OR p_email = '' OR position('@' IN p_email) = 0 THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;

  -- Validate password length
  IF length(p_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  -- Check if email already exists in user_profiles
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'A user with this email already exists';
  END IF;

  -- Create the auth user via Supabase's internal function
  new_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(), -- Auto-confirm email
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'role', p_role),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    ''
  );

  -- The trigger on auth.users will auto-create the user_profiles row,
  -- but we need to set department and role correctly
  UPDATE public.user_profiles
  SET 
    full_name = p_full_name,
    role = p_role,
    department = p_department,
    is_active = true
  WHERE id = new_user_id;

  -- Also insert identity record for email provider
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    new_user_id::text, -- FIXED: This must be the user UUID as a string, not the email!
    'email',
    jsonb_build_object('sub', new_user_id::text, 'email', p_email),
    now(),
    now(),
    now()
  );

  result := jsonb_build_object(
    'id', new_user_id,
    'email', p_email,
    'full_name', p_full_name,
    'role', p_role,
    'department', p_department
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;
