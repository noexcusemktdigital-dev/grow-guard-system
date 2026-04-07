

## Problema

A `SaasLanding.tsx` (rota `/`) redireciona usuários logados hardcoded para `/cliente/inicio`. Larissa é admin da **franqueadora**, então deveria ir para `/franqueadora/inicio`. Qualquer usuário franqueador que visite a landing logado é mandado pro portal errado.

## Solução

Usar a mesma lógica de `getRoleRedirect` que já existe em `ProtectedRoute.tsx` para decidir o destino baseado no role do usuário:

- `super_admin` / `admin` → `/franqueadora/inicio`
- `franqueado` → `/acessofranquia`  
- `cliente_admin` / `cliente_user` → `/cliente/inicio`

### Alteração em `src/pages/SaasLanding.tsx`

1. Importar `role` do `useAuth()` (já usado no componente)
2. Substituir o redirect hardcoded:

```tsx
// De:
if (user) return <Navigate to="/cliente/inicio" replace />;

// Para:
if (user) {
  const dest = role === "super_admin" || role === "admin"
    ? "/franqueadora/inicio"
    : role === "franqueado"
    ? "/acessofranquia"
    : "/cliente/inicio";
  return <Navigate to={dest} replace />;
}
```

Apenas 1 arquivo alterado, correção pontual.

