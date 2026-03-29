

## Correção — Convite de usuários mostrando erro genérico

### Causa raiz

A organização está no plano **trial** com limite de 2 usuários. Já possui 2 membros. A Edge Function retorna corretamente HTTP 403 com a mensagem `"Limite de 2 usuários atingido. Faça upgrade para adicionar mais."`, porém o código do frontend usa `if (error) throw error` que propaga o erro genérico do SDK (`FunctionsHttpError`) sem extrair a mensagem real do corpo da resposta.

### Plano de correção

**1. Melhorar o tratamento de erros nas chamadas ao `invite-user` (3 arquivos)**

Em `ClienteConfiguracoes.tsx`, `FranqueadoConfiguracoes.tsx` e `UnidadeUsuariosReal.tsx`, substituir o padrão:
```js
const { data, error } = await supabase.functions.invoke("invite-user", { body });
if (error) throw error;
if (data?.error) throw new Error(data.error);
```

Por um padrão que extrai a mensagem real:
```js
const { data, error } = await supabase.functions.invoke("invite-user", { body });
if (error) {
  // Extract actual error message from the response body
  const ctx = (error as any).context;
  if (ctx instanceof Response) {
    const body = await ctx.json().catch(() => null);
    throw new Error(body?.error || error.message);
  }
  throw error;
}
if (data?.error) throw new Error(data.error);
```

Isso fará com que o toast mostre mensagens úteis como "Limite de 2 usuários atingido" em vez do genérico "Edge Function returned a non-2xx status code".

**2. Aplicar o mesmo padrão ao `Matriz.tsx`** que também chama `invite-user`.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Extrair mensagem real do erro da Edge Function |
| `src/pages/franqueado/FranqueadoConfiguracoes.tsx` | Idem |
| `src/components/unidades/UnidadeUsuariosReal.tsx` | Idem |
| `src/pages/Matriz.tsx` | Idem |

### Nota sobre o limite de trial

O plano trial tem limite de 2 usuários (definido na Edge Function). Se quiser alterar esse limite, é uma mudança separada na Edge Function `invite-user` na linha dos `planLimits`. O erro que o cliente viu é o comportamento esperado — apenas a mensagem não estava sendo exibida corretamente.

