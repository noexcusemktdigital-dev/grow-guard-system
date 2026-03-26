

## Fix: Flash do "Complete o Plano de Vendas" durante navegação

### Problema
O `FeatureGateContext` usa `useSalesPlanCompleted()` que retorna `{ completed, isLoading }`, mas **nunca verifica o `isLoading`**. Durante a navegação entre páginas, os dados recarregam e `completed` fica momentaneamente `false`, fazendo o overlay "Complete o Plano de Vendas" piscar por um instante.

O mesmo problema ocorre com `useHasActiveStrategy` e potencialmente `useClienteSubscription` / `useClienteWallet`.

### Solução

Alterar `getGateReason` no `FeatureGateContext.tsx` para retornar `null` enquanto os dados ainda estão carregando. Isso evita que o overlay apareça antes dos dados estarem prontos.

**Arquivo:** `src/contexts/FeatureGateContext.tsx`

1. Capturar o `isLoading` de `useSalesPlanCompleted()`, `useClienteSubscription()`, `useClienteWallet()` e `useHasActiveStrategy()`
2. No início de `getGateReason`, se qualquer um estiver carregando, retornar `null`
3. Expor um `isLoading` geral no contexto para uso futuro se necessário

Mudança mínima — apenas adicionar uma guarda de loading no `getGateReason`.

