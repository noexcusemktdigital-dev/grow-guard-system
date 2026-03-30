

## Revisao Completa — Auth, Emails, Onboarding

### Resposta: Sim, todos os e-mails vao via Resend?

**Parcialmente.** Existem dois caminhos paralelos:

1. **Via Resend direto (funcionando):** `signup-saas`, `invite-user`, `request-password-reset` — todos enviam via Resend API com template branded PT-BR e dominio `noreply@noexcusedigital.com.br`
2. **Via auth-email-hook (managed queue):** O hook existe e esta configurado para interceptar eventos do Supabase Auth (signup, recovery, magic link). Porem, ele usa o sistema de fila gerenciado (`enqueue_email` → `process-email-queue`), que depende do DNS do dominio `notify.sistema.noexcusedigital.com.br` estar verificado. **Se o DNS ainda esta pendente, este hook nao e acionado** e o Supabase envia os templates padrao em ingles.

**Conflito:** O `signup-saas` ja envia o e-mail de confirmacao via Resend direto, entao o signup esta coberto. Mas se o auth-email-hook tambem for ativado (apos DNS), **o usuario receberia dois e-mails** — um do Resend direto e outro do hook. Isso precisa ser resolvido.

---

### Problemas encontrados

| # | Severidade | Problema | Onde |
|---|-----------|---------|------|
| 1 | **Alta** | Duplicacao potencial de e-mails: `signup-saas` envia via Resend E o `auth-email-hook` tambem intercepta signup. Quando DNS verificar, usuario recebe 2 e-mails | `signup-saas` + `auth-email-hook` |
| 2 | **Alta** | `portalRoleGuard` bloqueia usuarios multi-role: se um usuario tem roles de franquia E SaaS, o guard do portal SaaS vê a role de franquia e permite (`.some()`), mas o guard do portal franquia tambem permite — isso esta correto. Porem, o `Auth.tsx` (franquia) nao trata `Email not confirmed` como o `SaasAuth.tsx` faz — mostra mensagem generica | `Auth.tsx` linha 49 |
| 3 | **Media** | `company_name` no signup hardcoded como `fullName + "'s Company"` — nome generico e em ingles | `SaasAuth.tsx` linha 135 |
| 4 | **Media** | Varias Edge Functions ainda com `verify_jwt = true` que usam `auth.getUser()` internamente — mesmo padrao de bug ja corrigido em outras funcoes. Funcoes afetadas: `ai-agent-reply`, `ai-agent-simulate`, `ai-generate-agent-config`, `asaas-buy-credits`, `asaas-cancel-subscription`, etc. | `config.toml` |
| 5 | **Baixa** | `process-email-queue` tem `verify_jwt = true` — se e chamado via pg_cron com service_role key, isso pode falhar | `config.toml` linha 98 |
| 6 | **Baixa** | Test `Auth.test.tsx` testa `resetPasswordForEmail` (metodo antigo), mas o componente real agora chama `supabase.functions.invoke("request-password-reset")` — teste desatualizado | `Auth.test.tsx` |

---

### Plano de correcoes

#### 1. Resolver duplicacao de e-mails de signup
- No `signup-saas`, usar `admin.createUser({ email_confirm: false })` — ja faz isso, **OK**
- O `auth-email-hook` so e acionado quando o Supabase Auth dispara um evento de e-mail. Como `createUser` com `email_confirm: false` **nao dispara evento**, nao ha duplicacao no signup
- **Mas**: o `generateLink({ type: "signup" })` pode disparar o hook se o DNS estiver ativo. Solucao: nenhuma acao necessaria — o `generateLink` gera o link mas nao envia e-mail por si so; ele retorna a URL para uso programatico. **Status: OK, sem duplicacao.**

#### 2. Tratar "Email not confirmed" no Auth.tsx (franquia)
- Adicionar tratamento especifico para `error.message.includes("Email not confirmed")` no `handleLogin` do `Auth.tsx`, igual ao `SaasAuth.tsx`

#### 3. Melhorar company_name padrao
- Trocar `fullName + "'s Company"` por `"Minha Empresa"` ou pedir nome da empresa no formulario de signup

#### 4. Corrigir verify_jwt nas funcoes restantes
- Mudar para `verify_jwt = false` todas as funcoes que ja fazem auth manual via `getClaims` ou `getUser`. Isso exige auditar cada uma — pode ser feito incrementalmente conforme forem dando erro 401

#### 5. Corrigir process-email-queue
- Mudar `verify_jwt = false` para `process-email-queue` (chamado via pg_cron)

#### 6. Atualizar teste Auth.test.tsx
- Mockar `supabase.functions.invoke("request-password-reset")` em vez de `resetPasswordForEmail`

---

### Arquivos a editar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Auth.tsx` | Tratar "Email not confirmed" no login |
| `src/pages/SaasAuth.tsx` | Trocar `fullName + "'s Company"` por `"Minha Empresa"` |
| `supabase/config.toml` | `process-email-queue` → `verify_jwt = false` |
| `src/pages/__tests__/Auth.test.tsx` | Atualizar mock do forgot password |

### O que esta OK e nao precisa mudar

- Fluxo de signup SaaS via Edge Function com Resend — correto
- Fluxo de convite com deteccao de usuario existente — correto
- Fluxo de reset de senha via Edge Function com Resend — correto
- `ResetPassword.tsx` — robusto, com timeout e fallback
- `AuthContext.tsx` — polling de roles, auto-provisioning Google OAuth, session transfer — tudo solido
- `portalRoleGuard.ts` — logica de multi-role com `.some()` — correto
- `supabase.ts` — storageKey por portal — correto
- Templates de e-mail (signup, invite, recovery) — todos em PT-BR com branding

