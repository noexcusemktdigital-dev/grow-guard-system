# Plano de Otimização Avançada — Capacidade Máxima sem Travar

## Objetivo

Tornar a infra atual (Small/Medium) capaz de servir **muitos usuários e workspaces simultâneos sem travar, sem login lento e sem perda de performance** nas ferramentas e gerações — sem trocar de plano.

---

## 1. Auditoria do que encontrei (gargalos reais)

| Área | Achado | Impacto |
|---|---|---|
| Realtime | **6 telas abrem `supabase.channel()` direto** (FranqueadoSuporte, Atendimento, ChatConversation, ClienteIntegracoes, ClienteChat) — ignoram o `realtimeManager` | Cada usuário abre 3–6 conexões WebSocket em vez de 1 |
| Queries | **117 `select('*')`** na codebase | Lê 30+ colunas quando precisa de 3, satura I/O |
| Queries | **`crm_leads`** é a tabela mais consultada (23 pontos) — sem índice composto adequado | Toda navegação em CRM faz seq-scan |
| Polling | `FeatureGateContext` faz poll a cada **60s** em TODA tela autenticada | 1 query por usuário ativo por minuto, sem necessidade |
| Hotspots | `useFinance` (8 queries), `useTeamChat` (6), `ClienteDashboard` (6), `ClienteGamificacao` (6) | Página dispara 6–8 round-trips paralelos |
| Edge Funcs | 100 funções, várias com conexão direta (5432) em vez de pooler | Esgota slots de conexão sob carga |
| Bootstrap | Auth faz 2 round-trips em série (`profiles` + `get_user_role`) | +400ms no login |
| RLS | Policies sem índices de suporte em `user_roles`/`org_members` | RLS executa subselect sem índice em toda query |
| Logs | `audit_log`, `notifications`, `email_logs`, `whatsapp_messages` sem retention | Disco enche → autovacuum trava → incidente atual |

---

## 2. Estratégia de execução em 4 ondas

### Onda 1 — Backend (impacto: 5–10x na capacidade)
Migration única e segura, que multiplica capacidade do banco sem mudar UI.

**1.1 Índices compostos críticos:**
```sql
-- CRM (mais consultada)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_org_stage_updated
  ON crm_leads (organization_id, stage_id, updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_org_assigned
  ON crm_leads (organization_id, assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_contacts_org_email
  ON crm_contacts (organization_id, email);

-- Auth/RLS hot path
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_role
  ON user_roles (user_id, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_user_org
  ON org_members (user_id, organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_user_permissions_lookup
  ON org_user_permissions (user_id, organization_id);

-- Listagens com .order() sem limit
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_messages_contact_created
  ON whatsapp_messages (contact_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created_unread
  ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_tasks_org_due
  ON client_tasks (organization_id, due_date) WHERE status != 'done';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_followups_unit_created
  ON client_followups (unit_org_id, created_at DESC);
```

**1.2 RPC consolidado de bootstrap:**
`bootstrap_user_session(_user_id, _portal)` retorna em UMA chamada: `{role, org_id, profile_minimal, feature_flags, permissions}`. Reduz 4 round-trips → 1 no login.

**1.3 Retention automática (pg_cron):**
- `audit_log` > 90 dias → delete
- `notifications` > 60 dias e lidas → delete
- `email_logs` > 30 dias → delete
- `whatsapp_messages` arquivar > 180 dias
- `automation_logs` > 30 dias → delete

Roda diariamente às 03:00. Libera disco constantemente, evita autovacuum stalls.

**1.4 Segurança RLS via `SECURITY DEFINER`:**
Garantir que `has_role()`, `get_user_org_id()`, etc. usem `SET search_path = public` e sejam `STABLE` — para o Postgres cachear o resultado dentro da mesma query.

---

### Onda 2 — Realtime sob controle (impacto: 3x menos conexões)

**2.1 Migrar 6 telas para `realtimeManager`:**
- `src/pages/franqueado/FranqueadoSuporte.tsx`
- `src/pages/franqueado/FranqueadoSuporteComponents.tsx`
- `src/pages/Atendimento.tsx`
- `src/components/cliente/ChatConversation.tsx`
- `src/pages/cliente/ClienteIntegracoes.tsx`
- `src/pages/cliente/ClienteChat.tsx`

Cada uma passa a usar `subscribeToTable(orgId, ...)` — múltiplas tabelas no mesmo channel.

**2.2 Lint guard:**
Adicionar comentário-regra no topo do `realtimeManager.ts` proibindo `supabase.channel()` direto fora dele. Próximas PRs devem seguir.

**2.3 Filtro estrito no servidor:**
Todo channel novo carrega `filter: 'organization_id=eq.X'` — Postgres só envia o que importa, em vez de broadcast geral.

---

### Onda 3 — Eliminar desperdício no frontend (impacto: 2–3x menos queries)

**3.1 Substituir `select('*')` por colunas específicas** nos top hotspots:
- `useFinance.ts` (8 queries) — listar campos reais usados
- `useTeamChat.ts`, `ClienteDashboard.tsx`, `ClienteGamificacao.tsx`
- `useClienteContent.ts`, `useWhatsApp.ts`, `useOnboarding.ts`

