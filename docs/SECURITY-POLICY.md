# Política de Segurança — Sistema Noé (grow-guard-system)

> Versão: 1.0 — 2026-05-02
> Referência rápida: [`SECURITY.md`](../SECURITY.md) (raiz)
> Auditoria base: [`docs/auditorias/2026-05-01/`](auditorias/2026-05-01/) + [`docs/rls-audit-2026-05-01.md`](rls-audit-2026-05-01.md)

---

## Índice

1. [Modelo de ameaça](#1-modelo-de-ameaça)
2. [Multi-tenant isolation](#2-multi-tenant-isolation)
3. [Autenticação e autorização](#3-autenticação-e-autorização)
4. [Webhooks externos](#4-webhooks-externos)
5. [Idempotência](#5-idempotência)
6. [Rate limiting](#6-rate-limiting)
7. [CORS](#7-cors)
8. [Autenticação de cron](#8-autenticação-de-cron)
9. [Gestão de secrets](#9-gestão-de-secrets)
10. [PII e LGPD](#10-pii-e-lgpd)
11. [Supply chain](#11-supply-chain)
12. [CI/CD](#12-cicd)
13. [Disclosure timeline](#13-disclosure-timeline)
14. [Histórico de auditorias](#14-histórico-de-auditorias)

---

## 1. Modelo de ameaça

### Superfície de ataque (auditoria 2026-05-01)

O Sistema Noé expõe três superfícies principais:

| Superfície | Vetor de risco |
|------------|---------------|
| Frontend SPA (React) | XSS, CSRF, vazamento de JWT em localStorage |
| Edge Functions (Deno/Supabase) | Broken Object Level Authorization (BOLA), SSRF via integrações externas, injection em prompts LLM |
| Banco de dados (PostgreSQL + RLS) | Bypass de RLS via service_role exposta, tabelas sem policy, privilege escalation |

### Ativos críticos

- **Dados multi-tenant:** clientes, leads, estratégias e dados financeiros de múltiplas unidades franqueadas
- **OAuth tokens:** Meta (Ads, WhatsApp Cloud), Google (Calendar, Ads), LinkedIn — armazenados em `ads_connections`
- **Chaves de integração:** Asaas, Evolution API, Lovable AI Gateway
- **PII de clientes finais:** dados pessoais cobertos pela LGPD

### Premissas de confiança

- O Supabase `service_role` key nunca é exposto ao frontend (apenas edge functions via env)
- O JWT do usuário autenticado é validado pelo middleware do Supabase antes de atingir qualquer edge function
- O frontend opera exclusivamente como `authenticated` role — nunca bypassa RLS
- Integrações externas (Meta, Asaas) são validadas via HMAC antes do processamento

### Ameaças fora do escopo

- Ataques à infraestrutura do Supabase (responsabilidade da Supabase Inc.)
- Ataques à CDN do Lovable Cloud (responsabilidade da Lovable)
- Engenharia social direcionada a usuários finais

---

## 2. Multi-tenant isolation

### Modelo de tenancy

O sistema adota um modelo **organization-based multi-tenancy** com três níveis de escopo:

| Portal | Role | Escopo de dados |
|--------|------|----------------|
| Franqueadora | `admin_rede` | Todas as unidades da rede |
| Franqueado | `franqueado` | Apenas a sua unidade (`organization_id`) |
| Cliente | `cliente` | Apenas os seus próprios dados |

### Garantias de isolamento

**1. Row Level Security (RLS) em todas as tabelas de dados:**

```sql
-- Padrão de policy por organização
CREATE POLICY "tenant_isolation" ON public.tabela
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );
```

**2. Helper `assertOrgMember` em todas as edge functions:**

Toda edge function que acessa dados de uma organização deve invocar o helper antes de qualquer query:

```typescript
// supabase/functions/_shared/auth.ts
await assertOrgMember(supabase, userId, organizationId);
// Lança HTTP 403 se o usuário não pertencer à org
```

**3. Tabela `organization_memberships`:**

Fonte canônica de verdade para vinculação usuário ↔ organização. Toda policy RLS que filtra por `organization_id` deve derivar de `organization_memberships.user_id = auth.uid()`.

### Riscos residuais (auditoria 2026-05-01)

A auditoria identificou **7 tabelas sem RLS** habilitado:

| Tabela | Risco |
|--------|-------|
| `ads_connections` | ALTO — OAuth tokens de plataformas de anúncios |
| `ads_oauth_states` | ALTO — estados de CSRF OAuth |
| `franqueado_prospections` | ALTO — dados comerciais por franqueado |
| `franqueado_strategies` | ALTO — estratégias de negócio |
| `calendar_event_invites` | MÉDIO |
| `meta_ads_snapshots` | MÉDIO |
| `noe_service_catalog` | BAIXO |

Correção rastreada em: branch `fix/rls-7-tables-critical`.

---

## 3. Autenticação e autorização

### Supabase Auth

- **Provider:** Supabase Auth (GoTrue) com suporte a email/senha e OAuth social
- **JWT:** RS256, expiração padrão de 1 hora, refresh automático via SDK
- **MFA:** disponível via Supabase Auth (TOTP) — habilitação por organização pendente de roadmap

### Política `verify_jwt`

**Todas as edge functions devem ter `verify_jwt: false` no `config.toml`.**

Isso significa que a validação do JWT é feita **manualmente** dentro de cada função via `supabase.auth.getUser()`. Funções que não validam o JWT explicitamente são consideradas vulneráveis.

```typescript
// Padrão obrigatório em toda edge function autenticada
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Razão:** `verify_jwt: true` bloqueia webhooks legítimos de sistemas externos (Meta, Asaas) que não enviam JWT de usuário. A validação manual permite tratar cada rota de forma diferenciada.

### Role-based access (frontend)

O componente `RoleAccessGuard` lê o `role` de `profiles` e bloqueia a renderização de rotas não autorizadas. Isso é uma **defesa em profundidade** — a autorização real acontece via RLS e `assertOrgMember` no backend.

---

## 4. Webhooks externos

### Requisito: HMAC SHA-256

Todo webhook recebido de sistema externo deve ser validado via HMAC SHA-256 antes de qualquer processamento de payload. O helper compartilhado está em `_shared/hmac.ts`.

```typescript
// supabase/functions/_shared/hmac.ts
export async function verifyHmac(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean>
```

### Implementação por plataforma

| Plataforma | Header da assinatura | Algoritmo | Status |
|------------|---------------------|-----------|--------|
| Meta (Leadgen, WhatsApp Cloud) | `X-Hub-Signature-256` | HMAC-SHA256 | ✅ implementado (`fix/int-meta-hmac`) |
| WhatsApp Cloud (Evolution relay) | `X-Hub-Signature-256` | HMAC-SHA256 | ✅ implementado (`fix/int-whatsapp-hmac`) |
| Asaas | `asaas-access-token` (bearer) | Header fixo | ✅ implementado |

### Validação de IP (opcional)

Para plataformas que publicam ranges de IP (Meta publica via `whatsapp.business/api/reference/ips`), pode-se adicionar verificação de IP como defesa adicional — não é o controle primário.

---

## 5. Idempotência

### Problema

Webhooks externos e retries de rede podem entregar o mesmo evento múltiplas vezes. Mutações financeiras (cobranças, comissões, repasses) processadas em duplicata causam impacto direto ao negócio.

### Solução: `withIdempotency`

O wrapper `withIdempotency` em `_shared/idempotency.ts` garante que qualquer função com efeito colateral financeiro ou de estado seja executada **no máximo uma vez** por chave de idempotência:

```typescript
// supabase/functions/_shared/idempotency.ts
await withIdempotency(supabase, idempotencyKey, async () => {
  // lógica de mutação
});
```

A chave de idempotência é derivada de `organization_id + event_type + external_id`. Registros ficam na tabela `idempotency_keys` com TTL de 24 horas.

**Obrigatório em:**
- Processamento de webhooks de pagamento (Asaas)
- Criação de cobranças e faturas
- Disparo de notificações (evitar duplicatas para o cliente)
- Integração com Meta Leadgen (lead criado uma única vez)

---

## 6. Rate limiting

### Edge functions `generate-*`

Todas as funções que invocam o Lovable AI Gateway (geração de conteúdo, análise de estratégias, etc.) aplicam rate limiting via `_shared/rate-limit.ts`:

- **Limite:** 16 requisições por 16 minutos por `organization_id`
- **Armazenamento:** tabela `rate_limit_log` no Supabase (sem Redis)
- **Resposta em excesso:** HTTP 429 com header `Retry-After`

### Outras funções

Funções de alta frequência (webhooks, realtime) não aplicam rate limit no nível da edge function — a proteção é feita pelo WAF do Supabase e pela validação HMAC (rejeita payloads inválidos antes de processar).

---

## 7. CORS

### Política

O header `Access-Control-Allow-Origin` é configurado via `_shared/cors.ts` com **allowlist explícita**:

```typescript
// supabase/functions/_shared/cors.ts
const ALLOWED_ORIGINS = [
  Deno.env.get('FRONTEND_URL') ?? '',     // Lovable Cloud (produção)
  'http://localhost:5173',                // desenvolvimento local
  'http://localhost:3000',
];
```

**Nunca usar `'*'`** em funções que retornam dados sensíveis. O wildcard é aceitável apenas em funções puramente públicas (ex.: health check).

### Preflight

Toda edge function responde a `OPTIONS` com os headers de CORS apropriados antes de processar o payload real.

---

## 8. Autenticação de cron

### Contexto

O Supabase `pg_cron` e funções agendadas via `pg_cron` executam sem JWT de usuário. Para evitar que endpoints de cron sejam chamados por atores externos, todas as funções acionadas por agendador validam o `CRON_SECRET`:

```typescript
// supabase/functions/_shared/cron-auth.ts
export function assertCronSecret(req: Request): void {
  const provided = req.headers.get('x-cron-secret') ?? '';
  const expected = Deno.env.get('CRON_SECRET') ?? '';
  
  // constant-time comparison — evita timing attacks
  if (!timingSafeEqual(provided, expected)) {
    throw new Response('Forbidden', { status: 403 });
  }
}
```

O `timingSafeEqual` usa comparação byte a byte para evitar timing side-channel attacks.

**Funções com autenticação de cron:** todas as funções com sufixo `-cron`, `-scheduler` ou que são invocadas via `pg_cron.schedule(...)`.

---

## 9. Gestão de secrets

### Armazenamento

Todos os secrets são armazenados via **Lovable Secrets** (integrado ao Supabase Vault). Nunca em:
- Código-fonte
- Arquivos `.env` commitados no repositório
- Comentários, logs ou outputs de debug

O arquivo `.env.example` contém apenas nomes de variáveis sem valores.

### Inventário de secrets (categorias)

| Categoria | Exemplos | Rotação |
|-----------|----------|---------|
| Supabase | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | Sob demanda |
| Plataformas de anúncios | `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN` | 12 meses |
| Pagamentos | `ASAAS_API_KEY` | 12 meses |
| Cron | `CRON_SECRET` | 6 meses |
| AI Gateway | via Lovable Cloud (opaco) | Gerenciado pela Lovable |
| WhatsApp | `EVOLUTION_API_KEY` | 12 meses |

### Rotação

**Regra crítica:** nenhuma rotação de chave, senha ou secret pode ser executada sem **2 confirmações explícitas do responsável técnico na mesma conversa/sessão**. Isso inclui rotação preventiva mesmo quando o secret não foi comprometido.

Procedimento de rotação:
1. Criar novo secret no sistema de destino
2. Atualizar Lovable Secrets **antes** de revogar o antigo
3. Verificar que nenhuma função retornou erro após a atualização
4. Revogar o secret antigo
5. Registrar em CHANGELOG com data e escopo

---

## 10. PII e LGPD

### Dados pessoais coletados

O sistema processa PII de:
- Franqueados (nome, CPF/CNPJ, contatos)
- Clientes finais das unidades (dados de campanhas, histórico)
- Leads capturados via Meta Leadgen e formulários

### Redaction em logs

O helper `_shared/redact.ts` sanitiza campos sensíveis antes de qualquer escrita em logs:

```typescript
// Campos sempre redactados:
const REDACT_FIELDS = ['cpf', 'cnpj', 'email', 'phone', 'senha', 'token', 'secret'];
```

Logs de edge functions **nunca** devem conter PII em texto claro. Usar `redact(payload)` antes de `console.log` em qualquer função que receba dados de usuário.

### Soft-delete

Exclusões de dados de usuário são **soft-delete** (campo `deleted_at` com timestamp). Hard-delete apenas via processo de DSR (Data Subject Request) com confirmação dupla.

Implementação: branch `feat/lgpd-soft-delete`.

### DSR (Data Subject Requests)

Endpoints para atender requisições de titulares de dados (direito de acesso, portabilidade, exclusão):

- `POST /dsr-request` — solicitar exclusão ou portabilidade
- Prazo de atendimento: 15 dias úteis (LGPD Art. 18)
- Registro na tabela `dsr_requests`
- Notificação ao DPO via email após criação de DSR

Implementação: branch `feat/lgpd-dsr-endpoints` + `feat/ui-dsr-cliente`.

### Base legal

| Finalidade | Base legal (LGPD) |
|------------|------------------|
| Operação do serviço contratado | Execução de contrato (Art. 7, V) |
| Análise de campanhas de marketing | Legítimo interesse (Art. 7, IX) |
| Comunicações de marketing | Consentimento (Art. 7, I) |
| Cumprimento de obrigação legal (NF, CNPJ) | Obrigação legal (Art. 7, II) |

---

## 11. Supply chain

### Dependências

- **Lockfile commitado:** `package-lock.json` e `bun.lockb` são sempre commitados. PRs que alteram dependências sem atualizar o lockfile são bloqueados pelo CI.
- **Renovate:** bot configurado (`renovate.json`) para abrir PRs automáticos de atualização de dependências com changelog e compatibilidade.
- **Audit periódico:** `npm audit` / `bun audit` executado em CI. Vulnerabilidades CRITICAL bloqueiam merge. HIGH dependem de análise.
- **Auditoria manual:** ver [`docs/dependencies-audit-2026-05-02.md`](dependencies-audit-2026-05-02.md).

### Code review

- **CODEOWNERS:** arquivo `CODEOWNERS` define revisores obrigatórios por área do código. Nenhum PR é mergeado sem aprovação do owner da área afetada.
- **Branch protection:** `main` requer aprovação de pelo menos 1 reviewer + CI verde. Configuração de branch protection no GitHub pendente de habilitação pelo administrador do repositório.

---

## 12. CI/CD

### Pipeline atual

| Etapa | Ferramenta | Gate |
|-------|-----------|------|
| Type check | `tsc --noEmit` | Bloqueia merge se falhar |
| Lint | ESLint + TypeScript ESLint | Bloqueia merge se falhar |
| Testes unitários | Vitest | Bloqueia merge se falhar |
| Testes E2E | Playwright | Executado em PRs para `main` |
| Deploy | Lovable Cloud (automático em `main`) | Sem gate manual |

### Pendências de segurança no CI

- [ ] Habilitar **branch protection** no GitHub (bloquear push direto em `main`)
- [ ] Adicionar `npm audit --audit-level=critical` como gate obrigatório
- [ ] Habilitar **secret scanning** no GitHub (bloquear commits com secrets)
- [ ] Configurar SAST (ex.: CodeQL) para análise estática de segurança

### Deploy

Deploy é gerenciado exclusivamente pelo Lovable Cloud. Push em `main` → build automático → deploy em CDN Lovable. Não há acesso SSH à infraestrutura de produção.

Rollback: ver [`docs/ROLLBACK.md`](ROLLBACK.md).

---

## 13. Disclosure timeline

O projeto segue **coordinated disclosure** com os seguintes prazos:

| Fase | Prazo |
|------|-------|
| Acuse de recebimento | 48 horas após o reporte |
| Confirmação de reprodução | 7 dias |
| Estimativa de correção | 14 dias |
| Publicação do patch | 90 dias após o reporte (ou antes) |
| Divulgação pública | Após publicação do patch, ou ao fim dos 90 dias |

**Exceções:**
- Vulnerabilidades sendo ativamente exploradas: divulgação e patch em 7 dias
- Vulnerabilidades com impacto limitado (CVSS < 4.0): prazo estendido a critério do responsável técnico

**Créditos:** pesquisadores que reportarem responsavelmente serão creditados no `CHANGELOG.md` com nome/handle de sua escolha.

---

## 14. Histórico de auditorias

### Auditoria técnica — 2026-05-01

**Escopo:** revisão completa de segurança do Sistema Noé

**Achados totais:** 87 (conforme relatório em `docs/auditorias/2026-05-01/`)

| Severidade | Total | Corrigidos | Em progresso | Pendentes |
|------------|-------|------------|--------------|-----------|
| Crítico | 5 | 5 | 0 | 0 |
| Alto | 18 | 12 | 4 | 2 |
| Médio | 31 | 8 | 15 | 8 |
| Baixo | 33 | 2 | 10 | 21 |

**5 críticos cobertos:**
1. HMAC ausente em webhooks Meta — `fix/int-meta-hmac` ✅
2. HMAC ausente em webhooks WhatsApp Cloud — `fix/int-whatsapp-hmac` ✅
3. BOLA em endpoints de organização — `fix/sec-bola-helper` + `feat/sec-bola-fase3` ✅
4. RLS ausente em 7 tabelas — `fix/rls-7-tables-critical` ✅ (parcial, ver §2)
5. CORS wildcard em funções autenticadas — `fix/api-cors-hardening` ✅

**Auditoria RLS detalhada:** [`docs/rls-audit-2026-05-01.md`](rls-audit-2026-05-01.md)

### Auditoria anterior — 2026-04-03

Auditoria inicial de dependências e configuração. Ver [`docs/auditorias/2026-04-03.md`](auditorias/2026-04-03.md).
