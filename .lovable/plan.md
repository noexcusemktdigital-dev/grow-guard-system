

# Fix timestamps no whatsapp-sync-chats

## Diagnóstico
O código atual já tem `parseLastMessageTime` com suporte a número, string numérica, ISO e objeto `{_seconds}`. Porém o debug só loga as keys dos 3 primeiros chats — não loga o valor real dos campos de timestamp. O fallback `new Date().toISOString()` está sendo usado para todos os contatos, indicando que o campo `lastMessageTime` pode não existir ou vir em formato não tratado.

## Mudanças em `supabase/functions/whatsapp-sync-chats/index.ts`

### 1. Debug intensivo nos 5 primeiros chats
- Logar o **objeto completo** (JSON.stringify) dos 5 primeiros chats individuais (não só as keys)
- Logar explicitamente todos os campos candidatos: `lastMessageTime`, `lastMessageTimestamp`, `timestamp`, `t`, `lastMessage`, `lastInteraction`

### 2. Expandir detecção de campos de timestamp
- Adicionar campos: `chat.lastInteraction`, `chat.lastMessage?.timestamp`, `chat.lastActivity`
- Se `chat.lastMessage` for objeto, extrair `.timestamp` ou `.t` dele
- Cadeia de fallback completa: `lastMessageTime → lastMessageTimestamp → timestamp → t → lastInteraction → lastMessage.timestamp → lastActivity`

### 3. Expandir `parseLastMessageTime`
- Tratar booleano/null/undefined explicitamente (return null)
- Tratar string com formato `"DD/MM/YYYY HH:mm"` (comum em APIs BR)
- Ampliar range de validação para 2019-2030

### 4. Confirmar que NÃO há fases de fotos/mensagens
- O código atual já não tem essas fases (estão em `whatsapp-sync-photos` e `whatsapp-load-history`)
- Nenhuma remoção necessária

### 5. Adicionar preview da última mensagem
- Extrair `chat.lastMessage?.body` ou `chat.lastMessage?.content` ou `chat.lastMessageText` se existir
- Salvar em `last_message_preview` (coluna já existe na tabela)

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-sync-chats/index.ts` | Debug completo, mais campos de timestamp, salvar preview |

