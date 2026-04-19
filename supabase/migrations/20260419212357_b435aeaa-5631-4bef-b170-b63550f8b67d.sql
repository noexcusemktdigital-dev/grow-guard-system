-- Trigger imediato: ao inserir evento na fila, chama a função de processamento
CREATE OR REPLACE FUNCTION public.trigger_crm_automation_processor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Dispara a edge function de forma assíncrona (fire-and-forget)
  PERFORM net.http_post(
    url := 'https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/crm-run-automations',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cmhkcGJieGZpcGVvcGR5eWduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDk5ODksImV4cCI6MjA4NzI4NTk4OX0.xtodJb3x9EqwZcmPUyeOiAMw57YeBDX4AKbbw4p-pS8"}'::jsonb,
    body := jsonb_build_object('triggered_by', 'queue_insert', 'event_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca bloquear o insert da fila por causa de falha no http
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_automation_immediate ON public.crm_automation_queue;

CREATE TRIGGER trg_crm_automation_immediate
AFTER INSERT ON public.crm_automation_queue
FOR EACH ROW
EXECUTE FUNCTION public.trigger_crm_automation_processor();