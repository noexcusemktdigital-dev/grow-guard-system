

## Fix: invite-user failing for existing users

### Causa raiz
O `listUsers({ filter: email })` do Supabase não está retornando o usuário existente de forma confiável. Quando o usuário não é encontrado, a função tenta `createUser`, que falha com `email_exists` (422) e esse erro não é tratado — vira um 500.

### Solução
Inverter a lógica: tentar `createUser` primeiro e, se falhar com `email_exists`, buscar o usuário existente via `getUserById` ou `listUsers`. Isso elimina a dependência do filtro de busca.

### Mudança

**Arquivo:** `supabase/functions/invite-user/index.ts`

Trocar a lógica de "buscar primeiro, criar depois" por "criar primeiro, tratar duplicata":

```typescript
// 1. Tentar criar o usuário
const tempPassword = crypto.randomUUID() + "Aa1!";
const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
  email, password: tempPassword, email_confirm: true,
  user_metadata: { full_name: full_name || email.split("@")[0] },
});

let userId: string;

if (createErr && createErr.message?.includes("already been registered")) {
  // Usuário já existe — buscar por listUsers
  const { data: { users } } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 50 });
  const existing = users?.find(u => u.email === email);
  if (!existing) throw new Error("Usuário existe mas não foi encontrado");
  
  // Verificar se já é membro da org
  const { data: existingMembership } = await adminClient
    .from("organization_memberships").select("id")
    .eq("user_id", existing.id).eq("organization_id", organization_id).maybeSingle();
  if (existingMembership) return Response 409 "já é membro";
  
  userId = existing.id;
} else if (createErr) {
  throw createErr;
} else {
  userId = newUser.user.id;
}
```

Depois: redeploy da Edge Function.

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/invite-user/index.ts` | Inverter lógica: criar primeiro, tratar `email_exists` |
| Deploy | Redeploy obrigatório |

