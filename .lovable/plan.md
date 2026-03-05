

# Plano: Revisão do Fluxo de Criação de Conta + Trial Limitado

## Problemas Identificados

### 1. Trial sem restrições reais
O `signup-saas` cria uma subscription com `plan: "trial"`, mas `getPlanBySlug("trial")` retorna `undefined` — não existe um plano "trial" em `constants/plans.ts`. O sistema faz fallback para 5.000 créditos (igual ao Starter) e sem nenhuma restrição de funcionalidades. O trial deveria ter limites menores que o Starter.

### 2. Google OAuth não provisiona automaticamente em todos os casos
O `AuthContext` tenta provisionar via `signup-saas` quando detecta `provider === "google"` e não tem role. Porém, se o `signup-saas` falhar silenciosamente (ex: race condition), o usuário fica "preso" sem organização. Não há retry nem feedback.

### 3. Sem banner de dias restantes do trial
O sidebar mostra "Trial" mas não mostra quantos dias restam. O usuário não sente urgência para converter.

### 4. Sem welcome/onboarding pós-criação diferenciado para trial
Após criar a conta, o usuário é enviado direto para o onboarding de empresa → plano de vendas. Não há uma tela de boas-vindas explicando o que está incluso no trial e o que está bloqueado.

---

## Solução

### 1. Criar plano Trial em `constants/plans.ts`

Adicionar um `PlanConfig` com id `"trial"` com limites reduzidos:

| Campo | Trial | Starter |
|---|---|---|
| credits | 1000 | 5000 |
| maxUsers | 1 | 2 |
| maxContents | 3 | 8 |
| maxSocialArts | 2 | 4 |
| maxSites | 0 | 1 |
| maxAgents | 1 | 1 |
| maxDispatches | 0 | 0 |
| maxStrategies | 1 | 1 |
| maxTrafficStrategies | 0 | 1 |

Isso faz com que `getPlanBySlug("trial")` funcione corretamente em todo o sistema — limites de quota, alertas de crédito, etc.

### 2. Banner de contagem regressiva do Trial

Criar um componente `TrialCountdownBanner` que aparece no topo do layout cliente quando `subscription.plan === "trial"`. Mostra "Faltam X dias do seu teste grátis" com um botão "Ver planos". Usar cores progressivas (verde → amarelo → vermelho conforme aproxima do fim).

**Arquivo:** `src/components/cliente/TrialCountdownBanner.tsx` (novo)
**Integração:** `src/components/ClienteLayout.tsx` (adicionar antes do conteúdo)

### 3. Tela de Welcome Trial pós-primeiro-login

Criar um modal/tela de boas-vindas que aparece apenas uma vez após o primeiro login do trial, explicando:
- O que está incluso nos 7 dias (CRM, 1 Agente IA, Plano de Vendas, Estratégia Marketing)
- O que está bloqueado (Sites, Tráfego Pago, Disparos)
- CTA para começar pelo Plano de Vendas

Controlado via `localStorage` key `trial_welcome_seen`.

**Arquivo:** `src/components/cliente/TrialWelcomeModal.tsx` (novo)
**Integração:** `src/pages/cliente/ClienteInicio.tsx`

### 4. Hardening do fluxo Google OAuth

No `AuthContext`, após o provisioning via `signup-saas`:
- Fazer um re-fetch do role para confirmar que foi criado
- Se falhar, fazer retry uma vez
- Adicionar log de erro mais descritivo

### 5. Feature Gate para funcionalidades bloqueadas no Trial

Atualizar o `FeatureGateContext` para adicionar gate reason `"trial_limited"` para rotas bloqueadas durante o trial (Sites, Tráfego Pago, Disparos). Atualizar o `FeatureGateOverlay` com mensagem específica incentivando upgrade.

### 6. Sidebar — mostrar dias restantes

No `ClienteSidebar.tsx`, trocar o texto "Trial" por "Trial · Xd" mostrando os dias restantes.

---

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---|---|
| `src/constants/plans.ts` | Adicionar `PlanConfig` do trial com limites reduzidos |
| `src/components/cliente/TrialCountdownBanner.tsx` | **Novo** — banner com countdown de dias |
| `src/components/cliente/TrialWelcomeModal.tsx` | **Novo** — modal de boas-vindas do trial |
| `src/components/ClienteLayout.tsx` | Integrar TrialCountdownBanner |
| `src/pages/cliente/ClienteInicio.tsx` | Integrar TrialWelcomeModal |
| `src/contexts/FeatureGateContext.tsx` | Adicionar gate `trial_limited` para rotas bloqueadas no trial |
| `src/components/FeatureGateOverlay.tsx` | Adicionar config visual para `trial_limited` |
| `src/components/ClienteSidebar.tsx` | Mostrar dias restantes no badge |
| `src/contexts/AuthContext.tsx` | Retry no provisioning Google OAuth + re-fetch role |

