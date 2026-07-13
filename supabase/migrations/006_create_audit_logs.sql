-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmin can view audit logs
DROP POLICY IF EXISTS "Superadmin can view all audit logs" ON public.audit_logs;
CREATE POLICY "Superadmin can view all audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_superadmin());

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    user_id UUID;
    old_row JSONB;
    new_row JSONB;
BEGIN
    -- Try to get the user ID making the change (from Supabase auth)
    user_id := auth.uid();
    
    IF TG_OP = 'INSERT' THEN
        new_row = row_to_json(NEW);
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, new_row, user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Check if row actually changed (excluding updated_at), to avoid logging empty bulk upserts
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for data entry tables and user_profiles
DROP TRIGGER IF EXISTS audit_user_profiles_trigger ON public.user_profiles;
CREATE TRIGGER audit_user_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();

DROP TRIGGER IF EXISTS audit_population_stats_trigger ON public.population_stats;
CREATE TRIGGER audit_population_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.population_stats
    FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();

DROP TRIGGER IF EXISTS audit_social_dev_stats_trigger ON public.social_dev_stats;
CREATE TRIGGER audit_social_dev_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.social_dev_stats
    FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();

DROP TRIGGER IF EXISTS audit_econ_dev_stats_trigger ON public.econ_dev_stats;
CREATE TRIGGER audit_econ_dev_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.econ_dev_stats
    FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();

DROP TRIGGER IF EXISTS audit_infra_stats_trigger ON public.infra_stats;
CREATE TRIGGER audit_infra_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.infra_stats
    FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();

DROP TRIGGER IF EXISTS audit_governance_stats_trigger ON public.governance_stats;
CREATE TRIGGER audit_governance_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.governance_stats
    FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();

DROP TRIGGER IF EXISTS audit_gad_stats_trigger ON public.gad_stats;
CREATE TRIGGER audit_gad_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.gad_stats
    FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();

-- Login tracking trigger function
CREATE OR REPLACE FUNCTION public.log_auth_login()
RETURNS TRIGGER AS $$
BEGIN
    -- If last_sign_in_at changed, it's a login
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, changed_by)
        VALUES ('auth.users', NEW.id::text, 'LOGIN', NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users for logins
DROP TRIGGER IF EXISTS audit_auth_users_login_trigger ON auth.users;
CREATE TRIGGER audit_auth_users_login_trigger
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.log_auth_login();
