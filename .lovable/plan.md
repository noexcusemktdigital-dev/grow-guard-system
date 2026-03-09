

## Problema Identificado

Os contatos no banco de dados têm `last_message_preview` como `null`, causando a lista mostrar apenas telefones em vez dos textos das mensagens reais. O campo está vazio porque:
1. Contatos criados antes da atualização do webhook não têm preview
2. O sync só atualiza preview se ele não existir E se a Z-API fornecer texto na resposta
3. A Z-API nem sempre retorna o texto completo das mensagens no endpoint `/chats`

## Solução: Buscar Última Mensagem Real de Cada Contato

### 1. Criar Hook Otimizado para Previews (`useWhatsApp.ts`)

Adicionar função `useContactPreviews` que:
- Faz query JOIN entre `whatsapp_contacts` e `whatsapp_messages` 
- Usa `DISTINCT ON (contact_id)` para pegar apenas a última mensagem de cada contato
- Retorna mapa `contactId → preview formatado` em memória
- Formata preview igual WhatsApp:
  - Mensagens enviadas: "Você: {texto}" ou "✓✓ Você: {texto}" se lida
  - Mensagens recebidas: texto direto
  - Mídia: "📷 Foto", "🎤 Áudio", "📄 Documento", "📹 Vídeo"
  - Trunca em 100 caracteres

Query SQL proposta:
```sql
SELECT DISTINCT ON (contact_id) 
  contact_id,
  content,
  type,
  direction,
  status,
  created_at
FROM whatsapp_messages
WHERE organization_id = $1
  AND contact_id = ANY($2)
ORDER BY contact_id, created_at DESC
```

### 2. Integrar no `ClienteChat.tsx`

- Remover o `useMemo` atual que lê `last_message_preview` da tabela de contatos
- Chamar o novo `useContactPreviews(contactIds)` para buscar mensagens reais
- Passar o mapa retornado para `ChatContactList`

### 3. Atualizar `ChatContactItem.tsx`

- Adicionar lógica de formatação visual:
  - Checkmarks (✓ sent, ✓✓ delivered/read) para mensagens enviadas
  - Prefixo "Você:" em bold para outbound
  - Ícones de mídia com cor
  - Texto em cinza mais claro para preview

### 4. Backfill Automático (opcional, mas recomendado)

Criar migration SQL que popula `last_message_preview` para todos os contatos existentes baseado na última mensagem real:
```sql
UPDATE whatsapp_contacts c
SET last_message_preview = (
  SELECT 
    CASE 
      WHEN m.type = 'audio' THEN '🎤 Áudio'
      WHEN m.type = 'image' THEN '📷 Foto'
      WHEN m.type = 'video' THEN '📹 Vídeo'
      WHEN m.type = 'document' THEN '📄 Documento'
      WHEN m.direction = 'outbound' THEN '✓ Você: ' || LEFT(m.content, 80)
      ELSE LEFT(m.content, 100)
    END
  FROM whatsapp_messages m
  WHERE m.contact_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 1
)
WHERE c.last_message_preview IS NULL;
```

### 5. Atualizar Webhook para Sempre Salvar Preview

No `whatsapp-webhook/index.ts`, garantir que o preview seja SEMPRE atualizado, não apenas quando vazio.

---

## Resumo Técnico

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useWhatsApp.ts` | Adicionar `useContactPreviews()` que faz query JOIN otimizada |
| `src/pages/cliente/ClienteChat.tsx` | Substituir lógica de `lastMessages` para usar novo hook |
| `src/components/cliente/ChatContactItem.tsx` | Melhorar formatação de preview (checkmarks, ícones, "Você:") |
| `supabase/functions/whatsapp-webhook/index.ts` | Sempre atualizar preview (remover check `!existing.last_message_preview`) |
| Migration SQL | Backfill de previews para contatos existentes |

**Resultado**: Lista de conversas idêntica ao WhatsApp real, com textos atualizados em tempo real e formatação visual completa.

