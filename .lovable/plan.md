

## Plano — Corrigir erro na Edge Function `google-calendar-oauth`

### Problema

A função helper `jsonRes` (linha 5-10) referencia a variável `req` para obter os headers CORS, mas `req` existe apenas dentro do callback do `serve()`. Isso causa um `ReferenceError: req is not defined` em qualquer chamada da função, resultando no erro "non-2xx status code" para todos os usuários.

### Correção

Alterar `jsonRes` para receber `req` como parâmetro, e atualizar todas as chamadas (aproximadamente 15 ocorrências) para passar `req`.

### Arquivo

| Arquivo | Acao |
|---------|------|
| `supabase/functions/google-calendar-oauth/index.ts` | Adicionar `req` como parâmetro em `jsonRes` e passar em todas as chamadas |

### Detalhes Tecnicos

```typescript
// ANTES (broken)
function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

// DEPOIS (fixed)
function jsonRes(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}
```

Todas as chamadas mudam de `jsonRes({...})` para `jsonRes(req, {...})`.

