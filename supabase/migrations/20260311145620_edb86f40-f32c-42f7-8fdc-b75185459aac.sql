CREATE OR REPLACE FUNCTION public.notify_on_inbound_whatsapp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      AND message LIKE '%' || NEW.contact_id::text || '%'
      AND created_at > now() - interval '5 minutes'
    LIMIT 1
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO client_notifications (user_id, organization_id, title, message, type, action_url)
  SELECT om.user_id, NEW.organization_id,
    'Nova mensagem WhatsApp',
    'Mensagem recebida de ' || COALESCE(NEW.contact_id::text, 'contato') || ': ' || left(COALESCE(NEW.content, ''), 80),
    'Chat', '/chat'
  FROM organization_memberships om
  WHERE om.organization_id = NEW.organization_id;

  RETURN NEW;
END;
$function$;