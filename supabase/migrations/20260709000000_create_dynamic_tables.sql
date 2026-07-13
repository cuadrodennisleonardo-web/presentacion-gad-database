-- 1. Create dynamic_schemas table
CREATE TABLE IF NOT EXISTS public.dynamic_schemas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  department text NOT NULL, -- e.g., 'Social Development'
  tab_name text NOT NULL,   -- e.g., 'Health & Nutrition'
  schema jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of field definitions
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ensure a tab is unique within a department
ALTER TABLE public.dynamic_schemas ADD CONSTRAINT unique_dept_tab UNIQUE (department, tab_name);

-- 2. Create dynamic_data table
CREATE TABLE IF NOT EXISTS public.dynamic_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  barangay_id uuid REFERENCES public.barangays(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  month_updated text NOT NULL,
  schema_id uuid REFERENCES public.dynamic_schemas(id) ON DELETE CASCADE NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ensure data is unique per barangay, year, and schema
ALTER TABLE public.dynamic_data ADD CONSTRAINT unique_dynamic_data UNIQUE (barangay_id, year, schema_id);

-- 3. Enable RLS
ALTER TABLE public.dynamic_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_data ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for dynamic_schemas (Everyone can view, only Superadmin can edit)
CREATE POLICY "Anyone can view dynamic schemas"
  ON public.dynamic_schemas FOR SELECT
  USING (true);

CREATE POLICY "Superadmins can insert dynamic schemas"
  ON public.dynamic_schemas FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Superadmins can update dynamic schemas"
  ON public.dynamic_schemas FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Superadmins can delete dynamic schemas"
  ON public.dynamic_schemas FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- 5. RLS Policies for dynamic_data (Same as other data entry tables)
CREATE POLICY "Anyone can view dynamic data"
  ON public.dynamic_data FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update dynamic data (approval system handles frontend restrictions)
CREATE POLICY "Authenticated users can insert dynamic data"
  ON public.dynamic_data FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update dynamic data"
  ON public.dynamic_data FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.dynamic_schemas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dynamic_data;
