

## Implementação: Previews Reais nas Conversas

### Problema
Os previews no banco (`last_message_preview`) estão `null` para contatos antigos, então a UI mostra telefones em vez de mensagens reais como no WhatsApp.

### Solução

#### 1. Criar Função RPC no Supabase
Migration SQL que cria função otimizada para buscar última mensagem por contato:

```sql
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
```

#### 2. Hook `useContactPreviews` (`useWhatsApp.ts`)
Novo hook que chama a RPC e retorna `Map<contactId, preview>` formatado:
- Outbound: `"✓✓ Você: texto"` (read/delivered) ou `"✓ Você: texto"` (sent)
- Inbound: texto direto
- Mídia: ícones `"🎤 Áudio"`, `"📷 Foto"`, etc.

#### 3. Integrar em `ClienteChat.tsx`
Substituir `useMemo` que lê `last_message_preview` por:
```tsx
const contactIds = useMemo(() => contacts.map(c => c.id), [contacts]);
const { data: realPreviews } = useContactPreviews(contactIds);
```

Passar `realPreviews` para `<ChatContactList lastMessages={realPreviews} />`

#### 4. Atualizar `ChatContactItem.tsx`
Melhorar formatação visual:
- Negrito no "Você:" se for outbound
- Checkmarks (✓/✓✓) com cor verde
- Ícones de mídia coloridos
- Preview em cinza mais claro

#### 5. Backfill Migration (opcional)
SQL para popular previews de contatos existentes:
```sql
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
          WHEN m.status IN ('read', 'delivered') THEN '✓✓ Você: ' || LEFT(m.content, 80)
          ELSE '✓ Você: ' || LEFT(m.content, 80)
        END
      ELSE LEFT(m.content, 100)
    END
  FROM whatsapp_messages m
  WHERE m.contact_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 1
)
WHERE c.last_message_preview IS NULL;
```

### Arquivos Modificados
- Migration: Nova função RPC
- `src/hooks/useWhatsApp.ts`: +70 linhas (novo hook)
- `src/pages/cliente/ClienteChat.tsx`: ~10 linhas modificadas
- `src/components/cliente/ChatContactItem.tsx`: ~20 linhas (formatação)

### Resultado
Lista de conversas **idêntica ao WhatsApp**, com previews reais em tempo real, checkmarks de status e formatação visual completa.

