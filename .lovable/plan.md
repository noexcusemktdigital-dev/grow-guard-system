
# Modulo Metas & Ranking -- Gamificado e Integrado

## Resumo

Criar o modulo "Metas & Ranking" dentro da secao Comercial, integrado aos dados reais do Financeiro (mockData.ts) e Contratos (contratosData.ts). O modulo sera 100% automatico, gamificado, visualmente forte e usavel tanto pela franqueadora quanto pelo franqueado. Tudo com mock data, usando os dados ja existentes como fonte de verdade.

---

## Arquitetura de Arquivos

```text
CRIAR:
src/data/metasRankingData.ts                -- tipos, interfaces, mock data, helpers de integracao
src/pages/MetasRanking.tsx                  -- pagina principal com abas internas e navegacao
src/components/metas/MetasDashboard.tsx     -- dashboard geral (franqueadora + franqueado)
src/components/metas/MetasGoals.tsx         -- configuracao e visualizacao de metas
src/components/metas/MetasRanking.tsx       -- ranking dinamico com podio e lista completa
src/components/metas/MetasCampaigns.tsx     -- campanhas & premiacoes
src/components/metas/MetasConfig.tsx        -- configuracao admin (pesos, niveis, regras)

MODIFICAR:
src/components/FranqueadoraSidebar.tsx       -- remover disabled do item Metas & Ranking
src/App.tsx                                 -- adicionar rota /franqueadora/metas
```

---

## 1. Dados e Integracao (`src/data/metasRankingData.ts`)

### Integracao com Financeiro e Contratos

O modulo puxa dados automaticamente das fontes existentes:

- **Receita real**: `getReceitasForMonth(mes)` e `getMonthSummary(mes)` de `mockData.ts`
- **Contratos ativos**: `mockContratos` de `contratosData.ts`, filtrados por status "Assinado"
- **Franqueados**: `franqueados` de `mockData.ts`
- **Receita por produto**: campo `receitaPorProduto` do `getMonthSummary()`

### Tipos e Interfaces

```text
GoalType = "revenue" | "contracts" | "franchise" | "saas" | "custom"
GoalAppliesTo = "all" | "unit"
FranchiseLevel = "Iniciante" | "Crescimento" | "Ouro" | "Elite" | "Platinum"
CampaignStatus = "active" | "upcoming" | "finished"

Goal:
  id, name, type, targetValue, month, appliesTo,
  unitId (opcional), weight, rewardDescription

FranchiseScore:
  franchiseId, franchiseName, month,
  revenue, contracts, points, goalPercent,
  growthPercent, level, levelProgress

Campaign:
  id, name, periodStart, periodEnd, goalType,
  targetValue, rewardDescription, status

PointsConfig:
  revenuePerPoint (ex: cada R$1000 = 10 pts)
  contractPoints (ex: cada contrato = 50 pts)
  franchiseSalePoints (ex: cada franquia = 500 pts)
  goalBonusPoints (ex: meta batida = 200 pts)

LevelThreshold:
  level, minPoints, icon, color, gradient
```

### Helpers de Calculo Automatico

- `calculateFranchiseRevenue(franchiseId, month)` -- usa `getReceitasForMonth` filtrando por `franqueadoId`
- `calculateFranchiseContracts(franchiseId, month)` -- filtra `mockContratos` por `franqueadoId` + status + periodo
- `calculatePoints(franchiseId, month)` -- aplica formula de pontuacao sobre receita + contratos
- `calculateGoalProgress(goal, franchiseId?)` -- retorna % atingido
- `getFranchiseLevel(totalPoints)` -- retorna nivel atual baseado em thresholds
- `getRankingForMonth(month)` -- retorna array de FranchiseScore ordenado por pontos
- `getNetworkTotals(month)` -- faturamento total da rede, contratos totais, meta da rede
- `getEvolutionData(franchiseId?, months?)` -- dados para graficos de evolucao (6 meses)

### Mock Data

- 3-4 franquias com dados variados (usando as 2 de `mockData.ts` + 1-2 extras para ranking mais interessante)
- Metas mensais mock: meta de faturamento da rede R$80.000, meta de contratos 10/mes
- 1 campanha ativa: "Desafio Fevereiro -- Foco Assessoria"
- 1 campanha finalizada com resultado
- Config de pontuacao: R$1000 = 10pts, contrato = 50pts, franquia vendida = 500pts, meta batida = 200pts bonus
- 5 niveis com thresholds: Iniciante (0), Crescimento (500), Ouro (1500), Elite (3000), Platinum (6000)

