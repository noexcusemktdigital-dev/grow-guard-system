# Guia de Contribuição — Sistema Noé

> Documento vivo. Atualizar quando convenções mudarem.
> Referência central para qualquer desenvolvedor que contribui para o grow-guard-system.

---

## Índice

1. [Antes de começar](#1-antes-de-começar)
2. [Workflow de desenvolvimento](#2-workflow-de-desenvolvimento)
3. [Migrations SQL](#3-migrations-sql)
4. [Edge Functions](#4-edge-functions)
5. [Frontend](#5-frontend)
6. [Testes](#6-testes)
7. [Formato de commits](#7-formato-de-commits)
8. [Code review](#8-code-review)
9. [Padrões de PR](#9-padrões-de-pr)
10. [LGPD](#10-lgpd)
11. [Segurança](#11-segurança)
12. [Documentação](#12-documentação)
13. [CI/CD](#13-cicd)
14. [Onboarding em menos de 1 hora](#14-onboarding-em-menos-de-1-hora)

---

## 1. Antes de começar

### Pré-requisitos

- Node.js 22+
- npm (ou bun — `bun.lockb` está presente no repo)
- Acesso ao Supabase do projeto (`gxrhdpbbxfipeopdyygn`) — solicitar ao maintainer
- Acesso de leitura ao repositório GitHub (`noexcusemktdigital-dev/grow-guard-system`)

### Clone e setup local

```bash
git clone https://github.com/noexcusemktdigital-dev/grow-guard-system.git
cd grow-guard-system

# Copiar variáveis de ambiente de exemplo
cp .env.example .env
# Preencher VITE_SUPABASE_PUBLISHABLE_KEY e demais valores conforme .env.example

npm install

# Iniciar em modo dev
npm run dev
# → App disponível em http://localhost:8080
```

### Variáveis de ambiente

O arquivo `.env.example` lista todas as variáveis necessárias com comentários explicativos.
**Nunca commitar o arquivo `.env` preenchido** — ele está no `.gitignore`.

Secrets de produção são gerenciados exclusivamente pelo **Lovable Dashboard → Settings → Secrets**.
Nunca inserir secrets em código, `.env` commitado ou GitHub Actions secrets avulsos.

### Principais comandos

```bash
npm run dev            # Dev server (Vite)
npm run build          # Build de produção
npm run lint           # ESLint
npm run types:check    # TypeScript sem emitir arquivos
npm run test           # Vitest (unit/integration)
npm run coverage       # Vitest com cobertura
npm run e2e            # Playwright (requer BASE_URL)
npm run check:stale-time  # Verificar staleTime nos hooks React Query
```

---

## 2. Workflow de desenvolvimento

### Convenção de branches

Usar sempre branches curtas a partir de `main`. Nunca trabalhar diretamente em `main`.

| Prefixo | Quando usar |
|---------|-------------|
| `feat/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `docs/` | Apenas documentação |
| `chore/` | Manutenção, dependências, config |
| `test/` | Adiciona ou corrige testes sem mudar lógica |

Exemplos:
```
feat/ads-meta-oauth
fix/rls-policy-clientes
docs/runbook-asaas
chore/deps-update-react
```

### Fluxo básico

```bash
git checkout main && git pull
git checkout -b feat/minha-feature

# ... desenvolver ...

git add <arquivos específicos>
git commit -m "feat(ads): adicionar fluxo OAuth Instagram"
git push origin feat/minha-feature

# Abrir PR no GitHub
```

### PRs pequenos e focados

- Um PR deve fazer **uma coisa só**. PRs menores são revisados mais rápido e têm menor risco de conflito.
- Se a feature exige migration + edge fn + frontend, pode ser um único PR — mas manter as mudanças coesas.
- Evitar PRs com mais de 500 linhas alteradas. Se necessário, dividir em etapas sequenciais.

---

## 3. Migrations SQL

> Ver [ADR-005](docs/adr/005-migrations-idempotent-via-lovable.md) para o raciocínio completo.

### Regras invioláveis

1. **Commit antes de aplicar.** A Lovable Cloud lê migrations do repositório Git e aplica em ordem. Nunca usar `supabase db push` — isso desincroniza o histórico. Ver [ADR-001](docs/adr/001-lovable-cloud-platform.md).

2. **Idempotência obrigatória.** Toda migration deve ser segura para re-execução:
   ```sql
   CREATE TABLE IF NOT EXISTS public.minha_tabela ( ... );
   ALTER TABLE public.outra ADD COLUMN IF NOT EXISTS novo_campo text;
   DROP FUNCTION IF EXISTS minha_funcao();
   CREATE OR REPLACE FUNCTION minha_funcao() ...;
   ```

3. **RLS na mesma migration.** Sempre que criar uma tabela de negócio, incluir na mesma migration:
   ```sql
   ALTER TABLE public.minha_tabela ENABLE ROW LEVEL SECURITY;

   -- SELECT
   CREATE POLICY "tenant_select" ON public.minha_tabela
     FOR SELECT USING (organization_id = current_user_organization_id());

   -- INSERT
   CREATE POLICY "tenant_insert" ON public.minha_tabela
     FOR INSERT WITH CHECK (organization_id = current_user_organization_id());

   -- UPDATE
   CREATE POLICY "tenant_update" ON public.minha_tabela
     FOR UPDATE USING (organization_id = current_user_organization_id());

   -- DELETE
   CREATE POLICY "tenant_delete" ON public.minha_tabela
     FOR DELETE USING (organization_id = current_user_organization_id());
   ```
   Ver [ADR-002](docs/adr/002-multi-tenant-rls.md) para o modelo multi-tenant completo.

4. **Índices em tabelas grandes em migration separada.** `CREATE INDEX CONCURRENTLY` não roda dentro de transação — criar em arquivo separado:
   ```sql
   -- arquivo: 20260502_002_idx_minha_tabela_org.sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_minha_tabela_org
     ON public.minha_tabela(organization_id);
   ```

### Nomenclatura de arquivos

```
supabase/migrations/YYYYMMDD_NNN_descricao-curta.sql
```

Exemplo: `20260502_001_add-table-campanhas.sql`

### Checklist antes de commitar uma migration

- [ ] Usa `IF NOT EXISTS` / `IF EXISTS` em todos os DDL
- [ ] RLS habilitado e 4 policies criadas (SELECT/INSERT/UPDATE/DELETE)
- [ ] Índices em tabelas grandes em arquivo separado com `CONCURRENTLY`
- [ ] Testado localmente com Supabase Studio (inspecionar, não `db push`)
- [ ] `supabase db push` **NÃO** foi executado

---

## 4. Edge Functions

> Ver [ADR-003](docs/adr/003-edge-fns-verify-jwt-false.md) para a política de `verify_jwt`.

### Padrão obrigatório

Toda edge function nova deve usar os helpers de `_shared/`:

```typescript
import { corsHeaders } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { checkIdempotency, markIdempotency } from "../_shared/idempotency.ts";
import { generateCorrelationId } from "../_shared/correlation.ts";
import { redactPII } from "../_shared/redact.ts";
```

### Boilerplate para funções que recebem usuário autenticado

```typescript
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const correlationId = generateCorrelationId(req);

  try {
    // 1. Autenticação
    const { user, supabase } = await requireAuth(req);

    // 2. Rate limiting (quando aplicável)
    const rateOk = await checkRateLimit(supabase, user.id, "minha-funcao", 10);
    if (!rateOk) return new Response("Too Many Requests", { status: 429 });

    // 3. Idempotência (quando aplicável — mutations com retry do cliente)
    const idempotencyKey = req.headers.get("x-idempotency-key");
    if (idempotencyKey) {
      const cached = await checkIdempotency(supabase, idempotencyKey);
      if (cached) return Response.json(cached);
    }

    // 4. Lógica de negócio
    const body = await req.json();
    const result = { ok: true };

    // 5. Marcar idempotência
    if (idempotencyKey) await markIdempotency(supabase, idempotencyKey, result);

    return Response.json(result, { headers: corsHeaders });
  } catch (err) {
    console.error(`[minha-funcao] correlationId=${correlationId}`, redactPII(err.message));
    return Response.json({ error: "Internal error" }, { status: 500, headers: corsHeaders });
  }
});
```

### Webhooks externos (sem JWT de usuário)

Usar validação HMAC em vez de `requireAuth`:

```typescript
import { validateHmac } from "../_shared/hmac.ts";

const secret = Deno.env.get("META_APP_SECRET")!;
const valid = await validateHmac(req, secret);
if (!valid) return new Response("Unauthorized", { status: 401 });
```

### `verify_jwt`

- **Padrão:** `verify_jwt = false` — cada função faz autenticação interna via `requireAuth`.
- **Exceção:** `verify_jwt = true` apenas em funções que nunca recebem webhook e sempre exigem usuário autenticado (marcar o motivo em comentário no código).

### Quando usar cada helper

| Helper | Quando usar |
|--------|-------------|
| `requireAuth` | Toda fn que precisa de usuário autenticado |
| `checkRateLimit` | Fns expostas ao cliente que podem ser abusadas |
| `checkIdempotency` | Mutations que o cliente pode fazer retry com retry automático |
| `generateCorrelationId` | Toda fn — para rastreabilidade em logs |
| `validateHmac` | Webhooks externos (Meta, Asaas, Evolution) |
| `redactPII` | Todo log que pode conter dados de usuário |

---

## 5. Frontend

### `invokeEdge` como padrão para chamar edge functions

Nunca chamar `supabase.functions.invoke` diretamente nos componentes. Usar o helper `invokeEdge`:

```typescript
import { invokeEdge } from "@/lib/invokeEdge";

const result = await invokeEdge("minha-funcao", { param: "valor" });
```

O helper centraliza: headers de autenticação, `x-request-id`, `x-idempotency-key` (quando pertinente), e tratamento de erros.

### Tipagem com `Tables<>`

Usar os tipos gerados do Supabase em vez de interfaces manuais:

```typescript
import type { Tables } from "@/integrations/supabase/types";

type Campanha = Tables<"campanhas">;
// em vez de: interface Campanha { id: string; nome: string; ... }
```

Para gerar/atualizar tipos após migration:
```bash
npm run types:supabase
```

### Componentes de UI

- **shadcn/ui primeiro.** Antes de criar componente custom, verificar se já existe em `src/components/ui/` ou na biblioteca shadcn.
- Para adicionar um componente shadcn: `npx shadcn-ui@latest add <nome>`.
- Componentes de negócio ficam em `src/components/<domínio>/`.

### Skeleton em loading states

Todo dado assíncrono deve exibir `Skeleton` durante carregamento — nunca spinner "buraco negro" nem tela em branco:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

if (isLoading) return <Skeleton className="h-40 w-full" />;
```

### React Query — `staleTime` obrigatório

Todo `useQuery` deve declarar `staleTime` explícito. O script `check:stale-time` valida isso em CI:

```typescript
useQuery({
  queryKey: ["campanhas", orgId],
  queryFn: fetchCampanhas,
  staleTime: 1000 * 60 * 5, // 5 minutos
});
```

---

## 6. Testes

### Stack

- **Vitest + Testing Library** — testes unitários e de integração em `src/**/*.{test,spec}.{ts,tsx}`
- **Playwright** — testes E2E em `e2e/`
- Setup: `src/test/setup.ts`

### Regras mínimas por arquivo de teste

- Mínimo **5 assertions** por arquivo.
- Cobrir **3 caminhos obrigatórios**: happy path, error path, edge case.
- Nomear testes de forma descritiva: `deve retornar erro 401 quando usuário não autenticado`.

Exemplo:

```typescript
describe("formatarCNPJ", () => {
  it("deve formatar CNPJ válido com máscara", () => {
    expect(formatarCNPJ("12345678000195")).toBe("12.345.678/0001-95");
  });

  it("deve retornar string vazia para CNPJ vazio", () => {
    expect(formatarCNPJ("")).toBe("");
  });

  it("deve retornar string vazia para CNPJ com caracteres inválidos", () => {
    expect(formatarCNPJ("abc")).toBe("");
  });

  it("deve manter máscara para CNPJ já formatado", () => {
    expect(formatarCNPJ("12.345.678/0001-95")).toBe("12.345.678/0001-95");
  });

  it("deve retornar vazio para null", () => {
    expect(formatarCNPJ(null as unknown as string)).toBe("");
  });
});
```

### Coverage gate

O CI roda `npm run coverage`. Não há gate rígido definido ainda (Phase 19 do roadmap de testes em implantação), mas pull requests não devem reduzir cobertura existente.

### Rodar antes de criar PR

```bash
npm run types:check    # TypeScript
npm run lint           # ESLint
npm run test           # Vitest
npm run check:stale-time  # React Query staleTime
```

---

## 7. Formato de commits

O projeto usa **Conventional Commits**.

### Formato

```
<tipo>(<escopo>): <descrição curta em imperativo>

[corpo opcional — contexto, por que a mudança, trade-offs]

[rodapé opcional — referências, Co-Authored-By, BREAKING CHANGE]
```

### Tipos válidos

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação apenas |
| `test` | Adiciona ou corrige testes |
| `chore` | Manutenção, dependências, scripts |
| `refactor` | Refactor sem mudar comportamento externo |
| `perf` | Melhoria de performance |
| `ci` | Mudanças em CI/CD |

### Escopos comuns

`ads`, `auth`, `billing`, `campaigns`, `crm`, `edge`, `frontend`, `lgpd`, `meta`, `migrations`, `rls`, `tests`, `types`, `whatsapp`

### Exemplos

```
feat(ads): adicionar fluxo OAuth Instagram para franqueados

fix(rls): corrigir policy SELECT em tabela campanhas para role franqueado

docs(runbooks): adicionar runbook de rotação de secret Meta App

test(crm): adicionar 3 testes unitários para hook useCampanhas

chore(deps): atualizar shadcn-ui para 2.1.0

feat(lgpd): adicionar endpoint DSR de exclusão de dados de cliente

BREAKING CHANGE: campo `nome_fantasia` renomeado para `trade_name` em tabela organizações
```

---

## 8. Code review

### CODEOWNERS

O arquivo `CODEOWNERS` define reviewers obrigatórios. Pull requests que tocam as áreas abaixo exigem aprovação de `@rafmarutaka`:

| Área | Paths |
|------|-------|
| Migrations SQL | `/supabase/migrations/` |
| Edge functions financeiras | `/supabase/functions/asaas-*`, `/supabase/functions/recharge-*`, `/supabase/functions/credits-*` |
| Edge functions de webhook | `/supabase/functions/*-webhook/` |
| Helpers compartilhados | `/supabase/functions/_shared/` |
| Auth e RBAC | `useAuth.ts`, `ProtectedRoute.tsx`, `AdminOnlyRoute.tsx`, `RoleAccessGuard.tsx` |
| CI e config | `/.github/`, `/supabase/config.toml` |
| Auditorias | `/docs/audits/` |

### O que checar ao revisar

- [ ] Migrations: idempotentes, RLS incluído, sem `db push`
- [ ] Edge functions: `requireAuth` presente, `redactPII` em logs, `correlationId` usado
- [ ] Webhooks externos: validação HMAC presente
- [ ] Frontend: `Tables<>` em vez de interfaces manuais, `Skeleton` em loading, `staleTime` declarado
- [ ] LGPD: PII não logada em clear text, soft-delete quando aplicável
- [ ] Segurança: nenhum secret em código, HMAC em webhooks externos
- [ ] Testes: pelo menos 5 assertions, 3 caminhos cobertos
- [ ] `check:stale-time` passou

---

## 9. Padrões de PR

### Título

```
<tipo>(<escopo>): <descrição curta>
```

Exemplos:
```
feat(campaigns): adicionar filtro por período na lista de campanhas
fix(auth): corrigir redirect pós-login para franqueados
docs(adr): registrar ADR-006 sobre estratégia de cache React Query
```

### Corpo do PR

```markdown
## Resolve

Closes #<número-da-issue> (quando aplicável)

## Mudanças

- Breve descrição item a item das mudanças feitas
- Por que essa abordagem foi escolhida (quando não é óbvio)

## Test plan

- [ ] `npm run types:check` passou sem erros
- [ ] `npm run lint` passou sem erros
- [ ] `npm run test` passou sem erros
- [ ] `npm run check:stale-time` passou (quando há hooks React Query)
- [ ] Testado manualmente no preview da Lovable para os fluxos afetados
- [ ] Migration idempotente verificada (quando há SQL)

## Co-Authored-By (quando aplicável)

Co-Authored-By: Nome <email>
```

### Tamanho do PR

- Ideal: < 300 linhas alteradas
- Aceitável: até 500 linhas (com justificativa)
- Sinal de alerta: > 500 linhas → considerar dividir

---

## 10. LGPD

### PII nunca em logs

Todo log que pode conter dados pessoais deve passar pelo `redactPII`:

```typescript
import { redactPII } from "../_shared/redact.ts";

// Errado:
console.error("Falha ao processar cliente:", JSON.stringify(cliente));

// Correto:
console.error("Falha ao processar cliente:", redactPII(JSON.stringify(cliente)));
```

Campos redactados automaticamente: `email`, `cpf`, `cnpj`, `telefone`, `celular`, `nome`, `endereco`, `password`, `token`.

### Soft-delete em tabelas com dados pessoais

Tabelas que armazenam dados de pessoas físicas devem usar soft-delete com `deleted_at`:

```sql
-- Na migration:
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_deleted_at
  ON public.clientes(deleted_at) WHERE deleted_at IS NULL;

-- Policy SELECT que exclui registros deletados:
CREATE POLICY "tenant_select" ON public.clientes
  FOR SELECT USING (
    organization_id = current_user_organization_id()
    AND deleted_at IS NULL
  );
```

### Endpoints DSR (Data Subject Request)

Quando criar funcionalidade que coleta novos dados pessoais, verificar se o endpoint de exportação/exclusão DSR precisa ser atualizado (`lgpd-dsr-*` edge functions).

---

## 11. Segurança

### Nunca commitar secrets

Secrets nunca devem aparecer em código-fonte, arquivos de configuração commitados, mensagens de commit ou comentários.

Se um secret for commitado acidentalmente:
1. **Não fazer force push sozinho** — contatar o maintainer imediatamente.
2. O runbook `docs/runbooks/secret-rotation.md` define o procedimento de rotação.
3. Toda rotação de secret exige **2 confirmações explícitas** do Rafael antes de qualquer ação.

### HMAC em webhooks externos

Todo webhook recebido de terceiros (Meta, Asaas, Evolution API) deve validar assinatura HMAC:

```typescript
import { validateHmac } from "../_shared/hmac.ts";

const isValid = await validateHmac(req, Deno.env.get("META_APP_SECRET")!);
if (!isValid) {
  console.warn("[webhook] HMAC inválido — request rejeitado");
  return new Response("Unauthorized", { status: 401 });
}
```

### Anti-BOLA em edge functions

Toda mutation em edge function que opera sobre dados de um tenant deve verificar que o usuário pertence ao tenant correto via `assertOrgMember`:

```typescript
import { assertOrgMember } from "../_shared/auth.ts";

await assertOrgMember(supabase, user.id, body.organizationId);
```

### Renovate

O repositório usa Renovate para atualização automática de dependências. PRs de Renovate com patch/minor são aprovados automaticamente após CI passar. Major versions requerem revisão manual.

---

## 12. Documentação

### Quando atualizar documentação

| Mudança | Documentação afetada |
|---------|---------------------|
| Nova decisão arquitetural importante | Criar ADR em `docs/adr/` |
| Novo processo operacional | Criar ou atualizar runbook em `docs/runbooks/` |
| Mudança na arquitetura geral | Atualizar `docs/ARCHITECTURE.md` |
| Release com mudanças para usuários | Adicionar entrada em `CHANGELOG.md` |

### ADRs (Architecture Decision Records)

Um ADR documenta uma decisão arquitetural significativa e imutável. Criar quando:
- A decisão tem impacto duradouro (ex.: escolha de plataforma, padrão de autenticação)
- Ou quando a motivação não é óbvia e pode ser questionada no futuro

Template básico:
```markdown
# ADR-NNN: Título curto

- Status: Proposto | Aceito | Depreciado
- Data: YYYY-MM-DD
- Decisores: [nomes]

## Contexto
## Decisão
## Consequências
## Alternativas consideradas
```

### Runbooks

Um runbook documenta como executar um processo operacional. Criar quando adicionar qualquer nova capacidade operacional (novo tipo de webhook, novo cron job, nova integração com terceiro).

Runbooks existentes: `docs/runbooks/README.md`.

### CHANGELOG

Seguir o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/). Adicionar entrada em `Unreleased` a cada PR que muda comportamento visível para o usuário final.

---

## 13. CI/CD

### Pipeline

O deploy é gerenciado pela **Lovable Cloud** (ver [ADR-001](docs/adr/001-lovable-cloud-platform.md)):

1. PR aberto → preview automático gerado pela Lovable
2. CI passa (GitHub Actions)
3. Merge em `main` → deploy automático: frontend (CDN), edge functions (Supabase), migrations SQL

### Gates obrigatórios (CI deve passar antes do merge)

| Check | Comando | O que valida |
|-------|---------|-------------|
| TypeScript | `npm run types:check` | Sem erros de tipo |
| ESLint | `npm run lint` | Sem erros de lint |
| Vitest | `npm run test` | Testes unitários e de integração |
| staleTime | `npm run check:stale-time` | Todos os `useQuery` com `staleTime` declarado |

> Nota: o CI atualmente tem `continue-on-error: true` em alguns steps — tratado como tech debt.
> Não usar isso como justificativa para ignorar falhas.

### Nunca usar `supabase db push`

Migrations são aplicadas pela Lovable automaticamente após o merge.
Usar `supabase db push` desincroniza o histórico de migrations e pode causar falhas em deploys futuros.

---

## 14. Onboarding em menos de 1 hora

### Leitura inicial (30 min)

1. `README.md` — visão geral, stack, setup, comandos
2. `docs/ARCHITECTURE.md` — mapa completo da arquitetura
3. `docs/adr/README.md` — lista dos ADRs e suas decisões

### Setup local (20 min)

Seguir a seção [Antes de começar](#1-antes-de-começar) deste documento.

### Entender o modelo de dados (10 min)

- Abrir Supabase Studio (`https://supabase.com/dashboard/project/gxrhdpbbxfipeopdyygn`)
- Navegar em Database → Tables para ver as tabelas existentes
- Ler `docs/adr/002-multi-tenant-rls.md` para entender o modelo multi-tenant

### Primeiro PR

Escolher uma issue com label `good first issue` ou `docs`. Seguir o workflow deste guia do início ao fim — é a melhor forma de absorver os padrões.

### Dúvidas

- Abrir issue no GitHub com label `question`
- Ou contatar `@rafmarutaka` diretamente
