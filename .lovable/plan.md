

# Metas Comerciais -- Reformulacao Completa com Integracao Real

## Resumo

Transformar a aba "Minhas Metas" de uma lista simples em um painel visual rico e integrado aos dados reais do CRM. As metas terao escopo (empresa, equipe, individual), progresso calculado automaticamente a partir dos dados do CRM, visual rico com gauges/progress rings, e metas do mes atual separadas das antigas (historico).

---

## O que muda

### 1. Banco de Dados -- Expandir tabela `goals`

Adicionar colunas na tabela `goals` para suportar escopo, equipe e integracao:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `scope` | text (default 'company') | 'company', 'team', 'individual' |
| `team_id` | uuid (nullable) | Referencia ao time (crm_teams) quando scope='team' |
| `metric` | text (default 'revenue') | Metrica rastreada: 'revenue', 'leads', 'conversions', 'contracts', 'meetings', 'avg_ticket', 'retention' |
| `priority` | text (default 'media') | 'alta', 'media', 'baixa' |
| `status` | text (default 'active') | 'active', 'completed', 'archived' |

A coluna `type` existente sera reutilizada, mas o campo `metric` sera mais granular para definir exatamente o que e medido. O campo `current_value` ja existe e sera atualizado.

### 2. Calculo Automatico de Progresso (via CRM)

Uma funcao no frontend calculara `current_value` com base na metrica:

| Metrica | Fonte de dados | Calculo |
|---------|----------------|---------|
| **revenue** (Faturamento) | `crm_leads` com `won_at` no periodo | SUM(value) dos leads ganhos |
| **leads** (Leads Gerados) | `crm_leads` com `created_at` no periodo | COUNT de leads criados |
| **conversions** (Conversao) | `crm_leads` | (leads com won_at / total leads) * 100 |
| **contracts** (Contratos) | `crm_leads` com `won_at` | COUNT de leads ganhos |
| **meetings** (Reunioes) | `crm_activities` type='meeting' | COUNT no periodo |
| **avg_ticket** (Ticket Medio) | `crm_leads` com `won_at` | AVG(value) |

Quando escopo = 'team', filtra por `assigned_to IN (membros do time)`.
Quando escopo = 'individual', filtra por `assigned_to = user_id`.

### 3. Visual Novo -- Minhas Metas

Layout da aba reformulada:

```text
+------------------------------------------------------+
|  MINHAS METAS  (Fev 2026)                            |
|  [Empresa] [Equipe] [Individual]  <- filtros escopo   |
+------------------------------------------------------+
|                                                      |
|  KPI Cards (resumo do mes):                          |
|  +----------+ +----------+ +----------+ +----------+ |
|  | 3 metas  | | 1 batida | | 67% avg  | | 2 alta   | |
|  | ativas   | | atingida | | progresso| | priorid. | |
|  +----------+ +----------+ +----------+ +----------+ |
|                                                      |
|  Meta Cards (detalhados):                            |
|  +------------------------------------------------+  |
|  | [Ring 72%]  Faturamento Mensal                  |  |
|  |             Empresa · Alta prioridade           |  |
|  |  R$ 36.000 / R$ 50.000                         |  |
|  |  [=============================-------] 72%     |  |
|  |  Responsavel: Toda empresa                     |  |
|  |  Periodo: 01/02 - 28/02                        |  |
|  |  Faltam: R$ 14.000  |  Ritmo: R$ 1.800/dia    |  |
|  |  Status: [Em andamento]  [Editar] [Arquivar]   |  |
|  +------------------------------------------------+  |
|                                                      |
|  +------------------------------------------------+  |
|  | [Ring 45%]  Leads por Vendedor                  |  |
|  |             Individual · Joao Silva             |  |
|  |  9 / 20 leads                                  |  |
|  |  [=================-----------] 45%             |  |
|  |  Status: [Abaixo do ritmo]                     |  |
|  +------------------------------------------------+  |
|                                                      |
+------------------------------------------------------+
|  HISTORICO DE METAS (meses anteriores)               |
|  [card colapsavel com metas passadas + resultado]    |
+------------------------------------------------------+
```

