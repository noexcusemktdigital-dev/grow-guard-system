

# Conversas WhatsApp Web — Overhaul Completo

## Resumo

Transformar a ferramenta "Conversas" em um espelho fiel do WhatsApp Web, corrigindo bugs existentes, adicionando estados de mensagem (sending/failed), optimistic UI, retry automático, scroll inteligente com botão "novas mensagens", separadores de data, link preview, virtualização de lista e persistência local.

## Fase 1 — Estados de Mensagem + Optimistic UI

**Problema**: Mensagens enviadas não mostram estado "enviando" e não há tratamento visual de falha.

**Solução**:
- Adicionar estado local `pendingMessages` via `useRef` em `ChatConversation.tsx`
- Ao enviar, inserir mensagem com status `sending` instantaneamente na lista (optimistic UI)
- Quando o servidor confirma (via Realtime), remover do pending e usar a mensagem real
- Se falhar, marcar como `failed` com ícone de erro e botão de reenvio
- Adicionar ícone de relógio (⏳) para `sending` no `ChatMessageBubble.tsx`
- Adicionar ícone de erro (❌) + botão "Reenviar" para `failed`

**Arquivos**: `ChatConversation.tsx`, `ChatMessageBubble.tsx`

## Fase 2 — Scroll Inteligente + Botão "Novas Mensagens"

**Problema**: O botão de scroll existe mas não mostra contagem de novas mensagens.

**Solução**:
- Rastrear quantidade de mensagens novas quando o usuário está scrollado para cima
- Botão "⬇ X novas mensagens" em vez de apenas seta
- Ao clicar, scrollar suavemente e resetar o contador
- Manter auto-scroll APENAS quando `isNearBottom` é true (já existe, melhorar)

**Arquivos**: `ChatConversation.tsx`

## Fase 3 — Virtualização da Lista de Contatos

**Problema**: Renderizar centenas de contatos sem virtualização causa lentidão.

**Solução**:
- Instalar `@tanstack/react-virtual` (já disponível como dependência do react-query)
- Virtualizar a lista de contatos em `ChatContactList.tsx` usando `useVirtualizer`
- Cada item tem altura fixa (~72px), permitindo virtualização eficiente
- Manter filtros e busca funcionando normalmente

**Arquivos**: `ChatContactList.tsx`

## Fase 4 — Retry Automático de Mensagens Falhadas

**Problema**: Não existe retry para mensagens que falharam.

**Solução**:
- Mensagens com status `failed` ganham botão "↻ Reenviar"
- Ao clicar, tenta enviar novamente via `sendMutation`
- Retry automático em background: 1 tentativa após 5s, depois manual
- Fila local de mensagens pendentes mantida em `useRef`

**Arquivos**: `ChatConversation.tsx`, `ChatMessageBubble.tsx`

## Fase 5 — Link Preview

**Problema**: URLs em mensagens aparecem como texto puro.

**Solução**:
- Criar componente `LinkPreview` que detecta URLs no conteúdo da mensagem
- Renderizar URLs como links clicáveis com estilo sublinhado azul
- Para links simples: detectar com regex e renderizar como `<a>` clicável
- Preview completo (og:title/og:image) seria muito pesado — manter apenas link clicável estilizado

**Arquivos**: `ChatMessageBubble.tsx` (novo helper `renderTextWithLinks`)

## Fase 6 — Respostas Rápidas no Banco (em vez de localStorage)

**Problema**: `ChatQuickReplies` usa localStorage, não sincroniza entre dispositivos.

**Solução**:
- Criar tabela `quick_reply_templates` (organization_id, label, text, position)
- Migrar `ChatQuickReplies.tsx` para buscar/salvar via Supabase
- RLS: membros da organização podem CRUD

**Arquivos**: `ChatQuickReplies.tsx`, migration SQL

## Fase 7 — Image Lightbox (click para ampliar)

**Problema**: Imagens abrem em nova aba ao clicar.

**Solução**:
- Criar componente `ImageLightbox` com overlay fullscreen
- Ao clicar em imagem no chat, abrir lightbox com zoom
- Fechar com ESC, click fora, ou botão X
- Navegação entre imagens da conversa

**Arquivos**: `ChatMessageBubble.tsx`, novo `ImageLightbox.tsx`

## Fase 8 — Melhorias visuais WhatsApp Web

**Refinamentos de UI**:
- Timestamp agrupado: mensagens consecutivas do mesmo remetente dentro de 1 min compartilham apenas 1 timestamp (no último)
- Audio player customizado estilo WhatsApp (barra de progresso verde, ícone de waveform)
- Indicador "digitando..." com animação de 3 pontos (já existe, refinar visual)
- Check duplo cinza → check duplo azul com transição suave

**Arquivos**: `ChatMessageBubble.tsx`, `index.css`

## Fase 9 — Persistência Local (IndexedDB)

**Solução**:
- Usar `idb-keyval` (leve, ~600B) para cache local
- Cachear últimas 50 conversas + últimas 100 mensagens por conversa
- No load, mostrar cache primeiro, depois atualizar com dados do servidor
- Evita tela em branco no reload

**Arquivos**: novo `src/lib/chatCache.ts`, `ClienteChat.tsx`, `useWhatsApp.ts`

## Fase 10 — Polling Fallback para Realtime

**Problema**: Se o Realtime desconectar, não há fallback.

**Solução**:
- Detectar estado do channel Realtime (connected/disconnected)
- Se desconectado por >10s, ativar polling a cada 5s
- Quando Realtime reconectar, desativar polling
- Badge visual "Reconectando..." quando em fallback

**Arquivos**: `ClienteChat.tsx`

---

## Tabela de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/cliente/ChatConversation.tsx` | Optimistic UI, retry, scroll inteligente, polling fallback |
| `src/components/cliente/ChatMessageBubble.tsx` | Estados sending/failed, link preview, lightbox, timestamp agrupado |
| `src/components/cliente/ChatContactList.tsx` | Virtualização com react-virtual |
| `src/components/cliente/ChatQuickReplies.tsx` | Migrar localStorage → banco |
| `src/components/cliente/ImageLightbox.tsx` | **Novo** — overlay fullscreen para imagens |
| `src/lib/chatCache.ts` | **Novo** — cache IndexedDB |
| `src/pages/cliente/ClienteChat.tsx` | Polling fallback, integração cache |
| `src/index.css` | Refinamentos visuais WhatsApp |
| Migration SQL | Tabela `quick_reply_templates` |

## Ordem de Execução

1. Estados de mensagem + Optimistic UI (impacto visual imediato)
2. Scroll inteligente + botão novas mensagens
3. Retry automático
4. Link preview + Image lightbox
5. Virtualização de lista
6. Quick replies no banco
7. Persistência local
8. Polling fallback
9. Refinamentos visuais finais

