
# Correcoes no Chat: Imagens, Anexo e Performance

## Problema 1 -- Imagens nao aparecem

Em `ChatMessageBubble.tsx`, quando a mensagem tem `media_url`, o componente mostra apenas um placeholder cinza com icone generico (linhas 36-42). Ele nunca tenta renderizar a imagem real com `<img>`.

**Correcao**: Detectar o tipo de midia pelo URL/type e renderizar um `<img>` real quando for imagem, com fallback para o placeholder generico em caso de erro de carregamento.

## Problema 2 -- Botao de anexo nao funciona

Em `ChatConversation.tsx` linha 342-344, o botao `<Paperclip>` e apenas visual (`type="button"` sem `onClick`). Nao ha logica de upload conectada.

**Correcao**: Adicionar um `<input type="file" accept="image/*">` escondido, com ref. O clique no botao de Paperclip aciona o file input. Ao selecionar um arquivo, fazer upload para o Supabase Storage (bucket `chat-media`) e enviar a URL como mensagem com tipo `image`. Sera necessario criar o bucket via migracao SQL.

## Problema 3 -- Conversa grande fica bugada

O `ScrollArea` (linha 314) renderiza **todas** as mensagens de uma vez. Com centenas de mensagens, o DOM fica pesado e o scroll trava. Alem disso, o `useEffect` com `scrollIntoView` (linha 83) dispara a cada mudanca de `messages.length`, o que pode causar loops de re-render.

**Correcao**:
- Limitar a renderizacao inicial para as ultimas 100 mensagens, com botao "Carregar anteriores" no topo
- Melhorar o scroll para so rolar automaticamente se o usuario ja estiver proximo do final (evitar scroll forçado quando usuario esta lendo historico)
- Mover o `playSound` para fora do `useEffect` de scroll, evitando tocar som repetidamente

---

## Detalhes Tecnicos

### Migracao SQL -- Bucket de Storage
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Members can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view chat media"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');
```

### ChatMessageBubble.tsx
- Substituir o placeholder por `<img src={message.media_url}>` com `onError` fallback
- Detectar tipo (image, audio, video, document) via `message.type` ou extensao do URL
- Imagens: `<img>` com `object-cover`, clicavel para abrir em nova aba
- Outros tipos: manter placeholder com icone apropriado

### ChatConversation.tsx
- **Anexo funcional**: ref para `<input type="file">`, handler `handleFileUpload` que faz upload ao Supabase Storage e chama `sendMutation` com `type: "image"` e a URL publica
- **Performance**: estado `displayCount` (inicia em 100), slice das mensagens renderizadas, botao "Carregar anteriores" que incrementa `displayCount`
- **Scroll inteligente**: detectar se usuario esta no final antes de auto-scroll, usando `scrollHeight - scrollTop - clientHeight < 100`
- **Som de notificacao**: mover para um `useEffect` separado que so toca quando uma mensagem inbound **nova** aparece (comparar IDs, nao length)

### useWhatsApp.ts
- Adicionar parametro `mediaUrl` ao `useSendWhatsAppMessage` para enviar mensagens com midia

### Arquivos modificados

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar bucket `chat-media` + policies |
| `src/components/cliente/ChatMessageBubble.tsx` | Renderizar imagens reais com `<img>`, fallback |
| `src/components/cliente/ChatConversation.tsx` | Input de arquivo funcional, paginacao de mensagens, scroll inteligente |
| `src/hooks/useWhatsApp.ts` | Adicionar `mediaUrl` no `useSendWhatsAppMessage` |
