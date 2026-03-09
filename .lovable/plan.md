

## Refazer Planos, Precificacao e Cobranca — Plano Unificado

### Resumo

Substituir a arquitetura modular (Vendas separado de Marketing + Combo) por **3 planos unificados** baseados em creditos. Marketing disponivel em todos os planos. Funcionalidades avancadas (Agente IA, WhatsApp, Disparos) sao exclusivas do Pro+.

### Nova Tabela de Planos

| | **Starter** | **Pro** | **Enterprise** |
|---|---|---|---|
| Preco | R$ 397/mes | R$ 797/mes | R$ 1.497/mes |
| Creditos/mes | 500 | 1.000 | 1.500 |
| Usuarios | ate 10 | ate 20 | ilimitado |
| CRM Pipelines | 3 | 10 | ilimitado |
| Agente IA | — | Sim | Sim |
| WhatsApp/Disparos | — | Sim | Sim |
| Marketing completo | Sim | Sim | Sim |

### Nova Tabela de Custos (CREDIT_COSTS)

| Acao | Creditos |
|---|---|
| Site | 100 |
| Arte social | 25 |
| Conteudo | 30 |
| Script vendas | 20 |
| Estrategia marketing | 50 |
| Automacao CRM (por exec) | 5 |
| Agente IA (por msg) | 2 |
| Estrategia trafego | 50 |
| Checklist diario | 5 |
| Plano prospeccao | 30 |
| Config agente | 10 |
| Simulacao agente | 10 |
| Briefing arte/video | 0 |

### Pacotes de Recarga

| Pacote | Creditos | Preco |
|---|---|---|
| Basico | 200 | R$ 49 |
| Popular | 500 | R$ 99 |
| Premium | 1.000 | R$ 179 |

### Trial

- 200 creditos, 7 dias, ate 2 usuarios
- Acesso a tudo, mas sem Agente IA, WhatsApp e Disparos

---

### Arquivos Afetados

#### 1. `src/constants/plans.ts` — Reescrever completo
- Remover `SALES_PLANS`, `MARKETING_PLANS`, `COMBO_DISCOUNT`, `getComboPrice`, `getComboSavings`, `getSalesPlan`, `getMarketingPlan`
- Criar `UNIFIED_PLANS` com interface `UnifiedPlan` (id, name, price, credits, maxUsers, maxPipelines, hasAiAgent, hasWhatsApp, hasDispatches, popular, features)
- Atualizar `CREDIT_COSTS` com novos valores
- Atualizar `CREDIT_PACKS` com novos pacotes
- Atualizar `TRIAL_PLAN` (200 creditos, 2 usuarios)
- Simplificar `getEffectiveLimits(planId, isTrial)` — recebe apenas 1 plan ID
- Remover `EffectiveLimits.hasSalesModule/hasMarketingModule`, adicionar `hasAiAgent`, `hasWhatsApp`, `hasDispatches`
- Manter backward-compat: `maxContents`, `maxSocialArts`, `maxSites` passam a ser ilimitados (controlados por credito, nao por quota fixa)

#### 2. `src/contexts/FeatureGateContext.tsx`
- Remover logica de `SALES_MODULE_ROUTES` e `MARKETING_MODULE_ROUTES`
- Rotas de Agente IA, Chat WhatsApp e Disparos ficam bloqueadas se o plano nao tiver `hasAiAgent`/`hasWhatsApp`
- Marketing nunca e bloqueado por modulo (todas as rotas de marketing sao acessiveis)
- Manter gate por creditos e trial

#### 3. `src/pages/cliente/ClientePlanoCreditos.tsx` — Reescrever secao de planos
- Remover tabs Vendas/Marketing/Combo
- Mostrar 3 cards unificados (Starter, Pro, Enterprise)
- Atualizar `ModularSubscriptionDialog` para enviar apenas `plan` (nao `sales_plan` + `marketing_plan`)
- Adicionar secao "Calculadora de Creditos" mostrando quanto custa cada acao

#### 4. Hooks que chamam `getEffectiveLimits` (7 arquivos)
- `useLeadQuota.ts`, `useCreditAlert.ts`, `useClienteContentV2.ts`, `useClientePosts.ts`, `ClienteConfiguracoes.tsx`, `useClienteSitesDB.ts`, `useClienteDispatches.ts`
- Atualizar chamada de `getEffectiveLimits(salesPlan, mktPlan, isTrial)` para `getEffectiveLimits(plan, isTrial)`
- Remover refs a `sales_plan` e `marketing_plan` da subscription — usar campo `plan` existente

#### 5. `src/components/cliente/TrialWelcomeModal.tsx` e `TrialCountdownBanner.tsx`
- Atualizar texto para refletir 200 creditos e novo modelo

#### 6. `src/components/quota/UsageQuotaBanner.tsx`
- Ajustar para novo modelo de limites

#### 7. Edge Functions (asaas-create-subscription, asaas-webhook, signup-saas)
- Atualizar para trabalhar com campo `plan` unico ao inves de `sales_plan` + `marketing_plan`

### Ordem de Implementacao

1. Reescrever `plans.ts` (fundacao)
2. Atualizar `FeatureGateContext.tsx`
3. Atualizar todos os hooks consumidores
4. Reescrever `ClientePlanoCreditos.tsx` com calculadora
5. Atualizar Edge Functions
6. Atualizar componentes de Trial/Banner

