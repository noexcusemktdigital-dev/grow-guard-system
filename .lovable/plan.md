
# Otimização de Performance e Cloud — NoExcuse

Diagnóstico: instância pequena saturada por **Disk I/O 100% + Disco 90%**, causando timeouts de auth/login. A causa raiz não é o nº de usuários, é o **volume de escrita em tabelas de log e histórico** + **canais Realtime duplicados** + **falta de TTL/índices**.

Objetivo: derrubar I/O abaixo de 60% e estabilizar disco para que `small` volte a ser viável (sem precisar subir para `medium` permanentemente).

---

## Fase 1 — Emergencial (executar primeiro, libera I/O em minutos)

Tabelas que crescem sem controle hoje (confirmadas por código e memórias):

- `automation_execution_logs` — gravação a cada execução de automação CRM
- `crm_lead_history` — append em cada movimento de lead
- `notifications` — push a cada evento via trigger
- `whatsapp_dispatches` / `whatsapp_messages` — alto volume de inserts
- `credit_transactions` — debit a cada chamada de IA
- `audit_logs` (se existir) e respostas JSON grandes de IA armazenadas em `marketing_strategies.result`

Ações (migrations SQL, sem tocar UI):

1. **TTL via DELETE em lote + agendamento** (pg_cron já disponível):
   - `automation_execution_logs`: manter 60 dias
   - `notifications` lidas: manter 30 dias; não lidas: 90 dias
   - `crm_lead_history`: manter 180 dias (preserva auditoria importante)
   - `whatsapp_messages` de leads encerrados há +90 dias: arquivar ou deletar
   - `credit_transactions`: manter 365 dias (ainda permite relatório anual)

2. **VACUUM FULL** nas tabelas acima após o primeiro purge (libera disco físico, não só lógico).

3. **Reduzir publication do Realtime**: revisar `supabase_realtime` e remover tabelas que não precisam ser broadcast (cada tabela = WAL extra + I/O). Manter só `whatsapp_messages`, `notifications`, `crm_leads`, `team_chat_messages`.

Resultado esperado: −40% a −60% de I/O imediato e liberação de 3–6 GB de disco.

---

## Fase 2 — Estrutural (índices e queries)

1. **Índices faltando** nas colunas mais filtradas:
   - `automation_execution_logs (organization_id, created_at DESC)`
   - `crm_lead_history (lead_id, created_at DESC)`
   - `notifications (user_id, read, created_at DESC)`
   - `whatsapp_messages (organization_id, created_at DESC)`
   - `credit_transactions (organization_id, created_at DESC)`

2. **Consolidar Realtime no client**: o `realtimeManager.ts` já existe mas está subutilizado. Migrar hooks que ainda chamam `supabase.channel()` direto para usar `subscribeToTable()` — reduz nº de WebSockets simultâneos por usuário de ~8 para 1.

3. **staleTime do React Query**: aumentar em hooks de baixa volatilidade (`useUserOrgId`, `useOrgProfile`, `useUnits`, `useCrmFunnels`) de 0/1m para 5m. Reduz round-trips ao banco sem impacto de UX.

---

## Fase 3 — Relatório e governança (depois que o banco estabilizar)

Quando a instância voltar a responder, vou gerar:

1. **Relatório de uso real** (via `supabase--read_query`):
   - Top 20 tabelas por tamanho em disco
   - Top 10 tabelas por taxa de escrita/dia
   - Workspaces ativos × inativos
   - Usuários por organização × créditos consumidos × storage
   - Projeção de crescimento mensal

2. **Painel interno de quotas** (página admin no portal Matriz, sem expor ao cliente final):
   - Gráfico de I/O e disco por dia
   - Alerta automático quando disco passar de 75%
   - Lista de orgs que mais consomem (storage e créditos)

3. **Política de retenção documentada** em `docs/`:
   - Quanto cada tabela retém
   - Quando arquivar vs deletar
   - Como o SaaS cobra (ou não) excedente de uso

---

## Detalhes técnicos

```text
Fase 1 (impacto imediato no I/O)
├── Migration: criar pg_cron jobs de purge diário às 03:00 UTC
├── Migration: VACUUM FULL nas 6 tabelas críticas (manual, em janela)
└── Migration: ALTER PUBLICATION supabase_realtime DROP TABLE <tabelas baixo-valor>

Fase 2 (queries mais leves)
├── Migration: CREATE INDEX CONCURRENTLY nos 5 índices listados
├── Refactor: hooks Realtime → subscribeToTable() do realtimeManager
└── Refactor: staleTime em hooks de leitura estável

Fase 3 (visibilidade)
├── SQL views: v_storage_per_table, v_writes_per_day, v_org_usage
├── Página admin matriz: /matriz/cloud-usage (read-only, super_admin)
└── docs/cloud-retention-policy.md
```

Arquivos que serão tocados:

- `supabase/migrations/<timestamp>_cleanup_jobs.sql` (novo)
- `supabase/migrations/<timestamp>_performance_indexes.sql` (novo)
- `supabase/migrations/<timestamp>_realtime_publication_cleanup.sql` (novo)
- `src/hooks/useNotifications*.ts`, `src/hooks/useWhatsApp.ts`, `src/hooks/useTeamChat.ts` (migrar para realtimeManager — mantendo comportamento)
- `src/hooks/useUserOrgId.ts`, `src/hooks/useOrgProfile.ts`, `src/hooks/useUnits.ts`, `src/hooks/useCrmFunnels.ts` (apenas `staleTime`)
- `src/pages/matriz/CloudUsage.tsx` (novo, Fase 3)
- `docs/cloud-retention-policy.md` (novo)

NÃO serão alterados: regras de negócio, fluxos de auth, UI cliente/franqueado, edge functions já existentes (exceto adicionar logs estruturados se necessário).

---

## Pré-requisitos

- O Cloud precisa estar **respondendo** para rodar Fase 1. Se ainda estiver em I/O 100%, subir temporariamente para `medium`, executar Fase 1, depois voltar para `small`.
- Confirmar com você quais tabelas de log podem ser podadas (proponho os limites acima, mas você decide).

---

## Ordem de execução proposta

1. Você confirma os limites de retenção (60/90/180/365 dias) ou ajusta.
2. Eu rodo Fase 1 (purge + VACUUM + Realtime cleanup) → I/O cai.
3. Eu rodo Fase 2 (índices + Realtime client + staleTime).
4. Quando estável, rodo Fase 3 (relatório real + página admin + docs).

Aprovando este plano, sigo para Fase 1 assim que o backend responder.
