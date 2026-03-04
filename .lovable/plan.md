

# Fase 2: UX WhatsApp — Emoji Picker, Auto-resize, Audio, Busca, Scroll-to-bottom, Reply/Quote

## Estado Atual
O `ChatConversation.tsx` (737 linhas) **já tem implementado**:
- Emoji picker com popover e 40 emojis comuns
- Auto-resize do textarea (até 120px)
- Scroll-to-bottom button (aparece quando > 300px do fundo)
- Busca dentro da conversa com highlight
- Upload de arquivos (imagens, vídeos, PDFs)

**Falta implementar**:
1. **Gravação de áudio** — botão de microfone quando texto vazio, usando `MediaRecorder` API
2. **Mensagens de resposta/quote** — swipe ou botão para responder, preview acima do input, envio com `quotedMessageId`

## Mudanças

### 1. Gravação de Áudio (`ChatConversation.tsx`)
- Quando `text` estiver vazio, trocar o botão **Send** por um botão **Mic**
- Ao pressionar Mic, iniciar gravação via `navigator.mediaDevices.getUserMedia({ audio: true })` + `MediaRecorder`
- Mostrar indicador de gravação (tempo + botão cancelar + botão enviar)
- Ao finalizar: upload do blob para `chat-media` bucket, enviar via `sendMutation` com `type: "audio"` e `mediaUrl`

### 2. Suporte a Reply/Quote (`ChatMessageBubble.tsx` + `ChatConversation.tsx`)
- Adicionar botão "Responder" (reply arrow) que aparece no hover de cada mensagem
- Ao clicar, setar `replyingTo` state no `ChatConversation` com a mensagem selecionada
- Mostrar preview da mensagem citada acima do input (nome + trecho do conteúdo)
- Ao enviar, incluir `metadata.quotedMessageId` no body do `whatsapp-send`
- No `ChatMessageBubble`, se `metadata.quotedMsg` ou `metadata.quotedMessageId` existir, renderizar bloco de citação acima do conteúdo

### 3. Atualizar `whatsapp-send/index.ts`
- Aceitar campo `mediaUrl` e `quotedMessageId` opcionais
- Se `mediaUrl` presente e tipo `audio`, usar endpoint Z-API `send-audio` ao invés de `send-text`
- Se `quotedMessageId` presente, incluir no body da Z-API como `messageId` para quote

### 4. Melhorias Extras no Emoji Picker
- Expandir de 40 para ~80 emojis organizados por categoria (carinhas, mãos, objetos)
- Adicionar abas simples no popover

### Arquivos
| Arquivo | Mudança |
|---------|---------|
| `src/components/cliente/ChatConversation.tsx` | Gravação de áudio, reply state, preview de citação no input |
| `src/components/cliente/ChatMessageBubble.tsx` | Botão responder no hover, renderizar bloco de citação |
| `supabase/functions/whatsapp-send/index.ts` | Suporte a `mediaUrl`, `quotedMessageId`, endpoint `send-audio` |
| `src/hooks/useWhatsApp.ts` | Adicionar `quotedMessageId` ao tipo do mutation |

