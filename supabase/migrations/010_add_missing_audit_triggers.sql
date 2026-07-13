-- 010_add_missing_audit_triggers.sql

-- Add audit trigger for data_approvals table
DROP TRIGGER IF EXISTS audit_data_approvals_trigger ON public.data_approvals;
CREATE TRIGGER audit_data_approvals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.data_approvals
    FOR EACH ROW EXECUTE PROCEDURE public.log_audit_event();
