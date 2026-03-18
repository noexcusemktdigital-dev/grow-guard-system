

# Histórico de Diagnósticos + Gráficos Aprimorados

## Problema atual

1. **Sem histórico real**: A tabela `sales_plans` tem constraint `isOneToOne` no `organization_id`. Cada novo diagnóstico sobrescreve o anterior. O "histórico" mostra apenas 1 entrada (o plano atual). Não há como fazer diagnósticos periódicos.

2. **Itens do histórico não são clicáveis**: Mesmo a entrada existente não abre nenhum detalhe ao clicar.

3. **Gráficos do diagnóstico são básicos**: Apenas um RadarChart e um termômetro. Faltam gráficos interativos, comparativos e tipos variados.

---

## Solução

### 1. Nova tabela `sales_plan_history`
Criar uma tabela para armazenar snapshots de cada diagnóstico:

```sql
CREATE TABLE sales_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  answers JSONB DEFAULT '{}',
  score INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE sales_plan_history ENABLE ROW LEVEL SECURITY;
-- RLS: membros da org podem ver
CREATE POLICY "Members can view own org history"
  ON sales_plan_history FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "Members can insert own org history"
  ON sales_plan_history FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
  ));
```

### 2. Fluxo de "Refazer diagnóstico"
Quando o usuário clica "Refazer":
- **Antes de limpar**: Salva o diagnóstico atual (answers + score + data) como snapshot na `sales_plan_history`
- **Depois**: Limpa `sales_plans` como já faz hoje
- Isso garante que cada diagnóstico fica permanentemente salvo no histórico

### 3. Histórico clicável com visualização completa
- Buscar todos os registros de `sales_plan_history` para a org, ordenados por `created_at DESC`
- Cada card do histórico ganha botão "Ver diagnóstico"
- Ao clicar, abre um `Dialog` fullscreen com:
  - Termômetro com a pontuação daquele diagnóstico
  - Radar por área (recalculado das answers salvas)
  - Insights e plano de ação (recalculados)
  - Data de realização

### 4. Gráficos do diagnóstico aprimorados
Adicionar ao resultado do diagnóstico (além do Radar e Termômetro existentes):

| Gráfico | Tipo | Descrição |
|---|---|---|
| Barras por Categoria | BarChart horizontal | Score de cada área (Negócio, Financeiro, Equipe, etc) com cores por faixa |
| Evolução Histórica | AreaChart | Score geral ao longo do tempo (conecta com histórico) |
| Gauge de Maturidade | Componente custom | Indicador visual tipo velocímetro com animação |
| Comparativo Ideal vs Real | BarChart agrupado | Cada área mostra score atual vs benchmark ideal (100%) |

Os gráficos existentes (Radar, Termômetro) permanecem. Os novos são adicionados abaixo.

### 5. Metas — análise de completude
A aba de Metas está funcional com:
- Criação/edição/arquivamento
- Progresso real via CRM (useGoalProgress calcula revenue, leads, contracts, meetings, avg_ticket, conversions)
- Filtros por escopo (empresa/equipe/individual)
- Gráficos de progresso, comparativo por escopo, evolução diária
- Export CSV e PDF
- GoalCard com projeção inteligente (ritmo, dias restantes)

Nenhum bug crítico identificado na lógica de metas. O sistema está completo.

---

## Arquivos a alterar
- **Migration SQL** — criar tabela `sales_plan_history` com RLS
- **`src/hooks/useSalesPlan.ts`** — adicionar `useSalesPlanHistory()` query e `useArchiveSalesPlan()` mutation
- **`src/pages/cliente/ClientePlanoVendas.tsx`** — refazer tab Histórico (lista de `sales_plan_history`), dialog de visualização completa, novos gráficos no diagnóstico, lógica de archive antes de refazer

