

## Correção da Integração Evolution API v1

### Problema Identificado
O código atual usa formatos de payload incorretos para a Evolution API v1. Os endpoints estão certos, mas os bodies estão errados.

### Correções Necessárias

#### 1. `supabase/functions/whatsapp-send/index.ts` — Body format incorreto

**sendText** (linha ~186-190): O body atual envia `{ number: remoteJid, text: message }`.
O correto na v1 é:
```json
{
  "number": "5531982968010",
  "textMessage": { "text": "mensagem" }
}
```
- `number` deve ser telefone limpo (sem `@s.whatsapp.net`), não o remoteJid
- O texto vai dentro de `textMessage.text`, não em `text` diretamente

**sendMedia** (linha ~175-184): O body atual envia `{ number: remoteJid, mediatype, media, caption }`.
O correto na v1 é:
```json
{
  "number": "5531982968010",
  "mediaMessage": {
    "mediaType": "image",
    "media": "url",
    "caption": "texto"
  }
}
```
- `number` é telefone limpo
- Mídia vai dentro de `mediaMessage` object

#### 2. `supabase/functions/evolution-webhook/index.ts` — Validar formato do webhook payload

O webhook da Evolution v1 envia o payload com campos como `event`, `data`, `instance`. O código atual parece correto na estrutura geral, mas precisa garantir que:
- O campo `instance` do payload é mapeado corretamente
- O formato de mensagem `key.remoteJid`, `message.conversation`, `message.extendedTextMessage.text` está sendo lido corretamente (isso já está certo no código atual)

#### 3. `supabase/functions/whatsapp-setup/index.ts` — Webhook endpoint

O setup configura webhook via `POST /webhook/set/{instanceName}`. O formato correto na v1 é:
```json
{
  "url": "webhookUrl",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE", "QRCODE_UPDATED"]
}
```
Isso já está correto no código atual. Apenas verificar que `enabled` não é necessário no set (é inferido).

### Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `whatsapp-send/index.ts` | Corrigir body do sendText para `{ number, textMessage: { text } }` e sendMedia para `{ number, mediaMessage: { mediaType, media, caption } }`. Usar telefone limpo ao invés de remoteJid no campo `number`. |
| `evolution-webhook/index.ts` | Pequenos ajustes se necessário no mapeamento de payload |
| `whatsapp-setup/index.ts` | Sem mudanças necessárias (já está correto) |

### Impacto
- Apenas as Edge Functions de envio são corrigidas
- Nenhuma mudança no frontend
- Nenhuma mudança no banco de dados

