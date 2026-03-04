

# Espelho Total WhatsApp + Fix Número Z-API

## Problemas Identificados

### 1. Número antigo persiste
O auto check-status usa as credenciais do banco para chamar `/device` no Z-API. Se você trocou a instância Z-API (novo instance_id/token), precisa reconectar em Integrações primeiro — o check-status só consulta com as credenciais já salvas. Porém, se você trocou o **número** dentro da mesma instância Z-API, o problema é que o endpoint `/device` do Z-API pode estar cacheado. Vou adicionar um fallback usando o endpoint `/phone` do Z-API e também garantir que o auto-sync force uma atualização real.

### 2. Mensagens enviadas pelo celular não aparecem
O webhook Z-API recebe notificações de mensagens enviadas pelo celular (outbound), mas o código trata TUDO como `direction: "inbound"`. O campo `body.fromMe` indica se a mensagem foi enviada por você. Além disso, o webhook `update-webhook-send` precisa estar configurado no Z-API para receber notificações de mensagens enviadas.

## Solução

### 1. Webhook — Capturar mensagens outbound (`fromMe`)
Em `whatsapp-webhook/index.ts`:
- Detectar `body.fromMe === true` e salvar com `direction: "outbound"` e `status: "sent"`
- Não incrementar `unread_count` para mensagens outbound
- Não disparar `ai-agent-reply` para mensagens outbound

### 2. Setup — Configurar webhook de mensagens enviadas
Em `whatsapp-setup/index.ts`, na ação "connect":
- Adicionar chamada para `update-webhook-send` do Z-API (igual ao `update-webhook-received`), para que o Z-API envie notificações quando mensagens são enviadas pelo celular

### 3. Setup — Melhorar detecção do número (fallback)
Em `whatsapp-setup/index.ts`, no check-status:
- Adicionar fallback para endpoint `/phone/{phone}` ou usar `statusData.smartphoneConnected` + número do QR scan
- Logar mais detalhes para debug

### 4. UI — Exibir mensagens outbound no chat
O `ChatConversation` já renderiza baseado em `direction`, então mensagens outbound enviadas pelo celular aparecerão automaticamente como bolhas verdes (enviadas).

## Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/whatsapp-webhook/index.ts` | Detectar `fromMe` e salvar como outbound |
| `supabase/functions/whatsapp-setup/index.ts` | Configurar `update-webhook-send` + melhorar detecção de número |

