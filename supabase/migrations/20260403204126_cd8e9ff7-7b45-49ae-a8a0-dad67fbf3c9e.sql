CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _record_id       UUID;
  _organization_id UUID;
  _changed_fields  TEXT[];
  _old             JSONB;
  _new             JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _old := to_jsonb(OLD);
    _record_id := (_old ->> 'id')::UUID;
    _organization_id := (_old ->> 'organization_id')::UUID;
  ELSE
    _new := to_jsonb(NEW);
    _record_id := (_new ->> 'id')::UUID;
    _organization_id := (_new ->> 'organization_id')::UUID;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    _old := to_jsonb(OLD);
    SELECT array_agg(key)
    INTO _changed_fields
    FROM jsonb_each(_new) AS n(key, val)
    WHERE n.val IS DISTINCT FROM (_old -> key);
  END IF;

  INSERT INTO public.audit_logs
    (table_name, operation, record_id, organization_id, user_id, old_data, new_data, changed_fields)
  VALUES
    (TG_TABLE_NAME, TG_OP, _record_id, _organization_id, auth.uid(), _old, _new, _changed_fields);

  RETURN NULL;
END;
$$;