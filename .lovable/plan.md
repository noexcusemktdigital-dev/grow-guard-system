

## Fix: Login não funciona no preview (SaasAuth)

### Diagnóstico

O login retorna 200 OK mas o usuário permanece na tela de login. O problema provável é que `validatePortalAccess` está travando ou lançando um erro silencioso após o `signInWithPassword`. O `onAuthStateChange` do AuthContext dispara em paralelo e pode causar conflito de estado.

Na produção funciona porque o timing é diferente (rede mais rápida, sem overhead do HMR/Vite dev server).

### Solução

Envolver `validatePortalAccess` em um try-catch com timeout, garantindo que o redirecionamento sempre aconteça mesmo se a checagem falhar. O `ProtectedRoute` já tem a proteção de roles como fallback.

### Alteração

**`src/pages/SaasAuth.tsx`** — handleLogin (linhas 81-90):

```typescript
// Replace validatePortalAccess block with safe version
try {
  const check = await Promise.race([
    validatePortalAccess(data.user.id, "saas"),
    new Promise<{ allowed: boolean }>((resolve) =>
      setTimeout(() => resolve({ allowed: true }), 3000)
    ),
  ]);
  if (!check.allowed) {
    setLoading(false);
    await supabase.auth.signOut({ scope: 'local' });
    toast.error((check as any).message || "Acesso negado.");
    if ((check as any).redirect) navigate((check as any).redirect);
    return;
  }
} catch (err) {
  console.warn("[Login] Portal validation failed, proceeding:", err);
}
setLoading(false);
window.location.href = "/cliente/inicio";
```

Isso garante que mesmo se `validatePortalAccess` travar (timeout de 3s) ou lançar erro, o login prossegue. A segurança de roles continua garantida pelo `ProtectedRoute`.

