

## Plano: Reestruturar Metas & Ranking (Franqueadora + Franqueado)

### Visão Geral

**Franqueadora** — 3 abas: Dashboard, Metas, Ranking (remover Campanhas e Configurações)
**Franqueado** — mantém Metas do Mês + Troféus, mas puxa dados reais via `useGoalProgress`

O progresso das metas deve calcular valores reais a partir do CRM (leads/vendas), contratos ativos e financeiro.

---

### 1. Franqueadora (`MetasRanking.tsx`)

**Remover**: abas "Campanhas" e "Configuração" (e seus renders)

**Dashboard** — manter KPIs mas substituir "Campanhas Ativas" por outro indicador útil (ex: "Metas Atingidas")

**Metas** — já funciona bem. Integrar `useGoalProgress` para mostrar progresso real calculado a partir de:
- `revenue` / `faturamento` → soma de `value` de leads ganhos (CRM) no período
- `contratos` → contagem de leads ganhos (CRM) ou contratos ativos no período
- `leads` → total de leads criados no período
- O hook `useGoalProgress` já faz isso — basta usá-lo no render das metas

**Ranking** — adicionar:
- Seção de troféus de cada unidade (consultando dados reais: primeiro contrato, 3 clientes, etc.)
- Visão do time interno da matriz (membros com ranking individual)

### 2. Franqueado (`FranqueadoMetasRanking.tsx`)

**Metas** — substituir mock por dados reais:
- Usar `useActiveGoals` filtrado pela unidade + `useGoalProgress` para calcular valores reais
- Mostrar cards com progresso real (faturamento do CRM, contratos, leads)

**Troféus** — calcular desbloqueio real:
- `first_sale`: existe pelo menos 1 lead com `won_at` na org
- `hat_trick`: 3+ leads com `won_at`
- `top_revenue`: soma de `value` de leads ganhos em algum mês >= 20000
- `speed_close`: algum lead com `won_at - created_at < 7 dias`
- `first_goal`: alguma meta com progresso >= 100%
- `ten_clients`: 10+ contratos ativos ou 10+ leads ganhos

### 3. Hook de Troféus (novo: `useTrophyProgress.ts`)

Novo hook que consulta CRM + contratos e retorna quais troféus estão desbloqueados, reutilizável pela franqueadora (para ver troféus de cada unidade) e pelo franqueado.

### 4. Progresso Real das Metas

O hook `useGoalProgress` já existe e calcula corretamente revenue, leads, contratos, meetings e avg_ticket a partir do CRM via `get_network_crm_data`. Preciso apenas:
- Integrá-lo no render de `MetasRanking.tsx` (franqueadora)
- Integrá-lo no `FranqueadoMetasRanking.tsx` para substituir os mocks
- Adicionar métrica `contratos_ativos` que consulta tabela `contracts` com `status = 'active'`

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/MetasRanking.tsx` | Remover abas Campanhas/Config, integrar `useGoalProgress`, adicionar troféus e time interno no Ranking |
| `src/pages/franqueado/FranqueadoMetasRanking.tsx` | Substituir mocks por dados reais via hooks, calcular desbloqueio de troféus |
| `src/hooks/useTrophyProgress.ts` | Novo hook — calcula desbloqueio dos 6 troféus a partir de CRM/contratos |
| `src/hooks/useGoalProgress.ts` | Adicionar suporte a métrica `contratos_ativos` consultando tabela `contracts` |

