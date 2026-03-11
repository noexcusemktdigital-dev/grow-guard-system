

## Plano: 3 Correções no Financeiro

### Problema 1: Dashboard mostra "Receita de Contratos Ativos" (dados fake)
O bloco na DashboardTab (linhas 302-320) lista contratos internos (`activeContracts`) que incluem contratos fake. O MRR também é calculado a partir desses contratos (linha 103).

**Correção:**
- Remover o bloco "Receita de Contratos Ativos" inteiro do Dashboard
- Calcular MRR a partir dos pagamentos reais do Asaas (soma dos valores de cobranças recorrentes confirmadas) em vez dos contratos internos
- Remover a sublabel "X contratos ativos" do KPI de MRR

### Problema 2: KPI Cards cortando números
Os cards usam `grid-cols-2 lg:grid-cols-6` (linha 259) — 6 colunas em tela grande fica muito apertado. O valor usa `text-2xl` que pode ser grande demais para cards estreitos.

**Correção:**
- Mudar o grid do Dashboard para `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` para melhor responsividade
- No KpiCard, reduzir o tamanho do valor de `text-2xl` para `text-xl` e aplicar `truncate` para evitar corte
- Reduzir o padding do KpiCard de `p-6` para `p-4` na CSS para dar mais espaço ao conteúdo

### Problema 3: FinanceiroReceitas sem edição/exclusão
A página standalone `/financeiro/receitas` (FinanceiroReceitas.tsx) só tem criação. Faltam botões de editar e excluir nas linhas da tabela, e falta usar `updateRevenue`/`deleteRevenue` do hook.

**Correção:**
- Importar `updateRevenue` e `deleteRevenue` do `useFinanceMutations`
- Adicionar botões Editar (abre dialog preenchido) e Excluir (com confirmação) em cada linha
- Reutilizar o dialog existente para modo edição (como já funciona na aba Receitas do Dashboard)

### Arquivos a editar
1. `src/pages/FinanceiroDashboard.tsx` — remover bloco de contratos fake, ajustar grid dos KPIs, recalcular MRR via Asaas
2. `src/components/KpiCard.tsx` — reduzir tamanho do valor, adicionar truncate
3. `src/pages/FinanceiroReceitas.tsx` — adicionar edição e exclusão de receitas

