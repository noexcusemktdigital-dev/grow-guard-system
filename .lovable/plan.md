

## Fix: Portal Guard Blocking Dual-Role Users

### Problema
Quando um usuário com dual-role (ex: `cliente_admin` + `franqueado`) tenta acessar o portal da franquia, o guard bloqueia e faz sign-out. O guard atual funciona corretamente para dual-role users, **mas o problema real é que o guard faz `signOut` antes de mostrar o erro** — isso destrói a sessão do outro portal também.

Além disso, para usuários que genuinamente só têm role SaaS, o guard não deveria fazer sign-out automático — deveria apenas mostrar a mensagem e redirecionar, preservando a sessão do portal correto.

### Solução

**Arquivo: `src/lib/portalRoleGuard.ts`**

1. **Remover o `signOut` automático** — não destruir a sessão quando o acesso é negado
2. **Retornar `redirect` no resultado** para que o chamador redirecione ao portal correto sem perder a sessão

```ts
if (!hasAllowedRole) {
  // NÃO fazer signOut — preservar sessão do outro portal
  const redirect = portal === "saas" ? "/acessofranquia" : "/app";
  const message = portal === "saas"
    ? "Esta conta pertence ao portal da franquia. Acesse /acessofranquia"
    : "Esta conta pertence ao portal SaaS. Acesse /app";
  return { allowed: false, message, redirect };
}
```

**Arquivo: `src/pages/Auth.tsx`** (franchise login)
- Após `check.allowed === false`, fazer `signOut({ scope: 'local' })` apenas do cliente atual e mostrar toast com mensagem

**Arquivo: `src/pages/SaasAuth.tsx`** (SaaS login)  
- Mesmo ajuste: signOut local + toast

### Resultado
- Dual-role users passam normalmente (já funciona se roles estão corretos)
- Single-role users veem mensagem sem perder sessão do outro portal
- Sign-out é controlado pelo chamador, não pelo guard

