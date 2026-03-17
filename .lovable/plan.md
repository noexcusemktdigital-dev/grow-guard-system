

## Plano: Corrigir Google OAuth — Sessão não transferida a tempo

### Causa raiz

O problema é uma **condição de corrida** (race condition) no `AuthContext.tsx`:

1. Usuário clica "Entrar com Google" → é redirecionado ao Google → volta para `/cliente/inicio`
2. O `AuthProvider` monta e configura dois listeners em paralelo:
   - `onAuthStateChange` no cliente portal (`noe-saas-auth`) — não encontra sessão, dispara com `null` e **define `loading=false` imediatamente**
   - `getSession()` — verifica o cliente portal (nada), depois verifica o cliente default (onde o Lovable OAuth salvou a sessão), e só então faz a transferência
3. O `ProtectedRoute` vê `loading=false` + `user=null` e **redireciona para `/app`** antes da transferência completar

Em resumo: o `onAuthStateChange` define `loading=false` antes do `getSession` ter chance de encontrar e transferir a sessão do Google OAuth.

### Solução

Adicionar um flag `initializing` no `AuthContext` para garantir que `loading` só se torne `false` **após** toda a lógica de inicialização (incluindo verificação do default client) completar. O `onAuthStateChange` não deve setar `loading=false` durante a fase inicial.

### Mudança exata

**Arquivo: `src/contexts/AuthContext.tsx`**

```typescript
const [loading, setLoading] = useState(true);
const [initialized, setInitialized] = useState(false); // ← NOVO

// No onAuthStateChange:
if (newSession?.user) {
  setTimeout(() => fetchProfileAndRole(newSession.user), 0);
}
// Só define loading=false se já inicializou:
if (initialized) {
  setLoading(false);
}

// No getSession (final da promise):
setInitialized(true);
setLoading(false);
```

Isso garante que durante o carregamento inicial, o `loading` permanece `true` até que `getSession` complete a verificação e a transferência da sessão OAuth. Depois de inicializado, os eventos subsequentes do `onAuthStateChange` (logout, refresh) continuam funcionando normalmente.

### Arquivo impactado

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/AuthContext.tsx` | Adicionar flag `initialized` para evitar race condition |

