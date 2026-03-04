
# Espelhamento completo: fotos de perfil + preview de última mensagem

## Diagnóstico

1. **Mensagens históricas**: O endpoint `GET /chat-messages/{phone}` da Z-API retorna `"Does not work in multi device version"`. Isso é uma **limitação permanente da Z-API** para contas multi-device. Não é possível puxar mensagens antigas via API. Mensagens só são capturadas pelo webhook daqui pra frente.

2. **Fotos de perfil**: O sync usa `chat.imgUrl`, mas a resposta da Z-API retorna `profileThumbnail` — e o WhatsApp deleta essas URLs após 48h. A Z-API oferece o endpoint `GET /profile-picture?phone={phone}` que retorna a foto atualizada e permanente. Precisamos usá-lo.

3. **Preview da última mensagem**: O endpoint `/chats` não retorna o conteúdo da última mensagem, apenas o timestamp. Como não temos mensagens no banco (por causa da limitação multi-device), a lista de contatos aparece sem preview. Solução: durante o sync, salvar a última mensagem de cada contato usando os dados que a Z-API `/chats` já retorna (campo `lastMessage` se existir), ou marcar que o preview deve ser buscado via `/chat-messages` para apenas 1 mensagem por contato.

## Mudanças

### 1. Atualizar `whatsapp-sync-chats/index.ts` — fotos de perfil + última mensagem
- Usar `chat.profileThumbnail` além de `chat.imgUrl` como fallback para foto
- Para os **50 contatos mais recentes**, buscar a foto de perfil via `GET /profile-picture?phone={phone}` 
- Para cada contato, tentar buscar **1 mensagem** via `GET /chat-messages/{phone}?amount=1` e salvar no banco como preview (se o endpoint funcionar — tratar graciosamente se não)
- Limitar chamadas de API para evitar rate-limit (50 contatos com foto, não todos os 557)

### 2. Atualizar `whatsapp-load-history/index.ts` — fallback robusto
- Se o endpoint `chat-messages` falhar com "multi device", tentar endpoint alternativo `GET /get-messages-phone/{phone}` (formato diferente da Z-API para multi-device)
- Se ambos falharem, retornar `{ fallback: true }` sem erro para o usuário

### 3. Atualizar `ChatConversation.tsx` — UX para limitação
- Se o load-history retornar `fallback: true`, mostrar mensagem informativa "Mensagens anteriores à conexão não estão disponíveis. Novas mensagens aparecerão em tempo real."
- Remover botão "Buscar histórico" quando fallback confirmado

### Arquivos
- `supabase/functions/whatsapp-sync-chats/index.ts` — buscar fotos de perfil via API + foto fallback
- `supabase/functions/whatsapp-load-history/index.ts` — fallback robusto
- `src/components/cliente/ChatConversation.tsx` — UX informativa sobre limitação
