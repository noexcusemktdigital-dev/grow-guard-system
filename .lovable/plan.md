

## Integrar Metas ao Relatório CRM + Coloração Verde/Amarelo/Vermelho

### O que muda

O relatório CRM (`ClienteDashboard.tsx`) passará a consumir as metas ativas do mês e o progresso calculado (`useActiveGoals` + `useGoalProgress`), usando as cores verde (batida/no ritmo), amarelo (em andamento) e vermelho (abaixo/crítica) nos KPIs e gráficos. Uma nova seção de metas aparecerá no topo da aba CRM.

### Mudanças concretas

**1. Importar metas e progresso no dashboard**

- Importar `useActiveGoals` de `useGoals` e `useGoalProgress` de `useGoalProgress`
- Buscar metas ativas e seu progresso dentro do componente

**2. Nova seção "Metas do Mês" na aba CRM**

Abaixo dos 8 KPI cards, antes dos gráficos, adicionar um bloco com as metas ativas:
- Cada meta mostra: título, métrica, valor atual vs. alvo, barra de progresso colorida, dias restantes
- Cores da barra: verde (`batida`/`no_ritmo`), amarelo (`em_andamento`), vermelho (`abaixo`/`critica`)
- Se não houver metas, mostrar mensagem com link para criar metas

**3. Coloração dos KPI cards baseada nas metas**

- Para os KPIs que têm meta correspondente (ex: "Receita Total" → meta de `revenue`, "Leads Captados" → meta de `leads`, "Taxa de Conversão" → meta de `conversions`, "Ticket Médio" → meta de `avg_ticket`), o gradiente do card muda de acordo com o status:
  - Verde: `from-emerald-500/15` — meta batida ou no ritmo
  - Amarelo: `from-amber-500/15` — em andamento
  - Vermelho: `from-red-500/15` — abaixo ou crítica
  - Se não há meta para aquele KPI, manter gradiente padrão

**4. Refatorar `KpiCard` para aceitar status de meta**

- Adicionar prop opcional `goalStatus` ao `KpiCard`
- Adicionar indicador visual (badge ou borda colorida) mostrando "✓ Meta batida", "↗ No ritmo", "→ Em andamento", "↓ Abaixo"

**5. Cores dos gráficos do CRM**

- Gráfico "Taxa de Conversão" (radial): cor baseada em comparação com a meta de conversão (verde se >= meta, amarelo se >= 50% da meta, vermelho se abaixo)
- Gráfico "Leads por Etapa" (barras): manter cores padrão (não muda)
- Gráfico "Leads Criados por Semana" (linha): adicionar linha de referência horizontal se houver meta de leads (mostrando o "pace necessário por semana")

**6. Abas Chat e Agentes IA**

- Sem vínculo com metas (como solicitado — são baseadas em ações)
- Manter cores atuais

### Detalhes técnicos

**Mapeamento KPI → métrica de meta:**
```typescript
const metricMap: Record<string, string[]> = {
  "revenue": ["Receita Total"],
  "faturamento": ["Receita Total"],
  "leads": ["Leads Captados"],
  "conversions": ["Taxa de Conversão"],
  "avg_ticket": ["Ticket Médio"],
  "contracts": ["Pipeline Ativo"],
  "contratos": ["Pipeline Ativo"],
};
```

**Cores por status:**
```typescript
function getStatusColor(status: string) {
  if (status === "batida" || status === "no_ritmo") return { gradient: "from-emerald-500/15 to-emerald-600/5", color: "text-emerald-600", bg: "bg-emerald-100" };
  if (status === "em_andamento") return { gradient: "from-amber-500/15 to-amber-600/5", color: "text-amber-600", bg: "bg-amber-100" };
  return { gradient: "from-red-500/15 to-red-600/5", color: "text-red-600", bg: "bg-red-100" };
}
```

**Barra de progresso na seção de metas:**
```tsx
<div className="h-2 rounded-full bg-muted overflow-hidden">
  <div className={`h-full rounded-full ${statusBgClass}`} style={{ width: `${Math.min(percent, 100)}%` }} />
</div>
```

### Arquivo afetado
- `src/pages/cliente/ClienteDashboard.tsx` — importar hooks de metas, nova seção, KpiCard com status, cores condicionais nos gráficos

