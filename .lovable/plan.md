

## Correção — 2 Problemas na Arquitetura de Usuários

---

### PROBLEMA 1: E-mail de reset de senha em inglês (template padrão Lovable)

**Causa raiz:** O `resetPasswordForEmail` é chamado client-side e dispara o fluxo interno do Supabase Auth. O `auth-email-hook` existe e tem o template de recovery em PT-BR, mas os logs mostram que ele **nunca é acionado** — só "booted/shutdown", zero processamento. O hook não está ativo no pipeline de auth, então os e-mails vão pelo template padrão Lovable (inglês).

**Solução:** Substituir o fluxo client-side por uma Edge Function `request-password-reset` que faz o mesmo que o convite: usa `admin.generateLink({ type: "recovery" })` + envia via Resend com o template branded em PT-BR. Isso garante consistência com o fluxo de convite que já funciona.

**Arquivos:**

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/request-password-reset/index.ts` | **Novo** — recebe `{ email, portal }`, gera link de recovery via Admin API, envia e-mail branded via Resend |
| `supabase/config.toml` | Adicionar `[functions.request-password-reset]` com `verify_jwt = false` (endpoint público) |
| `src/pages/Auth.tsx` | `handleForgotPassword` chama a Edge Function em vez de `resetPasswordForEmail` |
| `src/pages/SaasAuth.tsx` | Idem |

A Edge Function vai:
- Receber `email` e `portal` (saas/franchise)
- Usar `admin.generateLink({ type: "recovery" })` com redirectTo correto
- Renderizar o template HTML de recovery (mesmo estilo dos convites)
- Enviar via Resend com `noreply@noexcusedigital.com.br`
- Retornar HTTP 200 sempre (com `{ error }` se houver falha)

---

### PROBLEMA 2: Usuário da franquia não consegue ser convidado para workspace SaaS

**Causa raiz:** A tabela `user_roles` tem constraint `UNIQUE(user_id)` — um usuário só pode ter **uma** role no sistema todo. Quando um franqueado (role `franqueado`) é convidado para um workspace de cliente, a `invite-user` preserva a role existente. Depois, o `portalRoleGuard` bloqueia o acesso ao portal SaaS porque `franqueado` não está em `SAAS_ROLES`.

**Solução:** Permitir múltiplas roles por usuário (uma por contexto de portal).

**Mudanças de banco:**

```sql
-- Remover constraint de role única por usuário
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;

-- Restaurar constraint composta (permite franqueado + cliente_user para o mesmo user)
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE(user_id, role);
```

**Arquivos:**

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Trocar constraint de `UNIQUE(user_id)` para `UNIQUE(user_id, role)` |
| `supabase/functions/invite-user/index.ts` | Ao convidar usuário existente de outro portal, **inserir nova role** para o portal correto em vez de preservar a existente |
| `get_user_role` (função SQL) | Tornar portal-aware: aceitar parâmetro `_portal` e filtrar roles pelo contexto |

**Lógica na invite-user:**
- Se o usuário já existe e já tem role do portal correto → manter
- Se o usuário já existe mas só tem role de outro portal → INSERT nova role para o portal atual (ex: `cliente_user` para SaaS)
- Não mais sobrescrever roles existentes

---

### Resumo de todos os arquivos afetados

1. `supabase/functions/request-password-reset/index.ts` — **Novo**
2. `supabase/config.toml` — Adicionar config da nova função
3. `src/pages/Auth.tsx` — Chamar nova Edge Function
4. `src/pages/SaasAuth.tsx` — Idem
5. **Migração SQL** — Constraint `UNIQUE(user_id, role)`
6. `supabase/functions/invite-user/index.ts` — Lógica multi-role
7. Função SQL `get_user_role` — Aceitar parâmetro `_portal` (opcional, backward-compatible)

### Nenhuma quebra de funcionalidade existente
- Usuários com uma única role continuam funcionando normalmente
- O `portalRoleGuard` já suporta múltiplas roles (usa `.some()`)
- O `has_role()` já funciona com múltiplas rows

