

# Melhorias no Chat Interno da Matriz

## Problemas Atuais Identificados
1. **Sem confirmação de leitura** -- Apenas `last_read_at` por membro, mas nenhuma UI mostra quem visualizou
2. **Imagem + texto separados** -- Ao enviar imagem, não é possível adicionar legenda/texto junto
3. **Input básico** -- Sem emoji picker, sem textarea multi-linha, sem indicador de digitação
4. **Sem resposta a mensagens** -- Não há reply/quote
5. **Sem reações** -- Não há como reagir a mensagens com emoji

## Alterações Planejadas

### 1. Migração de Banco -- Adicionar tabela de reações e coluna de reply
- Criar tabela `team_chat_reactions` (message_id, user_id, emoji, created_at)
- Adicionar coluna `reply_to_id` na `team_chat_messages` (referência à mensagem original)
- RLS: membros do canal podem ler/inserir/deletar suas reações
- Habilitar realtime na tabela de reações

### 2. Confirmação de Leitura (Read Receipts)
- Na UI da conversa, mostrar abaixo das mensagens enviadas por mim: "Visto por X, Y" ou "Visto por todos"
- Usar os dados de `last_read_at` já existentes em `team_chat_members` -- comparar com `created_at` da mensagem
- Passar a lista de membros do canal + seus `last_read_at` para o componente de conversa
- Exibir ícone de check duplo (azul se todos viram, cinza se não)

### 3. Envio de Imagem com Legenda
- Ao selecionar um arquivo de imagem, mostrar preview + campo de texto para legenda
- Na hora de enviar, passar `content` (legenda) junto com `fileUrl` e `fileName`
- O hook `sendMessage` já suporta `content + fileUrl` simultâneo
- O render já exibe `msg.content` abaixo da imagem -- funciona, mas o fluxo de envio não permite digitar texto quando há arquivo pendente

### 4. Responder Mensagens (Reply)
- Adicionar estado `replyingTo` no componente de conversa
- Ao clicar em "Responder" no hover de uma mensagem, preencher o estado
- Mostrar preview da mensagem original acima do input (estilo WhatsApp)
- Salvar `reply_to_id` na mensagem enviada
- Na renderização, mostrar a mensagem citada dentro do balão

### 5. Reações com Emoji
- No hover de mensagens, mostrar botão de reação (emoji rápido)
- Clicar abre um mini picker com emojis populares (👍❤️😂🔥✅)
- Reações salvas na tabela `team_chat_reactions`
- Renderizar abaixo do balão da mensagem como badges clicáveis

### 6. Emoji Picker no Input
- Adicionar botão de emoji no input (reutilizar o padrão do `ChatConversationInput`)
- Trocar `Input` por `textarea` com auto-resize para mensagens multi-linha

### 7. Indicador de Digitação (Typing Indicator)
- Usar Supabase Realtime Presence para broadcast de estado "typing"
- Mostrar "Fulano está digitando..." abaixo das mensagens

## Arquivos Modificados
- **Nova migração SQL** -- tabela `team_chat_reactions`, coluna `reply_to_id`
- **`src/hooks/useTeamChat.ts`** -- adicionar queries de reações, mutation de reação, typing broadcast, passar memberships para a conversa
- **`src/components/teamchat/TeamChatConversation.tsx`** -- reescrever com: emoji picker, textarea, reply preview, read receipts, reações, typing indicator, legenda em imagens
- **`src/pages/franqueadora/FranqueadoraChat.tsx`** -- passar novos props (memberships/reações)

## Ordem de Execução
1. Migração SQL (reações + reply_to_id)
2. Atualizar hook `useTeamChat` (reações, typing, read receipt data)
3. Reescrever `TeamChatConversation` com todas as melhorias
4. Atualizar `FranqueadoraChat` para integrar os novos recursos

