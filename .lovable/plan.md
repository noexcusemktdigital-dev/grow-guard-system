

## Plano — Migrar auth-email-hook para envio direto via Resend

### Situação atual

| Fluxo | Como envia | Status |
|-------|-----------|--------|
| Signup | Resend direto (`signup-saas`) | ✅ Funcionando |
| Convite | Resend direto (`invite-user`) | ✅ Funcionando |
| Reset senha | Resend direto (`request-password-reset`) | ✅ Funcionando |
| Magic link, email change, reauth | `auth-email-hook` → fila gerenciada → `process-email-queue` | ❌ Depende de DNS pendente |

O `auth-email-hook` usa o sistema de fila gerenciada (enqueue → process-email-queue) que depende do DNS de `notify.sistema.noexcusedigital.com.br` estar verificado. Como o DNS está pendente, esses e-mails nunca são enviados.

### Solução

Modificar o `auth-email-hook` para enviar diretamente via Resend API (igual ao `request-password-reset` e `invite-user`), eliminando a dependência da fila gerenciada e do DNS pendente.

Os templates React Email já existem e estão corretos (PT-BR, logo, cores). Só precisa mudar o mecanismo de envio.

### Mudança no auth-email-hook

**Antes:** Renderiza HTML → enqueue na fila pgmq → `process-email-queue` envia via sistema gerenciado

**Depois:** Renderiza HTML → envia direto via Resend API (`RESEND_API_KEY`) → loga em `email_send_log`

O hook continua interceptando os eventos de auth (magic link, email change, reauthentication). Signup e recovery são ignorados pelo hook porque já são tratados pelas Edge Functions diretas.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/auth-email-hook/index.ts` | Trocar `enqueue_email` por chamada direta ao Resend API. Manter preview endpoint, templates, e logging no `email_send_log` |

### O que NÃO muda

- Templates (já estão corretos)
- `signup-saas`, `invite-user`, `request-password-reset` (já usam Resend)
- `config.toml` (já tem `verify_jwt = false`)
- Preview endpoint (continua funcionando)

### Resultado

Todos os e-mails do sistema passam pelo Resend com domínio verificado `noexcusedigital.com.br`, templates branded em PT-BR, sem dependência de DNS pendente.

