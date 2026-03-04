

# Corrigir ordenação cronológica e sincronização real do WhatsApp

## Problema
Os contatos sincronizados estão com `last_message_at` em `1970-01-01` (epoch 0) porque o campo `lastMessageTime` da Z-API pode estar em milissegundos (não segundos), ou vazio. Isso quebra a ordenação cronológica. Além disso, o `unread_count` de contatos existentes não é atualizado durante o sync.

## Mudanças

### 1. Corrigir `whatsapp-sync-chats/index.ts`
- Detectar se `lastMessageTime` é em segundos ou milissegundos (se > 10 dígitos, já é ms)
- Atualizar `unread_count` dos contatos existentes durante o sync
- Usar a ordem original da Z-API (que já vem por recência) para definir `last_message_at` correto
- Para contatos sem `lastMessageTime`, usar `now()` ao invés de epoch

### 2. Corrigir `useWhatsApp.ts` — query de contatos
- Remover o filtro que exclui contatos com datas epoch (eles devem aparecer, só no final)
- Garantir que a query não tem limite de 1000 rows (contatos com muitos registros)

### 3. Atualizar `ClienteChat.tsx` — preview de mensagens
- O fetch de previews usa `limit` baseado em `contacts.length * 2`, que pode não cobrir todos os contatos
- Aumentar para buscar previews corretamente

### Arquivos
- `supabase/functions/whatsapp-sync-chats/index.ts` — fix timestamp parsing + unread_count update
- `src/hooks/useWhatsApp.ts` — ajuste menor se necessário
- `src/pages/cliente/ClienteChat.tsx` — fix preview fetch limit

