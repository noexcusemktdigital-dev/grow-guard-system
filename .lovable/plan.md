

## Plano — Créditos Trial só contam após aprovação do GPS

### Problema

Usuários trial começam com 500 créditos, mas o fluxo do GPS consome ~110 créditos automaticamente (50 na aprovação + 60 nos 3 scripts gerados). O usuário quer que trial mantenha 500 créditos intactos até o GPS ser aprovado — ou seja, o GPS inteiro é gratuito para trial.

### Solução

Adicionar verificação de **trial + GPS** em todos os pontos de débito envolvidos no fluxo do GPS. Se o plano é trial, essas operações não cobram créditos.

### Mudanças

| Arquivo | Ação |
|---------|------|
| `src/hooks/useMarketingStrategy.ts` | No `useApproveStrategy`, pular `debit_credits` se subscription é trial |
| `supabase/functions/generate-strategy/index.ts` | Pular check de créditos se subscription é trial |
| `supabase/functions/generate-script/index.ts` | Pular check e debit se subscription é trial E source é GPS (auto-geração) |
| `src/pages/cliente/ClienteGPSNegocio.tsx` | Passar flag `from_gps: true` nas chamadas de `generate-script` para distinguir scripts auto-gerados |

### Lógica no Edge Function

```typescript
// Verificar se é trial
const { data: sub } = await adminClient
  .from("subscriptions")
  .select("status")
  .eq("organization_id", organization_id)
  .maybeSingle();
const isTrial = sub?.status === "trial";

// Pular check/debit de créditos se trial
if (!isTrial) {
  // check balance + debit normalmente
}
```

### Frontend (useApproveStrategy)

```typescript
// Verificar se é trial antes de debitar
const { data: sub } = await supabase
  .from("subscriptions")
  .select("status")
  .eq("organization_id", orgId)
  .maybeSingle();

if (sub?.status !== "trial") {
  // debit 50 credits
}
```

### Resultado

- Trial: GPS inteiro (geração + aprovação + scripts automáticos) = 0 créditos. Saldo permanece 500.
- Planos pagos: Comportamento mantido — débito normal.
- Após GPS aprovado, qualquer outra ação (conteúdos, sites, tráfego) debita normalmente, inclusive para trial.

