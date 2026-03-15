

## Diagnóstico: Convite mostra sucesso mas email não chega (Gmail)

### Causa raiz provável

A Edge Function `invite-user` foi editada no código mas **pode não ter sido re-deployada** após as mudanças. Os logs da função estão completamente vazios, o que indica que ou a versão deployada ainda é a antiga (que usava `inviteUserByEmail`) ou a função não está respondendo como esperado.

Além disso, há um problema de escalabilidade: `adminClient.auth.admin.listUsers()` busca **todos os usuários** sem paginação. Com muitos usuários, isso pode causar timeout silencioso antes de chegar ao envio do email — o frontend recebe sucesso parcial.

### Solução

1. **Re-deploy da Edge Function** `invite-user` para garantir que o código atualizado (createUser + Resend direto) está ativo

2. **Corrigir busca de usuário existente** — trocar `listUsers()` por uma busca específica usando `listUsers({ filter })` ou tentando criar diretamente e tratando o erro de duplicata. Isso evita timeout com bases grandes.

3. **Adicionar log estruturado** no início e fim da função para facilitar diagnóstico futuro

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/invite-user/index.ts` | Trocar `listUsers()` por busca específica por email; adicionar logs de diagnóstico |
| Deploy | Re-deploy obrigatório da function |

### Detalhe técnico

Trocar:
```typescript
const { data: existingUsers } = await adminClient.auth.admin.listUsers();
const existingUser = existingUsers?.users?.find((u) => u.email === email);
```

Por:
```typescript
const { data: { users } } = await adminClient.auth.admin.listUsers({ filter: email });
const existingUser = users?.find((u) => u.email === email);
```

Isso faz uma busca filtrada no servidor em vez de baixar toda a base de usuários.

