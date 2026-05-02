# Arquitetura Técnica — Sistema Noé (grow-guard-system)

> Documento de referência gerado em 2026-05-02.
> Baseado em ADRs (`docs/adr/`), runbooks (`docs/runbooks/`), auditoria técnica (`docs/audits/2026-05-01/`) e análise estática do repositório.
> **Não duplicar** informações já detalhadas nos documentos referenciados — este arquivo é o mapa; os outros são os detalhes.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Diagrama de Arquitetura](#2-diagrama-de-arquitetura)
3. [Frontend](#3-frontend)
4. [Backend — Edge Functions](#4-backend--edge-functions)
5. [Banco de Dados](#5-banco-de-dados)
6. [Helpers Compartilhados (`_shared/`)](#6-helpers-compartilhados-_shared)
7. [Integrações Externas](#7-integrações-externas)
8. [Multi-tenancy](#8-multi-tenancy)
9. [Observabilidade](#9-observabilidade)
10. [LGPD Compliance](#10-lgpd-compliance)
11. [Segurança](#11-segurança)
12. [CI/CD](#12-cicd)
13. [Testes](#13-testes)
14. [PWA](#14-pwa)

---

## 1. Visão Geral

O **Sistema Noé** é um SaaS multi-tenant para redes de franquias de marketing digital (cliente atual: NOEXCUSE). Ele expõe **3 portais distintos** com diferentes escopos de acesso:

| Portal | Perfil | Escopo de dados |
|--------|--------|----------------|
| Franqueadora (rede) | Administrador da rede | Todas as unidades |
| Franqueado | Dono da franquia | Apenas a sua unidade |
| Cliente final | Cliente da unidade | Apenas os próprios dados |

**Stack principal:**

- **Frontend:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend:** Deno edge functions hospedadas no Supabase
- **Banco de dados:** PostgreSQL (Supabase) com RLS
- **Auth:** Supabase Auth (JWT)
- **Hospedagem e deploy:** Lovable Cloud (ver [ADR-001](adr/001-lovable-cloud-platform.md))
- **LLM:** Google Gemini via Lovable AI Gateway (ver [ADR-004](adr/004-ai-gateway-gemini.md))

**Dimensão atual (2026-05-02):**

- ~125 páginas React
- ~104 edge functions Deno
- ~210 migrations SQL
- ~61 componentes de UI reutilizáveis
- ~50 páginas de portal (excluindo componentes inline)

---

## 2. Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USUÁRIO FINAL                                │
│            (browser / PWA instalado em mobile)                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LOVABLE CLOUD                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Frontend SPA (Vite build estático, CDN Lovable)            │   │
│  │  React 18 + TypeScript + shadcn/ui + React Query            │   │
│  │  3 portais: /franqueadora/* | /franqueado/* | /cliente/*    │   │
│  └────────────────────┬────────────────────────────────────────┘   │
│                        │ REST/RPC + Realtime WebSocket              │
│  ┌─────────────────────▼────────────────────────────────────────┐  │
│  │  SUPABASE (gxrhdpbbxfipeopdyygn)                             │  │
│  │                                                               │  │
│  │  ┌───────────────┐  ┌────────────────┐  ┌─────────────────┐ │  │
│  │  │ Auth (JWT)    │  │ PostgreSQL +   │  │  Realtime       │ │  │
│  │  │ + RLS         │  │ RLS + pg_cron  │  │  (subscriptions)│ │  │
│  │  └───────────────┘  └────────────────┘  └─────────────────┘ │  │
│  │                                                               │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  EDGE FUNCTIONS (Deno, ~104 funções)                  │  │  │
│  │  │  _shared/: cors, auth, hmac, idempotency, rate-limit, │  │  │
│  │  │            redact, correlation, cron-auth, schemas,   │  │  │
│  │  │            job-failures, prompts/, email-templates/   │  │  │
│  │  └───────────────────────┬────────────────────────────────┘  │  │
│  └──────────────────────────┼────────────────────────────────────┘  │
│                              │ Lovable AI Gateway                    │
│  ┌───────────────────────────▼────────────────────────────────────┐ │
│  │  AI Gateway (Google Gemini 1.5/2.0 Flash)                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ HTTPS / Webhooks
              ┌───────────────────┼──────────────────────┐
              ▼                   ▼                      ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │  Meta Platform   │  │  Asaas (pagtos)  │  │  Evolution API   │
   │  - Leadgen       │  │  - Cobranças     │  │  (WhatsApp)      │
   │  - WhatsApp Cloud│  │  - Assinaturas   │  │  VPS externo     │
   │  - Instagram Ads │  │  - Pix           │  └──────────────────┘
   └──────────────────┘  └──────────────────┘
              │
   ┌──────────┴───────────┐
   ▼                      ▼
┌──────────────┐  ┌──────────────┐
│ Google Ads   │  │ LinkedIn Ads │
│ Google Cal.  │  │ OAuth        │
└──────────────┘  └──────────────┘
```

---

## 3. Frontend

### Stack

- **React 18** com Suspense e lazy loading por rota
- **TypeScript** — tipagem strict habilitada
- **Vite** como bundler (build + HMR)
- **Tailwind CSS** + **shadcn/ui** (componentes acessíveis)
- **React Router v6** — roteamento baseado em `<Routes>`

### Roteamento e Portais

O arquivo `src/App.tsx` define a estrutura de roteamento. Lazy loading é aplicado em todas as rotas exceto `SaasAuth` e `NotFound` (eager, por serem críticas para o time-to-interactive).

**Estrutura de portais:**

```
/                        → SaasLanding (landing pública)
/auth                    → Auth (login/signup)
/saas-auth               → SaasAuth (autenticação SaaS)
/franqueadora/*          → FranqueadoraLayout (portal admin rede)
/franqueado/*            → FranqueadoLayout (portal franqueado)
/cliente/*               → ClienteLayout (portal cliente final)
```

Cada layout aplica `ProtectedRoute` (verifica JWT ativo) e `RoleAccessGuard` (verifica role do usuário via `profiles.role`).

### Gerenciamento de Estado

- **React Query (`@tanstack/react-query`)** — cache e sincronização de dados do servidor (queries + mutations). Sem Redux.
- **Supabase Realtime** — subscriptions em tabelas selecionadas para atualizações em tempo real.
- **React Context** — apenas para AuthContext (estado de sessão do usuário).
- **Estado local** — `useState`/`useReducer` para estado de componente.

### Tipos Gerados

Tipos TypeScript são gerados a partir do schema do Supabase via script em `scripts/` (PR #65). Usar `supabase gen types` — nunca escrever tipos manuais para entidades do banco.

---

## 4. Backend — Edge Functions

### Runtime e Deploy

- **Runtime:** Deno (gerenciado pelo Supabase)
- **Deploy:** via Lovable Cloud (push em `main` → deploy automático)
- **Autenticação:** `verify_jwt = false` por padrão (ver [ADR-003](adr/003-edge-fns-verify-jwt-false.md)) — cada função é responsável pela própria auth via `requireAuth()` do `_shared/auth.ts`

### Categorias de Edge Functions

**Autenticação e usuários (3 fns)**

| Função | Responsabilidade |
|--------|-----------------|
| `auth-email-hook` | Hook de email customizado do Supabase Auth |
| `invite-user` | Convite de novo membro para organização |
| `manage-member` / `update-member` | CRUD de membros da organização |

**Financeiro — Asaas (12 fns)**

| Função | Responsabilidade |
|--------|-----------------|
| `asaas-webhook` | Recebe webhooks de pagamento/assinatura |
| `asaas-create-charge` / `asaas-charge-client` | Criação de cobranças |
| `asaas-create-subscription` | Assinaturas recorrentes |
| `asaas-cancel-subscription` | Cancelamento de assinaturas |
| `asaas-charge-franchisee` / `asaas-charge-system-fee` | Faturamento de franqueados |
| `asaas-get-pix` | Geração de QR Code Pix |
| `asaas-list-payments` | Listagem de pagamentos |
| `asaas-manage-payment` | Gestão de parcelas |
| `asaas-buy-credits` | Compra de créditos no sistema |
| `asaas-test-connection` | Health check da integração |

**WhatsApp (9 fns)**

| Função | Responsabilidade |
|--------|-----------------|
| `whatsapp-cloud-webhook` | Recebe mensagens da WhatsApp Cloud API (Meta) |
| `whatsapp-webhook` | Recebe eventos do Evolution API |
| `whatsapp-send` / `whatsapp-bulk-send` | Envio de mensagens |
| `whatsapp-setup` | Configuração de instância |
| `whatsapp-sync-chats` / `whatsapp-sync-photos` | Sincronização |
| `whatsapp-load-history` | Carregamento de histórico |
| `whatsapp-typing` | Indicador de digitação |

**Social Media / Ads (14 fns)**

| Função | Responsabilidade |
|--------|-----------------|
| `meta-leadgen-webhook` / `meta-leadgen-subscribe` / `meta-leadgen-pages` | Integração Meta Leadgen |
| `meta-ads-insights` / `meta-data-deletion` | Meta Ads + DSR |
| `social-publish` / `social-publish-post` | Publicação de conteúdo |
| `social-oauth-meta` / `social-oauth-linkedin` / `social-oauth-callback` | OAuth social |
| `social-token-refresh` | Renovação de tokens |
| `social-metrics-sync` / `social-get-insights` / `social-ads-metrics` | Métricas |
| `ads-oauth-start` / `ads-oauth-callback` / `ads-token-refresh` / `ads-sync-metrics` | Google/Meta Ads OAuth |

**IA e Geração de Conteúdo (16 fns generate-*)**

Todas usam o Lovable AI Gateway (Gemini). Ver `_shared/prompts/` para prompts centralizados.

`generate-content`, `generate-daily-checklist`, `generate-daily-tasks`, `generate-followup`, `generate-prospection`, `generate-script`, `generate-site`, `generate-social-briefing`, `generate-social-concepts`, `generate-social-image`, `generate-social-video-frames`, `generate-strategy`, `generate-support-access`, `generate-template-layout`, `generate-traffic-strategy`, `generate-video-briefing`

**Agente de IA (3 fns)**

`ai-agent-reply`, `ai-agent-simulate`, `ai-generate-agent-config`

**Operações e Provisionamento (10 fns)**

`provision-unit`, `delete-unit`, `seed-demo-data`, `seed-users`, `seed-diagnostic-user`, `signup-saas`, `izitech-provision`, `validate-coupon`, `validate-support-access`, `revoke-support-access`

**LGPD / DSR (2 fns)**

`dsr-delete-account`, `dsr-export-data`

**Cron / Scheduler (5 fns)**

`agent-followup-cron`, `billing-reminder-check`, `credits-low-check`, `process-email-queue`, `send-billing-reminder`

**Google Calendar (2 fns)**

`google-calendar-oauth`, `google-calendar-sync`

**Comunicação (2 fns)**

`send-campaign-email`, `send-transactional-email`

**Utilitários (7 fns)**

`get-inicio-data`, `get-next-gps-question`, `get-outbound-ip`, `extract-strategy-answers`, `calculate-gamification`, `recharge-credits`, `receive-candidate`, `transcribe-audio`, `website-chat`, `website-chat-widget`

---

## 5. Banco de Dados

### Tecnologia e Princípios

- **PostgreSQL** gerenciado pelo Supabase
- **~210 migrations SQL** — todas commitadas no repo, idempotentes (ver [ADR-005](adr/005-migrations-idempotent-via-lovable.md))
- **`pg_cron`** para jobs agendados internos
- **Soft-delete** via coluna `deleted_at TIMESTAMPTZ` (adicionado em `20260502010000_add_soft_delete_critical.sql`)

### Multi-tenancy

Isolamento por `organization_id` em todas as tabelas de negócio + RLS. Ver [Seção 8 — Multi-tenancy](#8-multi-tenancy) e [ADR-002](adr/002-multi-tenant-rls.md).

### Padrões de Migration

- `CREATE TABLE IF NOT EXISTS` — idempotente
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — idempotente
- RLS (`ENABLE ROW LEVEL SECURITY` + 4 policies) **na mesma migration** que cria a tabela
- `CREATE INDEX CONCURRENTLY` em arquivo de migration separado (sem transação)

### DSR e Audit

- Tabela `dsr_requests` (migration `20260502020000_add_dsr_requests.sql`) registra todas as solicitações LGPD de titulares de dados.
- Tabela `audit_logs` registra ações críticas com `organization_id`, `user_id`, `action`, `timestamp`.

### Realtime

Subscriptions Supabase ativas em tabelas selecionadas (configurado no Supabase Dashboard). O frontend usa `realtimeManager` em `src/lib/realtimeManager.ts` para gerenciar conexões.

---

## 6. Helpers Compartilhados (`_shared/`)

Diretório `supabase/functions/_shared/` — importado por todas as edge functions. Nunca duplicar lógica que já existe aqui.

| Arquivo | Responsabilidade | Usar quando |
|---------|-----------------|-------------|
| `cors.ts` | Headers CORS com whitelist por `Origin` (prod/dev) | Todo `OPTIONS` e response de fn |
| `auth.ts` | `requireAuth(req)` + `assertOrgMember()` anti-BOLA | Toda fn que exige usuário autenticado |
| `hmac.ts` | HMAC-SHA256 + `timingSafeEqual` para webhooks Meta | `meta-leadgen-webhook`, `whatsapp-cloud-webhook` |
| `idempotency.ts` | Dedup por `Idempotency-Key` + hash SHA-256 do payload | Mutações financeiras (Asaas, créditos) |
| `rate-limit.ts` | Rate limit por `(userId, fnName)` via tabela no Postgres | Fns `generate-*`, autenticação |
| `redact.ts` | Mascara PII em logs (`email`, `cpf`, `cnpj`, `phone`, etc.) | Todo `console.log` com payload de usuário |
| `correlation.ts` | `getCorrelationId(req)` + `newRequestContext()` para tracing | Toda fn (propagação de `x-request-id`) |
| `cron-auth.ts` | `checkCronSecret(req)` para fns invocadas por `pg_cron` | Toda fn de scheduler/cron |
| `schemas.ts` | Zod primitives (`UUID`, `Email`, `PositiveBRL`, etc.) + domain schemas | Validação de payload em toda fn |
| `job-failures.ts` | `logJobFailure()` — registra falhas em tabela `job_failures` | Fns de cron, webhooks críticos |
| `prompts/` | Prompts centralizados para todas as fns `generate-*` | Toda fn que chama o AI Gateway |
| `email-templates/` | Templates React Email para emails transacionais | `auth-email-hook`, `send-transactional-email` |
| `asaas-fetch.ts` | Cliente HTTP para API Asaas com retry/backoff | Toda fn Asaas |
| `asaas-customer.ts` | Helpers de customer Asaas (lookup, create) | Fns de cobrança Asaas |
| `credits.ts` | Operações de crédito do sistema | `asaas-buy-credits`, `recharge-credits` |
| `socialPublish.ts` | Lógica compartilhada de publicação social | `social-publish`, `social-publish-post` |
| `whatsappCircuitBreaker.ts` | Circuit breaker para Evolution API | Fns WhatsApp |

> Nota: `socialPublish.ts`, `whatsappCircuitBreaker.ts`, `asaas-fetch.ts`, `asaas-customer.ts` e `credits.ts` são helpers adicionais além dos 13 originais documentados na spec — fazem parte da evolução natural do `_shared/`.

---

## 7. Integrações Externas

### Asaas (Pagamentos)

- **Função:** cobrança de franqueados, clientes, assinaturas recorrentes, Pix
- **Autenticação:** API Key no header `access_token`
- **Webhooks:** recebidos em `asaas-webhook` com validação de IP allowlist
- **Idempotência:** obrigatória em todas as mutações (ver `_shared/idempotency.ts`)
- **Runbook:** [asaas-payment-issues](runbooks/asaas-payment-issues.md)

### Meta (Facebook/Instagram)

**Leadgen:**
- `meta-leadgen-subscribe` — inscreve página em webhooks de leads
- `meta-leadgen-webhook` — recebe leads, valida HMAC `x-hub-signature-256`
- `meta-leadgen-pages` — lista páginas conectadas

**WhatsApp Cloud API:**
- `whatsapp-cloud-webhook` — recebe mensagens e status, valida HMAC Meta
- `whatsapp-send` — envia mensagens via Cloud API

**Ads:**
- `meta-data-deletion` — endpoint obrigatório de deleção (Meta App Review compliance)
- Acesso via `ads-oauth-*` (fluxo OAuth2 PKCE)

**HMAC:** Todo webhook Meta usa `computeMetaSignature()` de `_shared/hmac.ts`. Ver [runbook webhook-hmac-failed](runbooks/webhook-hmac-failed.md).

### Evolution API (WhatsApp alternativo)

- API REST em VPS externo
- Eventos recebidos em `whatsapp-webhook`
- Circuit breaker implementado em `_shared/whatsappCircuitBreaker.ts`

### Google

**Calendar:**
- `google-calendar-oauth` — fluxo OAuth2
- `google-calendar-sync` — sincronização de eventos de agendamento

**Google Ads:**
- `ads-oauth-start` / `ads-oauth-callback` / `ads-token-refresh` — fluxo OAuth2
- `ads-sync-metrics` / `ads-analyze` — coleta de métricas

**Google Verification:** `public/google4e867a892a3752fb.html` (verificação de propriedade do site)

### LinkedIn

- `social-oauth-linkedin` — OAuth2 para publicação de conteúdo
- `social-publish-post` — publicação via LinkedIn API

### Lovable AI Gateway (Gemini)

- **Modelos:** Google Gemini 1.5 Flash / 2.0 Flash
- **Casos de uso:** geração de conteúdo, scripts, estratégias, briefings, análise de dados
- **Prompts:** centralizados em `_shared/prompts/` (propagados via PR #61)
- Decisão arquitetural: ver [ADR-004](adr/004-ai-gateway-gemini.md)
- Sem fallback para outro provider atualmente

---

## 8. Multi-tenancy

### Modelo

Decisão arquitetural: ver [ADR-002](adr/002-multi-tenant-rls.md).

- **Discriminador:** coluna `organization_id UUID NOT NULL` em toda tabela de negócio
- **Isolamento:** Row Level Security (RLS) nativa do PostgreSQL
- **Onboarding de nova franquia:** `INSERT INTO organizations` + `INSERT INTO organization_memberships`

### Função de Suporte

```sql
-- Retorna o organization_id do usuário logado via JWT claim
CREATE OR REPLACE FUNCTION current_user_organization_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() ->> 'organization_id')::uuid
$$;
```

### Policies RLS

Cada tabela tem 4 policies (SELECT / INSERT / UPDATE / DELETE):

- **Franqueado e cliente:** filtro `organization_id = current_user_organization_id()`
- **Admin de rede:** policy separada sem filtro de `organization_id` (cross-tenant)
- **Service role:** bypass total (usado nas edge functions com `SUPABASE_SERVICE_ROLE_KEY`)

### Anti-BOLA nas Edge Functions

Toda fn que recebe `organization_id` no payload deve chamar `assertOrgMember()` de `_shared/auth.ts` para garantir que o usuário autenticado pertence à organização alvo. Ver auditoria [API-006/SEC-002](audits/2026-05-01/auditoria-tecnica-2026-05-01.md).

### Verificação Frontend

Componente `RoleAccessGuard` em `src/components/RoleAccessGuard.tsx` verifica role do usuário e redireciona caso não tenha acesso ao portal correto.

---

## 9. Observabilidade

### Correlation ID (Tracing End-to-End)

Rollout completo em todas as 104 edge functions (PR #63). Fluxo:

1. Frontend envia `x-request-id` (UUID v4) em todo `fetch` via `_shared/correlation.ts`
2. Edge function extrai via `getCorrelationId(req)` — gera novo se ausente
3. Todos os `console.log` estruturados incluem `{ correlationId, fnName, durationMs }`
4. Response inclui header `x-request-id` de volta
5. Erros reportados ao Sentry/GlitchTip incluem `correlationId` para correlação

### Logs Estruturados

Formato padrão:

```json
{
  "level": "info|warn|error",
  "fn": "nome-da-edge-function",
  "correlationId": "uuid",
  "organizationId": "uuid",
  "durationMs": 123,
  "msg": "descrição do evento"
}
```

PII nunca aparece em logs — use `redact(payload)` de `_shared/redact.ts` antes de logar.

### Job Failures

Falhas de jobs (crons, webhooks críticos) são registradas na tabela `job_failures` via `logJobFailure()` de `_shared/job-failures.ts`. Ver [runbook dlq-investigation](runbooks/dlq-investigation.md).

### Runbooks

8 runbooks operacionais em `docs/runbooks/`. Ver [README dos runbooks](runbooks/README.md) para índice completo por severidade.

### Analytics Frontend

`src/lib/analytics.ts` — provider-agnostic stub. 10 pontos de tracking implementados em fluxos críticos (PR #58). PII bloqueada via `PII_BLOCKLIST` antes de qualquer evento.

---

## 10. LGPD Compliance

### Soft-Delete

Todas as tabelas de negócio com dados de pessoas possuem `deleted_at TIMESTAMPTZ` (migration `20260502010000`). Queries de leitura padrão filtram `WHERE deleted_at IS NULL`. Deleção real só ocorre via processo DSR ou retenção programática.

### DSR (Data Subject Request)

- **Tabela:** `dsr_requests` — audit trail de todas as solicitações
- **Exportação:** `dsr-export-data` gera JSON com todos os dados do titular
- **Deleção:** `dsr-delete-account` anonimiza/deleta dados do titular
- **Runbook:** [dsr-processing](runbooks/dsr-processing.md)
- **Prazo legal:** 15 dias úteis (Art. 18 LGPD)

### Redação de PII

`_shared/redact.ts` mascara automaticamente campos sensíveis (`email`, `cpf`, `cnpj`, `phone`, `password`, `token`, `secret`, `api_key`, etc.) em logs. **Todo payload logado deve passar por `redact()`.**

### Meta Data Deletion

Endpoint `meta-data-deletion` implementado como exigência do Meta App Review (compliance). Ver [meta-app-review-compliance-2026-04-29.md](meta-app-review-compliance-2026-04-29.md).

---

## 11. Segurança

### verify_jwt e Auth

- `verify_jwt = false` é o padrão (ver [ADR-003](adr/003-edge-fns-verify-jwt-false.md))
- Toda fn autenticada chama `requireAuth(req)` de `_shared/auth.ts`
- Resposta padrão em falha de auth: `401 { error: "unauthorized" }`

### BOLA Prevention (Anti-IDOR)

Toda fn que opera sobre recursos de uma organização chama `assertOrgMember(admin, userId, organizationId)`. Queries que recebem `id` do frontend devem ter segundo filtro de tenant:

```typescript
// CORRETO
.eq("id", resourceId).eq("organization_id", userOrgId)

// ERRADO — vulnerável a BOLA
.eq("id", resourceId)
```

### HMAC para Webhooks

Webhooks Meta (Leadgen, WhatsApp Cloud, Instagram) são validados com `computeMetaSignature()` + `timingSafeEqual()` de `_shared/hmac.ts`. Ver [runbook webhook-hmac-failed](runbooks/webhook-hmac-failed.md).

### Idempotência

Mutações financeiras (Asaas, créditos) usam `_shared/idempotency.ts` com `Idempotency-Key` + SHA-256 do payload para prevenir cobranças duplicadas em retry ou duplo-clique. Ver [runbook idempotency-conflicts](runbooks/idempotency-conflicts.md).

### Rate Limiting

`_shared/rate-limit.ts` implementa controle por `(userId, fnName)` via tabela no Postgres. Aplicado em fns `generate-*` e endpoints de autenticação. Ver [runbook rate-limit-tuning](runbooks/rate-limit-tuning.md).

### Cron Secret

Fns invocadas por `pg_cron` ou scheduler externo validam `CRON_SECRET` via `checkCronSecret(req)` de `_shared/cron-auth.ts`. Requisições sem o secret correto retornam `401`.

### CORS

`_shared/cors.ts` implementa whitelist por `Origin` com separação prod/dev. Em produção (`FRONTEND_URL` configurado), apenas o frontend oficial e `localhost` são aceitos. Lovable previews requerem opt-in explícito via `ALLOW_LOVABLE_PREVIEW=true`.

### Rotação de Secrets

Ver [runbook secret-rotation](runbooks/secret-rotation.md). Toda rotação requer 2 confirmações explícitas (diretiva crítica do projeto).

---

## 12. CI/CD

### Pipeline Principal

O deploy é gerenciado pela **Lovable Cloud** (ver [ADR-001](adr/001-lovable-cloud-platform.md)):

1. Pull Request criado no GitHub (`feat/*`, `fix/*`, etc.)
2. Preview automático gerado pela Lovable
3. Merge em `main` → deploy automático de:
   - Frontend (build Vite → CDN)
   - Edge functions (Deno → Supabase)
   - Migrations SQL (aplicadas em ordem pelo Lovable)
   - Secrets (gerenciados pelo Lovable)

### GitHub Actions

Workflows em `.github/workflows/` para gates de qualidade:

- Lint TypeScript (`tsc --noEmit`)
- ESLint
- Vitest (unit + integration)
- Playwright E2E (em ambiente de staging)

> Nota: o gate `continue-on-error: true` em CI foi identificado como risco na auditoria [OPS](audits/2026-05-01/auditoria-tecnica-2026-05-01.md) — tratar como tech debt.

### Não usar

- `supabase db push` — diverge do estado gerenciado pela Lovable
- `supabase functions deploy` — deploy deve ir via Lovable
- Deploy manual de migrations — só via commit no repo

---

## 13. Testes

### Vitest (Unit / Integration)

- Config: `vitest.config.ts`
- Ambiente: `jsdom`
- Localização: `src/**/*.{test,spec}.{ts,tsx}`
- Setup: `src/test/setup.ts`
- Rodar: `npx vitest run`

**Cobertura target:** Phase 19 do roadmap de testes (pirâmide). Status atual: em implantação.

### Playwright (E2E)

- Config: `playwright.config.ts`
- Diretório: `e2e/`
- Ambiente: staging (`BASE_URL` via env var)
- Workers: 1 (sequencial — compartilham DB de staging)
- Fluxos cobertos (PR #62):
  - Pagamento Asaas (`asaas-payment.spec.ts`)
  - DSR export + delete (`dsr-export-delete.spec.ts`)
  - Conversa WhatsApp (`whatsapp-conversation.spec.ts`)

### Evals de IA

- Diretório: `evals/`
- Propósito: avaliação qualitativa de outputs das fns `generate-*`
- Executados manualmente antes de mudanças em prompts

### Status QA (auditoria 2026-05-01)

Maturidade QA: **3.5/10** — 5 de 6 fluxos críticos sem cobertura automatizada. Ver [Agente 10 — QA](audits/2026-05-01/auditoria-tecnica-2026-05-01.md) para backlog priorizado.

---

## 14. PWA

### Configuração

- `public/manifest.json` — Web App Manifest (nome, ícones, cores, `display: standalone`)
- Service Worker registrado via Vite PWA plugin
- `public/offline.html` — página de fallback quando offline

### Funcionalidades

- Instalável em Android/iOS ("Adicionar à tela inicial")
- Cache de assets estáticos via service worker
- Offline page para rotas não cacheadas
- PWA Update Prompt (`src/components/PWAUpdatePrompt.tsx`) — notifica usuário quando nova versão disponível (PR #36)

### Ícones

Ver `public/PWA-ICONS-README.md` para especificações de ícones por plataforma.

---

## Referências

- [ADR-001: Lovable Cloud como plataforma única](adr/001-lovable-cloud-platform.md)
- [ADR-002: Multi-tenant via organization_id + RLS](adr/002-multi-tenant-rls.md)
- [ADR-003: Edge functions com verify_jwt=false](adr/003-edge-fns-verify-jwt-false.md)
- [ADR-004: AI Gateway Lovable (Gemini)](adr/004-ai-gateway-gemini.md)
- [ADR-005: Migrations idempotentes commitadas no repo](adr/005-migrations-idempotent-via-lovable.md)
- [Auditoria Técnica 2026-05-01](audits/2026-05-01/auditoria-tecnica-2026-05-01.md)
- [Runbooks operacionais](runbooks/README.md)
- [Guia de Credenciais Ads](guia-credenciais-ads-v2.md)
- [Meta App Review Compliance](meta-app-review-compliance-2026-04-29.md)
- [RLS Audit 2026-05-01](rls-audit-2026-05-01.md)
