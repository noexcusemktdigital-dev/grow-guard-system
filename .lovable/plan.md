

## Atualização de Planos — Todas as ferramentas liberadas desde o Starter

### Resumo das mudanças

Todos os planos passam a liberar **todas as ferramentas** (WhatsApp, Agente IA, Disparos). A diferenciação entre planos será apenas por créditos, usuários, pipelines e sites. O custo do WhatsApp (R$ 45/mês) já está embutido nos novos preços.

### Novos valores e limites

| Plano | Preço | Créditos | Usuários | Pipelines | WhatsApp/IA/Disparos |
|-------|-------|----------|----------|-----------|----------------------|
| Starter | R$ 349 | 500 | 10 | 10 | ✅ Todos |
| Pro | R$ 739 | 1.000 | 20 | 20 | ✅ Todos |
| Enterprise | R$ 1.429 | 2.000 | Ilimitados | 50 | ✅ Todos |

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/constants/plans.ts` | Atualizar preços, créditos do Enterprise (2000), e setar `hasAiAgent`, `hasWhatsApp`, `hasDispatches` como `true` em **todos** os planos (incluindo Starter). Atualizar `features[]` para refletir que tudo está incluso. Manter Trial com as flags `false` (trial continua limitado). |
| `src/contexts/FeatureGateContext.tsx` | Remover as travas `AI_AGENT_ROUTES` e `DISPATCH_ROUTES` que bloqueavam por `plan_locked`. Remover `TRIAL_BLOCKED` (sites e tráfego ficam acessíveis no trial também, limitados por créditos). Simplificar o `getGateReason`. |
| `src/components/FeatureGateOverlay.tsx` | Remover a config `plan_locked` (não será mais usada). |
| `src/pages/cliente/ClientePlanoCreditos.tsx` | Atualizar a exibição para não mostrar "Agente IA / WhatsApp: ❌ Não incluso" — agora sempre incluso. |
| `src/pages/cliente/ClientePlanoCreditsHelpers.tsx` | Remover badges "Pro+ exclusivo" que aparecem quando `!plan.hasAiAgent`. |
| `src/pages/SaasLanding.tsx` | Remover badges de "Agente IA", "WhatsApp", "Disparos" como exclusivos do Pro. Atualizar preços na landing. |

### Detalhes técnicos

**`plans.ts`** — Mudanças nos dados:
- Starter: `price: 349`, `hasAiAgent: true`, `hasWhatsApp: true`, `hasDispatches: true`
- Pro: `price: 739`
- Enterprise: `price: 1429`, `credits: 2000`
- Features do Starter atualizadas para incluir "Agente de IA", "Chat WhatsApp", "Disparos em massa"

**`FeatureGateContext.tsx`** — Remover os blocos que checam `limits.hasAiAgent` e `limits.hasDispatches` para retornar `plan_locked`. Também remover `TRIAL_BLOCKED` para que trial users vejam as ferramentas (limitados apenas por créditos e expiração).

