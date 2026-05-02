# E2E Tests — Sistema Noé

Playwright cobrindo fluxos críticos multi-perfil.

## Setup

```bash
npm install --save-dev @playwright/test
npx playwright install --with-deps chromium
```

## Configurar credenciais

Copie `.env.example` → `.env.e2e` e preencha **credenciais de STAGING** (NUNCA prod):

```bash
CI_E2E_SUPER_ADMIN_EMAIL=...
CI_E2E_ADMIN_EMAIL=...
CI_E2E_FRANQUEADO_EMAIL=...
CI_E2E_CLIENT_EMAIL=...
CI_E2E_OTHER_CLIENT_EMAIL=...
```

## Rodar

```bash
# Local (precisa npm run dev rodando)
BASE_URL=http://localhost:8080 npm run e2e

# Staging
BASE_URL=https://staging.noexcuse.com.br npm run e2e

# UI mode (debug)
npm run e2e:ui
```

## Suítes

| Suíte | Testes | Cobertura |
|-------|--------|-----------|
| login-roles | 6 (5 roles + invalid) | 5 perfis logam no portal certo |
| cross-tenant | 2 | Isolamento entre clients |
| ads-campaign | 2 | Smoke do fluxo ads |

## CI

Workflow `.github/workflows/e2e.yml` (criar separadamente, depende de secrets):
- Roda em PRs que tocam `src/`, `supabase/functions/`
- Skip se label `skip-e2e`
- Trace + screenshot + video em failures

## Roadmap

Round 2 cobre:
- Fluxo Asaas (charge → webhook → credit)
- Fluxo OAuth Meta/Google
- Conversas WhatsApp
- Geração de conteúdo IA
