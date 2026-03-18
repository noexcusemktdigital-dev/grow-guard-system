

## Fix: Login redireciona de volta para `/app` (race condition no role)

### Diagnóstico

O login funciona (200 OK confirmado). O problema é uma **race condition** entre `handleLogin` e o `AuthContext`:

1. `signInWithPassword` → sucesso
2. `onAuthStateChange` dispara → seta `user`, inicia `fetchProfileAndRole` (async, demora ~200ms)
3. `handleLogin` chama `validatePortalAccess` (query separada) → ok
4. `navigate("/cliente/inicio")` executa **antes** de `fetchProfileAndRole` terminar
5. `ProtectedRoute` vê `user` setado mas `role = null`
6. Como `allowedRoles={["cliente_admin","cliente_user"]}` e `role` é null → redireciona para `/app`
7. Usuário volta à tela de login

### Solução

No `ProtectedRoute`, quando `user` existe mas `role` ainda é `null`, mostrar o loader em vez de redirecionar. O role será setado em milissegundos pelo AuthContext.

### Alteração

**`src/components/ProtectedRoute.tsx`** — na checagem de `allowedRoles`, se `!role`, mostrar loader ao invés de redirecionar:

```typescript
if (allowedRoles && allowedRoles.length > 0) {
  if (!role) {
    // Role still loading — show spinner instead of redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRoleRedirect(role)} replace />;
  }
}
```

Um bloco alterado, zero risco de quebra. O loader aparece por milissegundos até o role carregar, e o fluxo continua normalmente.

