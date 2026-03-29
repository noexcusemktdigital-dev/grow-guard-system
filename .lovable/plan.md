

## Correção Urgente — Erro "Failed to send a request to the Edge Function"

### Causa raiz

O arquivo `supabase/functions/_shared/cors.ts` **não inclui o domínio de produção** `sistema.noexcusedigital.com.br` na lista de origens permitidas. Ele só permite:
- `*.lovable.app`
- `*.supabase.co`
- `localhost:5173` e `localhost:3000`

Quando o admin acessa via `https://sistema.noexcusedigital.com.br`, o preflight CORS falha e o browser bloqueia a requisição antes de chegar à Edge Function.

### Correção

**Arquivo:** `supabase/functions/_shared/cors.ts`

Adicionar `https://sistema.noexcusedigital.com.br` à lista `ALLOWED_ORIGINS_EXACT`:

```typescript
const ALLOWED_ORIGINS_EXACT = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://sistema.noexcusedigital.com.br',
];
```

**Deploy:** Re-deploy todas as Edge Functions que importam `_shared/cors.ts` para aplicar a correção.

### Impacto
- Corrige o erro para **todas** as Edge Functions (invite-user, generate-script, auth-email-hook, etc.) quando acessadas pelo domínio de produção
- Nenhuma mudança de banco de dados necessária

