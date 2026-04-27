-- Restore instant CRM automation processing (per-event mode).
-- The previous immediate trigger was removed because it processed the whole queue
-- on every insert, causing worker saturation. The edge function now accepts an
-- explicit event_id and processes only that event, so we can re-enable real-time
-- dispatch safely.

CREATE OR REPLACE FUNCTION public.trigger_crm_automation_processor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Fire-and-forget call to the edge function with the SPECIFIC event id.
  -- The function will process only this event, keeping cost and latency low.
  PERFORM net.http_post(
    url := 'https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/crm-run-automations',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cmhkcGJieGZpcGVvcGR5eWduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDk5ODksImV4cCI6MjA4NzI4NTk4OX0.xtodJb3x9EqwZcmPUyeOiAMw57YeBDX4AKbbw4p-pS8"}'::jsonb,
    body := jsonb_build_object('triggered_by', 'queue_insert', 'event_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the queue insert because of an HTTP failure;
  -- the 5-minute cron will pick the event up as a fallback.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_automation_immediate ON public.crm_automation_queue;

CREATE TRIGGER trg_crm_automation_immediate
AFTER INSERT ON public.crm_automation_queue
FOR EACH ROW
EXECUTE FUNCTION public.trigger_crm_automation_processor();