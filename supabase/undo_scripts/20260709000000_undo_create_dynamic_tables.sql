-- Undo script for 20260709000000_create_dynamic_tables.sql

-- 1. Remove from Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.dynamic_data;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.dynamic_schemas;

-- 2. Drop RLS Policies
DROP POLICY IF EXISTS "Anyone can view dynamic data" ON public.dynamic_data;
DROP POLICY IF EXISTS "Authenticated users can insert dynamic data" ON public.dynamic_data;
DROP POLICY IF EXISTS "Authenticated users can update dynamic data" ON public.dynamic_data;

DROP POLICY IF EXISTS "Anyone can view dynamic schemas" ON public.dynamic_schemas;
DROP POLICY IF EXISTS "Superadmins can insert dynamic schemas" ON public.dynamic_schemas;
DROP POLICY IF EXISTS "Superadmins can update dynamic schemas" ON public.dynamic_schemas;
DROP POLICY IF EXISTS "Superadmins can delete dynamic schemas" ON public.dynamic_schemas;

-- 3. Drop tables (This will automatically drop constraints and indexes)
DROP TABLE IF EXISTS public.dynamic_data CASCADE;
DROP TABLE IF EXISTS public.dynamic_schemas CASCADE;
