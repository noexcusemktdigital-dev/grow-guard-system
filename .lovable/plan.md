

# Correção: Atendimento IA + Bug do Agente

## Problemas Identificados

### 1. Todos os contatos em "Atendimento Humano"
Tanto o webhook (`whatsapp-webhook`, linha 193) quanto o sync (`whatsapp-sync-chats`, linha 273) criam contatos novos com `attending_mode: "human"`. O sync processou 557 contatos e definiu todos como humano.

**Regra correta**: Novos contatos via webhook (inbound) devem iniciar em modo `"ai"` para serem atendidos pela IA. Contatos criados via sync (histórico) devem iniciar como `"ai"` também, para que a IA assuma por padrão.

### 2. Agente IA não responde — ReferenceError
O log mostra: `ReferenceError: Cannot access 'role' before initialization` na linha 427.

Causa: No `ai-agent-reply/index.ts`, a variável `role` é usada na linha 419 (`if (role === "closer")`) mas só é declarada na linha 444 (`const role = agent.role || "sdr"`). O `const` tem temporal dead zone — o código crasha antes de gerar qualquer resposta.

## Correções

### Edge Function: `ai-agent-reply/index.ts`
- Mover `const role = agent.role || "sdr"` para **antes** do bloco que usa `role` (antes da linha 389, junto com `promptConfig` e `engagementRules`)
- Isso resolve o crash completo do agente

### Edge Function: `whatsapp-webhook/index.ts`
- Linha 193: Mudar `attending_mode: "human"` para `attending_mode: "ai"` em novos contatos criados via webhook
- Lógica: contato novo recebendo mensagem = deve ser atendido pela IA por padrão

### Edge Function: `whatsapp-sync-chats/index.ts`
- Linha 273: Mudar `attending_mode: "human"` para `attending_mode: "ai"` em contatos novos criados via sync
- Linha 277: Atualizar o map local para refletir `"ai"`

### Migration: Atualizar contatos existentes
- Executar SQL para corrigir contatos que já foram criados como "human" mas que nunca tiveram interação humana real:
```sql
UPDATE whatsapp_contacts SET attending_mode = 'ai' WHERE attending_mode = 'human';
```

### Nenhuma alteração no frontend
A `ChatContactList` já separa corretamente por `attending_mode`. Quando os dados mudarem para "ai", a UI refletirá automaticamente.

## Arquivos a Modificar
| Arquivo | Ação |
|---|---|
| `supabase/functions/ai-agent-reply/index.ts` | Mover declaração de `role` antes do seu uso (fix crash) |
| `supabase/functions/whatsapp-webhook/index.ts` | Novos contatos iniciam como `attending_mode: "ai"` |
| `supabase/functions/whatsapp-sync-chats/index.ts` | Novos contatos iniciam como `attending_mode: "ai"` |
| Migration SQL | Atualizar contatos existentes de "human" → "ai" |

