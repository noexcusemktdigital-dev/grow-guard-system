

## Plano — Corrigir cadastro via Google OAuth

### Problema raiz

Há dois problemas interligados no fluxo de cadastro via Google:

1. **redirect_uri apontando para rota protegida**: O `handleGoogleLogin` define `redirect_uri: window.location.origin + "/cliente/inicio"`. Após o Google redirecionar de volta, o app tenta carregar `/cliente/inicio` (rota protegida) antes de a sessão ser transferida do client padrão para o client customizado (`noe-saas-auth`). O `ProtectedRoute` não encontra sessão e redireciona para login, perdendo o fluxo.

2. **Provisionamento depende de sessão no client customizado**: O `AuthContext` chama `supabase.functions.invoke("signup-saas", { body: { user_id } })`, mas o `supabase` aqui é o client com `storageKey: "noe-saas-auth"`. Se a sessão ainda não foi transferida do client padrão, o invoke não envia o JWT correto e a edge function retorna 401 (Authorization required).

### Solução

| Arquivo | Mudança |
|---------|---------|
| `src/pages/SaasAuth.tsx` | Alterar `redirect_uri` de `window.location.origin + "/cliente/inicio"` para `window.location.origin` (raiz). A SaasLanding já redireciona usuários autenticados para `/cliente/inicio`. |
| `src/contexts/AuthContext.tsx` | No bloco de auto-provisioning Google OAuth (linha 151), usar `defaultClient.functions.invoke` como fallback caso o token do client customizado ainda não esteja disponível, garantindo que o JWT correto seja enviado. Alternativamente, verificar se a sessão do client customizado está ativa antes de invocar. |

### Detalhe técnico

**SaasAuth.tsx (linha 174):**
```typescript
// Antes:
redirect_uri: window.location.origin + "/cliente/inicio",

// Depois:
redirect_uri: window.location.origin,
```

**AuthContext.tsx (linhas 146-158):**
O provisionamento precisa garantir que o `supabase` (client customizado) já tem a sessão antes de chamar `signup-saas`. Adicionar uma verificação explícita:
```typescript
if (isGoogleOAuth && !existingOrg) {
  // Garantir que a sessão está no client customizado antes de invocar
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  if (!currentSession) {
    // Transferir sessão do defaultClient se necessário
    const { data: { session: defaultSess } } = await defaultClient.auth.getSession();
    if (defaultSess) {
      await supabase.auth.setSession({
        access_token: defaultSess.access_token,
        refresh_token: defaultSess.refresh_token,
      });
    }
  }
  
  await supabase.functions.invoke("signup-saas", {
    body: { user_id: currentUser.id, company_name: companyName },
  });
}
```

### Fluxo corrigido

1. Usuário clica "Entrar com Google" → `redirect_uri: window.location.origin`
2. Google redireciona de volta para `/` (SaasLanding)
3. `lovable.auth.signInWithOAuth` seta sessão no client padrão
4. `AuthContext.initialize` detecta sessão no defaultClient → transfere para client customizado
5. `fetchProfileAndRole` detecta Google OAuth sem org → chama `signup-saas` com JWT válido
6. Provisioning cria org, role, subscription, wallet
7. Polling encontra role → SaasLanding redireciona para `/cliente/inicio`

### Arquivos afetados

- `src/pages/SaasAuth.tsx` — 1 linha
- `src/contexts/AuthContext.tsx` — ~10 linhas no bloco de provisioning

