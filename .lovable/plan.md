

# Reestruturacao Final do Modulo Financeiro

## Resumo

Reorganizar o modulo Financeiro para a estrutura definitiva: 6 itens de menu (Dashboard, Despesas, Receitas, Repasse, Fechamentos, Configuracoes). Remover Impostos como pagina separada (vira categoria dentro de Despesas). Remover Projecao e Mes a Mes como menus. Remover Clientes como menu. Simplificar a Projecao no Dashboard (painel unico sem abas Trimestral/Semestral). Criar novo modulo Fechamentos (DRE por franqueado). Reorganizar Despesas com tabs por categoria (incluindo Impostos). Reorganizar Receitas com subabas por produto (Visao Geral, Assessoria, SaaS, Sistema, Venda de Franquia) + subaba Clientes.

---

## Alteracoes no Menu (Sidebar)

Menu atual: Dashboard, Despesas, Receitas, Repasse, Impostos, Projecao, Mes a Mes, Clientes, Configuracoes

Menu final:
- Dashboard (inclui Projecao dentro)
- Despesas (inclui Impostos como categoria interna)
- Receitas (inclui Clientes como subaba)
- Repasse
- Fechamentos (DRE) -- NOVO
- Configuracoes

Remover do menu: Impostos, Projecao, Mes a Mes, Clientes

---

## 1. Dashboard (`FinanceiroDashboard.tsx`) -- Reescrever

### Bloco A -- Resumo (ja existe, manter e ajustar)
- KPIs: Receita Bruta, Receita Liquida, Repasse Devido, Despesas Operacionais, Resultado, Caixa Atual, Runway, Clientes Ativos (por tipo)
- Graficos: Receita Liquida x Despesas (linha), Despesas por categoria (pizza), Resultado mensal (barras)
- Alertas: Receitas em atraso, Parcelas a vencer, Aumentos de folha, Meta clientes vs capacidade

### Bloco B -- Projecao Inteligente (simplificar)
- Remover abas Trimestral e Semestral
- Manter apenas: painel Mes a Mes (realizado) + Simulacao (cenarios) como duas secoes
- Projecao automatica 6 meses a frente (tabela + grafico de caixa projetado + lucro projetado)
- Campos editaveis: Crescimento clientes/mes, Ticket medio, Franquias/mes, Ativar evento (on/off), Ativar contratacao (on/off)
- Indicadores: "Pode investir?" + "Quando contratar?"

---

## 2. Despesas (`FinanceiroDespesas.tsx`) -- Reorganizar

Estrutura atual: filtros por categoria + status + tipo como botoes
Nova estrutura:
- Topo: Filtro por periodo (dropdown) + Botao "+ Nova Despesa"
- KPIs internos (manter)
- Tabs internas por categoria: Todas | Pessoas | Estrutura | Plataformas | Emprestimos | Investimentos | Impostos
- A tab "Impostos" mostra despesas de imposto (base tributavel, NF emitidas, valor calculado, status pagamento)
- Remover filtros complexos visiveis; usar botao "Filtrar" que abre modal simples (status, tipo fixa/variavel)
- CRUD completo (ja existe, manter)

Para a categoria Impostos, ao gerar despesas do mes, adicionar automaticamente uma despesa com:
- categoria: "Impostos"
- subcategoria: "Imposto mensal (10%)"
- valor: calculado pela regra (10% sobre NF + folha operacional, excluindo pro-labore)
- status: Previsto

---

## 3. Receitas (`FinanceiroReceitas.tsx`) -- Reorganizar

Estrutura atual: 2 tabs (Receitas, Clientes)
Nova estrutura com subabas:
- Visao Geral: Dashboard de receita (total por tipo, recorrente, unitaria, por origem, por produto) com graficos
- Assessoria: Lista CRUD de clientes/receitas de assessoria. Filtros: Status, Origem, Gera repasse, Ticket
- SaaS: Lista CRUD apenas clientes SaaS
- Sistema: Lista franqueados que pagam sistema (R$250)
- Venda de Franquia: Lista de franquias vendidas (nome franqueado, valor, status pagamento, contrato, data, onboarding vinculado). Preparada para integracao futura
- Clientes: Cadastro CRUD de clientes (ja existe, manter). Adicionar campos placeholder para Asaas (ID cobranca, Tipo cobranca, Status cobranca)

