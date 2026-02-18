

# Reestruturacaoo Estrategica do Modulo Financeiro

## Resumo

O modulo atual ja possui dados reais e 8 paginas funcionais. O que falta e adicionar a **Camada 3 (Previsibilidade)** e a **Camada 4 (Decisao de Investimento)** ao sistema, alem de enriquecer as paginas existentes com sub-secoes internas e melhorar o Dashboard com projecoes e semaforos de decisao.

---

## O que ja existe e funciona

- Dashboard com KPIs, graficos e alertas
- Despesas com filtro por categoria, KPIs e graficos
- Receitas com status de NF, pagamento e repasse
- Repasse agrupado por origem (Franqueado/Parceiro)
- Impostos com regra 10% e breakdown NF
- Mes a Mes com subtabs (Resumo/Receitas/Despesas/Impostos/Repasse)
- Clientes com filtros por origem e tipo
- Configuracoes com regras editaveis

---

## O que sera adicionado/alterado

### 1. Nova pagina: Projecao (Camada 3)

Criar `src/pages/FinanceiroProjecao.tsx` com:

- **Receita recorrente projetada** para 3 e 6 meses
- **Folha projetada** considerando reajustes programados (marco/abril)
- **Parcelas futuras** com visao de encerramento
- **Investimentos futuros** (eventos a partir de abril)
- **Break-even dinamico**: quantos clientes para empatar custos
- **Capacidade operacional**: barra visual (atuais / 30)
- **Lucro projetado 3 meses**: tabela mes a mes
- **Alerta de simulacao**: "Se fizer evento esse mes, lucro cai para X"

### 2. Dashboard enriquecido (Camada 4 - Decisao de Investimento)

Adicionar ao `FinanceiroDashboard.tsx`:

- **Semaforo de investimento** (verde/amarelo/vermelho):
  - Verde: lucro > 15% da receita E caixa > 3 meses de custo
  - Amarelo: lucro entre 5-15% OU caixa entre 2-3 meses
  - Vermelho: lucro < 5% OU caixa < 2 meses
- **Card de Previsao** com receita recorrente e lucro projetado proximo mes
- **KPI Break-even** (clientes necessarios para empatar)

### 3. Repasse enriquecido

Adicionar ao `FinanceiroRepasse.tsx`:

- Subtabs: **Por Franqueado** | **Pendentes** | **Pagos** | **Historico**
- Agrupar por franqueado (nao so por origem)
- Status de pagamento do repasse (Pendente/Pago)

### 4. Impostos enriquecido

Adicionar ao `FinanceiroImpostos.tsx`:

- Secao **Pagamentos** com status (Pago/Pendente)
- Historico de impostos por mes

### 5. Rota e sidebar

- Adicionar rota `/franqueadora/financeiro/projecao` no `App.tsx`
- Adicionar item "Projecao" (icone TrendingUp) na sidebar do Financeiro

### 6. Funcoes auxiliares no mockData

Adicionar ao `src/data/mockData.ts`:

- `getProjection(meses: number)` — calcula receita, custos e resultado projetado
- `getBreakEven()` — calcula numero de clientes para break-even
- `getInvestmentSignal(mes)` — retorna "green" | "yellow" | "red"

---

## Detalhes Tecnicos

### Estrutura de arquivos modificados

```text
src/data/mockData.ts          -- novas funcoes de projecao
src/pages/FinanceiroProjecao.tsx    -- NOVO
src/pages/FinanceiroDashboard.tsx   -- semaforo + previsao
src/pages/FinanceiroRepasse.tsx     -- subtabs por franqueado
src/pages/FinanceiroImpostos.tsx    -- secao pagamentos
src/components/FranqueadoraSidebar.tsx -- item Projecao
src/App.tsx                    -- rota projecao
```

### Logica do Break-even

```text
Custo mensal medio = (Despesas + Impostos) / 1
Ticket medio = Receita Bruta / Num clientes ativos
Break-even = Custo mensal medio / Ticket medio (arredondado para cima)
```

### Logica do Semaforo

```text
margemLucro = resultado / receitaLiquida
SE margemLucro > 0.15 E runway > 3 → VERDE
SE margemLucro > 0.05 E runway > 2 → AMARELO
SENAO → VERMELHO
```

### Projecao 3/6 meses

Para cada mes futuro, o sistema vai:
1. Usar receita recorrente atual (clientes ativos recorrentes)
2. Aplicar folha com reajustes programados
3. Incluir parcelas ativas (removendo as que encerram)
4. Incluir eventos/treinamento a partir de abril
5. Calcular imposto com a mesma regra (10%)
6. Calcular resultado projetado

### Subtabs do Repasse

- **Por Franqueado**: agrupa receitas pelo `franqueadoVinculado`
- **Pendentes**: filtra receitas com repasse onde `pago = false`
- **Pagos**: filtra receitas com repasse onde `pago = true`
- **Historico**: mostra todos os meses com totais

---

## Ordem de implementacao

1. Funcoes auxiliares no mockData (projecao, break-even, semaforo)
2. Pagina FinanceiroProjecao (nova)
3. Dashboard enriquecido (semaforo + previsao)
4. Repasse com subtabs
5. Impostos com secao pagamentos
6. Sidebar + rota

