-- Create function to get last message for each contact (optimized query)
CREATE OR REPLACE FUNCTION public.get_contact_last_messages(
  p_org_id uuid,
  p_contact_ids uuid[]
)
RETURNS TABLE(
  contact_id uuid,
  content text,
  type text,
  direction text,
  status text,
  created_at timestamptz
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (m.contact_id)
    m.contact_id,
    m.content,
    m.type,
    m.direction,
    m.status,
    m.created_at
  FROM whatsapp_messages m
  WHERE m.organization_id = p_org_id
    AND m.contact_id = ANY(p_contact_ids)
  ORDER BY m.contact_id, m.created_at DESC;
$$;

-- Backfill last_message_preview for existing contacts
UPDATE whatsapp_contacts c
SET last_message_preview = (
  SELECT 
    CASE 
      WHEN m.type = 'audio' THEN '🎤 Áudio'
      WHEN m.type = 'image' THEN '📷 Foto'
      WHEN m.type = 'video' THEN '📹 Vídeo'
      WHEN m.type = 'document' THEN '📄 Documento'
      WHEN m.direction = 'outbound' THEN 
        CASE 
          WHEN m.status IN ('read', 'delivered') THEN '✓✓ Você: ' || LEFT(COALESCE(m.content, ''), 80)
          ELSE '✓ Você: ' || LEFT(COALESCE(m.content, ''), 80)
        END
      ELSE LEFT(COALESCE(m.content, ''), 100)
    END
  FROM whatsapp_messages m
  WHERE m.contact_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 1
)
WHERE c.last_message_preview IS NULL;