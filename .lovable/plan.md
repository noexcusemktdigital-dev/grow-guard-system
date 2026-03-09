

## Diagnóstico Completo

Após revisar a documentação completa da Z-API e todo o código, identifiquei **3 problemas críticos**:

### Problema 1: `chat-messages` NÃO funciona em Multi-Device
A documentação Z-API diz explicitamente: *"Este método não está disponível na versão Multi Device, pois o Z-API não armazena as mensagens."* Sua conta é Multi-Device (`originalDevice: "smba"`). Por isso o `load-history` sempre retorna **400** — é impossível buscar histórico por essa via.

**A única forma de obter mensagens no Multi-Device é via webhooks em tempo real.**

### Problema 2: Webhook não captura mensagens enviadas pelo celular
O setup atual configura `update-webhook-received`, que captura apenas mensagens **recebidas**. Para espelhar mensagens **enviadas pelo celular** (não pela API), é necessário usar `update-webhook-received-delivery`, que inclui a flag "enviadas por mim".

### Problema 3: Formato de telefone inconsistente para grupos
- `/chats` retorna: `120363254049865532-group`
- Webhook envia `chatId`: `120363254049865532@g.us`
- Código normaliza para `@g.us`

Resultado: contatos duplicados ou não encontrados durante upsert.

---

## Plano de Correção

### 1. Padronizar formato de grupo como `-group` (formato nativo Z-API)
Reverter a normalização para `@g.us` e usar o formato `-group` que é o retornado pelo `/chats`.

**Migration SQL:**
- Atualizar `whatsapp_contacts` para converter `@g.us` → `-group`
- Atualizar `whatsapp_messages` cujos contatos mudaram

### 2. Corrigir `whatsapp-setup` — usar `update-webhook-received-delivery`
Trocar `update-webhook-received` por `update-webhook-received-delivery` para capturar **todas** as mensagens, inclusive as enviadas pelo celular.

**Arquivo:** `supabase/functions/whatsapp-setup/index.ts` (linha 196)

### 3. Corrigir `whatsapp-webhook` — normalizar grupo para `-group`
Quando `isGroup=true` e `chatId` contém `@g.us`, converter para formato `-group`.

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts` (linhas 118-127)

### 4. Corrigir `whatsapp-sync-chats` — manter formato nativo `-group`
Remover a normalização que converte `-group` para `@g.us` (linhas 252-255).

**Arquivo:** `supabase/functions/whatsapp-sync-chats/index.ts`

### 5. Corrigir `whatsapp-send` — enviar formato correto para Z-API
Ao enviar para grupos, usar o formato `-group` (sem `@g.us`).

**Arquivo:** `supabase/functions/whatsapp-send/index.ts` (linha 192)

### 6. Remover auto-load de histórico do `ChatConversation`
Como `chat-messages` não funciona em Multi-Device, remover a chamada automática e o botão "carregar mais" que sempre falha. Exibir mensagem informativa quando não há histórico.

**Arquivo:** `src/components/cliente/ChatConversation.tsx` (linhas 217-269)

### 7. Ajustar frontend `useWhatsApp.ts` — detecção de grupo por `-group`
Atualizar a lógica de detecção de tipo de contato para usar `-group` ao invés de `@g.us`.

**Arquivo:** `src/hooks/useWhatsApp.ts`

### 8. Re-configurar webhooks automaticamente
Adicionar lógica no `check-status` para verificar e atualizar webhooks se necessário (garantir que `received-delivery` está configurado).

---

## Resultado Esperado

- Mensagens de **grupos e individuais** chegam em **tempo real** via webhook
- Mensagens enviadas pelo **celular** também são espelhadas
- Sem erros 400 de `load-history`
- Formato de telefone consistente em toda a base
- Interface exibe conversas com previews reais conforme mensagens chegam

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Normalizar phones `@g.us` → `-group` |
| `whatsapp-setup/index.ts` | `received` → `received-delivery` |
| `whatsapp-webhook/index.ts` | Normalizar `chatId @g.us` → `-group` |
| `whatsapp-sync-chats/index.ts` | Remover normalização `@g.us` |
| `whatsapp-send/index.ts` | Enviar formato correto para grupos |
| `ChatConversation.tsx` | Remover load-history automático |
| `useWhatsApp.ts` | Ajustar detecção de grupo |

