

# Reorganizacao: Financeiro + Contratos da Franqueadora

## Contexto

O modulo financeiro atual tem receitas e despesas sem edicao/exclusao, dashboard sem filtro por mes, e nenhuma conexao automatica com contratos ativos. O modulo de contratos nao permite editar/excluir contratos existentes na visao de rede. A logica "cada contrato = um cliente" nao esta refletida na interface.

---

## Modulo Financeiro — Nova Estrutura

### Sidebar (menu lateral)
```text
Financeiro
  |-- Dashboard (visao geral com filtro por mes)
  |-- Controle Financeiro (entradas + saidas em uma unica tela com CRUD completo)
  |-- Repasse (cobranças franqueados — mantido)
  |-- Fechamentos (consolidacao mensal — mantido)
```

Remover as rotas separadas de "Receitas" e "Despesas" — unificar em "Controle Financeiro" com abas internas.

### 1. Dashboard Financeiro (refatorar `FinanceiroDashboard.tsx`)
- Adicionar **filtro de mes/ano** no topo (Select com meses disponiveis)
- KPIs: MRR da Rede (de contratos ativos), Receitas do Mes, Despesas do Mes, Resultado do Mes
- Adicionar secao "Receita de Contratos" mostrando contratos ativos e seus valores mensais (puxados de `useNetworkContracts`)
- Grafico simples (barras) comparando receita vs despesa nos ultimos 6 meses
- Links rapidos para Controle Financeiro, Repasse e Fechamentos

### 2. Controle Financeiro (nova pagina unificada `FinanceiroControle.tsx`)
- Substitui as paginas separadas de Receitas e Despesas
- **Abas**: "Entradas" | "Saidas" | "Contratos Ativos"
- **CRUD completo** em cada aba:
  - Adicionar (ja existe)
  - **Editar** (novo — dialog com campos preenchidos)
  - **Excluir** (novo — confirmacao antes de deletar)
- Aba "Contratos Ativos" mostra contratos com status `active`/`signed` como fonte de receita recorrente, com valor mensal e signatario
- Filtro por mes, categoria e status em cada aba
- KPIs no topo de cada aba (total, pago, pendente)

### 3. Hooks (`useFinance.ts`) — Adicionar mutations
- `updateRevenue` — update por id
- `deleteRevenue` — delete por id
- `updateExpense` — update por id
- `deleteExpense` — delete por id

---

## Modulo Contratos — Nova Estrutura

### Sidebar (menu lateral)
```text
Contratos
  |-- Templates (modelos base — mantido)
  |-- Criar Contrato (gerador — mantido)
  |-- Gestao de Contratos (substitui "Rede" — com CRUD completo)
```

### 4. Gestao de Contratos (refatorar `ContratosGerenciamento.tsx`)
- Manter a tabela atual mas adicionar **acoes por linha**:
  - **Ver detalhes** (sheet lateral com todos os dados do contrato)
  - **Editar** (dialog com campos editaveis — status, valor, datas, signatario)
  - **Excluir** (dialog de confirmacao)
  - **Baixar PDF** (gerar PDF do contrato)
- Adicionar **alertas visuais**:
  - Contratos que vencem nos proximos 30 dias (badge amarelo)
  - Contratos vencidos (badge vermelho)
- Adicionar KPI "A Vencer (30d)" no topo
- Cada contrato = um cliente — mostrar o nome do signatario como "Cliente" na coluna

### 5. Vinculo Contratos → Financeiro
- Na aba "Contratos Ativos" do Controle Financeiro, cada contrato ativo aparece como receita recorrente
- O valor mensal do contrato e automaticamente considerado no calculo de MRR e receita prevista do mes
- Contratos com `owner_type = "unidade"` sao marcados com badge indicando que geram repasse

---

## Rotas (App.tsx)

Mudancas:
- Remover: `/franqueadora/financeiro/receitas` e `/franqueadora/financeiro/despesas`
- Adicionar: `/franqueadora/financeiro/controle`
- Manter: `/franqueadora/financeiro` (dashboard), `/franqueadora/financeiro/repasse`, `/franqueadora/financeiro/fechamentos`
- Remover: `/franqueadora/financeiro/configuracoes` (configs nao persistem, sera incorporado ao dashboard ou removido)

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/pages/FinanceiroControle.tsx` — pagina unificada de entradas e saidas com CRUD completo

### Arquivos a modificar:
- `src/hooks/useFinance.ts` — adicionar `updateRevenue`, `deleteRevenue`, `updateExpense`, `deleteExpense`
- `src/hooks/useContracts.ts` — adicionar `deleteContract` mutation
- `src/pages/FinanceiroDashboard.tsx` — adicionar filtro por mes, secao de contratos, grafico
- `src/pages/ContratosGerenciamento.tsx` — adicionar acoes por linha (ver, editar, excluir, PDF), alertas de vencimento
- `src/components/FranqueadoraSidebar.tsx` — atualizar menu do financeiro (trocar Receitas+Despesas por Controle Financeiro)
- `src/App.tsx` — atualizar rotas

### Arquivos a remover/descontinuar:
- `src/pages/FinanceiroReceitas.tsx` — funcionalidade migrada para FinanceiroControle
- `src/pages/FinanceiroDespesas.tsx` — funcionalidade migrada para FinanceiroControle
- `src/pages/FinanceiroConfiguracoes.tsx` — configs nao persistem, sera removido das rotas

### Nenhuma migracao de banco necessaria
- As tabelas `finance_revenues`, `finance_expenses`, `contracts` ja existem com os campos necessarios
- As mutations de update/delete usarao o Supabase SDK diretamente (RLS ja garante isolamento por org)

