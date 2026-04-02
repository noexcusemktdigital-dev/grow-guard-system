

## Plano — Integrar metas do GPS com vendas do CRM

### Diagnóstico

O problema é que quando um lead é marcado como vendido no CRM (`markAsWon`, `markAsLost`, `updateLead`, `createLead`), nenhuma dessas mutations invalida a query `goal-progress`. Ou seja, o cálculo de progresso das metas **já funciona corretamente** (ele busca leads com `won_at` dentro do período) — mas o cache do React Query não é atualizado quando uma venda acontece no CRM.

O `useGoalProgress` calcula o progresso corretamente com base nos leads ganhos (`won_at`) dentro do período da meta. O problema é puramente de **invalidação de cache**: as mutations do CRM não avisam ao React Query que os dados de progresso das metas mudaram.

### Correção

Adicionar `qc.invalidateQueries({ queryKey: ["goal-progress"] })` em todas as mutations do CRM que afetam dados usados pelo cálculo de metas:

- `createLead` → afeta métrica "leads"
- `updateLead` → afeta valor, assigned_to, stage
- `markAsWon` → afeta métricas "revenue", "contracts", "conversions", "avg_ticket"
- `markAsLost` → afeta taxa de conversão
- `bulkUpdateLeads` → pode afetar qualquer campo
- `deleteLead` / `bulkDeleteLeads` → remove leads do cálculo

### Arquivo

| Arquivo | Ação |
|---------|------|
| `src/hooks/useCrmLeads.ts` | Adicionar invalidação de `goal-progress` em todos os `onSuccess` das mutations |

### Resultado

- Quando um lead é marcado como vendido no CRM, a meta atualiza automaticamente o progresso
- Dashboard, GPS do Negócio e página de Metas refletem vendas em tempo real
- Sem mudanças no banco de dados — apenas sincronização de cache no frontend

