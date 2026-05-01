CREATE OR REPLACE FUNCTION public._chunked_delete_old_automation_logs(_days int DEFAULT 30, _chunk int DEFAULT 200000, _max_iters int DEFAULT 5)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted bigint := 1;
  v_total bigint := 0;
  v_iter int := 0;
BEGIN
  WHILE v_deleted > 0 AND v_iter < _max_iters LOOP
    DELETE FROM public.automation_execution_logs
    WHERE ctid IN (
      SELECT ctid FROM public.automation_execution_logs
      WHERE created_at < now() - (_days || ' days')::interval
      LIMIT _chunk
    );
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_total := v_total + v_deleted;
    v_iter := v_iter + 1;
  END LOOP;
  RETURN v_total;
END;
$$;