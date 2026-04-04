

## Plano — Corrigir erro "Organização não encontrada" no Google Calendar OAuth

### Problema

Na edge function `google-calendar-oauth`, a chamada `get_user_org_id` na linha 41 não passa o parâmetro `_portal`. Como a função SQL possui múltiplas sobrecargas, sem o parâmetro ela assume o contexto "franchise", falhando para clientes SaaS.

### Solução

Adicionar `_portal: "saas"` à chamada RPC no action `save_credentials`. Para ser mais robusto, receber o `portal` do frontend no body da requisição (o wizard já roda em `/cliente/agenda`, então sabemos que é SaaS), com fallback para `"saas"`.

### Mudanças

| Arquivo | Ação |
|---------|------|
| `supabase/functions/google-calendar-oauth/index.ts` | Linha 41: adicionar `_portal` ao RPC. Extrair `portal` do body da request com default `"saas"` |
| Deploy da edge function | `google-calendar-oauth` |

### Detalhe técnico

```typescript
// Antes (linha 41):
const { data: orgId } = await serviceClient.rpc("get_user_org_id", { _user_id: userId });

// Depois:
const portalCtx = portal || "saas";
const { data: orgId } = await serviceClient.rpc("get_user_org_id", { _user_id: userId, _portal: portalCtx });
```

E no destructuring do body (linha 30), adicionar `portal`:
```typescript
const { action, code, redirect_uri, client_id, client_secret, portal } = await req.json();
```

