

## Plano — Corrigir erro CORS na Edge Function `izitech-provision`

### Problema

O arquivo `supabase/functions/_shared/cors.ts` possui uma allowlist restrita de origens CORS que **nao inclui** os dominios do Lovable (`*.lovableproject.com`, `*.lovable.app`). Quando usuarios acessam via preview, o browser bloqueia a resposta por CORS mismatch, resultando no erro generico "Edge Function returned a non-2xx status code".

Alem disso, o componente `WhatsAppSetupWizard.tsx` nao usa `extractEdgeFunctionError` para extrair a mensagem real do backend, mostrando apenas o erro generico do SDK.

### Alteracoes

#### 1. `supabase/functions/_shared/cors.ts`

Adicionar os dominios do Lovable a allowlist:
- `https://id-preview--1d5802a2-4462-4bb6-a30e-a9b2d444f68e.lovable.app`
- `https://grow-guard-system.lovable.app`

Ou, melhor ainda, aceitar qualquer origem `*.lovable.app` e `*.lovableproject.com` via checagem dinamica para nao quebrar em futuros deploys.

#### 2. `src/components/cliente/WhatsAppSetupWizard.tsx`

No catch do `handleIzitechConnect`, usar `extractEdgeFunctionError` para extrair a mensagem real do backend em vez do erro generico do SDK.

### Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/_shared/cors.ts` | Adicionar dominios Lovable |
| `src/components/cliente/WhatsAppSetupWizard.tsx` | Usar `extractEdgeFunctionError` no catch |

