

## Atualizar whatsapp-setup: Configurar todos os 6 webhooks Z-API

### Problema
Atualmente o `whatsapp-setup` configura apenas 3 webhooks:
- `update-webhook-received-delivery` (ao receber)
- `update-webhook-status` (status da mensagem)
- `update-webhook-send` (ao enviar)

Faltam 3:
- `update-webhook-chat-presence` (presença do chat / digitando)
- `update-webhook-disconnected` (ao desconectar)
- `update-webhook-connected` (ao conectar)

### Mudança

**`supabase/functions/whatsapp-setup/index.ts`** — Expandir o array `webhookEndpoints` (linha 195-198) de 3 para 6 endpoints:

```typescript
const webhookEndpoints = [
  "update-webhook-received-delivery",
  "update-webhook-status",
  "update-webhook-send",
  "update-webhook-chat-presence",
  "update-webhook-disconnected",
  "update-webhook-connected",
];
```

Todos usam a mesma URL (`whatsapp-webhook/{orgId}`) e o mesmo formato de body `{ value: webhookUrl }`. Nenhuma outra alteração necessária — o `whatsapp-webhook` já recebe o payload e identifica o tipo de evento pelo conteúdo.

### Impacto
- 1 arquivo editado, 3 linhas adicionadas
- Novas instâncias conectadas terão todos os 6 webhooks configurados automaticamente
- Instâncias já existentes precisam ser reconectadas (ou o usuário pode clicar "Verificar status" para re-trigger o setup)

