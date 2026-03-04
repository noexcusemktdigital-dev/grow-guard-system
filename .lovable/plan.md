

# Fase 3: Integração Avançada WhatsApp

## Escopo

Três funcionalidades avançadas para completar a experiência de espelhamento WhatsApp:

1. **Typing indicator** — mostrar "digitando..." do contato e enviar typing quando o usuario digita
2. **Marcar como lido no WhatsApp** — ao abrir conversa, chamar Z-API para sincronizar status de leitura
3. **Contagem real de nao lidas** — preservar unread_count do Z-API durante sync

---

## Mudancas

### 3.1 Typing Indicator

**Webhook (`whatsapp-webhook/index.ts`)**:
- Detectar evento de typing do Z-API (campo `type: "typing"` ou `chatstate`)
- Em vez de salvar no banco, inserir em um canal Realtime (broadcast) com `{ phone, isTyping: true/false }`
- Nao salvar como mensagem — apenas broadcast efemero

**Frontend (`ChatConversation.tsx`)**:
- Subscribir ao canal `whatsapp-typing-{orgId}` via Realtime broadcast
- Quando receber typing do contato atualmente aberto, mostrar indicador "digitando..."
- Auto-dismiss apos 5 segundos sem update
- Ao usuario digitar, chamar debounced (1.5s) o endpoint Z-API `POST /typing` via nova edge function

**Nova edge function `whatsapp-typing/index.ts`**:
- Recebe `{ contactPhone }`, busca instancia conectada, chama `POST /typing` na Z-API
- Lightweight, sem persistencia

### 3.2 Marcar como lido no WhatsApp

**Frontend (`ChatConversation.tsx`)**:
- Quando usuario abre conversa (no useEffect de contact change), chamar `whatsapp-send` com nova action `read` ou criar endpoint dedicado
- Usar endpoint Z-API `POST /read-message` com o messageId da ultima mensagem inbound

**Edge function `whatsapp-send/index.ts`** (ou nova `whatsapp-read`):
- Adicionar action type `read` que chama `POST /read-message` da Z-API
- Sem salvar mensagem no banco — apenas sincroniza o status de leitura

### 3.3 Contagem real de nao lidas no sync

**`whatsapp-sync-chats/index.ts`**:
- Extrair `chat.unreadCount` ou `chat.unreadMessages` da resposta Z-API
- Usar esse valor no upsert em vez de `0`
- Apenas atualizar se o contato nao tem `unread_count` ja maior (para nao sobrescrever incrementos do webhook)

---

## Arquivos

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/whatsapp-webhook/index.ts` | Detectar typing events, broadcast via Realtime |
| `supabase/functions/whatsapp-typing/index.ts` | **NOVO** — envia typing para Z-API |
| `supabase/functions/whatsapp-send/index.ts` | Adicionar action `read` para marcar lido |
| `supabase/functions/whatsapp-sync-chats/index.ts` | Preservar unread_count do Z-API |
| `src/components/cliente/ChatConversation.tsx` | Subscribe typing broadcast, debounced send typing, chamar read on open |
| `src/hooks/useWhatsApp.ts` | Hook para send typing (debounced) |