---

## 4. Repasse (`FinanceiroRepasse.tsx`) -- Manter

Ja esta bem estruturado com subtabs (Por Franqueado, Pendentes, Pagos, Historico). Sem alteracoes significativas.

---

## 5. Fechamentos (DRE) -- NOVO (`FinanceiroFechamentos.tsx`)

Duas subabas:
- **Por Franqueado**: Selecionar franqueado, ver DRE gerado automaticamente
- **Todos os Fechamentos**: Lista de todas DREs geradas por mes

### DRE Automatico (por franqueado, por mes)
Estrutura:
- Clientes ativos do franqueado
- Receita bruta
- (-) 1% royalties
- (-) Imposto proporcional
- (-) Sistema (R$250)
- (-) Repasse matriz (se houver)
- = Resultado liquido do franqueado

Botoes: Exportar Excel (placeholder) | Exportar PDF (placeholder)
Design: Logo Skillzy (placeholder), layout limpo, resumo executivo no topo

Nota: Exportacao real sera implementada em fase futura. Por ora, botoes mostram toast "Em breve".

---

## 6. Configuracoes (`FinanceiroConfiguracoes.tsx`) -- Manter

Ja esta completo. Sem alteracoes.

---

## 7. Rotas e Sidebar

### App.tsx
- Remover rota: `/franqueadora/financeiro/impostos`
- Remover rota: `/franqueadora/financeiro/projecao` (se existir)
- Remover rota: `/franqueadora/financeiro/mes-a-mes` (se existir)  
- Remover rota: `/franqueadora/financeiro/clientes` (se existir)
- Adicionar rota: `/franqueadora/financeiro/fechamentos`

### FranqueadoraSidebar.tsx
- Remover do submenu Financeiro: Impostos, Projecao, Mes a Mes, Clientes
- Adicionar ao submenu: Fechamentos (icone FileSpreadsheet)
- Ordem final: Dashboard, Despesas, Receitas, Repasse, Fechamentos, Configuracoes

---

## 8. Dados (`mockData.ts`)

- Adicionar categoria "Impostos" ao tipo Despesa
- Criar funcao `getImpostoDespesa(mes)` que retorna a despesa de imposto gerada automaticamente
- Atualizar `getDespesasForMonth` para incluir imposto como despesa
- Criar funcao `getDREFranqueado(franqueadoId, mes)` para gerar DRE automatico
- Adicionar campo opcional `idCobrancaAsaas`, `tipoCobrancaAsaas`, `statusCobrancaAsaas` na interface Cliente

---

## Detalhes Tecnicos

### Arquivos modificados
```text
src/components/FranqueadoraSidebar.tsx  -- remover/adicionar itens menu
src/App.tsx                             -- remover/adicionar rotas
src/data/mockData.ts                    -- nova categoria Impostos, funcao DRE, campos Asaas
src/pages/FinanceiroDashboard.tsx       -- simplificar projecao (remover tabs trim/sem)
src/pages/FinanceiroDespesas.tsx        -- tabs por categoria, incluir Impostos
src/pages/FinanceiroReceitas.tsx        -- subabas por produto + Clientes com campos Asaas
```

### Arquivos criados
```text
src/pages/FinanceiroFechamentos.tsx     -- novo modulo DRE
```

### Arquivos removidos
```text
src/pages/FinanceiroImpostos.tsx        -- impostos migram para dentro de Despesas
```

### Funcao getDREFranqueado
```text
Para cada franqueado:
  clientesDoFranqueado = clientes com franqueadoVinculado = franqueadoId
  receitaBruta = soma dos valores
  royalties = receitaBruta * 0.01
  impostoProporcional = (receitaBruta / receitaTotalMes) * impostoTotalMes
  sistema = 250
  repasseMatriz = soma dos repasses
  resultadoLiquido = receitaBruta - royalties - imposto - sistema - repasse
```

### Ordem de implementacao
1. mockData.ts (novos tipos, funcoes DRE, campo Asaas)
2. FinanceiroFechamentos.tsx (novo)
3. FinanceiroDashboard.tsx (simplificar projecao)
4. FinanceiroDespesas.tsx (tabs por categoria + Impostos)
5. FinanceiroReceitas.tsx (subabas por produto)
6. Sidebar + App.tsx (menu e rotas)
7. Remover FinanceiroImpostos.tsx

