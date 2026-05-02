# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added (Adicionado)

- Phase 11: useGoalProgress hook, CrmContactsView component, edge-base-url helper, correlation-extra tests (PR #110)
- Phase 12: error-toast helper, idempotency-edge helper, MemberPermissionsEditor component, useSupportTickets hook, auth-helper tests (PR #114)
- Lighthouse CI config + docs/PERFORMANCE.md (PR #97)
- E2E +3 specs: crm-create-lead, content-generation, sidebar-nav (PR #98)
- docs/FAQ.md + docs/TROUBLESHOOTING.md (888 linhas) (PR #99)
- src/lib/error-toast.ts helper unificado com rollout em 6+14 callsites (PR #108, #113)
- src/lib/formatters.ts com 7 formatadores PT-BR (PR #112)
- analytics-events: ERROR_DISPLAYED event adicionado
- 8 edge functions removidas de @ts-nocheck (PR #103)
- 16 components removidos de @ts-nocheck (PR #105, #107, #111)
- PWA: manifest + service worker + offline page (PR #36)
- DSR endpoints LGPD Art. 18 (export-data + delete-account) + UI no portal cliente (PR #25, #34)
- Soft-delete em finance_clients, crm_leads, organization_memberships (PR #20, #27)
- Idempotency-Key em mutações Asaas (PR #6, #33)
- Rate limit em 16/16 fns generate-* IA (PR #11, #22)
- Job failures DLQ (job_failures table + helper) cobrindo 6/6 crons (PR #14, #29)
- Correlation ID 100% backend + frontend (PR #12, #23, #35, #39, #43, #60, #63)
- Prompts versionados em _shared/prompts/ (15/16 fns IA) — PR #28, #50, #54, #55, #61
- Zod schemas validation em fns críticas (PR #16, #30, #49)
- assertOrgMember anti-BOLA em fns mutantes (PR #8, #21, #51)
- HMAC SHA-256 em meta-leadgen-webhook + whatsapp-cloud-webhook (PR #4, #5)
- TS strict flags: noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitOverride (PR #46)
- Tests automatizados: 283+ asserts cobrindo 14+ helpers (PR #19, #24, #38, #53)
- E2E Playwright: 6 spec files cobrindo login, cross-tenant, ads, asaas, dsr, whatsapp (PR #26, #62)
- AI evals scaffold + fixtures: 11/16 generate-* fns (PR #15, #48)
- Runbooks operacionais (8 P0-P3): webhook-hmac-failed, asaas-payment, idempotency-conflicts, rate-limit, dsr-processing, pg-cron-failures, dlq-investigation, secret-rotation (PR #37)
- Analytics layer agnóstica + 25 eventos taxonomia + 10 tracks (PR #52, #58)
- ADRs essenciais: Lovable Cloud, multi-tenant, verify_jwt, AI Gateway, migrations (PR #10)
- SEO: meta tags + sitemap + robots em rotas públicas + react-snap prerender (PR #31, #41)
- Bundle splitting: charts/pdf/docx lazy-loaded em 5 páginas (PR #44)
- Image optimization: vite-imagetools + OptimizedImage helper (PR #47)
- Supabase types gen script + Tables<T> helpers (PR #65)
- Frontend retry/backoff em invokeEdge (resiliência) (PR #64)
- CODEOWNERS + Renovate config (PR #2)
- README expandido + .env.example (PR #3, #9)

### Changed (Alterado)

- Types: 39 hooks tipados via Tables<> generics
- Types: ~26 components tipados com interfaces explícitas
- Types: 30 pages tipadas (zero `any` em src/pages/)
- ~250+ ocorrências de `:any` removidas no total
- README: 73 → 120 linhas com stack + 3 portais + setup (PR #9)
- CORS hardening: allowlist por origin (PR #13)
- Frontend: ~50 hooks/components migram para invokeEdge wrapper

### Fixed (Corrigido)

- evolution-webhook resolver hardening (INT-009) (PR #66)
- RLS reaplicada em 7 tabelas críticas (PR #59)
- Frontend defense-in-depth: 19 mutations com segundo filtro orgId (PR #83)
- LGPD-001: ~40 console.log com PII redactados (PR #7, #42)
- API-008: CORS aceitava qualquer subdomínio Lovable (PR #13)
- INT-007: 3 crons sem CRON_SECRET enforce (PR #18)

### Tests

- ~661 asserts acumulados em suite de testes
- 9 specs E2E Playwright cobrindo fluxos críticos

### Security

- Auditoria completa 2026-05-01 (PR #1) — 87 achados, 5 críticos
- 5/5 P0 (24h SLA) cobertos: INT-001 (Meta HMAC), INT-002 (WhatsApp HMAC), API-004 (Asaas idempotency), LGPD-001 (PII redact), SEC-002 (BOLA)

## [1.0.0] - 2026-04-28

- Versão inicial cliente NOEXCUSE em produção
