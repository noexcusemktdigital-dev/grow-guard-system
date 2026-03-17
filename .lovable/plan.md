

## Plano: Corrigir redirecionamento do Google OAuth no SaaS

### Causa raiz

Em `SaasAuth.tsx` linha 152, o `redirect_uri` aponta para `window.location.origin` (raiz `/`), que é a rota da `SaasLanding`. Após o OAuth completar, o usuário é redirecionado para a landing page ao invés de entrar no app.

### Correção

Alterar o `redirect_uri` de `window.location.origin` para `window.location.origin + "/cliente/inicio"`. Assim, após o Google OAuth, o usuário cai diretamente na rota protegida `/cliente/inicio`, onde o `AuthContext` detecta a sessão, provisiona o usuário (se novo) e exibe o dashboard.

### Arquivo impactado

| Arquivo | Mudança |
|---------|---------|
| `src/pages/SaasAuth.tsx` | Alterar `redirect_uri` na função `handleGoogleLogin` (linha 152) |

### Mudança exata

```typescript
// De:
redirect_uri: window.location.origin,

// Para:
redirect_uri: window.location.origin + "/cliente/inicio",
```

