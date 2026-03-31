

## Plano — Corrigir erro na geração de postagens

### Problema

A edge function `generate-social-briefing` (e outras funções de redes sociais) não estavam deployadas no servidor, causando erro 401/500 genérico. Já deployei as funções: `generate-social-briefing`, `generate-social-image`, `generate-social-concepts`, `generate-social-video-frames`, `generate-video-briefing`.

Além disso, o tratamento de erros no hook `useClientePosts.ts` usa `throw new Error(resp.error.message)` que mostra a mensagem genérica "Edge Function returned a non-2xx status code" em vez de extrair a mensagem real do backend.

### Mudanças no código

Atualizar `src/hooks/useClientePosts.ts` para usar `extractEdgeFunctionError` (já existe em `src/lib/edgeFunctionError.ts`) em todas as chamadas de edge functions:

- Linha 128: `generate-social-image` — usar `extractEdgeFunctionError`
- Linha 152: `generate-social-video-frames` — usar `extractEdgeFunctionError`
- Linha 199: `generate-social-briefing` — usar `extractEdgeFunctionError`
- Linha 227 (aprox): `generate-video-briefing` — usar `extractEdgeFunctionError`

Padrão a aplicar:
```typescript
if (resp.error) {
  const realError = await extractEdgeFunctionError(resp.error);
  throw realError;
}
```

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useClientePosts.ts` | Importar `extractEdgeFunctionError` e usar em todas as 4 chamadas de edge function |

### Resultado

- Funções já deployadas e funcionando
- Erros reais do backend (créditos insuficientes, rate limit, etc.) serão exibidos corretamente ao usuário em vez da mensagem genérica

