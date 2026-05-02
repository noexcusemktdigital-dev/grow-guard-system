# Tests — Helpers compartilhados

Testes para os helpers de `supabase/functions/_shared/`.

## Como rodar

### Vitest (helpers compatíveis com browser/node)

```bash
# redact — roda via vitest (src/test/)
npm test src/test/redact.test.ts

# todos os testes vitest
npm test
```

### Deno (helpers que usam Deno API)

```bash
deno test --allow-env tests/_shared/hmac.test.ts
deno test --allow-env tests/_shared/cron-auth.test.ts

# todos de uma vez
deno test --allow-env tests/_shared/
```

## Cobertura atual

| Helper | Tipo | Arquivo de teste | Testes |
|--------|------|-----------------|--------|
| hmac.ts | Deno | `tests/_shared/hmac.test.ts` | 9 — assinatura SHA-256, determinismo, timing-safe, verify end-to-end |
| redact.ts | Vitest | `src/test/redact.test.ts` | 14 — redact recursivo, regex PII, maskEmail, maskPhone |
| cron-auth.ts | Deno | `tests/_shared/cron-auth.test.ts` | 7 — CRON_SECRET enforcement, constant-time, edge cases |

**Total: 30 testes cobrindo os 3 helpers de segurança mais críticos.**

## Estratégia de código inline

Os helpers ainda não existem no `main` (pendentes de merge dos PRs #4/#5/#7/#18).
O código de cada helper está copiado inline no arquivo de teste correspondente.

Quando os PRs forem mergeados, substituir o bloco inline pelo import direto:

```ts
// hmac.test.ts
import { computeMetaSignature, timingSafeEqual, verifyMetaWebhook }
  from "../../supabase/functions/_shared/hmac.ts";

// cron-auth.test.ts
import { checkCronSecret }
  from "../../supabase/functions/_shared/cron-auth.ts";

// redact.test.ts (vitest)
import { redact, redactString, maskEmail, maskPhone }
  from "../../supabase/functions/_shared/redact.ts";
```

## Próximos helpers (rollout gradual)

| Helper | PR | Prioridade |
|--------|----|-----------|
| auth.ts | #8 | Alta — requireAuth, assertOrgMember |
| rate-limit.ts | #11 | Alta — checkRateLimit |
| idempotency.ts | #6 | Média — hashPayload, withIdempotency |
| correlation.ts | #12 | Média — newRequestContext, makeLogger |
| cors.ts | #13 | Baixa — getCorsHeaders |
| schemas.ts | #16 | Média — parseOrThrow, AsaasSchemas |
| job-failures.ts | #14 | Baixa — logJobFailure |
