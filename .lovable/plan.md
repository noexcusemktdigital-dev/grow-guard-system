

## Correção — Erro ao excluir membro no painel do cliente

### Causa raiz

O `EditMemberDialog.tsx` tem o mesmo bug de extração de erro do SDK que já corrigimos em `invite-user` e `generate-script`. Quando a Edge Function `update-member` retorna qualquer non-2xx (ex: 403 "Sem permissão", 400 "Você não pode remover a si mesmo"), o SDK encapsula como `FunctionsHttpError` genérico. O código faz `if (error) throw error` sem extrair a mensagem real do corpo da resposta, resultando em erro genérico para o usuário.

A Edge Function em si está correta (usa service role, RLS não é obstáculo, não há foreign keys bloqueantes). O problema é exclusivamente no frontend.

### Plano de correção

**Arquivo: `src/components/EditMemberDialog.tsx`**

Aplicar o mesmo padrão de extração de erro nos dois métodos:

1. **`handleRemove`** (linha 76): substituir `if (error) throw error` pelo padrão que extrai a mensagem do `error.context`
2. **`handleSave`** (linha 62): aplicar o mesmo padrão

```typescript
if (error) {
  const ctx = (error as any).context;
  if (ctx instanceof Response) {
    const body = await ctx.json().catch(() => null);
    throw new Error(body?.error || error.message);
  }
  throw error;
}
```

### Resultado esperado

- Administrador consegue excluir membros normalmente
- Se houver erro real (ex: tentar remover a si mesmo), a mensagem específica aparece no toast em vez de erro genérico

