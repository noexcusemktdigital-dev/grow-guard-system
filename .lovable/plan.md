

## Plano: Corrigir isolamento de sessão entre portais

### Problema
Mesmo com storageKeys separados (`noe-saas-auth` / `noe-franchise-auth`), ao logar em um portal o outro é deslogado. A causa são chamadas `signOut()` sem `scope: 'local'` — o padrão revoga o refresh token **no servidor**, invalidando a sessão do outro portal.

### Pontos de conflito encontrados

| Local | Problema |
|-------|----------|
| `portalRoleGuard.ts` L29 | `signOut()` sem scope — revoga token no servidor, mata sessão do outro portal |
| `AuthContext.tsx` L145 | `defaultClient.auth.signOut()` sem scope — mesma revogação |
| `AuthContext.tsx` L166 (signOut fn) | `signOut()` sem scope — ao fazer logout em um portal, revoga o token no servidor |
| `ProtectedRoute.tsx` L31 | Redireciona sempre para `/acessofranquia` mesmo para usuários SaaS sem sessão |

### Solução

**1. Todas as chamadas `signOut()` devem usar `scope: 'local'`**

Isso remove apenas a sessão local (localStorage) sem revogar o refresh token no servidor. Assim, a sessão do outro portal continua válida.

```typescript
await supabase.auth.signOut({ scope: 'local' });
```

**2. `ProtectedRoute` deve redirecionar para o portal correto**

Se o usuário está em rota `/cliente/*` sem sessão, redirecionar para `/app` (SaaS login), não `/acessofranquia`.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/lib/portalRoleGuard.ts` | `signOut({ scope: 'local' })` |
| `src/contexts/AuthContext.tsx` | `signOut({ scope: 'local' })` em ambos os locais (defaultClient e signOut function) |
| `src/components/ProtectedRoute.tsx` | Redirect baseado no path atual (SaaS → `/app`, Franchise → `/acessofranquia`) |

Total: 3 arquivos, mudanças cirúrgicas.

