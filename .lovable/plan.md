

## Melhoria — Extração de erro correta no GPS

### Situação atual

A divisão em 3 chamadas e a persistência de respostas já estão implementadas. O risco de timeout foi drasticamente reduzido.

Porém, há um problema menor: o hook `useGenerateStrategy` não usa o `extractEdgeFunctionError` para extrair a mensagem real de erro. Se a Edge Function retornar status 402 (créditos) ou 500 (falha AI), o SDK do Supabase consome o body e mostra "Edge Function returned a non-2xx status code" em vez da mensagem real.

### Mudança

| Arquivo | Ação |
|---------|------|
| `src/hooks/useMarketingStrategy.ts` | Importar `extractEdgeFunctionError` e usá-lo no `catch` do `useGenerateStrategy` para extrair a mensagem real do erro |

### Impacto

Se uma das 3 chamadas falhar, o toast mostrará "Créditos insuficientes" ou "Falha ao estruturar resposta da IA" em vez de uma mensagem genérica — facilitando o diagnóstico. A geração em si já deve funcionar com o 3-split implementado.