---

## 2. Pagina Principal (`src/pages/MetasRanking.tsx`)

### Estrutura

Seguir o padrao visual do `Academy.tsx` (header contextual + abas como cards coloridos).

### Header

- Titulo "Metas & Ranking" com icone Trophy
- Badge "Franqueadora"
- Subtitulo: "Performance, gamificacao e metas da rede"
- Mini KPIs no header: faturamento do mes, % meta atingida, posicao no ranking (para franqueado)

### Abas Internas

1. **Dashboard** (icone BarChart3, cor azul) -- visao geral estrategica
2. **Metas** (icone Target, cor emerald) -- metas configuradas e progresso
3. **Ranking** (icone Trophy, cor amber/dourado) -- ranking gamificado
4. **Campanhas** (icone Zap, cor purple) -- campanhas & premiacoes
5. **Configuracao** (icone Settings, cor rose) -- admin, pesos e niveis

### Navegacao

State `activeTab` controla a aba visivel. Sem sub-views complexas (diferente do Academy).

---

## 3. Dashboard Geral (`src/components/metas/MetasDashboard.tsx`)

### Visao Franqueadora (padrao)

**KPI Cards (topo, 4-5 cards)**:
- Faturamento total da rede (valor + icone DollarSign + cor verde)
- Meta da rede (barra de progresso circular com %)
- Contratos fechados no mes (numero grande)
- Novos clientes (numero + trend)
- Certificados/Premiacoes emitidos

**Grafico: Meta vs Real** (BarChart, recharts):
- Barras lado a lado: meta (cinza transparente) vs real (cor primaria)
- Por produto: Assessoria, SaaS, Sistema, Franquia

**Grafico: Evolucao 6 meses** (LineChart, recharts):
- Linhas por franquia, mostrando faturamento mensal
- Tooltip com detalhes

**Top 3 do Mes** (cards visuais):
- Podio simplificado: 1o, 2o, 3o lugar com medalhas coloridas
- Nome da franquia + faturamento + % meta + pontos

**Receita por Produto** (PieChart ou barras horizontais):
- Assessoria, SaaS, Sistema, Franquia com cores distintas

### Visao Franqueado (alternativa -- controlada por toggle ou deteccao futura)

- Minha meta do mes (barra de progresso animada grande)
- Valor faturado vs meta
- Contratos fechados
- Posicao no ranking (destaque visual)
- Proximo nivel (barra + nome do nivel)
- Badge atual (Ouro, Prata, etc.)
- Historico 3 meses (mini grafico)

---

## 4. Metas (`src/components/metas/MetasGoals.tsx`)

### Lista de Metas Ativas

Cards visuais por meta, cada um com:
- Nome + tipo (badge colorido por tipo)
- Barra de progresso com % e valores (atual / alvo)
- Periodo (mes)
- Aplicacao: "Toda a rede" ou "Unidade X"
- Peso e premiacao vinculada
- Status visual: verde (batida), amarelo (em andamento), vermelho (abaixo de 50%)

### Criar/Editar Meta (Dialog)

- Nome (Input)
- Tipo (Select: Faturamento, Contratos, Franquia, SaaS, Personalizada)
- Valor alvo (Input numerico)
- Mes (Select)
- Aplica a (Select: Todas unidades / Unidade especifica)
- Peso (Slider 1-5)
- Premiacao (Textarea)

### Metas por Franquia (accordion/tabela)

- Expandir cada franquia para ver o progresso individual em cada meta
- Barras de progresso inline

---

## 5. Ranking Gamificado (`src/components/metas/MetasRanking.tsx`)

### Podio Top 3

Visual impactante no topo:
- 3 cards grandes, o do meio (1o lugar) mais alto
- Medalha animada: ouro (1o), prata (2o), bronze (3o)
- Nome da franquia
- Pontuacao grande
- Faturamento + % meta
- Nivel/badge da franquia
- Gradiente de fundo por posicao (dourado, prateado, bronze)

### Lista Completa (abaixo do podio)

