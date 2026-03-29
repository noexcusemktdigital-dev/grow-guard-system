

## Auditoria Completa — Arquitetura de Usuários

Após revisão detalhada de todos os fluxos (signup, login, convite, edição, remoção, reset de senha, Google OAuth), identifiquei os seguintes bugs e melhorias organizados por criticidade.

---

### BUG CRÍTICO 1 — Google OAuth: usuário fica sem organização/assinatura/créditos

Quando um usuário faz "Criar conta com Google" no portal SaaS, o fluxo OAuth redireciona diretamente para `/cliente/inicio`. A Edge Function `signup-saas` **nunca é chamada** para usuários Google. O `AuthContext` detecta `provider === "google"` e faz polling pela role, mas como ninguém provisionou org/role/subscription/wallet, o polling falha por 10s e o fallback atribui `cliente_admin` — porém **sem organização, sem assinatura, sem créditos**.

O onboarding (`ClienteOnboardingCompany`) tenta ler `orgData` mas como não existe org, provavelmente falha silenciosamente ou mostra tela em branco.

**Correção:** Após o redirect do Google OAuth, o `AuthContext` (ou uma página intermediária) deve detectar que o usuário Google não tem organização e chamar `signup-saas` automaticamente para provisionar org + subscription + wallet.

---

### BUG CRÍTICO 2 — Franqueado: papel "cliente_user" usado como "Operador"

Em `FranqueadoConfiguracoes.tsx` (linha 125-126), as opções de papel para convidar membros na franquia são:
- `franqueado` → "Admin (Franqueado)"
- `cliente_user` → "Operador"

Isso atribui a role global `cliente_user` a um membro da **franquia**, o que causa conflito com o `portalRoleGuard`: na próxima vez que esse "operador" tentar logar, o sistema pode bloquear o acesso ao portal da franquia porque `cliente_user` é uma role SaaS, não franchising.

Da mesma forma, em `UnidadeUsuariosReal.tsx` a opção "Usuário" também usa `cliente_user`.

**Correção:** Criar ou usar uma role específica para operadores de franquia (ex: manter `franqueado` como única role do portal franquia, ou adicionar `franqueado_user` ao enum), ou ajustar o `portalRoleGuard` para permitir `cliente_user` no portal franchise quando o membership é de uma org tipo `franqueado`.

---

### BUG MÉDIO 3 — invite-user: self-invite check acontece DEPOIS da criação do usuário

No `invite-user` (linha 210-216), a verificação de "auto-convite" (`userId === callerId`) só acontece **depois** de tentar criar o usuário e gerar o link de recuperação. Se o admin digitar o próprio email, o sistema vai gerar um recovery link e enviar email antes de barrar. Isso não é um blocker funcional mas é um desperdício e potencialmente confuso.

**Correção:** Mover a verificação de self-invite para antes da criação do usuário (logo após validar o `callerId`).

---

### BUG MÉDIO 4 — invite-user: email de convite enviado mesmo para usuários existentes que já são membros

Se um usuário já existe E já é membro, o código retorna 409 na linha 194-198. Isso está correto. Porém, se o usuário **existe mas NÃO é membro** (multi-org), o sistema gera um novo recovery link e envia email — o que reseta a senha do usuário existente sem aviso. Isso pode causar perda de acesso temporária na outra organização.

**Correção:** Para usuários existentes sendo adicionados a nova org, enviar um email informativo ("Você foi adicionado à organização X") em vez de um recovery link que reseta a senha.

---

### BUG MÉDIO 5 — update-member remove: não deleta o usuário do auth

Quando um admin remove um membro, o `update-member` deleta: team memberships, org membership, e condicionalmente a role. Porém **o usuário continua existindo no auth.users**. Se ele não tem mais nenhum membership, fica como um "usuário fantasma" — pode fazer login mas não tem acesso a nada, resultando em tela em branco ou erro.

**Correção:** Quando `otherMemberships === 0` após a remoção, deletar também o auth user via `admin.auth.admin.deleteUser(user_id)` para limpar completamente. Ou alternativamente, mostrar uma tela de "Você não tem acesso a nenhuma organização" no frontend.

---

### BUG MENOR 6 — team_ids no invite-user: sem ON CONFLICT

Linha 288-289 do `invite-user`: se o mesmo usuário for convidado duas vezes com os mesmos team_ids (edge case), o insert falha com duplicate key. Deveria ter `ON CONFLICT DO NOTHING`.

**Correção:** Adicionar `.onConflict("team_id,user_id")` ou handling de erro no insert de `org_team_memberships`.

---

### BUG MENOR 7 — Franqueado role options inconsistente com invite-user default

No `invite-user` (linha 266), quando o org type é `franqueado`, o default role é `franqueado`. Mas em `FranqueadoConfiguracoes.tsx` o default do formulário de convite é `cliente_user`. O frontend envia `role: "cliente_user"` que o backend aceita (está na lista `allowedRoles`). Isso não deveria acontecer — um operador de franquia não deveria receber `cliente_user`.

---

### MELHORIA 1 — Consistência de error handling

Embora já tenhamos corrigido vários locais, ainda existe o risco de que **novos locais que chamam Edge Functions** repitam o pattern `if (error) throw error` sem extrair o contexto. Sugiro criar um helper reutilizável:

```typescript
// src/lib/edgeFunctionError.ts
export async function extractEdgeFunctionError(error: any): Promise<Error> {
  const ctx = error?.context;
  if (ctx instanceof Response) {
    const body = await ctx.json().catch(() => null);
    return new Error(body?.error || error.message);
  }
  return error instanceof Error ? error : new Error(String(error));
}
```

E usá-lo em todos os locais que invocam functions.

---

### Resumo de arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/AuthContext.tsx` | Provisionar Google OAuth users via `signup-saas` |
| `src/pages/franqueado/FranqueadoConfiguracoes.tsx` | Corrigir role options (remover `cliente_user` de franquias) |
| `src/components/unidades/UnidadeUsuariosReal.tsx` | Idem |
| `supabase/functions/invite-user/index.ts` | Mover self-invite check, ON CONFLICT em team_ids, email diferente para existing users |
| `supabase/functions/update-member/index.ts` | Deletar auth user quando sem memberships |
| `src/lib/edgeFunctionError.ts` | Novo helper reutilizável para extração de erros |
| Todos os locais que chamam Edge Functions | Usar o helper |

### Nenhuma mudança de banco de dados necessária

Todas as correções são em código frontend e Edge Functions.

