-- 013_security_hardening.sql
-- Fixes SECURITY DEFINER search_path vulnerabilities and tightens RLS policies.

-- ============================================================
-- 1. FIX SECURITY DEFINER FUNCTIONS (search_path injection)
-- ============================================================

-- Fix is_superadmin()
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_user_role()
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  u_role text;
BEGIN
  SELECT role INTO u_role FROM public.user_profiles WHERE id = auth.uid();
  RETURN COALESCE(u_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_user_department()
CREATE OR REPLACE FUNCTION public.get_user_department()
RETURNS text AS $$
DECLARE
  u_dept text;
BEGIN
  SELECT department INTO u_dept FROM public.user_profiles WHERE id = auth.uid();
  RETURN COALESCE(u_dept, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix log_audit_event()
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    user_id UUID;
    old_row JSONB;
    new_row JSONB;
BEGIN
    user_id := auth.uid();
    
    IF TG_OP = 'INSERT' THEN
        new_row = row_to_json(NEW);
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, new_row, user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (row_to_json(OLD)::jsonb - 'updated_at') = (row_to_json(NEW)::jsonb - 'updated_at') THEN
            RETURN NEW;
        END IF;
        
        old_row = row_to_json(OLD);
        new_row = row_to_json(NEW);
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, old_row, new_row, user_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        old_row = row_to_json(OLD);
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id::text, TG_OP, old_row, user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix log_auth_login()
CREATE OR REPLACE FUNCTION public.log_auth_login()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, changed_by)
        VALUES ('auth.users', NEW.id::text, 'LOGIN', NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================================
-- 2. TIGHTEN NOTIFICATIONS INSERT POLICY
-- ============================================================
-- Old policy allowed any authenticated user to insert notifications for ANY user.
-- New policy: only allow inserting notifications where user_id = self, OR the caller is a superadmin.

DROP POLICY IF EXISTS "Anyone can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Superadmins can create notifications" ON public.notifications;

CREATE POLICY "Users can create own notifications or superadmin can create any"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    public.is_superadmin()
  );


-- ============================================================
-- 3. SCOPE user_profiles SELECT POLICY
-- ============================================================
-- Old policy: USING (true) — exposes all user data to everyone.
-- New policy: All authenticated users can see id, role, full_name (needed for notifications).
-- Full profile details (email, department, etc.) are visible to the owner and superadmins.
-- Since RLS operates on row level (not column level), we keep row-level access
-- but this is still better than the previous anonymous access.

DROP POLICY IF EXISTS "All users can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.user_profiles;

-- All authenticated users can read profiles (needed for notification routing and user display)
CREATE POLICY "Authenticated users can view profiles"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only superadmins or the owner can update profiles
DROP POLICY IF EXISTS "Superadmins can update profiles" ON public.user_profiles;
CREATE POLICY "Owner or superadmin can update profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (
    id = auth.uid() OR public.is_superadmin()
  );
