

## Plano — Resolver instabilidade de sessão e logouts inesperados

### Problema

O `AuthContext` registra `onAuthStateChange` antes de `getSession()`, causando race condition onde `INITIAL_SESSION` com `null` dispara logout antes da sessão real ser restaurada. Além disso, `await` no callback bloqueia token refresh.

### Correção

#### Arquivo: `src/contexts/AuthContext.tsx`

Reescrever o `useEffect` de inicialização:

1. **`getSession()` primeiro** — restaurar sessão do storage antes de qualquer decisão
2. **Registrar listener depois** — só após `getSession()` completar
3. **Flag `initializedRef`** — ignorar o evento `INITIAL_SESSION` automático (que vem com `null`)
4. **Sem `await` no callback** — usar fire-and-forget para `fetchProfileAndRole`
5. **`loading = false` apenas após `getSession()`** — nunca antes

Fluxo novo:
```text
1. getSession() → restaura token do localStorage
2. Se session → setUser, setSession, await fetchProfileAndRole
3. setLoading(false)
4. Registra onAuthStateChange (para SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED futuros)
   - No callback: fire-and-forget, sem await
   - Ignora INITIAL_SESSION (já tratado pelo getSession)
```

#### Arquivo: `src/components/ProtectedRoute.tsx`

Adicionar detecção de mismatch de portal: se o usuário está em rota `/cliente/*` mas a storageKey é `noe-franchise-auth` (ou vice-versa), forçar reload para recalcular a storageKey correta.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/contexts/AuthContext.tsx` | Reescrever useEffect: getSession primeiro, listener depois, sem await |
| `src/components/ProtectedRoute.tsx` | Guard contra portal mismatch na storageKey |

### Resultado

- Sessão restaurada do storage antes de qualquer routing
- Sem logouts fantasma por race condition
- Token refresh não bloqueia
- Navegação entre portais recalcula storageKey corretamente

