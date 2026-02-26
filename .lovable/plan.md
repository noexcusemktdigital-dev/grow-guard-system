

## Correcao: Audio nao sendo salvo no webhook

### Problema
Na linha 59 do `whatsapp-webhook/index.ts`, a condicao para detectar "status update" e:
```
body.status !== undefined && !body.text && !body.image
```

Mensagens de audio/PTT do Z-API chegam com `status: "RECEIVED"` mas sem `text` nem `image`. Resultado: o webhook acha que e uma atualizacao de status e retorna na linha 70 sem salvar a mensagem.

### Solucao
Expandir a condicao `isStatus` para tambem verificar que nao ha audio, ptt, video, document ou sticker:

**Arquivo**: `supabase/functions/whatsapp-webhook/index.ts` (linha 59)

De:
```js
const isStatus = body.status !== undefined && !body.text && !body.image;
```

Para:
```js
const isStatus = body.status !== undefined && !body.text && !body.image && !body.audio && !body.ptt && !body.video && !body.document && !body.sticker;
```

Tambem adicionar um `console.log` para debug do payload recebido, facilitando diagnostico futuro.

### Impacto
- Apenas 1 linha alterada no webhook
- Audios, videos, documentos e stickers que antes eram ignorados passarao a ser salvos corretamente
- O player de audio no `ChatMessageBubble.tsx` ja esta preparado para renderizar (o codigo ja existe)