**Componentes visuais de cada meta:**
- Circular progress ring (SVG) mostrando percentual
- Barra de progresso colorida (verde >= 80%, amarelo >= 50%, vermelho < 50%)
- Badge de status: "Batida", "Em andamento", "Abaixo do ritmo", "Critica"
- Indicador de ritmo: calcula se o progresso esta compativel com os dias restantes do mes
- Mini sparkline de evolucao (opcional, para metas recorrentes)

### 4. Filtros por Escopo

Tres botoes de filtro no topo:
- **Empresa**: mostra metas com scope='company'
- **Equipe**: mostra metas com scope='team', agrupadas por time
- **Individual**: mostra metas com scope='individual', agrupadas por pessoa

### 5. Historico Automatico

Metas cujo `period_end` e anterior ao mes atual sao automaticamente exibidas na secao "Historico" (abaixo das metas ativas). O historico mostra:
- Nome da meta + periodo
- Resultado final (current_value vs target_value)
- Badge: "Batida" ou "Nao atingida" com percentual

### 6. Formulario de Nova Meta (expandido)

O dialog de criar meta sera mais completo:
- Nome da meta
- Metrica (dropdown com as 7 opcoes)
- Valor alvo (numerico)
- Escopo: Empresa / Equipe / Individual
- Se Equipe: selecionar time (lista de crm_teams)
- Se Individual: selecionar usuario (lista de membros da org)
- Periodo: mes de referencia (auto-preenche inicio/fim do mes)
- Prioridade: Alta / Media / Baixa

---

## Arquivos

### Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/cliente/ClientePlanoVendas.tsx` | Reescrever secao "metas" (linhas ~966-1098): substituir cards simples por layout visual rico com progress rings, KPI summary, filtros de escopo, historico automatico, integracao com dados CRM |
| `src/hooks/useGoals.ts` | Expandir para incluir queries filtradas por escopo/mes, funcao de calculo de progresso via CRM data, mutation de arquivamento |

### Novos

| Arquivo | Descricao |
|---------|-----------|
| `src/components/metas/GoalProgressRing.tsx` | Componente SVG circular de progresso (ring chart) com animacao |
| `src/components/metas/GoalCard.tsx` | Card visual completo de uma meta com ring, barra, status, ritmo |
| `src/hooks/useGoalProgress.ts` | Hook que calcula current_value de cada meta consultando crm_leads, crm_activities |

### Migracao SQL

Adicionar colunas `scope`, `team_id`, `metric`, `priority`, `status` na tabela `goals`.

---

## Detalhes Tecnicos

### GoalProgressRing (SVG)

Circulo SVG com `stroke-dasharray` e `stroke-dashoffset` animados via CSS transition. Cores: verde (>=80%), amarelo (>=50%), vermelho (<50%). Tamanho: 56x56px nos cards.

### Calculo de Ritmo

```
diasPassados = hoje - period_start
diasTotais = period_end - period_start
ritmoNecessario = (target_value - current_value) / diasRestantes
ritmoAtual = current_value / diasPassados
status = ritmoAtual >= ritmoNecessario ? "No ritmo" : "Abaixo do ritmo"
```

### useGoalProgress Hook

Para cada meta ativa:
1. Busca dados do CRM filtrados pelo periodo e escopo
2. Calcula current_value
3. Retorna objeto com `{ goalId, currentValue, percent, status, pace }`

Usa React Query com chave `["goal-progress", goalId, metric, period]`.

### Separacao Ativas vs Historico

- Metas ativas: `period_end >= primeiro dia do mes atual` OU `period_end IS NULL`
- Metas historicas: `period_end < primeiro dia do mes atual`
- Na UI, metas ativas ficam em destaque; historicas ficam em secao colapsavel abaixo

