

# Analise profunda: Ajustes e otimizacoes do Chat WhatsApp

## Problemas identificados

### 1. Timestamps falsos — ordenacao cronologica incorreta
Todos os 557 contatos tem `last_message_at` entre `23:12:44` e `23:12:48` (mesmo segundo). A funcao `parseLastMessageTime` esta caindo no fallback `new Date().toISOString()` para todos os contatos. O campo `lastMessageTime` da Z-API provavelmente vem em um formato que nao esta sendo detectado (ex: string ISO, objeto, ou campo com nome diferente como `lastMessageTimestamp`). O sync precisa logar o valor bruto para debug e tratar mais formatos.

### 2. Fotos de perfil nao carregando
Apenas 1 de 557 contatos tem foto. O sync tenta buscar fotos para 50 contatos, mas a edge function provavelmente esta dando timeout (60s default) antes de completar as 3 fases (contatos + fotos + mensagens). 50 requests sequenciais x 100ms delay = 5s minimo, mais o tempo de cada request.

### 3. Mensagens historicas nao carregam
O `whatsapp-load-history` tem 0 logs — nunca foi chamado. O auto-load no `ChatConversation` depende de `messages.length === 0`, mas a condicao pode nao estar sendo atingida corretamente, ou o `instanceId` nao esta sendo passado.

### 4. Edge function timeout
A sync-chats tenta fazer 557 upserts + 50 profile-picture requests + 50 chat-messages requests em uma unica execucao. Isso excede o timeout de 60s do Deno.

### 5. Preview de mensagens vazio
O fetch de previews no `ClienteChat` busca do banco `whatsapp_messages`, mas como nenhuma mensagem foi importada, todas as previews ficam vazias.

### 6. UX gaps para espelhamento completo

- Sem indicador de digitando (typing)
- Sem emoji picker
- Sem gravacao de audio
- Textarea nao cresce automaticamente
- Sem suporte a mensagens de resposta/quote
- Sem busca dentro da conversa
- Sem contagem real de nao lidas (sync nao preserva)
- LeadPanel nao mostra foto do contato
- Sem scroll infinito para cima (carregar mensagens antigas)

---

## Plano de correcoes (por prioridade)

### Fase 1 — Corrigir o que ja existe (critico)

#### 1.1 Fix `whatsapp-sync-chats` — separar em fases e corrigir timestamps
- **Logar o valor bruto** de `lastMessageTime` para os primeiros 5 contatos (debug)
- Tratar `lastMessageTime` como: numero (s ou ms), string ISO, string numerica, objeto `{_seconds}`
- **Remover fases 2 e 3** (fotos e mensagens) da sync para evitar timeout — mover para funcoes separadas
- Resultado: sync rapida (contatos + timestamps corretos em <30s)

#### 1.2 Nova edge function `whatsapp-sync-photos`
- Recebe `limit` (default 30) e busca fotos via `GET /profile-picture` apenas para contatos sem foto
- Chamada separada do sync, com botao proprio ou automatica apos sync
- Rate-limit: 200ms entre requests

#### 1.3 Fix auto-load de historico no `ChatConversation`
- Verificar que `instanceId` esta sendo passado corretamente (no `ClienteChat` ja passa `instance?.instance_id`)
- Adicionar log no useEffect para confirmar que o auto-load dispara
- Fazer o load-history usar a instance_id da instancia do DB (nao o instance_id Z-API) — verificar mismatch

#### 1.4 Preview de mensagens no contact list
- Em vez de buscar previews do banco (que esta vazio), usar o campo `lastMessage` da resposta Z-API `/chats` durante o sync
- Adicionar coluna `last_message_preview` na tabela `whatsapp_contacts` (migration)
- Popular durante o sync com o conteudo da ultima mensagem do Z-API

### Fase 2 — UX e experiencia WhatsApp

#### 2.1 Emoji picker
- Adicionar botao de emoji ao lado do input com popover simples de emojis comuns
- Usar lista estatica de ~50 emojis mais usados (sem lib externa)

#### 2.2 Auto-resize do textarea
- O textarea atual nao cresce. Adicionar `onInput` handler que ajusta `height` baseado no `scrollHeight`

#### 2.3 Gravacao de audio
- Botao de microfone que aparece quando o campo de texto esta vazio (como no WhatsApp)
- Usar `MediaRecorder` API para gravar, fazer upload para `chat-media` bucket, enviar como tipo `audio`

#### 2.4 Busca dentro da conversa
- Botao de lupa no header da conversa
- Filtro local nos `messages` por `content.includes(search)`
- Highlight do termo encontrado e scroll ate a mensagem

#### 2.5 Mensagens de resposta (quote/reply)
- Ao clicar "Responder" em uma mensagem, mostrar preview da mensagem original acima do input
- Enviar com `metadata.quotedMessageId` para a Z-API

#### 2.6 Scroll to bottom button
- Botao flutuante "↓" quando o usuario rolar para cima, com badge de novas mensagens

### Fase 3 — Integracao avancada

#### 3.1 Typing indicator
- Usar endpoint Z-API `POST /typing` quando usuario comeca a digitar
- Usar webhook event `typing` para mostrar "digitando..." do contato

#### 3.2 Marcar como lido no WhatsApp
- Ao abrir conversa, chamar Z-API `POST /read-message` para sincronizar status de leitura

#### 3.3 Contagem real de nao lidas
- O sync deve preservar `unread_count` do Z-API em vez de sobrescrever com 0
- O webhook ja incrementa corretamente

---

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/whatsapp-sync-chats/index.ts` | Remover fases 2-3, fix timestamps, salvar preview |
| `supabase/functions/whatsapp-sync-photos/index.ts` | **NOVO** — busca fotos separadamente |
| `supabase/functions/whatsapp-load-history/index.ts` | Ajustes menores de log |
| `src/components/cliente/ChatConversation.tsx` | Auto-resize textarea, emoji picker, scroll-to-bottom, busca, reply |
| `src/components/cliente/ChatContactItem.tsx` | Usar `last_message_preview` do contato |
| `src/components/cliente/ChatMessageBubble.tsx` | Suporte a quote/reply |
| `src/pages/cliente/ClienteChat.tsx` | Chamar sync-photos apos sync, fix preview source |
| `src/hooks/useWhatsApp.ts` | Adicionar campo `last_message_preview` ao tipo |
| Migration SQL | Adicionar coluna `last_message_preview` em `whatsapp_contacts` |

## Recomendacao de implementacao

Implementar na ordem: **1.1 → 1.4 → 1.3 → 1.2 → 2.2 → 2.6 → 2.1 → 2.4 → 2.3 → 2.5 → 3.x**

As correcoes da Fase 1 resolvem os problemas criticos (ordem, preview, fotos, mensagens). A Fase 2 melhora a UX para parecer com o WhatsApp real. A Fase 3 e opcional e pode ser feita depois.

