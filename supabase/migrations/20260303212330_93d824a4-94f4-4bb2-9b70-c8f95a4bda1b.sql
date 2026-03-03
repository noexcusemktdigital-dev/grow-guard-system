
-- 1. Trigger function: notify all org members on new CRM lead
CREATE OR REPLACE FUNCTION public.notify_on_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO client_notifications (user_id, organization_id, title, message, type, action_url)
  SELECT om.user_id, NEW.organization_id,
    'Novo lead: ' || NEW.name,
    'Lead adicionado via ' || coalesce(NEW.source, 'CRM'),
    'CRM', '/crm'
  FROM organization_memberships om
  WHERE om.organization_id = NEW.organization_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_crm_lead
  AFTER INSERT ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_lead();

-- 2. Trigger function: notify org members on inbound WhatsApp message (with 5min debounce)
CREATE OR REPLACE FUNCTION public.notify_on_inbound_whatsapp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only for inbound messages
  IF NEW.direction <> 'inbound' THEN
    RETURN NEW;
  END IF;

  -- Debounce: skip if there's an unread Chat notification for this contact in last 5 min
  IF EXISTS (
    SELECT 1 FROM client_notifications
    WHERE organization_id = NEW.organization_id
      AND type = 'Chat'
      AND is_read = false
      AND message LIKE '%' || NEW.contact_id || '%'
      AND created_at > now() - interval '5 minutes'
    LIMIT 1
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO client_notifications (user_id, organization_id, title, message, type, action_url)
  SELECT om.user_id, NEW.organization_id,
    'Nova mensagem WhatsApp',
    'Mensagem recebida de ' || coalesce(NEW.contact_id, 'contato') || ': ' || left(coalesce(NEW.content, ''), 80),
    'Chat', '/chat'
  FROM organization_memberships om
  WHERE om.organization_id = NEW.organization_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_inbound_whatsapp
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_inbound_whatsapp();

-- 3. Enable realtime on crm_leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;
