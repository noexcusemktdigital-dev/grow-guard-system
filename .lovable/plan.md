

## Problema

O `ai-agent-reply` gera a resposta da IA corretamente, mas na hora de **enviar a mensagem para o WhatsApp** (linhas 730-751), ele usa **sempre a API do Z-API** — hardcoded. Para instâncias Evolution API, a chamada falha silenciosamente (URL errada, autenticação errada), e a mensagem nunca chega ao WhatsApp.

O mesmo problema afeta o **typing indicator** (linha 735), que também usa Z-API hardcoded.

## Solução

Adicionar lógica multi-provedor no `ai-agent-reply/index.ts`, similar ao que já existe no `whatsapp-send/index.ts`:

### 1. Typing indicator — suportar Evolution
- Se `instance.provider === "evolution"`: não enviar typing (Evolution não tem endpoint nativo para isso), ou silenciar.
- Se Z-API: manter lógica atual.

### 2. Envio de mensagem — suportar Evolution
- Se `instance.provider === "evolution"`:
  - URL: `${instance.base_url}/message/sendText/${instance.instance_id}`
  - Headers: `{ apikey: instance.client_token }`
  - Body: `{ number: cleanPhone, text: cleanReply }`
  - Message ID no response: `apiData?.key?.id`
- Se Z-API (padrão atual): manter lógica existente.

### 3. Tratar grupos
- Para contatos com phone terminando em `-group`, converter para `@g.us` no envio Evolution.

### Arquivo alterado
- `supabase/functions/ai-agent-reply/index.ts` — linhas 730-761

