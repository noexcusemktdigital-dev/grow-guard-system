

## Diagnóstico: Erro "invalid input syntax for type integer: 67.5"

### Causa raiz
A coluna `score_percentage` na tabela `marketing_strategies` é do tipo `integer`. A IA está retornando scores decimais (ex: `67.5`), e o código insere esse valor diretamente sem arredondar, causando rejeição do Postgres.

### Correção

Arredondar o valor com `Math.round()` antes de salvar. Há dois pontos de inserção:

| Arquivo | Linha | Mudança |
|---|---|---|
| `src/pages/cliente/ClienteGPSNegocio.tsx` | ~426 | `Math.round(...)` no `score_percentage` |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | ~46 | `Math.round(...)` no `score_percentage` |

Exemplo da mudança:
```typescript
// Antes
score_percentage: (unifiedResult as any)?.diagnostico_gps?.score_geral || 0,

// Depois
score_percentage: Math.round((unifiedResult as any)?.diagnostico_gps?.score_geral || 0),
```

Correção simples e sem risco — apenas garante que decimais sejam arredondados para inteiro antes do insert.

