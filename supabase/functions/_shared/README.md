# Edge Functions — Helpers Compartilhados

Padrões reutilizáveis para todas as edge fns do Sistema Noé.

## Imports

```ts
import { corsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { requireAuth, assertOrgMember, authErrorResponse } from '../_shared/auth.ts';
import { withIdempotency } from '../_shared/idempotency.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { verifyMetaWebhook } from '../_shared/hmac.ts';
import { redact, maskEmail, maskPhone } from '../_shared/redact.ts';
```

## Boilerplate padrão

```ts
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const ctx = newRequestContext(req, '<fn-name>');
  const log = makeLogger(ctx);
  log.info('request_received');

  try {
    const { user, supabase, admin } = await requireAuth(req);
    const body = await req.json();
    await assertOrgMember(admin, user.id, body.organization_id);

    const rl = await checkRateLimit(user.id, body.organization_id, '<fn-name>');
    if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

    // ... lógica ...

    log.info('success');
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: withCorrelationHeader(ctx, { ...corsHeaders, 'Content-Type': 'application/json' })
    });
  } catch (err) {
    log.error('error', { error: String(err) });
    return authErrorResponse(err, corsHeaders);
  }
});
```

## Boas práticas
- Sempre logar PII via `redact()` ou `maskEmail/maskPhone`
- Sempre incluir `correlation_id` no header de resposta
- Webhooks: validar HMAC ANTES de auth (request externa)
- Mutações financeiras: `withIdempotency` + `Idempotency-Key` header
