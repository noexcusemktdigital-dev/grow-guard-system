

# Plano Consolidado: Revisão Completa do Módulo Marketing + Fluxo de Créditos

Este plano unifica os dois planos aprovados anteriormente em uma execução única.

---

## PARTE A — Correções de Créditos, Quotas e Integração

### A1. Corrigir dupla cobrança nos edge functions

Remover `debit_credits` dos edge functions que já cobram na aprovação frontend:
- `generate-strategy/index.ts` — remover debit, manter pré-check de saldo
- `generate-social-image/index.ts` — remover debit, manter pré-check
- `generate-social-video-frames/index.ts` — remover debit, manter pré-check

### A2. Adicionar pré-verificação de saldo

Nos edge functions sem verificação, adicionar check antes de gastar tokens de IA:
- `generate-site/index.ts` — verificar 500 créditos
- `generate-content/index.ts` — verificar 200 × quantidade
- `generate-traffic-strategy/index.ts` — verificar 200 créditos

### A3. Fix bug quota de conteúdos

- `useClienteContentV2.ts`: mudar `plan_slug` para `plan`

### A4. Adicionar quota de postagens

- Criar `usePostQuota` hook em `useClientePosts.ts`
- Enforce em `ClienteRedesSociais.tsx` — avisar quando `remaining <= 0`

### A5. Atualizar CREDIT_COSTS e PlanConfig

Em `src/constants/plans.ts`:
- Adicionar entries: `generate-traffic-strategy` (200), `generate-video-briefing` (0), `generate-social-briefing` (0)
- Adicionar `maxStrategies` e `maxTrafficStrategies` ao `PlanConfig`

---

## PARTE B — Fluxo de Recarga Não-Intrusivo

### B1. Criar `InsufficientCreditsDialog`

Dialog reutilizável com saldo atual, custo da ação, botões "Comprar Créditos" e "Fazer Upgrade". Aparece **apenas** quando aprovação falha por saldo insuficiente.

**Arquivo:** `src/components/cliente/InsufficientCreditsDialog.tsx`

### B2. Padronizar onError nos hooks de aprovação

Detectar `INSUFFICIENT_CREDITS` e retornar flag para abrir o dialog:
- `useClientePosts.ts` (useApprovePost)
- `useMarketingStrategy.ts` (useApproveStrategy)
- `useClienteSitesDB.ts` (useApproveSite)
- `useClienteContentV2.ts` (useApproveContent)
- `useTrafficStrategy.ts` (useApproveTrafficStrategy)

### B3. Integrar dialog nas páginas de aprovação

- `ClienteRedesSociais.tsx`
- `ClienteConteudos.tsx`
- `ClienteSites.tsx`
- `ClientePlanoMarketing.tsx`
- `ClienteTrafegoPago.tsx`

### B4. Remover bloqueios pré-geração

Garantir que nenhum wizard bloqueia o briefing por créditos — bloqueio apenas na aprovação.

---

## Resumo de Arquivos

| Arquivo | Ação |
|---|---|
| `src/constants/plans.ts` | Atualizar CREDIT_COSTS + PlanConfig |
| `src/components/cliente/InsufficientCreditsDialog.tsx` | Criar |
| `src/hooks/useClienteContentV2.ts` | Fix plan_slug → plan + onError |
| `src/hooks/useClientePosts.ts` | usePostQuota + onError |
| `src/hooks/useMarketingStrategy.ts` | onError |
| `src/hooks/useClienteSitesDB.ts` | onError |
| `src/hooks/useTrafficStrategy.ts` | onError |
| `supabase/functions/generate-strategy/index.ts` | Remover debit |
| `supabase/functions/generate-social-image/index.ts` | Remover debit |
| `supabase/functions/generate-social-video-frames/index.ts` | Remover debit |
| `supabase/functions/generate-site/index.ts` | Pré-check saldo |
| `supabase/functions/generate-content/index.ts` | Pré-check saldo |
| `supabase/functions/generate-traffic-strategy/index.ts` | Pré-check saldo |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Quota + dialog |
| `src/pages/cliente/ClienteConteudos.tsx` | Dialog |
| `src/pages/cliente/ClienteSites.tsx` | Dialog |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Dialog |
| `src/pages/cliente/ClienteTrafegoPago.tsx` | Dialog |

