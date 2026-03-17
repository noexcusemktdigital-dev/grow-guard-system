

## Plano: Corrigir redirecionamento de logout do SaaS

### Causa raiz

Quando o usuário SaaS faz logout via `UserMenu`:

1. `handleLogout` chama `await signOut()` — que seta `user=null` imediatamente
2. React re-renderiza, `ProtectedRoute` vê `user=null` e faz `<Navigate to={getLoginPath()}>` 
3. O `navigate("/app")` do `handleLogout` não executa a tempo — o `ProtectedRoute` já ganhou a corrida

O problema é que `signOut()` limpa o estado do React antes do `navigate()` rodar, e o `ProtectedRoute` captura a mudança primeiro.

### Solução

Modificar `signOut` no `AuthContext` para aceitar um parâmetro `redirectTo`. Quando fornecido, navega usando `window.location.href` (que é síncrono e bypassa React Router) ANTES de limpar o estado. No `UserMenu.handleLogout`, passar o caminho correto.

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/AuthContext.tsx` | `signOut` aceita `redirectTo?: string`, navega antes de limpar estado |
| `src/components/UserMenu.tsx` | Passa o redirect path para `signOut()` |
| `src/components/FranqueadoSidebar.tsx` | Passa `/acessofranquia` no `signOut()` |
| `src/components/FranqueadoraSidebar.tsx` | Passa `/acessofranquia` no `signOut()` |

### Código

**AuthContext.tsx** — `signOut`:
```typescript
const signOut = async (redirectTo?: string) => {
  const target = redirectTo || (
    role === "cliente_admin" || role === "cliente_user" ? "/app" : "/acessofranquia"
  );
  await supabase.auth.signOut({ scope: 'local' });
  setUser(null);
  setSession(null);
  setProfile(null);
  setRole(null);
  window.location.href = target;
};
```

**UserMenu.tsx**:
```typescript
const handleLogout = async () => {
  const target = isSaasUser ? "/app" : "/acessofranquia";
  await signOut(target);
  // Não precisa de navigate — signOut já redireciona
};
```

Usar `window.location.href` garante que a navegação acontece de forma determinística, sem depender do ciclo de re-render do React.

