

## Plano: Remover seção "Emitir Nova Cobrança" com contratos fake da aba Clientes

### Problema
A seção "Emitir Nova Cobrança (contratos)" no final da aba Clientes lista contratos internos (`activeContracts`) que incluem dados fake da Unidade Teste. Esses contratos não são reais e não devem aparecer no financeiro da Franqueadora.

### Correção
Remover completamente o bloco "Emitir Nova Cobrança (contratos)" da `ClientesTab` (linhas ~1189-1212 do `FinanceiroDashboard.tsx`), já que a emissão de cobranças reais já é feita diretamente pelo Asaas. Também remover a prop `activeContracts` da `ClientesTab` pois não será mais utilizada.

### Arquivo a editar
- `src/pages/FinanceiroDashboard.tsx` — remover bloco de emissão de cobrança por contratos internos e limpar a prop `activeContracts` da ClientesTab

