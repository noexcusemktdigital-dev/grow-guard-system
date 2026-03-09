

## Plano: Reestruturação de Planos Modulares (Vendas + Marketing + Combo)

### Modelo de Negócio

Cada módulo tem 3 tiers independentes. O cliente contrata Vendas OU Marketing OU ambos (combo com ~15% desconto).

### Sugestão de Precificação

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  MÓDULO VENDAS (7 ferramentas)                                              │
│  CRM, Chat WhatsApp, Agentes IA, Scripts, Disparos, Plano Vendas, Checklist │
├────────────┬──────────┬──────────┬────────────┬─────────┬───────────────────┤
│ Tier       │ Preço    │ Créditos │ Usuários   │ Agentes │ Disparos          │
├────────────┼──────────┼──────────┼────────────┼─────────┼───────────────────┤
│ Starter    │ R$ 197   │ 3.000    │ 2          │ 1       │ 0                 │
│ Professional│ R$ 497  │ 15.000   │ 5          │ 2       │ 1 (500 dest.)     │
│ Enterprise │ R$ 997   │ 40.000   │ 15         │ 4       │ 3 (2.000 dest.)   │
└────────────┴──────────┴──────────┴────────────┴─────────┴───────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  MÓDULO MARKETING (5 ferramentas)                                            │
│  Conteúdos, Artes Sociais, Sites, Tráfego Pago, Estratégia de Marketing     │
├────────────┬──────────┬──────────┬────────────┬──────────┬──────┬───────────┤
│ Tier       │ Preço    │ Créditos │ Conteúdos  │ Artes    │ Sites│ Tráfego   │
├────────────┼──────────┼──────────┼────────────┼──────────┼──────┼───────────┤
│ Starter    │ R$ 147   │ 2.000    │ 8          │ 4        │ 1    │ 1 estr.   │
│ Professional│ R$ 397  │ 10.000   │ 12         │ 8        │ 2    │ 2 estr.   │
│ Enterprise │ R$ 797   │ 30.000   │ 20         │ 12       │ 3    │ 4 estr.   │
└────────────┴──────────┴──────────┴────────────┴──────────┴──────┴───────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  COMBO (desconto ~15% sobre a soma)                                          │
├──────────────────────┬─────────────┬──────────────┬──────────────────────────┤
│ Combinação           │ Soma        │ Combo (-15%) │ Economia                 │
├──────────────────────┼─────────────┼──────────────┼──────────────────────────┤
│ Starter + Starter    │ R$ 344      │ R$ 297       │ R$ 47/mês               │
│ Prof. + Prof.        │ R$ 894      │ R$ 757       │ R$ 137/mês              │
│ Enterprise + Enter.  │ R$ 1.794    │ R$ 1.527     │ R$ 267/mês              │
│ (mix qualquer)       │ Soma ambos  │ -15%         │ Calculado dinamicamente  │
└──────────────────────┴─────────────┴──────────────┴──────────────────────────┘

Trial: 7 dias, 1.000 créditos, 1 usuário, acesso limitado (não aparece nos planos pagos)
Usuário adicional: R$ 29/mês (além do limite incluso no plano)
```

### Recarga de Créditos

Manter os 3 pacotes avulsos (5k/R$49, 20k/R$149, 50k/R$299), adicionando créditos ao saldo sem alterar o plano.

### Arquitetura de Dados

**Novo modelo em `src/constants/plans.ts`:**

```typescript
// Planos separados por módulo
interface SalesModulePlan { id, name, price, credits, maxUsers, maxAgents, maxDispatches, ... }
interface MarketingModulePlan { id, name, price, credits, maxContents, maxSocialArts, maxSites, ... }

SALES_PLANS: SalesModulePlan[]    // starter, professional, enterprise
MARKETING_PLANS: MarketingModulePlan[]  // starter, professional, enterprise

COMBO_DISCOUNT = 0.15  // 15%

