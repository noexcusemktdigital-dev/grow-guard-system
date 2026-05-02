# Quick Start (5 minutos)

Guia para rodar o **Sistema Noé** localmente em desenvolvimento.

## Pré-requisitos

- Node.js >= 22 (recomendado: 22 LTS)
- npm 10+
- git

## Passos

```bash
git clone https://github.com/noexcusemktdigital-dev/grow-guard-system.git
cd grow-guard-system
cp .env.example .env
npm install
npm run dev
```

Abra <http://localhost:8080> no navegador.

### Configurar `.env`

O único campo obrigatório para rodar o frontend é:

```env
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key-do-supabase-dashboard>
VITE_SUPABASE_URL=https://gxrhdpbbxfipeopdyygn.supabase.co
```

Obtenha a chave em: **Supabase Dashboard → Project Settings → API → anon public**.

As demais variáveis (integrações Meta, Asaas, Evolution, etc.) são opcionais para desenvolvimento local — as edge functions que dependem delas falharão graciosamente se não configuradas.

## Login de teste

Use as credenciais de teste documentadas em `docs/ONBOARDING.md` (seção "Credenciais de Ambiente"). Não commitar credenciais reais.

## Comandos essenciais

| Comando | Uso |
|---------|-----|
| `npm run dev` | Dev server com HMR |
| `npm run build` | Build de produção |
| `npm test` | Vitest (unit tests) |
| `npm run e2e` | Playwright (E2E) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check |
| `npm run check:stale-time` | Gate de stale-time React Query |
| `npm run lhci` | Lighthouse CI |
| `npm run types:supabase` | Regenera types Supabase |

## Como rodar os testes

```bash
# Unitários (Vitest)
npm test

# Com cobertura
npm run coverage

# E2E (requer npm run build antes se for headless)
npm run e2e

# E2E com UI interativa
npm run e2e:ui
```

## Como criar uma nova Edge Function

Consulte [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — seção **Edge Functions** — para o padrão de criação, variáveis de ambiente e deploy via Lovable Cloud.

> Edge functions são gerenciadas exclusivamente pelo Lovable Cloud. Não use `supabase functions deploy` manualmente.

## Próximos passos

- Arquitetura do sistema: [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)
- Contribuindo com código: [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- Onboarding completo: [`docs/ONBOARDING.md`](ONBOARDING.md)
- Deployment e ambientes: [`docs/DEPLOYMENT.md`](DEPLOYMENT.md)

## Troubleshooting

Consulte [`docs/TROUBLESHOOTING.md`](TROUBLESHOOTING.md) para erros comuns (CORS, RLS, variáveis ausentes, problemas de autenticação).