Tabela estilizada com:
- Posicao (numero grande + indicador de subida/descida)
- Franquia (nome + badge de nivel)
- Faturamento do mes (formatado BRL)
- % meta atingida (barra mini inline)
- Pontos (numero em destaque)
- Crescimento % (vs mes anterior, com seta verde/vermelha)

### Filtros

- Mes (Select)
- Tipo de meta (Select: Geral, Faturamento, Contratos)
- Produto (Select: Todos, Assessoria, SaaS, etc.)

### Sistema de Niveis (lateral ou secao inferior)

Cards visuais dos 5 niveis com:
- Nome + icone + cor/gradiente
- Pontuacao minima
- Indicador de qual nivel a franquia esta
- Barra de progresso para o proximo nivel

```text
Niveis e cores:
Iniciante   -- cinza, icone Shield
Crescimento -- azul, icone TrendingUp
Ouro        -- dourado/amber, icone Star
Elite       -- roxo, icone Crown
Platinum    -- gradiente especial, icone Gem
```

---

## 6. Campanhas & Premiacoes (`src/components/metas/MetasCampaigns.tsx`)

### Campanha Ativa (destaque)

Card grande no topo com:
- Nome da campanha
- Periodo (data inicio -- data fim)
- Dias restantes (countdown visual)
- Meta especial + progresso da rede
- Premiacao descrita
- Mini ranking da campanha (top 3)
- Gradiente de fundo vibrante

### Historico de Campanhas

Cards menores, lista de campanhas passadas:
- Nome + periodo
- Vencedor
- Resultado
- Badge "Finalizada"

### Criar Campanha (Dialog -- admin)

- Nome (Input)
- Periodo (DatePicker inicio/fim)
- Tipo de meta (Select)
- Valor alvo (Input)
- Premiacao (Textarea)
- Opcoes de premiacao sugeridas: Dinheiro, Desconto royalties, Curso gratuito, Destaque na rede, Trofeu virtual

---

## 7. Configuracao Admin (`src/components/metas/MetasConfig.tsx`)

### Pesos de Pontuacao

Cards editaveis:
- Cada R$ X faturado = Y pontos (Inputs)
- Cada novo contrato = Z pontos
- Cada franquia vendida = W pontos
- Bonus por meta batida = V pontos

### Niveis de Franquia

Tabela editavel:
- Nivel, pontuacao minima, icone, cor
- Dialog para editar thresholds

### Regras Gerais

- Periodo de calculo (mensal)
- Criterios de desempate
- Visibilidade do ranking para franqueados (toggle)

---

## 8. Design e Efeitos Visuais

### Paleta de cores por secao

- Dashboard: azul dominante
- Metas: verde/emerald
- Ranking: dourado/amber
- Campanhas: roxo/purple
- Config: rose

### Efeitos

- KPI cards com hover elevacao + brilho sutil
- Barras de progresso com animacao de fill (transition-all duration-700)
- Podio com scale-in animado (animate-scale-in com delay por posicao)
- Medalhas com leve brilho/pulse
- Cards de nivel com gradiente sutil
- Numeros grandes com font-bold e tamanho destacado
- Graficos recharts com animacao padrao
- Cards de campanha ativa com borda pulsante

### Dark Mode

- Gradientes escuros para podio
- Medalhas com brilho mais sutil
- Cards com glass-card (ja definido no CSS)

---

## 9. Integracao com Sidebar e Rotas

### FranqueadoraSidebar.tsx

Remover `disabled: true` do item "Metas & Ranking":
```text
{ label: "Metas & Ranking", icon: Trophy, path: "/franqueadora/metas" }
```

### App.tsx

Adicionar rota:
```text
<Route path="metas" element={<MetasRanking />} />
```

---

## 10. Ordem de Implementacao

1. `metasRankingData.ts` -- tipos, integracao com mockData/contratosData, helpers de calculo, mock data
2. `MetasDashboard.tsx` -- KPIs, graficos recharts, top 3, receita por produto
3. `MetasGoals.tsx` -- lista de metas com progresso, dialog CRUD
4. `MetasRanking.tsx` -- podio top 3, lista completa, niveis, filtros
5. `MetasCampaigns.tsx` -- campanha ativa, historico, dialog criar
6. `MetasConfig.tsx` -- pesos, niveis, regras
7. `MetasRanking.tsx` (pagina) -- hub com abas e header
8. `FranqueadoraSidebar.tsx` + `App.tsx` -- ativar menu e rota