// Função que calcula limites combinados
getEffectiveLimits(salesPlan?, marketingPlan?) => { totalCredits, maxUsers, ... }
```

**Tabela `subscriptions` — novo campo `modules`:**
- Formato atual: `"comercial" | "marketing" | "combo"` (string simples)
- Novo formato: armazenar `sales_plan_id` e `marketing_plan_id` separados
- Alternativa leve: usar `modules` como JSON (`{"sales":"professional","marketing":"starter"}`)

Recomendo adicionar 2 colunas à tabela `subscriptions`:
- `sales_plan` (text, nullable) — ex: "starter", "professional", "enterprise"
- `marketing_plan` (text, nullable) — ex: "starter", "professional", "enterprise"

Isso permite combinações livres (ex: Vendas Enterprise + Marketing Starter).

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/constants/plans.ts` | Refatorar para 2 arrays (SALES_PLANS, MARKETING_PLANS) + funções de cálculo combo |
| `src/pages/cliente/ClientePlanoCreditos.tsx` | Nova UI com seleção independente por módulo + toggle combo |
| `src/pages/SaasLanding.tsx` | Atualizar pricing section com nova estrutura modular |
| `supabase/functions/asaas-create-subscription/index.ts` | Aceitar `sales_plan` + `marketing_plan` separados |
| `supabase/functions/signup-saas/index.ts` | Manter trial inalterado |
| `supabase/functions/asaas-webhook/index.ts` | Ajustar renovação para novo modelo |
| `src/hooks/useCreditAlert.ts` | Calcular limite somando créditos de ambos os planos |
| `src/contexts/FeatureGateContext.tsx` | Gate por módulo contratado (bloquear ferramentas de Vendas se só tem Marketing e vice-versa) |
| `src/hooks/useRoleAccess.ts` | Manter RBAC admin/user inalterado |
| `src/components/ClienteSidebar.tsx` | Ocultar/desabilitar itens de módulos não contratados |
| Migration SQL | Adicionar `sales_plan` e `marketing_plan` à tabela `subscriptions` |

### Fluxo do Usuário

1. **Signup** → Trial 7 dias (todas as ferramentas com limites mínimos)
2. **Banner de expiração** → Direciona para `/cliente/plano-creditos`
3. **Página de Planos** → Escolhe Vendas, Marketing ou ambos + tier de cada
4. **Checkout** → Asaas (PIX/Cartão/Boleto) com valor calculado
5. **Pós-pagamento** → Limites atualizados, módulos desbloqueados
6. **Recarga** → Compra créditos avulsos a qualquer momento

### UX da Página de Planos

```text
┌──────────────────────────────────────────────────────────────┐
│  Plano & Créditos                                            │
├──────────────────────────────────────────────────────────────┤
│  [Status atual] [Wallet de Créditos]                         │
├──────────────────────────────────────────────────────────────┤
│  Módulo Vendas                     [Selecionar ▼]            │
│  ┌─────────┐ ┌──────────────┐ ┌────────────┐                │
│  │ Starter │ │ Professional │ │ Enterprise │                │
│  │ R$ 197  │ │   R$ 497     │ │   R$ 997   │                │
│  └─────────┘ └──────────────┘ └────────────┘                │
│                                                              │
│  Módulo Marketing                  [Selecionar ▼]            │
│  ┌─────────┐ ┌──────────────┐ ┌────────────┐                │
│  │ Starter │ │ Professional │ │ Enterprise │                │
│  │ R$ 147  │ │   R$ 397     │ │   R$ 797   │                │
│  └─────────┘ └──────────────┘ └────────────┘                │
│                                                              │
│  ┌──────────────────────────────────────────────────┐        │
│  │ 🔥 Combo: Vendas Prof + Mkt Prof = R$ 757/mês   │        │
│  │    Economia de R$ 137/mês (15% off)              │        │
│  │    [Contratar Combo]                              │        │
│  └──────────────────────────────────────────────────┘        │
├──────────────────────────────────────────────────────────────┤
│  Pacotes de Créditos Avulsos                                 │
│  [5.000 - R$49] [20.000 - R$149] [50.000 - R$299]          │
├──────────────────────────────────────────────────────────────┤
│  [Consumo por módulo] [Faturas] [Histórico]                  │
└──────────────────────────────────────────────────────────────┘
```

