# Sistema Noé (grow-guard-system)

[![CI](https://img.shields.io/github/actions/workflow/status/noexcusemktdigital-dev/grow-guard-system/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/noexcusemktdigital-dev/grow-guard-system/actions)
[![Version](https://img.shields.io/github/package-json/v/noexcusemktdigital-dev/grow-guard-system?style=flat-square)](package.json)
[![License](https://img.shields.io/badge/license-proprietary-red?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen?style=flat-square)](https://nodejs.org)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-purple?style=flat-square)](https://web.dev/progressive-web-apps/)
[![LGPD](https://img.shields.io/badge/LGPD-compliant-blue?style=flat-square)](docs/SECURITY-POLICY.md)
[![Supabase](https://img.shields.io/badge/Supabase-gxrhdpbbxfipeopdyygn-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Lovable](https://img.shields.io/badge/deploy-Lovable%20Cloud-orange?style=flat-square)](https://lovable.dev)

> Plataforma de marketing digital para redes de franquias.
> Cliente principal: NOEXCUSE (Davi Tesch).
> Operada via Lovable Cloud.

## Visão geral

Sistema Noé é um SaaS multi-tenant para gestão de marketing digital em redes de franquias: campanhas de ads (Meta/Google), CRM, geração de conteúdo por IA, conversas WhatsApp, sites e relatórios consolidados. Atende três personas — franqueadora (rede), franqueado (unidade) e cliente final — em portais segregados por RLS no Supabase.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + shadcn-ui + Tailwind + Framer Motion
- **Backend:** Supabase (PostgreSQL + Edge Functions + Auth + Realtime + Storage) — projeto `gxrhdpbbxfipeopdyygn`
- **Hosting:** Lovable Cloud (auto-deploy via push em `main`)
- **AI:** Lovable AI Gateway (Google Gemini)
- **Integrações:** Asaas (pagamentos), Meta Ads/Leadgen/WhatsApp Cloud, Google Ads/Calendar, Evolution API (WhatsApp via VPS Lamadre)
- **Estado/Dados:** TanStack Query, Zod, react-hook-form
- **Testes:** Vitest + Testing Library + jsdom

## Características

- **PWA Ready** — Progressive Web App com suporte offline e instalação nativa
- **Multi-tenant** — Isolamento por `organization_id` + Row Level Security no Supabase
- **LGPD Compliant** — Sanitização de PII via `redact.ts`, consentimento e retenção controlada
- **Idempotência** — `withIdempotency` wrapper para todas as mutações críticas
- **Correlation IDs** — Rastreamento ponta a ponta em edge functions e webhooks
- **Soft-delete** — Registros preservados com `deleted_at`, nunca removidos fisicamente
- **DSR (Data Subject Requests)** — Suporte a export e exclusão de dados de usuários (LGPD Art. 18)
- **Anti-BOLA** — `assertOrgMember` em todas as edge functions com mutações cross-tenant
- **Realtime** — Supabase Realtime em tabelas críticas para updates instantâneos na UI
- **100+ Edge Functions** — Pagamentos, webhooks, IA generativa, OAuth, crons

## Arquitetura — 3 Portais

| Portal | Roles | Funcionalidades |
|--------|-------|-----------------|
| **Franqueadora** (admin rede) | `super_admin`, `admin` | gestão de unidades, comunicados globais, métricas consolidadas, CRM master |
| **Franqueado** | `franqueado` | gestão da própria unidade, equipe, métricas locais, ads, conteúdo |
| **Cliente** | `cliente_admin`, `cliente_user` | dashboard de campanhas, conversas WhatsApp, sites, IA (geração de conteúdo) |

Multi-tenant via `organization_id` + RLS no Supabase. Toda mutação crítica passa por `assertOrgMember` (anti-BOLA) nas edge functions.

## Documentação

| Doc | Conteúdo |
|-----|----------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura técnica, 3 portais, helpers, multi-tenancy |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Workflow de contribuição, PRs, testes |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy via Lovable Cloud, rollback |
| [SECURITY-POLICY.md](docs/SECURITY-POLICY.md) | Política de segurança e disclosure |
| [ONBOARDING.md](docs/ONBOARDING.md) | Guia para novos desenvolvedores |
| [PERFORMANCE.md](docs/PERFORMANCE.md) | Métricas e Lighthouse CI |
| [FAQ.md](docs/FAQ.md) | Perguntas frequentes |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Diagnóstico e soluções |
| [adr/](docs/adr/) | Architecture Decision Records |
| [runbooks/](docs/runbooks/) | Runbooks operacionais |
| [audits/](docs/audits/) | Auditorias técnicas |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de mudanças |

## Setup local

### Pré-requisitos
- Node.js 22+
- npm (ou bun — `bun.lockb` presente)
- Acesso ao Supabase do projeto (`gxrhdpbbxfipeopdyygn`)

### Quick Start

```bash
git clone https://github.com/noexcusemktdigital-dev/grow-guard-system.git
cd grow-guard-system
cp .env.example .env  # preencher VITE_SUPABASE_PUBLISHABLE_KEY se aplicável
npm install
npm run dev
```

App roda em http://localhost:8080.

Para guia completo de onboarding (Supabase, segredos, testes, primeiro PR), veja [ONBOARDING.md](docs/ONBOARDING.md).

## Comandos principais

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | dev server (HMR) |
| `npm run build` | build de produção |
| `npm run build:dev` | build em modo development |
| `npm run preview` | preview do build |
| `npm run lint` | ESLint (flat config) |
| `npm test` | Vitest (run único) |
| `npm run test:watch` | Vitest em watch mode |
| `npm run coverage` | Cobertura via @vitest/coverage-v8 |
| `npx tsc --noEmit` | type-check |

## Edge Functions (Supabase)

100+ edge functions em `supabase/functions/`. Categorias:

- **Pagamentos:** `asaas-*`, `recharge-credits`, `credits-*`
- **Webhooks:** `*-webhook` (Asaas, Evolution, Meta Leadgen, WhatsApp Cloud)
- **IA generativa:** `generate-*` (conteúdo, imagens, vídeos via Gemini)
- **OAuth:** `*-oauth-*` (Meta, Google, LinkedIn, TikTok)
- **Crons:** `*-cron`, `*-sync` (rodam via pg_cron)

Helpers compartilhados em `supabase/functions/_shared/`:
- `cors.ts` — headers CORS
- `hmac.ts` — validação HMAC de webhooks (Meta)
- `auth.ts` — `requireAuth` + `assertOrgMember` (anti-BOLA)
- `idempotency.ts` — wrapper `withIdempotency` para mutações críticas
- `redact.ts` — sanitização de PII em logs (LGPD)

## Workflow de mudanças

### Migrations SQL
1. Criar arquivo em `supabase/migrations/NNNN_verb_subject.sql` (idempotente, RLS junto)
2. Commit + push em branch
3. PR + review
4. Após merge: aplicar via Lovable SQL Editor (NUNCA `supabase db push` direto)

### Edge functions
1. Editar em `supabase/functions/{nome}/index.ts`
2. Adicionar entry em `supabase/config.toml` se nova
3. PR + merge → Lovable sincroniza (até ~10min)

### Frontend
- Push em branch + PR + merge → Lovable rebuilda automaticamente.
- **Nunca** usar o preview lento do Lovable como ciclo de desenvolvimento — editar direto no código e empurrar para o GitHub.

## Documentação

- `docs/adr/` — Architecture Decision Records (quando aplicável)
- `docs/auditorias/` — Auditorias técnicas periódicas
- `docs/guia-credenciais-ads-v2.md` — credenciais e setup de plataformas de ads
- `docs/meta-app-review-compliance-2026-04-29.md` — compliance Meta App Review
- `docs/social-integration-plan.md` — plano de integrações sociais
- `docs/ROLLBACK.md` — procedimentos de rollback

## Auditoria

Auditorias técnicas vivem em `docs/auditorias/`. Itens críticos identificados são endereçados em PRs separados com SLA de 24h (DX, segurança, RLS, compliance LGPD).

## Lovable

Projeto operado pela Lovable Cloud. Para abrir no editor: [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID).

Para conectar domínio customizado: Project → Settings → Domains → Connect Domain. Documentação: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain).

## Contato

- Time: NOEXCUSE / IZITECH
- Owner: Rafael Marutaka
- GitHub: [noexcusemktdigital-dev/grow-guard-system](https://github.com/noexcusemktdigital-dev/grow-guard-system)
