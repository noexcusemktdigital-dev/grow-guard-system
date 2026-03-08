

## Plano: Receitas com Asaas + Manual, Cobranças do mês/atrasadas/recebidas, Matriz como 1ª ferramenta

### Mudanças

#### 1. Sidebar — Reordenar seção Gestão
**Arquivo**: `src/components/FranqueadoraSidebar.tsx`

Mover "Matriz" para a primeira posição da seção adminSection:
```
Matriz → Contratos → Financeiro → SaaS
```

#### 2. Receitas — Permitir Asaas + Manual
**Arquivo**: `src/pages/FinanceiroDashboard.tsx`

Na aba **Receitas**, restaurar a capacidade de adicionar receitas manuais junto com as do Asaas:
- Adicionar botão "Nova Receita" para entrada manual (usando `createRevenue` do `useFinanceMutations`)
- Lista unificada: cobranças Asaas + receitas manuais, diferenciadas por badge "Asaas" ou "Manual"
- Dialog de criação/edição de receita manual (descrição, valor, data, categoria, status)
- Reimportar `useFinanceRevenues` e mutações de receita do `useFinance`

#### 3. Dashboard — KPIs reais com cobranças do mês
**Arquivo**: `src/pages/FinanceiroDashboard.tsx`

Atualizar KPIs do Dashboard para mostrar dados reais combinados (Asaas + manual):
- **Cobranças do Mês**: total de cobranças Asaas com dueDate no mês atual
- **Recebidas**: cobranças com status CONFIRMED/RECEIVED/RECEIVED_IN_CASH
- **Atrasadas**: cobranças com status OVERDUE
- **Resultado**: (Receitas Asaas pagas + Receitas manuais pagas) - Despesas pagas

#### 4. Receitas Tab — Cards de resumo aprimorados
Adicionar 4 cards de resumo:
- Total Recebido (Asaas pago + manual pago)
- Total Pendente (Asaas pendente + manual pendente)
- Atrasadas (Asaas OVERDUE)
- Cobranças do Mês (total no período)

#### 5. Clientes Tab — Somente dados reais
A aba Clientes já mostra apenas contratos ativos reais da rede. Sem alteração necessária.

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/components/FranqueadoraSidebar.tsx` | Reordenar: Matriz como 1º item |
| `src/pages/FinanceiroDashboard.tsx` | Receitas: Asaas + manual; Dashboard KPIs atualizados |

