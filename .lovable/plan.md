

## Auditoria de Capacidade e Otimização do CRM

### Estado Atual do Banco

| Tabela | Registros | Tamanho | Índice org_id |
|--------|-----------|---------|---------------|
| crm_leads | 259 | 168 KB | Sim |
| crm_activities | 16 | 48 KB | **NÃO** |
| crm_contacts | 0 | 32 KB | **NÃO** |
| crm_tasks | 9 | 48 KB | **NÃO** |
| crm_funnels | 3 | 48 KB | Sim |
| crm_automation_queue | 2 | 48 KB | Sim |
| **Total DB** | — | **39 MB** | — |

### Limites Identificados

1. **Limite de 1000 leads por org** — O Supabase retorna no máximo 1000 linhas por query. O hook `useCrmLeads` não tem paginação, então clientes com mais de 1000 leads simplesmente perdem dados silenciosamente.

2. **Índices faltando** — `crm_activities`, `crm_contacts` e `crm_tasks` não têm índice em `organization_id`. Com milhares de registros, queries vão ficar lentas (full table scan + RLS check).

3. **Kanban renderiza TODOS os leads de uma vez** — Para um cliente com 5000 leads, isso significa 5000 cards DOM. O navegador trava.

4. **Bulk tag update é O(n) mutations** — A função `handleBulkAddTag` faz um `updateLead.mutate()` para cada lead individualmente, gerando N requests HTTP.

5. **Sem funis ilimitados** — Não há limite técnico nos funis (apenas restrição de plano que não existe ainda).

6. **Sem archiving** — Leads perdidos/vendidos antigos nunca são removidos, inflando queries.

### Capacidade Estimada (sem otimização)

| Recurso | Limite Real | Gargalo |
|---------|------------|---------|
| Leads por org | ~1000 | Query limit Supabase |
| Funis | Ilimitado | Sem gargalo |
| Usuários simultâneos | ~60 | Connections PostgreSQL |
| Atividades por lead | ~1000 | Sem paginação |
| Contatos | ~1000 | Query limit |

### Plano de Otimização

**1. Migração: Adicionar índices faltantes**
```sql
CREATE INDEX idx_crm_activities_org ON crm_activities (organization_id);
CREATE INDEX idx_crm_contacts_org ON crm_contacts (organization_id);
CREATE INDEX idx_crm_tasks_org ON crm_tasks (organization_id);
CREATE INDEX idx_crm_leads_org_stage ON crm_leads (organization_id, stage);
CREATE INDEX idx_crm_leads_org_funnel ON crm_leads (organization_id, funnel_id);
```

**2. Paginação no `useCrmLeads`**
- Adicionar `.range(offset, offset + pageSize - 1)` com `pageSize = 200`
- Usar `keepPreviousData` do React Query para UX suave
- Kanban: buscar por etapa com `useCrmLeads(funnelId, stageKey)` — cada coluna faz sua query independente com limite de 50 leads visíveis + "Ver mais"

**3. Virtualização do Kanban**
- Para listas longas dentro de cada coluna, usar lazy rendering (mostrar apenas os primeiros 20 cards por coluna, com botão "Carregar mais")

**4. Otimizar bulk operations**
- Corrigir `handleBulkAddTag`: usar uma RPC server-side que faz `UPDATE ... SET tags = array_append(tags, $tag) WHERE id = ANY($ids)` em uma única query

**5. Archiving automático**
- Criar coluna `archived_at` em `crm_leads`
- Leads perdidos há mais de 90 dias são auto-arquivados
- Filtro padrão exclui arquivados: `.is("archived_at", null)`

**6. Contagem sem download**
- Pipeline Summary: usar `.select('id, value, won_at, lost_at, stage', { count: 'exact', head: false })` em vez de `select("*")` para reduzir payload

### Capacidade Pós-Otimização

| Recurso | Novo Limite | Melhoria |
|---------|------------|----------|
| Leads por org | **50.000+** | Paginação + índices |
| Funis | Ilimitado | Sem mudança |
| Usuários simultâneos | ~60 | Connection pooling nativo |
| Atividades por lead | **10.000+** | Paginação |
| Contatos | **50.000+** | Paginação + índice |
| Kanban render | ~200 cards visíveis | Lazy loading por coluna |

### Arquivos a Modificar

1. **Migration SQL** — Índices + coluna `archived_at` + RPC `bulk_add_tag`
2. **`src/hooks/useCrmLeads.ts`** — Paginação, select otimizado, filtro de arquivados
3. **`src/pages/cliente/ClienteCRM.tsx`** — Lazy loading no Kanban, paginação na lista, corrigir bulk tag
4. **`src/hooks/useCrmActivities.ts`** — Paginação com limit
5. **`src/hooks/useCrmContacts.ts`** — Paginação com limit

