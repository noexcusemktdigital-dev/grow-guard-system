

## Plano: Adicionar filtros específicos em cada aba do Financeiro

### Estado atual dos filtros
- **Global**: filtro de mês no topo (já existe)
- **Receitas**: busca por texto (já existe)
- **Despesas**: busca por texto (já existe)
- **Repasse**: nenhum filtro
- **Fechamentos**: nenhum filtro
- **Clientes**: busca por texto (já existe)

### Filtros a adicionar por aba

**Receitas** (ReceitasTab)
- Filtro de **status**: Todos / Recebido / Pendente / Vencido
- Filtro de **origem**: Todos / Asaas / Manual

**Despesas** (DespesasTab)
- Filtro de **categoria**: Todas / Pessoas / Plataformas / Estrutura / Empréstimos / etc.
- Filtro de **status**: Todos / Pago / Previsto
- Filtro de **tipo**: Todos / Fixa / Variável

**Repasse** (RepasseTab)
- Busca por **nome do franqueado**
- Filtro de **status**: Todos / Pendente / Pago / Vencido
- Filtro de **mês** (select com os meses disponíveis)

**Fechamentos** (FechamentosTab)
- Filtro de **unidade** (select com as unidades)
- Filtro de **ano** (select)
- Filtro de **status**: Todos / Publicado / Pendente

**Clientes** (ClientesTab)
- Filtro de **status**: Todos / Recebido / Pendente / Vencido

### Implementação
Todos os filtros serão `Select` inline ao lado da barra de busca existente, usando o mesmo padrão visual. A filtragem acontece via `useMemo` no lado do cliente (sem queries adicionais).

### Arquivo a editar
- `src/pages/FinanceiroDashboard.tsx` — adicionar estados e lógica de filtro em cada tab component

