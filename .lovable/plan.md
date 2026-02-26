

## Corrigir audio nas Conversas

### Problema raiz

O Z-API envia mensagens de voz (notas de voz / push-to-talk) com o campo `ptt` no payload, nao `audio`. O webhook atual so verifica `body.audio`, entao mensagens de voz sao salvas como `type: "text"` sem conteudo e sem media_url — ficam invisiveis.

### Correcoes

**1. Webhook: `supabase/functions/whatsapp-webhook/index.ts`**

Linha 97 — adicionar deteccao de `ptt` (push-to-talk / nota de voz):

```typescript
const messageType = body.image ? "image" 
  : (body.audio || body.ptt) ? "audio" 
  : body.video ? "video" 
  : body.document ? "document" 
  : body.sticker ? "sticker"
  : "text";
```

Linha 98 — extrair URL do ptt:

```typescript
const mediaUrl = body.image?.imageUrl 
  || body.audio?.audioUrl 
  || body.ptt?.audioUrl || body.ptt?.pttUrl
  || body.video?.videoUrl 
  || body.document?.documentUrl 
  || null;
```

**2. ChatMessageBubble: `src/components/cliente/ChatMessageBubble.tsx`**

- Quando `message.type === "audio"` e `media_url` nao existe: mostrar um indicador visual "Audio nao disponivel" em vez de nada
- Estilizar o player de audio com visual WhatsApp (fundo arredondado, icone de microfone)
- Tambem tratar mensagens antigas que ja foram salvas sem media_url

**3. Mensagens existentes sem media_url**

Para mensagens de audio ja salvas incorretamente (sem `media_url`), verificar se o `metadata` contem `ptt.audioUrl` ou `ptt.pttUrl` e usar como fallback no componente.

### Arquivos alterados

1. `supabase/functions/whatsapp-webhook/index.ts` — adicionar deteccao ptt
2. `src/components/cliente/ChatMessageBubble.tsx` — fallback de audio via metadata + visual melhorado

