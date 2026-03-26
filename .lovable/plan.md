

## Redesign Visual dos KPI Cards com Metas Integradas + Seção de Metas Dinâmica

### O que muda

Os 8 KPI cards passam a mostrar **dentro do próprio card** a meta vinculada (valor atual vs alvo + mini barra de progresso), tornando desnecessário olhar para outra seção. A seção "Metas do Mês" é redesenhada com visual mais rico — usando `GoalProgressRing` + projeções inline em vez de simples barras de texto.

### Mudanças concretas

**1. Redesign do KpiCard local (dentro de ClienteDashboard)**

Cada KpiCard que tem meta vinculada ganha:
- Mini progress bar colorida (verde/amarelo/vermelho) na parte inferior do card
- Texto "Meta: R$ 50.000" ou "Meta: 30 leads" abaixo do valor principal
- Porcentagem da meta (ex: "78% da meta") ao lado do status badge
- Se não há meta, o card continua igual (sem barra nem texto de meta)

```text
┌─────────────────────────┐
│ 💲                      │
│ R$ 32.500               │
│ RECEITA TOTAL  ↗ +15%   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░ 65%    │
│ Meta: R$ 50.000 → 18d   │
│ ↗ No ritmo              │
└─────────────────────────┘
```

Props adicionadas ao KpiCard local:
- `goalTarget?: string` — valor formatado da meta (ex: "R$ 50.000")
- `goalPercent?: number` — percentual atingido
- `goalDaysLeft?: number` — dias restantes

**2. Redesign da seção "Metas do Mês"**

Substituir a lista de barras simples por cards visuais com:
- `GoalProgressRing` (anel circular) à esquerda — já existe no projeto
- Título + métrica + badge de status
- Barra de progresso expandida com cores
- Texto de projeção: "No ritmo atual, atingirá ~92% da meta" (lógica já existe no GoalCard)
- Layout em grid 2 colunas (lg) para ficar mais compacto

```text
┌──────────────────────────────────────┐
│  ◎ 78%  │ Faturamento Mensal         │
│  (ring) │ R$ 32.500 / R$ 50.000      │
│         │ ▓▓▓▓▓▓▓▓▓▓▓░░░  ↗ No ritmo│
│         │ ✅ Projeção: ~92% da meta   │
│         │ 18 dias restantes           │
└──────────────────────────────────────┘
```

**3. Lógica de vinculação KPI → Meta**

Expandir `getKpiGoalStatus` para retornar também os dados numéricos (não só o status), para alimentar a mini barra e os textos do card:

```typescript
function getKpiGoalData(kpiLabel: string): {
  status: GoalStatus;
  percent: number;
  targetFormatted: string;
  daysLeft: number;
} | undefined
```

**4. Formatação inteligente da meta no card**

- Métricas monetárias (revenue, avg_ticket): `formatBRL(target_value)`
- Métricas numéricas (leads, contracts): `${target_value}`
- Métricas percentuais (conversions): `${target_value}%`

### Arquivos afetados

- `src/pages/cliente/ClienteDashboard.tsx` — redesign do KpiCard local, nova seção de metas visual, helper `getKpiGoalData`
- Reutiliza `GoalProgressRing` existente (sem alteração)

### Detalhes técnicos

A seção de metas usa `GoalProgressRing` com `size={52}` para caber no layout compacto. A lógica de projeção é extraída do `GoalCard.tsx` existente (cálculo de `projectedPercent` e `increaseNeeded`). O grid de metas usa `grid-cols-1 lg:grid-cols-2` para responsividade. Os KpiCards mantêm `data-pdf-hide` nos badges de status para não poluir o PDF.

