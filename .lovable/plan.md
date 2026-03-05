

# Correção: Banner de créditos esgotados não atualiza

## Problema

O hook `useClienteWallet` faz um fetch único e cacheia indefinidamente (sem `staleTime` nem `refetchOnWindowFocus`). Quando os créditos são atualizados diretamente no banco (recarga manual), o cache do React Query mantém o valor antigo (`balance: 0`) e o banner "Créditos esgotados" continua aparecendo.

## Correção

**Arquivo**: `src/hooks/useClienteWallet.ts`

Adicionar `staleTime: 30_000` (30s) e `refetchOnWindowFocus: true` ao `useQuery`, para que o saldo seja re-verificado ao voltar à aba e não fique "grudado" no valor antigo por tempo indeterminado.

Isso resolve tanto o caso de recarga manual quanto o caso de consumo de créditos em outra aba — o saldo atualiza automaticamente ao navegar entre páginas ou focar a janela.

