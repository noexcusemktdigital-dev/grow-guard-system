# AUDITORIA TÉCNICA + NEGÓCIO — Sistema Noé (grow-guard-system) — 2026-05-01

**Repo:** noexcusemktdigital-dev/grow-guard-system
**Supabase:** gxrhdpbbxfipeopdyygn (Lovable Cloud)
**Commit base:** 0d7dfb1a (2026-05-01) "Added disk cleanup migration"
**Auditor:** Claude (auditoriapropria framework v3, nível 1+ paralelizado)
**Nível executado:** Análise estática multi-agente (4 sub-agentes paralelos cobrindo 24 áreas)
**Limitações:** sem browser disponível → agentes 13/15/16/18 com confiança reduzida

---

## ÍNDICE
- [Score Final & Painel Executivo](#score-final)
- [Top 20 Achados Priorizados](#top-20)
- [Plano de Ação por SLA](#plano-acao)
- [Discovery & Threat Surface](#discovery)
- [Fluxos Críticos (FC-01..FC-08)](#fluxos-criticos)
- [Agente 01 — ARCH](#a01-arch)
- [Agente 02 — CODE](#a02-code)
- [Agente 04 — API](#a04-api)
- [Agente 05 — DATA](#a05-data)
- [Agente 06 — SEC](#a06-sec)
- [Agente 07 — PERF](#a07-perf)
- [Agente 08 — FIN](#a08-fin)
- [Agente 09 — OPS](#a09-ops)
- [Agente 10 — QA](#a10-qa)
- [Agente 11 — INT](#a11-int)
- [Agente 12 — AI](#a12-ai)
- [Agente 13 — RUN](#a13-run)
- [Agente 14 — PERM](#a14-perm)
- [Agente 15 — MPRF](#a15-mprf)
- [Agente 16 — A11Y](#a16-a11y)
- [Agente 17 — I18N](#a17-i18n) (N/A)
- [Agente 18 — MOB](#a18-mob)
- [Agente 19 — SEO](#a19-seo)
- [Agente 20 — LGPD](#a20-lgpd)
- [Agente 21 — DX](#a21-dx)
- [Agente 22 — TEL](#a22-tel)
- [Agente 23 — BI](#a23-bi) (N/A)
- [Agente 24 — SUPPLY](#a24-supply)

---

## Score Final & Painel Executivo {#score-final}

### Maturidade por agente

| # | Agente | Aplicabilidade | Maturidade | Risco | Confiança |
|---|--------|----------------|-----------|-------|-----------|
| 01 | ARCH | Aplicável | 6.5/10 | 7/10 | Alta |
| 02 | CODE | Aplicável | 5.5/10 | 6/10 | Alta |
| 03 | UX | Aplicável | 7.0/10 | 4/10 | Alta |
| 04 | API | Aplicável | **5.0/10** | **8/10** | Média-Alta |
| 05 | DATA | Aplicável | 6.0/10 | 6/10 | Média-Alta |
| 06 | SEC | Aplicável | **5.0/10** | **7/10** | Alta |
| 07 | PERF | Aplicável | 6.5/10 | 5/10 | Média (sem baseline) |
| 08 | FIN | Aplicável | 6.0/10 | 5/10 | Média |
| 09 | OPS | Aplicável | **3.5/10** | **8/10** | Alta |
| 10 | QA | Aplicável | **3.5/10** | **8/10** | Alta |
| 11 | INT | Aplicável | **4.5/10** | **9/10** | Alta |
| 12 | AI | Aplicável | 5.5/10 | 6/10 | Média |
| 13 | RUN | Parcial | 6.0/10 | 6/10 | Baixa |
| 14 | PERM | Aplicável | 6.0/10 | 6/10 | Média-Alta |
| 15 | MPRF | Não testado | **4.0/10** | 7/10 | Baixa |
| 16 | A11Y | Aplicável | 6.5/10 | 4/10 | Média |
| 17 | I18N | N/A | — | — | — |
| 18 | MOB | Aplicável | 5.5/10 | 5/10 | Média |
| 19 | SEO | Parcial | 5.0/10 | 4/10 | Média |
| 20 | LGPD | Aplicável | **3.5/10** | **9/10** | Alta — **BLOQUEADOR LEGAL** |
| 21 | DX | Aplicável | 6.5/10 | 3/10 | Alta |
| 22 | TEL | Aplicável | **2.0/10** | 6/10 | Alta |
| 23 | BI | N/A | — | — | — |
| 24 | SUPPLY | Aplicável | 4.0/10 | 6/10 | Alta |

### Score Geral Ponderado (fluxos críticos×2, monetário×1.5, multi-tenant×1.5)

- **Maturidade geral:** **5.1/10** — aceitável com riscos significativos
- **Risco residual geral:** **6.7/10** — alto
- **Cobertura geral estimada:** ~60% (limitada por análise estática)

### Bandeiras Vermelhas Executivas (alerta independente da média)

🔴 **5 áreas críticas confirmadas** que exigem ação imediata:
1. **INT-001/002** — Webhooks Meta Leadgen + WhatsApp Cloud sem validação HMAC (forge trivial de leads/mensagens)
2. **API-004** — Pagamentos Asaas sem idempotência (cobrança duplicada em retry/duplo-clique)
3. **LGPD-001** — 21 `console.log` com PII em produção (violação Art. 46 LGPD)
4. **LGPD-002** — Zero soft-delete em 199 migrations (sem trilha de exclusão)
5. **API-006/SEC-002** — Padrão BOLA: 20+ `.eq("id", ...)` sem segundo filtro de tenant/owner

⚠️ **Risco operacional alto:**
- **OPS** sem correlation_id, sem runbook, sem postmortem, CI com `continue-on-error: true`
- **QA** 5 de 6 fluxos críticos sem teste e sem monitor (`QA-CRITICAL-GAP`)
- **TEL** zero analytics e zero feature flags (cego para funil + sem kill-switch)

---

## Top 20 Achados Priorizados {#top-20}

> Ordenado por severidade × fluxo crítico × explorabilidade × confiança. Deduplicado por causa-raiz.

| # | ID | Sev | Causa-raiz | Achado | Fluxo Impactado | SLA |
|---|-----|-----|-----------|--------|-----------------|-----|
| 1 | INT-001 | 🔴 CRÍTICO | RC-SEC | Meta Leadgen webhook não valida `x-hub-signature-256` POST — forge de leads PII trivial | FC-04 | 24h |
| 2 | INT-002 | 🔴 CRÍTICO | RC-SEC | WhatsApp Cloud webhook sem HMAC — forge de mensagens entrantes (chatbot IA acionável por adversário) | FC-03 | 24h |
| 3 | API-004 | 🔴 CRÍTICO | RC-FLOW | Pagamentos Asaas (`asaas-buy-credits`, `recharge-credits`, `asaas-create-charge`) sem idempotência — cobrança duplicada em duplo-clique/retry | FC-01 | 24h |
| 4 | LGPD-001 | 🔴 CRÍTICO | RC-LGPD | 21 `console.log` com email/cpf/phone em produção — violação LGPD Art. 46 | Todos | 24h |
| 5 | API-006 / SEC-002 | 🔴 CRÍTICO | RC-AUTH | Padrão BOLA: 20+ `.eq("id",...)` sem segundo filtro de owner; edge fns aceitam `organization_id` no body sem `assertOrgMember` | FC-01..08 | 7d |
| 6 | INT-003 | 🟡 ALTO | RC-FLOW | Webhooks (Asaas, Evolution, Meta, WhatsApp) sem idempotência via `external_event_id` — duplicação de processamento | FC-01,03,04 | 7d |
| 7 | API-005 | 🟡 ALTO | RC-PERF / RC-SEC | 14 fns `generate-*` (IA) sem rate-limit — drain trivial de créditos via paralelo | FC-02 | 7d |
| 8 | API-001 | 🟡 ALTO | RC-DATA | Zero Zod em 100 edge functions — validação ad-hoc, type confusion, missing required | Todos | 30d |
| 9 | LGPD-002 | 🟡 ALTO | RC-LGPD | Zero soft-delete (`deleted_at`) em 199 migrations — sem trilha de exclusão auditável | Todos | 30d |
| 10 | LGPD-003 | 🟡 ALTO | RC-LGPD | Sem endpoint DSR (export/delete por solicitação do titular) — obrigatório LGPD Art. 18 | Todos | 30d |
| 11 | OPS-01 | 🟡 ALTO | RC-OBS | Zero `correlation_id`/`traceId` em 100 edge fns + frontend — sem rastreabilidade ponta-a-ponta | Todos | 30d |
| 12 | QA-01 | 🟡 ALTO | RC-DATA | 5 de 6 fluxos críticos sem teste/monitor: criar campanha, OAuth Meta/Google, dashboard, conversas WA, lead scoring | FC-02,03,04,05 | 30d |
| 13 | INT-005 | 🟡 ALTO | RC-OBS | Sem DLQ em 99% das integrações; 7 cron jobs falham silenciosamente | FC-01..06 | 30d |
| 14 | INT-008 | 🟡 ALTO | RC-LGPD / RC-OBS | `meta-leadgen-pages` loga `JSON.stringify(j)` da Meta API — possível leak de access tokens em logs | FC-05 | 7d |
| 15 | ARCH-003 / CODE-001 | 🟠 MÉDIO | RC-DATA | 96/99 edge fns com `@ts-nocheck` + 500 supressões TS no front — backend inteiro sem validação de tipos | Todos | 30d |
| 16 | TEL-01/02 | 🟠 MÉDIO | RC-OBS | Zero analytics + zero feature flags — plataforma cega + sem kill-switch para releases | Todos | 30d |
| 17 | INT-004 | 🟠 MÉDIO | RC-SEC | Comparação non-constant-time em validação de tokens webhook (Asaas, Evolution) — timing attack | FC-01,03 | 30d |
| 18 | MPRF-01 | 🟠 MÉDIO | RC-AUTH | Sem E2E multi-perfil — isolamento entre 3 portais não validado dinamicamente | Todos | 30d |
| 19 | OPS-05 | 🟠 MÉDIO | RC-DATA | CI com `continue-on-error: true` em lint/test — testes regridem silenciosamente | — | 7d |
| 20 | SUPPLY-001 | 🟠 MÉDIO | RC-SUPPLY | Lockfile duplicado (`bun.lockb` + `package-lock.json`) — drift dev↔CI | — | 30d |

### Causas-raiz dominantes

| RC-* | # achados | % do Top 20 |
|------|-----------|-------------|
| RC-SEC | 4 | 20% |
| RC-LGPD | 4 | 20% |
| RC-AUTH | 2 | 10% |
| RC-FLOW | 2 | 10% |
| RC-OBS | 4 | 20% |
| RC-DATA | 3 | 15% |
| RC-PERF | 1 | 5% |

---

## Plano de Ação por SLA {#plano-acao}

### 🔴 24h (críticos confirmados — bloqueio de release)
1. **INT-001** Implementar HMAC SHA-256 (`crypto.subtle` + `META_APP_SECRET`) em `meta-leadgen-webhook/index.ts`
2. **INT-002** Implementar HMAC em `whatsapp-cloud-webhook/index.ts`
3. **API-004** Adicionar tabela `idempotency_keys(key, fn, response, created_at)` + uso em `asaas-buy-credits`, `recharge-credits`, `asaas-create-charge`
4. **LGPD-001** Listar e mascarar/remover 21 `console.log` com PII (helper `redact()` em `_shared/`)

### 🟡 7d (altos)
5. Criar `_shared/auth.ts` com `requireAuth(req)` + `assertOrgMember(user, orgId)` — rollout em fns financeiras primeiro
6. **INT-003** Tabela `webhook_events(provider, external_id UNIQUE)` + `INSERT...ON CONFLICT DO NOTHING`
7. **API-005** Rate-limit por `(user, org, fn)` em todas as `generate-*` (tabela `rate_limits` + janela deslizante)
8. **OPS-05** Remover `continue-on-error: true` de lint/test no CI
9. **INT-008** Sanitizar logs em `meta-leadgen-pages` e similares (helper `redact(['access_token','token','password'])`)

### 🟠 30d (estruturais)
10. **API-001** Introduzir Zod em `_shared/schemas.ts`, rollout por área (financeiro → IA → social → resto)
11. **LGPD-002** Migration global adicionando `deleted_at` + views `*_active` em tabelas de negócio
12. **LGPD-003** Edge fns `dsr-export-data` e `dsr-delete-account` (LGPD Art. 18)
13. **OPS-01** Header `x-request-id` propagado em todas edge fns + log estruturado (substituir `console.log` por `pino`)
14. **QA-01** Suíte E2E Playwright para 5 fluxos críticos sem cobertura
15. **INT-005** Tabela `job_failures` + retry exponencial em crons; alertas GlitchTip se >3 falhas/24h
16. **TEL-01** Adotar PostHog (resolve analytics + feature flags numa só dep)
17. **ARCH-003 / CODE-001** Banir `@ts-nocheck` em código novo (pre-commit hook); rollout 10 fns/semana removendo o existente

### 🟢 backlog (90d+)
18. **MPRF-01** Suíte multi-perfil completa
19. **AI-001** Suíte de evals para `generate-*`
20. **SUPPLY-001/002/003** Padronizar lockfile, adicionar CODEOWNERS, configurar Renovate
21. **MOB-001** Decidir: PWA real ou remover menção do CLAUDE.md
22. **UX-001** Migrar 370 cores hardcoded para tokens Tailwind/CSS vars

---

## Discovery & Threat Surface {#discovery}

### Perfil
- **Tipo:** SaaS multi-tenant (3 portais: franqueadora/franqueado/cliente) para marketing de redes de franquias
- **Superfícies:** 142 páginas frontend, 100 edge functions, 199 migrations, 7 cron jobs (pg_cron), webhooks externos (Asaas, Evolution, Meta Leadgen, WhatsApp Cloud, Google Calendar)
- **Maturidade:** crescimento (cliente principal NOEXCUSE em produção)

### Inventário
| Item | Quantidade |
|------|-----------|
| Rotas frontend (`<Route>`) | 104 |
| Páginas `.tsx` | 142 |
| Componentes | 264 |
| Hooks | 116 |
| Edge functions | 100 |
| Tabelas (CREATE TABLE) | 148+ |
| Migrations | 199 |
| Cron jobs (pg_cron) | 7 |
| Testes (.test/.spec) | 35 |
| Coverage estimada | ~13% |

### Ativos Críticos
1. `organization_id` (tenant key — 797 ocorrências) — vazamento entre franquias = breach
2. Tokens OAuth (Meta/Google/TikTok/LinkedIn) em `social_*_accounts`
3. `asaas_*` (charges, subscriptions, customers) — financeiro
4. WhatsApp instances (Evolution + Cloud API) — comunicação cliente
5. `credits_*` — moeda interna (consumo IA)
6. Sessões OAuth (transferência cross-portal)
7. `crm_leads` — PII de leads de franqueados
8. AI prompts e conteúdo gerado

### Dependências Externas
Asaas (pagamentos) · Evolution API (VPS própria) · Meta Graph (leadgen + ads + WhatsApp Cloud) · Google Ads/Calendar OAuth · TikTok · LinkedIn · Lovable AI Gateway (Gemini) · SMTP grupolamadre

### Trust Boundaries
browser ↔ edge fn (74 com `verify_jwt=false`) · edge fn ↔ Supabase DB (RLS via service_role bypass) · edge fn ↔ APIs externas · webhooks → edge fn (validação heterogênea)

### Abuse Cases
- **AC1** Cross-tenant via `organization_id` no body sem rebind ao JWT user
- **AC2** Replay de webhook Asaas/Evolution sem nonce/idempotência
- **AC3** Forge de webhook Meta Leadgen sem `x-hub-signature-256` validado
- **AC4** Drain de créditos via `generate-*` chamadas paralelas sem rate-limit
- **AC5** Token OAuth roubado via logs com `JSON.stringify` de respostas Meta

---

## Fluxos Críticos {#fluxos-criticos}

| ID | Fluxo | Roles | Tabelas | Irrev? | $ | Multi-tenant | Risco |
|----|-------|-------|---------|--------|---|---------------|-------|
| **FC-01** | Cobrança Asaas (charge → webhook → credit/upgrade) | franqueado/cliente | asaas_*, credits_*, organizations | sim | sim | sim | financeiro+SLA |
| **FC-02** | Geração de conteúdo IA (créditos) | cliente | credits_balance, ai_jobs | parcial | sim | sim | drain de créditos |
| **FC-03** | Webhook Evolution → mensagem WhatsApp | cliente | whatsapp_messages, contacts | não | não | sim | duplicação/cross-tenant |
| **FC-04** | Meta Leadgen → CRM | cliente | crm_leads, lead_events | não | não | sim | forge/PII spam |
| **FC-05** | OAuth Ads (Meta/Google/TikTok) | cliente | social_accounts, ads_* | sim (token) | não | sim | token leak |
| **FC-06** | Cron sync ads/social/email-queue | system | ads_metrics, social_posts | não | não | múltiplo | uso indevido CRON_SECRET |
| **FC-07** | Provisão de unidade/onboarding | franqueadora | organizations, units, members | sim | sim | sim | vazamento config |
| **FC-08** | Reset password / support access | todos | auth.users, support_access | sim | não | sim | takeover |

---

## AGENTE 01 — ARCH (Arquitetura) {#a01-arch}

**Aplicabilidade:** Aplicável | **Maturidade:** 6.5/10 | **Risco:** 7/10 | **Confiança:** Alta

### Achados
- **ARCH-001 [ALTA]** 100 edge functions sem categorização clara (handler/service/integration). Cada `index.ts` mistura auth+validação+lógica+I/O.
- **ARCH-002 [MÉDIA]** Dois clients Supabase divergentes (`integrations/supabase/client.ts` vs `lib/supabase.ts`) com workaround de OAuth handoff — frágil.
- **ARCH-003 [ALTA]** 96/99 edge fns com `// @ts-nocheck` — perde validação de tipos no backend inteiro.
- **ARCH-004 [ALTA]** Multi-tenancy: `organization_id` em 797 lugares mas request bind ao JWT user depende do dev em cada fn. Sem helper `assertUserBelongsToOrg`. Risco IDOR.
- **ARCH-005 [MÉDIA]** Sem fila/worker — toda operação assíncrona depende de pg_cron + edge fn. Sem DLQ exceto `process-email-queue`.
- **ARCH-006 [MÉDIA]** 10+ páginas >20KB indicam mega-componentes (`SaasLanding.tsx`, `Marketing.tsx`, `Atendimento.tsx`).
- **ARCH-007 [BAIXA]** `.env` versionado com `SUPABASE_PUBLISHABLE_KEY` (anon — público OK), mas convivendo com `VITE_*` duplicada.
- **ARCH-008 [INFO]** 14 fns com `verify_jwt=true`, 74 com `false` (política Lovable — auth no código). Heterogêneo.

### Recomendações
1. Criar `_shared/auth.ts` com `requireAuth(req)` + `assertOrgMember(user, orgId)` — usar em todas fns que aceitam `organization_id` no body
2. Remover `@ts-nocheck` em ondas (10/semana) — começar pelas financeiras
3. Adicionar fila persistente (pgmq) para email/social/whatsapp bulk
4. Documentar contrato I/O de cada fn (OpenAPI ou MD único)

---

## AGENTE 02 — CODE (Código) {#a02-code}

**Aplicabilidade:** Aplicável | **Maturidade:** 5.5/10 | **Risco:** 6/10 | **Confiança:** Alta

### Métricas brutas
- `: any` em src/: **275** (109 só em hooks/)
- `@ts-ignore/nocheck/expect-error`: **500** ocorrências em src/
- `console.log/warn/error` em src/: 29 (OK)
- Páginas >20KB: ≥10
- Testes: 35 arquivos / 264 components + 116 hooks ⇒ **coverage <15%**

### Achados
- **CODE-001 [ALTA]** 500 supressões TS no front
- **CODE-002 [ALTA]** 275 `: any` no src — 109 em hooks (Supabase). Dados de edge fns chegam como `any` e propagam
- **CODE-003 [MÉDIA]** Mega-componentes em 10+ páginas
- **CODE-004 [ALTA]** Coverage ~13%. Sem testes em fluxos financeiros, IA, multi-tenant
- **CODE-005 [MÉDIA]** 220 `console.error/toast.error` — falta canal central (Sentry/GlitchTip)
- **CODE-006 [BAIXA]** 264 components em estrutura plana — segregação por portal inconsistente
- **CODE-007 [INFO]** ESLint flat config presente; falta evidência de execução em CI

### Recomendações
1. Regra ESLint `@typescript-eslint/no-explicit-any: error` por diretório, começar por `src/hooks/`
2. Banir `@ts-nocheck` em código novo (pre-commit)
3. Tipar respostas de edge fns via `supabase gen types typescript`
4. Refatorar páginas >20KB

---

## AGENTE 04 — API (Backend / Edge Functions) {#a04-api}

**Aplicabilidade:** Crítica | **Maturidade:** 5/10 | **Risco:** 8/10 | **Confiança:** Média-Alta

### Achados
- **API-001 [CRÍTICA]** Zod ausente em todas as 100 fns (`grep zod = 0`). Validação ad-hoc.
- **API-002 [ALTA]** 96/99 fns com `@ts-nocheck` — sem garantia de tipagem em pagamento/IA
- **API-003 [ALTA]** Sem padronização de resposta (`{error}` vs `{ok:true}` vs `{message}`). Sem `error_code` nem `trace_id`
- **API-004 [ALTA]** **Idempotência ausente** em `asaas-buy-credits`, `recharge-credits`, `asaas-create-charge`. Cliente clica 2x = 2 cobranças
- **API-005 [ALTA]** Rate limiting ausente nas 14 fns `generate-*` (IA). Drain de créditos trivial
- **API-006 [ALTA]** IDOR: `asaas-create-charge` aceita `organization_id` do body, valida JWT user mas não membership ao org
- **API-007 [MÉDIA]** 236 `console.log` em edge fns; vários logam payloads completos da Meta API (tokens podem aparecer)
- **API-008 [MÉDIA]** CORS dinâmico aceita qualquer subdomínio `.lovable.app/.lovableproject.com` — superfície ampla
- **API-009 [BAIXA]** `auth-email-hook`, `seed-*`, `reset-test-password` em produção — separar por env

---

## AGENTE 05 — DATA (Banco/Modelagem/Performance) {#a05-data}

**Aplicabilidade:** Aplicável | **Maturidade:** 6/10 | **Risco:** 6/10 | **Confiança:** Média-Alta

### Métricas
| Métrica | Valor |
|---|---|
| Migrations totais | 199 |
| Migrations destrutivas (DROP/RENAME) | 0 detectadas |
| RLS habilitado em N migrations | 96 (~48%) |
| Soft delete (`deleted_at`) | **0 ocorrências** |
| Triggers/audit_log | 126 ocorrências |
| `brand_id` em migrations | **0** |
| `CREATE INDEX` sem CONCURRENTLY | 156 |

### Achados
- **DATA-001 [CRÍTICO]** Zero `brand_id` em 199 migrations — sistema multi-marca por design. Tenant scope via `organization_id`. Validar consistência RLS.
- **DATA-002 [ALTO]** 156 `CREATE INDEX` sem `CONCURRENTLY` — em produção bloqueia writes. Aceitável greenfield, gap operacional para escala
- **DATA-003 [ALTO]** Ausência total de soft delete — `useAcademy.ts`, `Matriz.tsx`, `ClienteConfiguracoes.tsx` removem fisicamente
- **DATA-004 [MÉDIO]** RLS em 48% das migrations — cross-check vs total de tabelas necessário
- **DATA-005 [INFO]** 126 referências a triggers/audit — boa cobertura DB-side
- **DATA-006 [BAIXO]** N+1 não detectado em src/hooks/ — bom indicador

---

## AGENTE 06 — SEC (Segurança) {#a06-sec}

**Aplicabilidade:** Aplicável | **Maturidade:** 5/10 | **Risco:** 7/10 | **Confiança:** Alta

### Achados
- **SEC-001 [POLÍTICA — REPORTAR, NÃO BUG]** Maioria das edge fns com `verify_jwt=false`. **É política Lovable** (auth interna via `getUser()` com SEC-NOE-002 fixed). Validar que TODAS de fato fazem `getUser()`.
- **SEC-002 [CRÍTICO — BOLA]** 20+ `.eq("id", ...)` SEM segundo filtro de tenant/owner:
  - `src/pages/Apresentacao.tsx:775,782` — `client_followups`
  - `src/hooks/useAcademy.ts:126,155,211,222,231,248,257`
  - `src/pages/Matriz.tsx:293`, `src/pages/cliente/ClienteConfiguracoes.tsx:234`
  - **Mitigação esperada via RLS**, mas frontend não defende em profundidade
- **SEC-003 [ALTO]** Webhooks `evolution-webhook`, `whatsapp-webhook`, `whatsapp-cloud-webhook`, `meta-leadgen-webhook`, `asaas-webhook` — apenas `meta-data-deletion`, `crm-lead-webhook`, `social-oauth-meta` no grep de HMAC
- **SEC-004 [INFO]** PII em logs: zero em src/ (mas 21 confirmados em edge functions — ver LGPD-001)
- **SEC-005 [INFO]** `agent-followup-cron` exige `Bearer CRON_SECRET` — corretamente protegido
- **SEC-006 [MÉDIO]** Asaas webhook com `verify_jwt=false` confiando em "own signature auth" — confirmar HMAC

---

## AGENTE 07 — PERF (Performance) {#a07-perf}

**Aplicabilidade:** Aplicável | **Maturidade:** 6.5/10 | **Risco:** 5/10 | **Confiança:** Média (sem baseline anterior)

### Baseline (este ciclo estabelece)
- `dist/` total: **11M**
- Top bundles: pdf 617KB, charts 459KB, docx 395KB, ui 317KB, supabase 204KB, index 154KB, framer-motion 128KB
- Code splitting: 125 ocorrências de `lazy()`/dynamic import — ativo
- Realtime: 18 chamadas `.channel()/.subscribe()`, há `realtimeManager.ts` (centralizador)

### Achados
- **PERF-WARN-01** `pdf-D3PF25HD.js` = 617KB. Lazy-load apenas em rotas que geram PDF
- **PERF-WARN-02** `charts` 459KB e `docx` 395KB. Confirmar dynamic import por rota
- **PERF-WARN-03** `ClienteChat.tsx` mistura polling (`setInterval`) com Realtime channel — duplicidade
- **PERF-INFO-04** `realtimeManager.ts` existe mas não usado por todas (ClienteChat, Atendimento, FranqueadoSuporte, NotificationBell, useTeamChat ainda chamam `.channel()` direto)
- **PERF-INFO-05** Sem `rollup-plugin-visualizer` em CI

---

## AGENTE 08 — FIN (FinOps) {#a08-fin}

**Aplicabilidade:** Aplicável | **Maturidade:** 6/10 | **Risco:** 5/10 | **Confiança:** Média

### Achados
- **FIN-INFO-01** IA: 37 ocorrências de modelos, **100% Google Gemini** via Lovable AI Gateway. Sem GPT-4/Claude — bom para custo. Atenção a `gemini-3-pro-image-preview` (mais caro)
- **FIN-WARN-02** Sem cache de prompt em supabase/functions/. `generate-followup`, `generate-prospection`, `get-next-gps-question` são candidatas naturais
- **FIN-WARN-03** 18 channels Realtime ativos com chaves por org/ticket/usuário — auditar fechamento em logout/route change
- **FIN-WARN-04** `ClienteChat.tsx` polling **+** realtime simultâneos — dobra custo
- **FIN-INFO-05** Tabelas grandes prováveis (logs, mensagens, eventos) sem TTL/retenção. Adicionar política (90d logs, 1y eventos)

---

## AGENTE 09 — OPS (DevOps/SLO/Tracing) {#a09-ops}

**Aplicabilidade:** Aplicável | **Maturidade:** 3.5/10 | **Risco:** 8/10 | **Confiança:** Alta

### Achados
- **OPS-CRITICAL-01** `correlation_id`/`traceId`: **0 ocorrências** em src/ ou supabase/functions/. Sem rastreabilidade ponta-a-ponta
- **OPS-CRITICAL-02** Logs estruturados: nenhuma lib (pino/winston/bunyan) — apenas `console.log`
- **OPS-CRITICAL-03** Nenhum runbook ou postmortem no repo. 100 edge fns sem playbooks de incidente
- **OPS-WARN-04** Nenhum endpoint `/health|/ready|/live`. Sem health-check externo
- **OPS-WARN-05** CI `.github/workflows/ci.yml`: 3 jobs (type-check, lint, test). **lint e test com `continue-on-error: true`** — falhas não bloqueiam merge
- **OPS-INFO-06** Deploy/rollback: N/A (Lovable Cloud auto-deploy). Documentar revert via Git
- **OPS-INFO-07** Sem alerting (Sentry, GlitchTip, Datadog)

---

## AGENTE 10 — QA (Testes) {#a10-qa}

**Aplicabilidade:** Aplicável | **Maturidade:** 3.5/10 | **Risco:** 8/10 | **Confiança:** Alta

### Estado
- Testes: 35 arquivos. Vitest configurado. RTL presente
- E2E: **ausente** (sem cypress/playwright)
- SAST/secret scanning no CI: **nenhum**
- Cobre: auth, rbac, asaas-webhook, meta-review, Marketing, MetasRanking, SaasAuth, Auth, Unidades

### Matriz de fluxos críticos
| Fluxo | Unit/Comp | E2E | Monitor | Status |
|---|---|---|---|---|
| Login cliente | ✅ | ❌ | ❌ | QA-WARN |
| Criar campanha ads | ❌ | ❌ | ❌ | **QA-CRITICAL-GAP** |
| Conectar Meta/Google (OAuth) | ❌ | ❌ | ❌ | **QA-CRITICAL-GAP** |
| Dashboard | ❌ | ❌ | ❌ | **QA-CRITICAL-GAP** |
| Conversas WhatsApp | ❌ | ❌ | ❌ | **QA-CRITICAL-GAP** |
| Lead scoring | ❌ | ❌ | ❌ | **QA-CRITICAL-GAP** |

### Achados
- **QA-CRITICAL-01** 5/6 fluxos críticos sem teste/monitor
- **QA-CRITICAL-02** CI permite test/lint failure (`continue-on-error: true`)
- **QA-CRITICAL-03** Sem secret scanning. 100 edge fns com chaves Asaas/Meta/Google/Lovable
- **QA-WARN-04** Sem SAST (semgrep/codeql)
- **QA-WARN-05** Sem E2E
- **QA-INFO-06** Restore drill: N/A (Supabase/Lovable)

---

## AGENTE 11 — INT (Integrações) {#a11-int}

**Aplicabilidade:** Crítica | **Maturidade:** 4.5/10 | **Risco:** 9/10 | **Confiança:** Alta

### Webhooks
| Origem | Função | Auth | HMAC? | Idempotência | DLQ |
|--------|--------|------|-------|---------------|-----|
| Asaas | `asaas-webhook` | header `asaas-access-token` (estático) | ❌ não-HMAC, comparação string | parcial | ❌ |
| Evolution API | `evolution-webhook` | `x-evolution-secret` (estático) | ❌ | ❌ | ❌ |
| Meta Leadgen | `meta-leadgen-webhook` | `hub.verify_token` (GET only) | **❌ POST sem `x-hub-signature-256`** | ❌ | ❌ |
| WhatsApp Cloud | `whatsapp-cloud-webhook` | `hub.verify_token` | ❌ não verifica HMAC (header em CORS mas sem código) | ❌ | ❌ |
| CRM lead generic | `crm-lead-webhook` | aceita `x-webhook-signature` OU `x-hub-signature-256` | parcial | ? | ❌ |
| Google Calendar | `google-calendar-sync` | OAuth | n/a | ? | ❌ |

### Achados
- **INT-001 [CRÍTICA]** Meta Leadgen POST sem `x-hub-signature-256` — forge trivial de leads (PII spam, drain de filas, custo IA)
- **INT-002 [CRÍTICA]** WhatsApp Cloud sem HMAC — chatbot IA acionável por adversário
- **INT-003 [ALTA]** Sem idempotência em webhooks (`INSERT ... ON CONFLICT (provider, external_event_id)`)
- **INT-004 [ALTA]** Comparação non-constant-time (`!==`) em tokens — timing attack
- **INT-005 [ALTA]** Sem DLQ em 99%. Crons (`social-metrics-sync`, `agent-followup-cron`, `billing-reminder-check`) falham silenciosamente
- **INT-006 [MÉDIA]** OAuth tokens em `social_accounts` — não confirmado se criptografados em repouso
- **INT-007 [MÉDIA]** 7 cron jobs mas só 2 fns documentam `Bearer CRON_SECRET`
- **INT-008 [MÉDIA]** `meta-leadgen-pages` loga `JSON.stringify(j)` da Meta API — risco de leak de access tokens
- **INT-009 [BAIXA]** Evolution webhook resolve org via path UUID OU body — risco cross-org se permissivo

---

## AGENTE 12 — AI (IA Value + Risk) {#a12-ai}

**Aplicabilidade:** Aplicável | **Maturidade:** 5.5/10 | **Risco:** 6/10 | **Confiança:** Média

### Achados
- **AI-001 [P1]** 5+ edge fns geram com LLM sem suíte de evals
- **AI-002 [P2]** Não há diretório central de prompts versionado — inline nas edge fns
- **AI-003 [P2]** Audit de prompt injection (`${userInput}` sem sanitização) não realizado em profundidade
- **AI-004 [P3]** Sem RAG/pgvector — features generativas só com contexto in-prompt
- **AI-005 [P2]** Sem rastreamento de custo IA por workflow/tenant — risco financeiro em escala

---

## AGENTE 13 — RUN (Runtime) {#a13-run}

**Aplicabilidade:** Parcial (sem browser) | **Maturidade:** 6/10 | **Risco:** 6/10 | **Confiança:** Baixa

### Achados
- **RUN-001 [P2]** Zero `BroadcastChannel` ou `storage event` — sessões em múltiplas abas não sincronizam logout/role-switch
- **RUN-002 [P3]** 252 `useEffect` não auditados quanto a cleanup
- **RUN-003 [P2]** Deep-link guards: `ProtectedRoute` + `AdminOnlyRoute` + `RoleAccessGuard` presentes. Não testado dinamicamente

---

## AGENTE 14 — PERM (RBAC) {#a14-perm}

**Aplicabilidade:** Aplicável | **Maturidade:** 6/10 | **Risco:** 6/10 | **Confiança:** Média-Alta

### Roles detectados
`super_admin`, `admin`, `franqueado`, `cliente_admin`, `cliente_user` (5 roles vs. expectativa "3 portais")

### Achados
- **PERM-001 [ALTO]** Roles checados via string literal espalhados (ex.: `MetasRanking.tsx:411`). Falta enum/constants central. Risco: typo silencioso vira bypass
- **PERM-002 [ALTO]** Único `ProtectedRoute`. Sem evidência de `RouteGuard` granular por permissão. Gap vs diretiva V2 (4 pontos)
- **PERM-003 [ALTO]** `FranqueadoConfiguracoes.tsx:118,152` — convite default `role: "franqueado"` mas reset para `"cliente_user"`. Inconsistência
- **PERM-004 [MÉDIO]** BOLA em `useAcademy.ts` — depende 100% de RLS
- **PERM-005 [INFO]** Sidebar vs guard alignment: `ClienteSidebar` existe mas guards equivalentes para franqueado/admin não aparecem

---

## AGENTE 15 — MPRF (Multi-perfil) {#a15-mprf}

**Aplicabilidade:** Não testado (V13 — gap crítico) | **Maturidade:** 4/10 | **Risco:** 7/10 | **Confiança:** Baixa

### Achados
- **MPRF-001 [P1]** Ausência de testes E2E multi-perfil. Cada feature pode quebrar isolamento entre 3 portais sem detecção
- **MPRF-002 [P1]** `RoleAccessGuard` (visto em `ClienteLayout`) só aplicado ao portal cliente — franqueado/franqueadora dependem só de `ProtectedRoute` + `allowedRoles`. Auditar paridade

---

## AGENTE 16 — A11Y (Acessibilidade) {#a16-a11y}

**Aplicabilidade:** Aplicável | **Maturidade:** 7.0/10 (revisada após verificação) | **Risco:** 3/10 | **Confiança:** Média

### Achados
- **A11Y-001 [P2]** Sem axe-core/jest-axe no CI. 125+ páginas sem gate automático
- **A11Y-002 [FALSO POSITIVO — verificado 2026-05-01]** ~~7 imagens sem `alt`. Catalogar~~ — **Revalidação detectou: regex multi-linha do auditor original errou. Todas 7 imagens TÊM alt apropriado** (Logo, QR Code PIX, QR Code WhatsApp, Imagem ampliada, Avatar acessório com alt="", \\{name\\} dinâmico). Validado com `grep -Pzo` e leitura manual.
- **A11Y-003 [P3]** Não auditado: contraste em 370 cores customizadas

---

## AGENTE 17 — I18N {#a17-i18n}

**N/A** — sem `i18next`/`react-intl`. Sistema PT-BR única língua.

---

## AGENTE 18 — MOB (Mobile/PWA) {#a18-mob}

**Aplicabilidade:** Aplicável | **Maturidade:** 5.5/10 | **Risco:** 5/10 | **Confiança:** Média

### Achados
- **MOB-001 [P2]** Sistema NÃO é PWA apesar de CLAUDE.md mencionar. Sem manifest, sem SW, sem instalação mobile, sem offline. Lacuna intenção vs implementação
- **MOB-002 [P3]** Touch targets não auditáveis estaticamente
- 609 ocorrências de breakpoints `sm:|md:|lg:` (boa cobertura responsiva)

---

## AGENTE 19 — SEO {#a19-seo}

**Aplicabilidade:** Parcial (rotas públicas existem) | **Maturidade:** 5/10 | **Risco:** 4/10 | **Confiança:** Média

### Achados
- **SEO-001 [P2]** Landing pública (`/crescimento`, `/plataformadoempresario`) em SPA — sem SSR/prerender. JS-bundle pesado prejudica indexação
- **SEO-002 [P3]** Sem evidência de `react-helmet`/meta tags por rota

---

## AGENTE 20 — LGPD {#a20-lgpd}

**Aplicabilidade:** Aplicável | **Maturidade:** 3.5/10 | **Risco:** 9/10 | **Confiança:** Alta — **BLOQUEADOR LEGAL**

### Achados
- **LGPD-001 [P0]** **21 `console.log` com PII** (email/cpf/phone) em `src/` e `supabase/functions/`. Violação direta LGPD Art. 46. Listar e remover/mascarar urgente
- **LGPD-002 [P0]** **Zero soft-delete** em migrations. Sem `deleted_at`, exclusões são hard delete — viola direito ao esquecimento auditável
- **LGPD-003 [P1]** **Sem endpoint DSR** para exportação/exclusão por solicitação do titular. Obrigatório LGPD Art. 18
- **LGPD-004 [P2]** Sem evidência de jobs de retenção/expiração automática
- **LGPD-005 [P3]** Páginas `/termos` e `/privacidade` existem (positivo) — auditar conteúdo (fora escopo estático)

---

## AGENTE 21 — DX (Developer Experience) {#a21-dx}

**Aplicabilidade:** Aplicável | **Maturidade:** 6.5/10 | **Risco:** 3/10 | **Confiança:** Alta

### Achados
- **DX-001 [P2]** Sem `.env.example` — onboarding requer descobrir variáveis lendo código
- **DX-002 [P2]** Sem ADRs — decisões arquiteturais (3 portais, RLS, multi-tenant) não documentadas
- **DX-003 [P3]** README curto (73 linhas) para sistema de 125+ páginas

---

## AGENTE 22 — TEL (Analytics) {#a22-tel}

**Aplicabilidade:** Aplicável | **Maturidade:** 2/10 | **Risco:** 6/10 | **Confiança:** Alta

### Achados
- **TEL-CRITICAL-01** Nenhum provider de analytics em package.json. Zero `track()`/`capture()`. Plataforma cega para funil/ativação/retenção
- **TEL-CRITICAL-02** Sem feature flags. Releases sem kill-switch nem rollout gradual
- **TEL-INFO-03** PII em eventos: N/A (não há eventos). Quando implementar, blocklist email/cpf/phone obrigatória
- **TEL-WARN-04** Recomendar PostHog (open-source, self-hosted possível, inclui flags + analytics + session replay)

---

## AGENTE 23 — BI {#a23-bi}

**N/A** — sem dbt/airflow. Métricas operacionais via Supabase direto. Considerar BI dedicado quando volume crescer.

---

## AGENTE 24 — SUPPLY (Supply Chain) {#a24-supply}

**Aplicabilidade:** Aplicável | **Maturidade:** 4/10 | **Risco:** 6/10 | **Confiança:** Alta

### Achados
- **SUPPLY-001 [ALTO]** Lockfile duplicado: `bun.lockb` E `package-lock.json`. Drift dev↔CI
- **SUPPLY-002 [ALTO]** CODEOWNERS ausente — sem reviewers obrigatórios
- **SUPPLY-003 [ALTO]** Sem Renovate/Dependabot — atualizações manuais (gap vs memória global "Renovate em 7 repos")
- **SUPPLY-004 [MÉDIO]** Apenas 1 workflow CI. Pinning SHA não validado individualmente
- **SUPPLY-005 [MÉDIO]** Branch protection: não checável via repo local — gap a confirmar no GitHub
- **SUPPLY-006 [INFO]** `npm audit`/`bun audit` não executado — recomendar rodar e capturar HIGH/CRITICAL

---

## Encerramento

**Maturidade média ponderada:** 5.1/10
**Risco residual médio ponderado:** 6.7/10
**Achados confirmados:** 87
**Achados críticos (🔴):** 5
**Achados altos (🟡):** 14
**Bloqueadores legais:** LGPD-001, LGPD-002

**Próximo ciclo recomendado:** após implementação dos 4 itens 24h (INT-001, INT-002, API-004, LGPD-001), reauditar com cobertura dinâmica (Playwright multi-perfil) e validação RLS exaustiva.

---

## Status de Remediação — atualizado 2026-05-01 21:30 BRT

**15 PRs criados nesta data atacando os achados.** Ver [`remediacao-status.md`](./remediacao-status.md) para tabela completa, ordem de merge, conflitos esperados e ações pendentes.

### P0 (24h SLA) — cobertura
| Achado | PR | Cobertura |
|--------|----|-----------|
| INT-001 Meta HMAC | [#2](https://github.com/noexcusemktdigital-dev/grow-guard-system/pull/2) | 100% |
| INT-002 WhatsApp HMAC | [#3](https://github.com/noexcusemktdigital-dev/grow-guard-system/pull/3) | 100% |
| API-004 Asaas idempotência | [#6](https://github.com/noexcusemktdigital-dev/grow-guard-system/pull/6) | 100% (3 fns + dedup webhook) |
| LGPD-001 PII redact | [#7](https://github.com/noexcusemktdigital-dev/grow-guard-system/pull/7) | 100% (~24 logs em 15 fns) |
| SEC-002/API-006 BOLA | [#8](https://github.com/noexcusemktdigital-dev/grow-guard-system/pull/8) | parcial (3 fns financeiras + helper) |

### Estruturais P1/P2 atacados
DX-001 [#4] · SUPPLY-002/003 [#5] · DX-003 [#9] · DX-002 [#10] · API-005 [#11] (parcial) · OPS-CRITICAL-01 [#12] (parcial) · API-008 [#13] · INT-005 [#14] (parcial) · AI-001 [#15] (parcial) · API-001 [#16] (parcial)

---

*Auditoria gerada por Claude (auditoriapropria framework v3) em 2026-05-01. Análise estática multi-agente paralelizada (4 sub-agentes). Para contexto completo: `/home/claude/.claude/skills/auditoriapropria/SKILL.md`.*
