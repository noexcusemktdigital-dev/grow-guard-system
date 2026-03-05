

# Plano: Revisão do Plano de Vendas, CRM, Conversas e Agentes IA

## 1. Metas integradas ao Plano de Vendas — Projeções e Previsibilidade

### Problema
As metas existem como uma aba separada ("Metas") dentro do Plano de Vendas, mas não se conectam ao diagnóstico. As projeções (leads e receita) são calculadas com fórmulas genéricas baseadas no score do diagnóstico — não usam dados reais do CRM nem as metas definidas. Não existe previsibilidade: "no ritmo atual, você atinge a meta em X dias?" ou "faltam Y leads para bater a meta".

### Correção
- **Painel de Previsibilidade** no topo da aba Metas: para cada meta ativa, mostrar:
  - Progresso atual vs ideal (já existe em `useGoalProgress` — os campos `pacePerDay`, `requiredPacePerDay`, `remaining`, `daysLeft` já são calculados mas não exibidos)
  - Projeção linear: "No ritmo atual, você atingirá X% da meta até o final do período"
  - Alerta visual quando `pacePerDay < requiredPacePerDay * 0.7` (ritmo crítico)
- **Vincular projeções ao diagnóstico**: substituir as projeções genéricas (`getLeadsProjection`, `getRevenueProjection`) por projeções que usem dados reais + metas quando disponíveis. Se há meta de "revenue" ativa, a projeção mostra progresso real vs meta.
- **GoalCard aprimorado**: exibir `remaining`, `daysLeft` e `requiredPacePerDay` que já vêm do hook mas são ignorados no card atual.

### Arquivos
| Arquivo | Ação |
|---|---|
| `src/pages/cliente/ClientePlanoVendas.tsx` | Adicionar painel de previsibilidade na aba Metas; atualizar projeções do diagnóstico para usar dados reais quando existem metas |
| `src/components/metas/GoalCard.tsx` | Exibir dados de ritmo/projeção (remaining, daysLeft, pace) |

---

## 2. CRM — Bug no drag-and-drop de leads

### Problema
O `ClienteCRM.tsx` usa `@dnd-kit/core` com `closestCorners` para detectar drops. O `handleDragEnd` compara `lead.stage !== newStage` onde `newStage` é o `over.id` (que é o `stageKey` do `DroppableColumn`). O bug provável: quando o card é dropado **sobre outro card** (e não sobre a coluna), o `over.id` é o ID do lead (não do stage), fazendo o `updateLead` receber um UUID como `stage` em vez do key da etapa.

### Correção
- No `handleDragEnd`, quando `over.id` não corresponde a nenhum `stageKey`, buscar o stage do container pai. Usar `over.data?.current` do droppable ou verificar se `over.id` é um stage key válido antes de atualizar.
- Adicionar validação: se `newStage` não está na lista de `stages`, ignorar o drop.

### Arquivo
| Arquivo | Ação |
|---|---|
| `src/pages/cliente/ClienteCRM.tsx` | Corrigir `handleDragEnd` para validar que `newStage` é um stage key válido; se não, identificar o stage do card alvo |

---

## 3. Conversas — Mensagens não atualizando

### Problema
A subscrição Realtime em `ClienteChat.tsx` filtra por `organization_id` e invalida queries quando detecta mudanças. No entanto:
1. O filtro Realtime `filter: organization_id=eq.${instance.organization_id}` pode não funcionar se a publicação Realtime não estiver habilitada para `whatsapp_messages`. Preciso verificar se a tabela está na publicação `supabase_realtime`.
2. O `useWhatsAppMessages` pode ter cache agressivo do React Query que não reseta ao invalidar.
3. O polling de 10s/15s mencionado na memória pode não estar implementado como fallback.

### Correção
- Garantir via migration que `whatsapp_messages` está na publicação Realtime (se já não estiver).
- Adicionar `refetchInterval: 10000` ao `useWhatsAppMessages` como fallback de polling caso o Realtime falhe.
- No `useWhatsAppContacts`, adicionar `refetchInterval: 15000`.

### Arquivos
| Arquivo | Ação |
|---|---|
| `src/hooks/useWhatsApp.ts` | Adicionar `refetchInterval` como polling fallback em `useWhatsAppMessages` e `useWhatsAppContacts` |
| Migration SQL | `ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;` (se necessário) |

---

## 4. Agentes IA — Arquitetura de atendimento e ativação/desativação

### Estado atual (funcional)
A arquitetura já está bem estruturada:
- **Webhook recebe mensagem** → `whatsapp-webhook` salva no DB → chama `ai-agent-reply`
- **ai-agent-reply** verifica: créditos → modo do contato (human/ai) → agente ativo → horário comercial → limite de mensagens → inatividade → responde
- **Desativação do agente** (`useClienteAgentMutations.updateAgent`): já faz unlock automático de todos os contatos do agente para modo humano
- **Fallback**: se agente atribuído está inativo, busca outro ativo; se nenhum existe, transfere para humano com notificação

### Problemas identificados
1. **Falta visibilidade na UI**: o usuário não sabe POR QUE o agente não respondeu (créditos? horário? limite?). Não há log visível.
2. **Ativação não reassocia contatos**: ao reativar um agente, os contatos que foram desbloqueados para humano não voltam automaticamente para IA. O usuário precisa ir manualmente em cada contato.
3. **Sem painel de status do agente**: não mostra quantos contatos ativos, mensagens respondidas hoje, handoffs realizados.

### Correção
- **AgentCard aprimorado**: mostrar contadores (contatos ativos, mensagens hoje) via query direta
- **Botão "Reativar IA"** no `AgentCard`: ao ativar, oferecer opção de reassociar contatos que estavam com esse agente
- **Log de ações do agente**: na `AgentFormSheet`, adicionar aba "Histórico" mostrando as últimas interações (já existe `whatsapp_messages` com `metadata` que identifica respostas IA)

### Arquivos
| Arquivo | Ação |
|---|---|
| `src/components/cliente/AgentCard.tsx` | Adicionar contadores de contatos e mensagens; botão de reativação com reassociação |
| `src/components/cliente/AgentFormSheet.tsx` | Adicionar aba "Histórico" com log de atividades do agente |
| `src/hooks/useClienteAgents.ts` | Adicionar query para estatísticas do agente; mutation para reassociar contatos |

---

## Resumo de Impacto

| Módulo | Tipo | Prioridade |
|---|---|---|
| CRM drag-and-drop | Bug fix | Alta |
| Conversas Realtime | Bug fix | Alta |
| Metas/Projeções | Feature | Média |
| Agentes IA visibilidade | Feature | Média |

## Migrations Necessárias

```sql
-- Garantir Realtime para whatsapp_messages e whatsapp_contacts
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_contacts;
```

