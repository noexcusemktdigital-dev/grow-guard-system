

## Plano: Atualização Completa do WhatsApp em Tempo Real

### Problemas Identificados

1. **`last_message_preview` não atualizado no webhook** — O webhook (`whatsapp-webhook`) atualiza `last_message_at` mas NÃO atualiza `last_message_preview` para mensagens recebidas. Isso faz com que a lista de contatos mostre texto desatualizado até o próximo sync manual.

2. **Bug na resolução de instância no `whatsapp-send`** — Linha 133 referencia `inst?.id` antes de `inst` ser definido, causando query incorreta. Há lógica duplicada de fallback desnecessária.

3. **Polling desnecessariamente frequente** — Com Realtime já configurado e funcionando (ambas tabelas estão na publicação), o polling de 10s/15s adiciona carga sem necessidade. Pode ser relaxado para servir apenas como backup.

4. **Realtime subscription correta mas refetch pode ser otimizado** — Atualmente usa `refetchQueries` que refaz a query inteira. Para mensagens da conversa ativa, podemos adicionar otimisticamente a mensagem ao cache.

---

### Mudanças

#### 1. Edge Function `whatsapp-webhook/index.ts`
- Atualizar o contact upsert para incluir `last_message_preview` com o texto/tipo da mensagem recebida
- Preview: texto truncado (100 chars), ou ícone para mídia ("🎤 Áudio", "📷 Imagem", etc.)

#### 2. Edge Function `whatsapp-send/index.ts`
- Corrigir bug na resolução de instância (linha 120-147): simplificar lógica removendo referência circular a `inst?.id`

#### 3. Hook `useWhatsApp.ts`
- Reduzir `refetchInterval` de contacts de 15s → 30s (Realtime é o primário)
- Reduzir `refetchInterval` de messages de 10s → 30s (Realtime é o primário)
- Adicionar invalidação instantânea no `useSendWhatsAppMessage` para atualizar contatos e mensagens logo após o envio

#### 4. `ClienteChat.tsx` — Otimizar Realtime
- O Realtime subscription já está correto. Ajustar para fazer `invalidateQueries` (limpa cache) em vez de `refetchQueries` (força refetch) para evitar queries duplicadas
- Adicionar `last_message_preview` ao contact no Realtime callback de mensagens para atualizar preview instantaneamente na lista

#### 5. Melhoria visual na `ChatContactList`
- Exibir contagem de "msg hoje" e "contatos ativos" no header (dados já disponíveis nos contatos)
- Adicionar indicador visual de "última atividade" (timestamp relativo) mais proeminente

---

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/whatsapp-webhook/index.ts` | Adicionar `last_message_preview` no upsert do contato |
| `supabase/functions/whatsapp-send/index.ts` | Corrigir bug de resolução de instância |
| `src/hooks/useWhatsApp.ts` | Ajustar polling intervals, otimizar invalidação |
| `src/pages/cliente/ClienteChat.tsx` | Otimizar Realtime callbacks |
| `src/components/cliente/ChatContactList.tsx` | Adicionar stats no header (msg hoje / contatos ativos) |

