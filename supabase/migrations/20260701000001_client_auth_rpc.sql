-- Provide a safe RPC function for the frontend to log auth events
CREATE OR REPLACE FUNCTION public.log_client_auth_event(event_type text, device_info jsonb)
RETURNS void AS $$
BEGIN
    -- Only allow LOGIN and LOGOUT
    IF event_type NOT IN ('LOGIN', 'LOGOUT') THEN
        RAISE EXCEPTION 'Invalid auth event type';
    END IF;

    -- auth.uid() gives the user ID making the RPC call
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, new_data)
        VALUES ('auth.users', auth.uid()::text, event_type, auth.uid(), device_info);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
