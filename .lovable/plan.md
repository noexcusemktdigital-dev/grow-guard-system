

## Correção — Erro genérico ao gerar script (mesmo padrão do invite-user)

### Causa raiz

Idêntica ao bug do `invite-user`: quando a Edge Function `generate-script` retorna HTTP 402 (créditos insuficientes) ou qualquer non-2xx, o SDK do Supabase encapsula como `FunctionsHttpError` genérico. O frontend faz `if (error) throw error` sem extrair a mensagem real do corpo da resposta.

**Não tem relação com o plano trial** — qualquer usuário com créditos deveria conseguir gerar scripts normalmente.

### Plano de correção

Aplicar o mesmo padrão de extração de erro nos 3 locais que chamam `generate-script`:

```js
if (error) {
  const ctx = (error as any).context;
  if (ctx instanceof Response) {
    const body = await ctx.json().catch(() => null);
    throw new Error(body?.error || error.message);
  }
  throw error;
}
```

### Arquivos afetados

| Arquivo | Local |
|---------|-------|
| `src/components/cliente/ScriptGeneratorDialog.tsx` | `handleGenerate` (linha 84) |
| `src/pages/cliente/ClienteScripts.tsx` | `handleImproveWithAI` (linha 80) |
| `src/pages/cliente/ClientePlanoVendas.tsx` | Loop de geração de scripts (linha ~157) |

