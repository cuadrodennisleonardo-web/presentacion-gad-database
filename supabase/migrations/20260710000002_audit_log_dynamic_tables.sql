-- Attach trigger to dynamic_data
DROP TRIGGER IF EXISTS audit_dynamic_data_changes ON public.dynamic_data;
CREATE TRIGGER audit_dynamic_data_changes
AFTER INSERT OR UPDATE OR DELETE ON public.dynamic_data
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Attach trigger to dynamic_schemas
DROP TRIGGER IF EXISTS audit_dynamic_schemas_changes ON public.dynamic_schemas;
CREATE TRIGGER audit_dynamic_schemas_changes
AFTER INSERT OR UPDATE OR DELETE ON public.dynamic_schemas
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
