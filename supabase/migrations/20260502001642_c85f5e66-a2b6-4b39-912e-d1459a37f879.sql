-- Function: notifies via edge function when first GPS approved
CREATE OR REPLACE FUNCTION public.notify_gps_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_key text;
  v_already_approved boolean;
BEGIN
  -- Only on transitions INTO approved
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Check if there is any OTHER previously-approved strategy for the same org
    SELECT EXISTS (
      SELECT 1 FROM public.marketing_strategies
      WHERE organization_id = NEW.organization_id
        AND id <> NEW.id
        AND status = 'approved'
    ) INTO v_already_approved;

    -- Only fire for the FIRST approval per org
    IF NOT v_already_approved THEN
      -- Look up project URL/key from app settings (set by infra)
      BEGIN
        v_url := current_setting('app.supabase_url', true);
        v_key := current_setting('app.service_role_key', true);
      EXCEPTION WHEN OTHERS THEN
        v_url := NULL;
      END;

      IF v_url IS NOT NULL AND v_key IS NOT NULL THEN
        PERFORM net.http_post(
          url := v_url || '/functions/v1/send-gps-completed',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_key
          ),
          body := jsonb_build_object(
            'strategy_id', NEW.id,
            'organization_id', NEW.organization_id
          )
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_gps_completed ON public.marketing_strategies;
CREATE TRIGGER trg_notify_gps_completed
AFTER UPDATE OF status ON public.marketing_strategies
FOR EACH ROW
EXECUTE FUNCTION public.notify_gps_completed();