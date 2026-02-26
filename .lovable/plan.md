

## Corrigir Transcrição de Áudio dos Agentes de IA

### Problema
A transcrição de áudio não funciona porque o código atual envia apenas a URL do áudio como texto para o modelo de IA (`"Transcreva este áudio: https://..."`) . O modelo não consegue acessar URLs externas -- ele precisa receber o conteúdo do áudio diretamente como dados binários (base64).

### Solução

**Arquivo**: `supabase/functions/ai-agent-reply/index.ts` (bloco de transcrição, linhas 241-265)

Modificar o fluxo de transcrição para:

1. **Baixar o arquivo de áudio** da URL usando `fetch`
2. **Converter para base64** usando `btoa` ou equivalente Deno
3. **Enviar como conteúdo multimodal** para o Gemini usando o formato de mensagem com `image_url` (que no Gemini suporta áudio também) ou content parts com tipo `audio`

O formato correto para enviar áudio ao Gemini via a API de chat completions compatível com OpenAI:

```typescript
// 1. Baixar o áudio
const audioResponse = await fetch(audioUrl);
const audioBuffer = await audioResponse.arrayBuffer();
const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

// 2. Detectar MIME type
const contentType = audioResponse.headers.get("content-type") || "audio/ogg";

// 3. Enviar como multimodal
const transcribeRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: "Transcreva o áudio. Retorne apenas o texto transcrito." },
      { role: "user", content: [
        { type: "input_audio", input_audio: { data: audioBase64, format: "ogg" } }
      ]}
    ],
  }),
});
```

Caso o formato `input_audio` nao funcione com o gateway, usaremos o fallback com `image_url` com data URI (que o Gemini aceita para áudio):

```typescript
{ type: "image_url", image_url: { url: `data:${contentType};base64,${audioBase64}` } }
```

Tambem adicionaremos logs de debug (`console.log`) para confirmar que o áudio foi baixado e o resultado da transcrição.

### Impacto
- 1 arquivo alterado (`ai-agent-reply/index.ts`)
- O agente passara a realmente ouvir e entender os áudios recebidos
- Funcao sera redeployada automaticamente
