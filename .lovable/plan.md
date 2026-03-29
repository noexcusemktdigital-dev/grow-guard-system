

## Diagnóstico — Erro ao convidar usuário existente de outro workspace

### Causa raiz

O problema está na detecção de "usuário já existe" na Edge Function `invite-user`. Quando o `adminClient.auth.admin.createUser()` falha porque o e-mail já está registrado, o código verifica:

```typescript
if (createErr && (createErr as { code?: string }).code === "email_exists")
```

Em versões mais recentes do Supabase JS, o código de erro pode ser `"user_already_exists"` em vez de `"email_exists"`, ou o erro pode vir com uma estrutura diferente (ex: apenas na `message`). Se o código não bate, a execução cai no `else if (createErr)` → `throw createErr` → resposta 500.

Adicionalmente, há um problema arquitetural: a tabela `user_roles` tem constraint `UNIQUE(user_id)`, permitindo apenas **uma role por usuário globalmente**. Quando um usuário existente (ex: `cliente_admin` no workspace A) é convidado para o workspace B, a função faz `UPDATE` na role — **sobrescrevendo a role do workspace original**. Isso quebra o acesso no workspace anterior.

### Plano de correção

**1. Tornar a detecção de "usuário existente" robusta**

No `invite-user/index.ts`, ao invés de depender exclusivamente do `code === "email_exists"`, verificar também o `message` e o código `"user_already_exists"`:

```typescript
const isEmailExists = createErr && (
  (createErr as any).code === "email_exists" ||
  (createErr as any).code === "user_already_exists" ||
  (createErr as any).message?.includes("already been registered") ||
  (createErr as any).message?.includes("already exists")
);
```

Adicionar `console.log` detalhado para o erro quando não for reconhecido.

**2. Preservar a role do workspace original (multi-org)**

O cenário multi-workspace exige que um usuário possa ter roles diferentes em organizações diferentes. Porém, como `user_roles` tem `UNIQUE(user_id)`, isso não é possível hoje. A correção:

- Para usuários **existentes** que já têm uma role e estão sendo convidados para outra org: **não sobrescrever a role** se ela já existe. Manter a role atual e apenas criar o membership.
- Para o futuro (quando a arquitetura multi-workspace evoluir), a role deveria ser por organização, mas isso é uma mudança maior. Por ora, a solução segura é: se o usuário já tem role, preservá-la.

**3. Melhorar logging para debug**

Adicionar logs detalhados em cada etapa para facilitar diagnóstico futuro.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/invite-user/index.ts` | Detecção robusta de email_exists, preservar role existente, logging melhorado |

