

## Plano: Limite Máximo de Leads por Plano

### Mudanças

**1. `src/constants/plans.ts`** — Adicionar `maxLeads` em todas as interfaces e planos:

| Plano | maxLeads |
|-------|----------|
| Trial | 50 |
| Starter | 500 |
| Professional | 5.000 |
| Enterprise | 50.000 |

- Adicionar `maxLeads` em `SalesModulePlan`, `TrialPlan`, `EffectiveLimits`
- Adicionar nos 3 objetos de `SALES_PLANS`, no `TRIAL_PLAN`, e no retorno de `getEffectiveLimits`

**2. `src/hooks/useCrmLeads.ts`** — Bloquear criação quando limite atingido:
- No `createLead.mutationFn`, antes do insert, fazer um `SELECT count` de leads ativos (não arquivados) da org
- Comparar com `maxLeads` do plano (obtido via subscription)
- Se atingido, lançar erro `LEAD_LIMIT_REACHED`

**3. `src/pages/cliente/ClienteCRM.tsx`** — Exibir banner de uso:
- Mostrar barra de progresso "X / Y leads" no topo do CRM
- Quando >= 90%, exibir alerta amarelo "Você está próximo do limite"
- Quando 100%, desabilitar botão "Novo Lead" e mostrar CTA de upgrade

**4. `src/components/crm/CrmNewLeadDialog.tsx`** — Verificar limite antes de abrir:
- Se limite atingido, mostrar toast de erro com link para upgrade em vez de abrir o dialog

### Valores Propostos

Os limites foram calibrados para:
- **Starter (500)**: Operação pequena, 1-2 vendedores, não sobrecarrega
- **Professional (5.000)**: Equipe média, suporta volume comercial robusto
- **Enterprise (50.000)**: Grandes operações com múltiplos times

