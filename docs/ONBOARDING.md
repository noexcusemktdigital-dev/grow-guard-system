# Onboarding — Sistema Noé (grow-guard-system)

> Objetivo: novo dev realiza o primeiro PR em menos de 1 dia.
> Último update: 2026-05-02

---

## Índice

1. [Antes de começar](#1-antes-de-começar)
2. [Setup local](#2-setup-local)
3. [Primeira navegação](#3-primeira-navegação)
4. [Estrutura de pastas](#4-estrutura-de-pastas)
5. [Fluxo de uma feature](#5-fluxo-de-uma-feature)
6. [Onde encontrar coisas](#6-onde-encontrar-coisas)
7. [Helpers compartilhados (`_shared/`)](#7-helpers-compartilhados-_shared)
8. [Comandos úteis](#8-comandos-úteis)
9. [Debugging comum](#9-debugging-comum)
10. [Quem perguntar](#10-quem-perguntar)

---

## 1. Antes de começar

### Acesso necessário

Solicitar ao maintainer (@rafmarutaka) antes de iniciar:

| Recurso | O que é | Como obter |
|---------|---------|-----------|
| GitHub | Repositório `noexcusemktdigital-dev/grow-guard-system` | Convite por email |
| Supabase | Dashboard do projeto `gxrhdpbbxfipeopdyygn` | Conta Supabase + acesso ao org |
| Lovable | Editor cloud e deploy | Acesso via Lovable Dashboard |

### Credenciais de teste

O ambiente de teste usa contas internas. Solicitar ao maintainer as credenciais para cada role:

| Role | Escopo | Usar para |
|------|--------|-----------|
| `super_admin` / `admin` | Portal Franqueadora | Ver dados de toda a rede |
| `franqueado` | Portal Franqueado | Ver dados de uma unidade |
| `cliente_admin` / `cliente_user` | Portal Cliente | Ver campanhas e conversas da unidade |

> As credenciais de teste nunca devem ser commitadas. Jamais usar dados de produção para desenvolvimento.

---

## 2. Setup local

### Pré-requisitos

- Node.js 22+
- npm (ou bun — `bun.lockb` também está presente)
- Acesso ao Supabase do projeto (ver seção anterior)

### Clone e instalação

```bash
git clone https://github.com/noexcusemktdigital-dev/grow-guard-system.git
cd grow-guard-system

# Copiar variáveis de ambiente
cp .env.example .env
# Preencher VITE_SUPABASE_PUBLISHABLE_KEY e demais valores conforme .env.example
# Nunca commitar o .env preenchido — já está no .gitignore

npm install
npm run dev
```

O app sobe em **http://localhost:8080**.

> Secrets de produção ficam exclusivamente no **Lovable Dashboard → Settings → Secrets**.
> Nunca colocar secrets em código, `.env` commitado ou GitHub Actions.

---

## 3. Primeira navegação

Com o app rodando em http://localhost:8080, faça login com a credencial de teste de cada role e explore os três portais:

### Portal Franqueadora (`/franqueadora/*`)

Roles: `super_admin`, `admin`
Acesso a todas as unidades da rede: métricas consolidadas, comunicados globais, gestão de franqueados, CRM master, financeiro da rede.

### Portal Franqueado (`/franqueado/*`)

Role: `franqueado`
Escopo restrito à própria unidade: campanhas de ads, conteúdo gerado por IA, equipe, WhatsApp, métricas locais.

### Portal Cliente (`/cliente/*`)

Roles: `cliente_admin`, `cliente_user`
Visão do cliente final da unidade: dashboard de campanhas, conversas WhatsApp, sites, geração de conteúdo IA.

> Os portais são segregados por RLS no Supabase. Tentar acessar `/franqueadora/` com um `franqueado` logado resulta em redirecionamento pelo `RoleAccessGuard`.

---

## 4. Estrutura de pastas

```
grow-guard-system/
├── src/
│   ├── App.tsx                  # Roteamento principal — 3 portais + auth
│   ├── components/
│   │   ├── ui/                  # shadcn/ui — componentes base reutilizáveis
│   │   └── <domínio>/           # Componentes de negócio por domínio
│   ├── hooks/                   # React Query hooks e hooks de estado
│   ├── pages/                   # Páginas React (~125 páginas)
│   ├── integrations/
│   │   └── supabase/
│   │       └── types.ts         # Tipos gerados — usar Tables<> aqui
│   ├── lib/
│   │   ├── invokeEdge.ts        # Helper para chamar edge functions
│   │   └── realtimeManager.ts   # Gerenciamento de subscriptions Realtime
│   └── __tests__/               # Testes Vitest
├── supabase/
│   ├── functions/
│   │   ├── _shared/             # Helpers compartilhados — ver seção 7
│   │   └── <nome-da-fn>/        # Uma pasta por edge function (~104 fns)
│   ├── migrations/              # Migrations SQL idempotentes (~210 arquivos)
│   └── config.toml              # Configuração Supabase (edge fns registradas)
├── e2e/                         # Testes Playwright (E2E)
├── evals/                       # Evals de qualidade dos outputs de IA
├── docs/
│   ├── ARCHITECTURE.md          # Mapa arquitetural completo
│   ├── ONBOARDING.md            # Este arquivo
│   ├── adr/                     # Architecture Decision Records
│   ├── runbooks/                # Runbooks operacionais
│   └── audits/                  # Auditorias técnicas periódicas
├── CONTRIBUTING.md              # Guia de contribuição detalhado
├── CODEOWNERS                   # Reviewers obrigatórios por área
└── CHANGELOG.md                 # Histórico de mudanças para usuários
```

---

## 5. Fluxo de uma feature

Exemplo concreto: **adicionar campo `origem` em CRM lead**.

### Passo 1 — Migration SQL

Criar `supabase/migrations/20260502_001_add-campo-origem-leads.sql`:

```sql
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS origem text;

-- Nenhuma migration nova de RLS necessária para campo simples;
-- as policies existentes já cobrem a tabela.
```

Regras obrigatórias:
- `IF NOT EXISTS` / `IF EXISTS` em todo DDL (idempotência)
- RLS incluído na mesma migration quando criar tabela nova
- Nunca usar `supabase db push` — a Lovable aplica via Git após o merge

### Passo 2 — Commit e branch

```bash
git checkout main && git pull
git checkout -b feat/crm-campo-origem

git add supabase/migrations/20260502_001_add-campo-origem-leads.sql
git commit -m "feat(crm): adicionar campo origem em tabela leads"
```

### Passo 3 — Atualizar tipos TypeScript

Após a migration existir no repo (ou localmente via Supabase Studio):

```bash
npm run types:supabase
# Atualiza src/integrations/supabase/types.ts
git add src/integrations/supabase/types.ts
git commit -m "chore(types): regenerar types após migration campo origem"
```

### Passo 4 — Hook usando `Tables<>`

Em `src/hooks/useLeads.ts`:

```typescript
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;
// Lead.origem já está tipado — sem interface manual
```

### Passo 5 — Component usa o hook

Em `src/components/crm/LeadCard.tsx`:

```tsx
import { useLeads } from "@/hooks/useLeads";

export function LeadCard({ leadId }: { leadId: string }) {
  const { data: lead, isLoading } = useLeads(leadId);

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return <div>{lead?.origem ?? "—"}</div>;
}
```

### Passo 6 — Teste com Vitest

Em `src/__tests__/useLeads.test.ts`:

```typescript
describe("useLeads — campo origem", () => {
  it("deve exibir origem quando preenchida", () => { ... });
  it("deve exibir traço quando origem é null", () => { ... });
  it("deve mostrar Skeleton durante loading", () => { ... });
  // Mínimo 5 assertions por arquivo
});
```

### Passo 7 — Checklist pré-PR

```bash
npm run types:check       # Zero erros TypeScript
npm run lint              # Zero erros ESLint
npm run test              # Vitest passa
npm run check:stale-time  # Todos os useQuery com staleTime
```

### Passo 8 — PR

```bash
git push origin feat/crm-campo-origem
# Abrir PR no GitHub com título: feat(crm): adicionar campo origem em leads
```

Após merge em `main`, a Lovable aplica a migration e faz deploy do frontend automaticamente.

---

## 6. Onde encontrar coisas

| O que procurar | Onde está |
|---------------|-----------|
| Decisões arquiteturais | `docs/adr/` — 5 ADRs ativos |
| Runbooks operacionais | `docs/runbooks/` — 8 runbooks por severidade |
| Auditorias técnicas | `docs/audits/` |
| Arquitetura geral | `docs/ARCHITECTURE.md` |
| Guia de contribuição | `CONTRIBUTING.md` |
| Reviewers obrigatórios | `CODEOWNERS` |
| Testes unitários | `src/__tests__/` e `src/**/*.{test,spec}.ts` |
| Testes E2E | `e2e/` |
| Evals de IA | `evals/` |
| Tipos do banco | `src/integrations/supabase/types.ts` |
| Histórico de mudanças | `CHANGELOG.md` |

### ADRs disponíveis

| ADR | Decisão |
|-----|---------|
| [ADR-001](adr/001-lovable-cloud-platform.md) | Lovable Cloud como plataforma única de deploy |
| [ADR-002](adr/002-multi-tenant-rls.md) | Multi-tenant via `organization_id` + RLS |
| [ADR-003](adr/003-edge-fns-verify-jwt-false.md) | `verify_jwt=false` nas edge functions |
| [ADR-004](adr/004-ai-gateway-gemini.md) | Lovable AI Gateway (Google Gemini) |
| [ADR-005](adr/005-migrations-idempotent-via-lovable.md) | Migrations commitadas, aplicadas via Lovable |

### Runbooks disponíveis

Ver `docs/runbooks/README.md` para índice por severidade. Runbooks existentes:
`asaas-payment-issues`, `dlq-investigation`, `dsr-processing`, `idempotency-conflicts`, `pg-cron-failures`, `rate-limit-tuning`, `secret-rotation`, `webhook-hmac-failed`.

---

## 7. Helpers compartilhados (`_shared/`)

Diretório `supabase/functions/_shared/`. Toda edge function nova deve importar daqui — nunca duplicar lógica.

| Helper | Quando usar |
|--------|-------------|
| `cors.ts` | Todo response de edge function (incluir headers CORS) |
| `auth.ts` → `requireAuth` | Toda função que exige usuário autenticado |
| `auth.ts` → `assertOrgMember` | Toda mutation que opera sobre dados de um tenant (anti-BOLA) |
| `hmac.ts` | Webhooks externos: Meta Leadgen, WhatsApp Cloud, Instagram |
| `idempotency.ts` | Mutações financeiras (Asaas, créditos) com risco de retry duplo |
| `rate-limit.ts` | Funções `generate-*` e endpoints de autenticação |
| `redact.ts` | Todo `console.log` com payload que pode conter PII |
| `correlation.ts` | Toda função — propagar `x-request-id` para tracing |
| `cron-auth.ts` | Funções invocadas por `pg_cron` ou scheduler externo |
| `schemas.ts` | Validação de payload via Zod em qualquer função |
| `job-failures.ts` | Crons e webhooks críticos — registrar falhas na tabela `job_failures` |
| `prompts/` | Toda função `generate-*` — prompts centralizados para o AI Gateway |
| `email-templates/` | Emails transacionais (`auth-email-hook`, `send-transactional-email`) |
| `asaas-fetch.ts` | Cliente HTTP Asaas com retry/backoff — toda função Asaas |
| `whatsappCircuitBreaker.ts` | Funções WhatsApp que chamam o Evolution API |

---

## 8. Comandos úteis

```bash
# Desenvolvimento
npm run dev                # Dev server com HMR em localhost:8080
npm run build              # Build de produção
npm run preview            # Preview do build de produção

# Qualidade de código
npm run lint               # ESLint (flat config)
npm run types:check        # TypeScript sem emitir arquivos (npx tsc --noEmit)
npm run test               # Vitest (run único)
npm run test:watch         # Vitest em modo watch
npm run coverage           # Cobertura via @vitest/coverage-v8
npm run e2e                # Playwright E2E (requer BASE_URL configurada)

# Banco e tipos
npm run types:supabase     # Gerar/atualizar src/integrations/supabase/types.ts
npm run check:stale-time   # Verificar que todo useQuery declara staleTime

# Checklist pré-PR (rodar todos antes de abrir PR)
npm run types:check && npm run lint && npm run test && npm run check:stale-time
```

---

## 9. Debugging comum

### "Edge function não responde" ou retorna 500

1. Abrir **Lovable Dashboard → Functions → [nome da função] → Logs**
2. Buscar pelo `correlationId` do request (presente no header `x-request-id` da resposta)
3. Ver se o log indica erro de runtime, timeout ou exception não tratada
4. Se a fn depende de um secret: verificar **Lovable Dashboard → Settings → Secrets**

### "401 no webhook" — Meta, Asaas ou Evolution

- **Meta:** verificar se `META_APP_SECRET` está configurado nos secrets da Lovable. O HMAC é validado em `_shared/hmac.ts` — ver [runbook webhook-hmac-failed](runbooks/webhook-hmac-failed.md).
- **Asaas:** verificar IP allowlist (Asaas só envia de IPs específicos) — ver [runbook asaas-payment-issues](runbooks/asaas-payment-issues.md).
- **Evolution API:** verificar se `EVOLUTION_API_KEY` está nos secrets e se a instância está conectada.

### "Dados do usuário X aparecem para usuário Y" — RLS incorreto

1. Abrir **Supabase Dashboard → Database → Tables → [tabela] → RLS Policies**
2. Verificar se as 4 policies (SELECT/INSERT/UPDATE/DELETE) estão ativas
3. Testar no **SQL Editor** com `SET ROLE authenticated; SET request.jwt.claims TO '{"organization_id": "uuid"}';`
4. Se necessário, criar migration de correção seguindo o padrão de `CONTRIBUTING.md` seção 3
5. Ver [ADR-002](adr/002-multi-tenant-rls.md) para o modelo multi-tenant completo

### "Tipos desatualizados" — `Tables<>` não reflete migration recente

```bash
npm run types:supabase
# Se a migration ainda não foi aplicada no Supabase remoto, aplicar via Lovable SQL Editor primeiro
```

### "useQuery sem staleTime" — `check:stale-time` falha

Todo `useQuery` precisa declarar `staleTime` explícito:

```typescript
useQuery({
  queryKey: ["leads", orgId],
  queryFn: fetchLeads,
  staleTime: 1000 * 60 * 5, // 5 minutos
});
```

### "Build falha com erro TypeScript"

```bash
npm run types:check
# Corrigir todos os erros antes de abrir PR
# Erros de tipo são bloqueantes no CI
```

---

## 10. Quem perguntar

| Dúvida | Contato |
|--------|---------|
| Arquitetura, decisões críticas, RLS, segurança | **@rafmarutaka** (Rafael Marutaka — Founder/CTO) |
| Todos os paths críticos (migrations, edge fns, auth, CI) | **@rafmarutaka** (CODEOWNERS — revisor obrigatório) |
| Dúvidas de processo e convenções | Abrir issue no GitHub com label `question` |

O arquivo `CODEOWNERS` define que `@rafmarutaka` é revisor obrigatório em migrations SQL, edge functions financeiras e de webhook, helpers `_shared/`, arquivos de auth/RBAC, CI e auditorias.

---

> Próximos passos após o setup: ler `docs/ARCHITECTURE.md` para o mapa completo e `docs/adr/README.md` para as decisões arquiteturais que guiam o projeto.
