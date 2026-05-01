# Otimização CRM — Performance sem refatoração

Aplicar apenas otimizações de baixo risco que mantêm a arquitetura atual de leads centralizados (`ClienteCRM.tsx`), preservando 100% de `selectionMode`, `bulkActions`, `toggleAllLeads` e a distribuição atual de `stageLeads` por coluna.

## 1. Migrações de banco — 3 índices parciais

Cada índice em uma migração separada (necessário para `CREATE INDEX CONCURRENTLY`, que não roda dentro de transação).

**Migração A** — Kanban principal (leads ativos por funil/stage, ordenados por updated_at):
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_kanban_v2
ON crm_leads(organization_id, funnel_id, stage, updated_at DESC)
WHERE archived_at IS NULL;
```

**Migração B** — Tasks pendentes por lead (badges de contagem em cada card):
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_tasks_lead_pending
ON crm_tasks(lead_id, due_date)
WHERE completed_at IS NULL;
```

**Migração C** — Lookup de lead por org (consultas de detalhe e contagens):
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_org_active
ON crm_leads(organization_id, created_at DESC)
WHERE archived_at IS NULL;
```

## 2. Frontend — `src/hooks/useCrmLeads.ts`

Adicionar `gcTime: 1000 * 60 * 10` (10 min) à query principal `useCrmLeads` para evitar limpeza prematura do cache ao trocar de aba/funil. Confirmar `staleTime` em 3 min e `refetchOnWindowFocus: false` (já presentes).

Também remover a definição duplicada de `useCrmLeadTaskCounts` que existe no arquivo (há duas declarações idênticas — manter apenas a primeira).

## O que NÃO será alterado

- PAGE_SIZE (mantém 50)
- Arquitetura centralizada de leads em `ClienteCRM.tsx`
- Lógica de `selectionMode`, `toggleAllLeads`, `bulkActions`
- Distribuição de `stageLeads` para cada `KanbanColumn`
- Índices existentes (mantidos para evitar regressão; podem ser auditados depois)

## Impacto esperado

- Kanban com muitos leads: scan via índice + ordenação "grátis" por `updated_at`.
- Badges de tarefas: índice 5–10× menor (só pendentes).
- Cache mais resiliente entre navegações curtas.
- Zero risco de quebra de features existentes.
- Sem perda de dados.