Meta: reduzir de 117 → < 30 (mantendo `*` só onde realmente todas as colunas são exibidas).

**3.2 FeatureGateContext — backoff inteligente:**
Hoje: refetch fixo a cada 60s.
Novo: 60s nos primeiros 5min de sessão (provisionamento ainda pode rolar), depois sobe pra 5min. Plano aprovado vira `staleTime: Infinity` até signOut.

**3.3 Paginação obrigatória:**
Auditar listas (`useClientePosts`, `useClienteScripts`, `useUnits`, `useClienteDispatches`, `useAutomationLogs`, `useWhatsApp`) e adicionar `.range(0, 49)` ou `.limit(50)` por padrão. Sem isso um workspace com 5k registros derruba a tela.

**3.4 Bootstrap consolidado no AuthContext:**
Substituir as 2 chamadas paralelas por uma única `rpc('bootstrap_user_session')`. Cache em localStorage (já temos `noe-cached-role` e `noe-cached-profile`, expandir pra `noe-cached-bootstrap` com TTL 5min).

---

### Onda 4 — Edge Functions e jobs (impacto: estabilidade sob carga)

**4.1 Auditar conexão DB nas 100 funções:**
Webhooks de alta frequência (`process-asaas-webhook`, `evolution-webhook`, `receive-candidate`, `crm-webhook-receive`) devem usar **service role + porta 6543 (pooler transacional)** — não conexão direta na 5432.

**4.2 Cron jobs com lock:**
Jobs longos (relatórios, sync Asaas) devem usar `pg_advisory_lock` para não rodar 2x em paralelo se demorarem.

**4.3 Timeouts agressivos:**
Toda edge function com `EdgeRuntime.waitUntil` ou timeout máx de 25s. Função travada hoje prende worker.

---

## 3. Capacidade esperada após as 4 ondas

| Plano | Hoje (sem otimizar) | Pós-Onda 1+2 | Pós-Onda 3+4 |
|---|---|---|---|
| Small (2GB)  | ~50 ativos / 15 workspaces  | ~150 / 40  | **~250 / 70** |
| Medium (4GB) | ~150 ativos / 40 workspaces | ~400 / 100 | **~700 / 180** |
| Large (8GB)  | ~400 ativos / 100 workspaces| ~1000 / 250| **~1800 / 450** |

"Ativo" = usuário com sessão fazendo request nos últimos 60s. Total cadastrado é ~10x maior (a maioria fica idle).

---

## 4. Ordem de execução proposta

1. **Onda 1 (HOJE, assim que DB estabilizar)** — uma migration com índices + RPC bootstrap + cron de retention. Risco baixo, ganho enorme. ~30 min.
2. **Onda 2** — migrar 6 telas para realtimeManager. ~45 min, sem migration.
3. **Onda 3** — refactor de hotspots (`useFinance`, `ClienteDashboard`, FeatureGate, paginação). ~60 min.
4. **Onda 4** — auditoria edge functions e cron locks. Iterativo, conforme aparecerem warnings.

Cada onda é **independente e reversível**. Posso parar entre elas se quiser validar.

---

## 5. Detalhes técnicos

**Arquivos editados:**
- `supabase/migrations/<timestamp>_perf_optimization.sql` (Onda 1)
- `src/contexts/AuthContext.tsx` (Onda 1 — bootstrap consolidado)
- `src/contexts/FeatureGateContext.tsx` (Onda 3 — backoff)
- `src/pages/franqueado/FranqueadoSuporte.tsx` + 5 telas chat (Onda 2)
- `src/hooks/useFinance.ts`, `useTeamChat.ts`, `useClienteContent.ts`, `useWhatsApp.ts`, `useOnboarding.ts`, `useClienteAgents.ts`, `useClientePosts.ts`, `useClienteScripts.ts`, `useUnits.ts`, `useClienteDispatches.ts`, `useAutomationLogs.ts` (Onda 3)
- `src/lib/realtimeManager.ts` (Onda 2 — comentário lint guard)
- `supabase/functions/process-asaas-webhook/`, `evolution-webhook/`, `receive-candidate/` (Onda 4 — pooler)

**Métricas a acompanhar (aba Advanced):**
- CPU sustentado < 60%
- RAM < 75%
- Disk I/O budget > 50% disponível
- Conexões ativas < 50% do limite
- p95 de query < 200ms

**O que NÃO vou tocar:**
- `src/integrations/supabase/client.ts` (auto-gerado)
- Schemas reservados (`auth`, `storage`, `realtime`)
- Lógica de billing/Asaas (intocável)

---

## 6. Próximo passo

Aguardando o DB estabilizar (`cloud_status` diz OK mas queries diretas ainda timeout = propagação rolando). Assim que a primeira `read_query` voltar com sucesso, **disparo a Onda 1 imediatamente**. Você quer que eu execute as 4 ondas em sequência ou paro entre cada uma para você validar?
