

## Plano: Redesign dos Gráficos de Projeção do Plano de Vendas

### Problema atual
Os gráficos de projeção (leads e receita) são 4 AreaCharts básicos idênticos em layout, separados em "Sem Estratégia" vs "Com Estratégia" lado a lado. Visual repetitivo, sem impacto, sem destaque nos números.

### Solução: Dashboard de projeção premium com gráficos variados

Substituir os 4 AreaCharts por uma seção única e visualmente rica com 3 componentes:

**1. Gráfico principal — Receita Projetada (AreaChart sobreposto)**
- Um único AreaChart grande com as duas curvas sobrepostas (atual tracejada, com estratégia sólida com gradiente)
- Badges flutuantes mostrando crescimento absoluto e percentual (ex: "+R$ 45k" "+120%")
- Tooltip formatado em R$

**2. Funil de Conversão visual (BarChart horizontal)**
- Novo gráfico mostrando o funil reverso: leads necessários → qualificados → propostas → fechamentos
- Calculado a partir do ticket médio, meta de faturamento e taxas de conversão estimadas
- Cores em gradiente do topo ao fundo do funil

**3. KPI Cards de impacto**
- Cards destacando métricas-chave da projeção:
  - Receita projetada no mês 6
  - Crescimento % de receita
  - Leads projetados no mês 6
  - ROI estimado (vendas adicionais vs cenário atual)

### Mudanças técnicas

| Arquivo | Mudança |
|---------|---------|
| `src/pages/cliente/ClientePlanoVendas.tsx` | Substituir seção de projeção (linhas 1058-1130) por: 1 AreaChart sobreposto, 1 BarChart horizontal de funil, KPI cards com badges de crescimento |

Componentes Recharts utilizados: `AreaChart` (sobreposto), `BarChart` (horizontal), mantendo `RadarChart` existente. Adição de `funnel data` calculado a partir das respostas.

### Visual esperado

```text
┌─────────────────────────────────────────────────┐
│  KPI    │   KPI    │    KPI    │     KPI        │
│ Receita │ Crescim. │  Leads   │  Fechamentos   │
│ M6 proj │  +120%   │  M6 proj │   projetados   │
├─────────────────────────────────────────────────┤
│         PROJEÇÃO DE RECEITA (6 MESES)           │
│  AreaChart sobreposto: atual vs com estratégia  │
│  Badges: +R$XXk  +XX%                           │
├─────────────────────────────────────────────────┤
│         FUNIL DE CONVERSÃO PROJETADO            │
│  BarChart horizontal:                           │
│  ████████████████████ Leads (150)               │
│  ██████████████ Qualificados (75)               │
│  ████████ Propostas (30)                        │
│  ████ Fechamentos (12)                          │
└─────────────────────────────────────────────────┘
```

Total: 1 arquivo editado, seção de ~70 linhas substituída por ~150 linhas mais ricas visualmente.

