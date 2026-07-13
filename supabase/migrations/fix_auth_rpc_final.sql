-- ============================================================
-- FINAL AUTH RPC FIX
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

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
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Permission denied: only superadmins can create users';
  END IF;

  IF p_role NOT IN ('superadmin', 'senior_viewer', 'dept_admin', 'dept_viewer', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  IF p_email IS NULL OR p_email = '' OR position('@' IN p_email) = 0 THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;

  IF length(p_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'A user with this email already exists';
  END IF;

  new_user_id := gen_random_uuid();

  -- We must insert into auth.users with ALL required fields to prevent GoTrue from crashing
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    is_super_admin,
    is_sso_user
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'role', p_role, 'email_verified', true),
    now(),
    now(),
    '',
    '',
    '',
    '',
    false,
    false
  );

  UPDATE public.user_profiles
  SET full_name = p_full_name, role = p_role, department = p_department, is_active = true
  WHERE id = new_user_id;

  INSERT INTO auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    new_user_id::text,
    'email',
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', p_email,
      'email_verified', false,
      'phone_verified', false
    ),
    now(), now(), now()
  );

  RETURN jsonb_build_object(
    'id', new_user_id, 'email', p_email, 'full_name', p_full_name,
    'role', p_role, 'department', p_department
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;
