

## Plano: Simplificar Financeiro da Matriz — Apenas dados do Asaas

### O que muda

O usuário quer que as abas **Receitas** e **Clientes** mostrem **apenas dados vindos do Asaas**, removendo entradas manuais dessas abas.

### Mudanças no arquivo `src/pages/FinanceiroDashboard.tsx`

#### Aba Receitas
- Remover a lógica de "unified entries" que mistura manual + Asaas
- Mostrar **apenas** pagamentos do Asaas (`asaasPayments`)
- Remover o botão "Nova Receita" (entrada manual)
- Remover o dialog de criação/edição de receita manual
- Remover o dialog de exclusão de receita manual
- Manter: busca, botão "Atualizar Asaas", tabela com status/fatura/link externo
- Remover imports e uso de `createRevenue`, `updateRevenue`, `deleteRevenue`

#### Aba Clientes
- Já mostra apenas contratos ativos com emissão via Asaas — **sem mudanças necessárias**

#### Dashboard
- Atualizar KPI "Receitas" para usar apenas `totalAsaasPaid` (remover `totalManualRev`)
- Remover gráfico de composição por categoria manual (pie chart) — substituir por composição de pagamentos Asaas
- Gráfico de barras: receitas baseadas em Asaas payments agrupados por mês

#### Limpeza
- Remover `revCategories` (não mais usado)
- Remover props `createRevenue`, `updateRevenue`, `deleteRevenue` da ReceitasTab
- Simplificar interface `UnifiedEntry` e funções relacionadas

### Abas que permanecem inalteradas
- **Despesas** — CRUD manual permanece (são gastos da matriz)
- **Repasse** — cobranças automáticas para franqueados via Asaas
- **Fechamentos** — consolidação mensal
- **Configurações** — regras financeiras

### Arquivo afetado
| Arquivo | Ação |
|---------|------|
| `src/pages/FinanceiroDashboard.tsx` | Simplificar Receitas para só Asaas, atualizar Dashboard |

