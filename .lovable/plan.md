

## Separação de Portais de Login por Papel (Role)

### Problema
Ambos os portais (`/app` e `/acessofranquia`) usam a mesma autenticação. Um usuário da Matriz consegue logar via `/app` e ser redirecionado para o sistema, quando deveria ser bloqueado.

### Regra
- `/app` (SaasAuth): aceita **apenas** `cliente_admin` e `cliente_user`
- `/acessofranquia` (Auth): aceita **apenas** `super_admin`, `admin` e `franqueado`

### Solução

| Arquivo | Mudança |
|---------|---------|
| `src/pages/SaasAuth.tsx` | Após login com sucesso, buscar role do usuário. Se for `super_admin`/`admin`/`franqueado`, fazer signOut e mostrar erro "Esta conta pertence ao portal da franquia. Acesse /acessofranquia" |
| `src/pages/Auth.tsx` | Após login com sucesso, buscar role do usuário. Se for `cliente_admin`/`cliente_user`, fazer signOut e mostrar erro "Esta conta pertence ao portal SaaS. Acesse /app" |
| `src/pages/SaasAuth.tsx` | No useEffect de sessão existente (se houver), também validar role e redirecionar/bloquear |
| `src/pages/Auth.tsx` | Idem |

### Fluxo pós-login

```text
Login → signInWithPassword → sucesso
  → buscar role via user_roles
  → role compatível com portal? 
    SIM → navigate normalmente
    NÃO → signOut() + toast.error("Acesse pelo portal correto")
```

### Detalhes
- A validação será feita logo após o `signInWithPassword` retornar sucesso, antes do `navigate()`
- Para Google OAuth no `/app`, a validação acontecerá no `onAuthStateChange` (o usuário já é criado como cliente, então conflito é improvável, mas será protegido)
- A busca de role será uma query simples: `supabase.from("user_roles").select("role").eq("user_id", user.id)`

