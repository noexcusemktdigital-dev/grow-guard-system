/* ═══════════════════════════════════════════════════════════════
   Plan Architecture — Unified (Starter / Pro / Enterprise)
   ═══════════════════════════════════════════════════════════════ */

// ── Unified Plan ────────────────────────────────────────────────
export interface UnifiedPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  maxUsers: number;
  maxPipelines: number;
  hasAiAgent: boolean;
  hasWhatsApp: boolean;
  hasDispatches: boolean;
  popular: boolean;
  features: string[];
}

export const UNIFIED_PLANS: UnifiedPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 397,
    credits: 500,
    maxUsers: 10,
    maxPipelines: 3,
    hasAiAgent: false,
    hasWhatsApp: false,
    hasDispatches: false,
    popular: false,
    features: [
      "CRM completo (3 pipelines)",
      "Scripts de vendas",
      "Relatórios comerciais",
      "Marketing completo (conteúdos, artes, sites, tráfego)",
      "Estratégia de marketing IA",
      "500 créditos/mês",
      "Até 10 usuários",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 797,
    credits: 1000,
    maxUsers: 20,
    maxPipelines: 10,
    hasAiAgent: true,
    hasWhatsApp: true,
    hasDispatches: true,
    popular: true,
    features: [
      "Tudo do Starter",
      "Agente de IA",
      "Chat WhatsApp",
      "Disparos em massa",
      "CRM com 10 pipelines",
      "1.000 créditos/mês",
      "Até 20 usuários",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 1497,
    credits: 1500,
    maxUsers: 9999,
    maxPipelines: 9999,
    hasAiAgent: true,
    hasWhatsApp: true,
    hasDispatches: true,
    popular: false,
    features: [
      "Tudo do Pro",
      "Usuários ilimitados",
      "Pipelines ilimitados",
      "1.500 créditos/mês",
      "Gerente dedicado",
      "API avançada",
      "Suporte prioritário",
    ],
  },
];

// ── Trial Plan ──────────────────────────────────────────────────
export interface TrialPlan {
  credits: number;
  maxUsers: number;
  maxPipelines: number;
  durationDays: number;
  hasAiAgent: boolean;
  hasWhatsApp: boolean;
  hasDispatches: boolean;
}

export const TRIAL_PLAN: TrialPlan = {
  credits: 200,
  maxUsers: 2,
  maxPipelines: 3,
  durationDays: 7,
  hasAiAgent: false,
  hasWhatsApp: false,
  hasDispatches: false,
};

// ── Credit Costs ────────────────────────────────────────────────
export const CREDIT_COSTS: Record<string, { cost: number; label: string }> = {
  "generate-site":              { cost: 100, label: "Site" },
  "generate-social-image":      { cost: 25,  label: "Arte social" },
  "generate-content":           { cost: 30,  label: "Conteúdo" },
  "generate-script":            { cost: 20,  label: "Script de vendas" },
  "generate-strategy":          { cost: 50,  label: "Estratégia de marketing" },
  "crm-automation":             { cost: 5,   label: "Automação CRM (por execução)" },
  "ai-agent-reply":             { cost: 2,   label: "Agente IA (por mensagem)" },
  "generate-traffic-strategy":  { cost: 50,  label: "Estratégia de tráfego" },
  "generate-daily-checklist":   { cost: 5,   label: "Checklist diário IA" },
  "generate-prospection":       { cost: 30,  label: "Plano de prospecção" },
  "ai-generate-agent-config":   { cost: 10,  label: "Config. automática agente" },
  "ai-agent-simulate":          { cost: 10,  label: "Simulação agente IA" },
  "generate-social-briefing":   { cost: 0,   label: "Briefing de arte (gratuito)" },
  "generate-video-briefing":    { cost: 0,   label: "Briefing de vídeo (gratuito)" },
  "generate-social-concepts":   { cost: 25,  label: "Conceitos visuais" },
  "generate-social-video":      { cost: 25,  label: "Vídeo social" },
  "agent-followup-cron":        { cost: 2,   label: "Follow-up automático (por msg)" },
};

// ── Credit Packs ────────────────────────────────────────────────
export interface CreditPack {
  id: string;
  credits: number;
  price: number;
  popular: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack-200",  credits: 200,  price: 49,  popular: false },
  { id: "pack-500",  credits: 500,  price: 99,  popular: true },
  { id: "pack-1000", credits: 1000, price: 179, popular: false },
];

// ── Extra User ──────────────────────────────────────────────────
export const EXTRA_USER_PRICE = 29;

// ── Effective Limits Calculator ─────────────────────────────────
export interface EffectiveLimits {
  totalCredits: number;
  maxUsers: number;
  maxPipelines: number;
  hasAiAgent: boolean;
  hasWhatsApp: boolean;
  hasDispatches: boolean;
  /** @deprecated — everything is credit-based now, unlimited generation */
  maxContents: number;
  /** @deprecated */
  maxSocialArts: number;
  maxSites: number;
  /** @deprecated */
  maxLeads: number;
}

export function getEffectiveLimits(
  planId: string | null | undefined,
  isTrial: boolean = false,
): EffectiveLimits {
  if (isTrial) {
    return {
      totalCredits: TRIAL_PLAN.credits,
      maxUsers: TRIAL_PLAN.maxUsers,
      maxPipelines: TRIAL_PLAN.maxPipelines,
      hasAiAgent: TRIAL_PLAN.hasAiAgent,
      hasWhatsApp: TRIAL_PLAN.hasWhatsApp,
      hasDispatches: TRIAL_PLAN.hasDispatches,
      maxContents: 9999,
      maxSocialArts: 9999,
      maxSites: 1,
      maxLeads: 9999,
    };
  }

  const plan = UNIFIED_PLANS.find((p) => p.id === planId);

  const siteLimits: Record<string, number> = {
    starter: 1,
    pro: 3,
    enterprise: 9999,
  };

  return {
    totalCredits: plan?.credits ?? 500,
    maxUsers: plan?.maxUsers ?? 10,
    maxPipelines: plan?.maxPipelines ?? 3,
    hasAiAgent: plan?.hasAiAgent ?? false,
    hasWhatsApp: plan?.hasWhatsApp ?? false,
    hasDispatches: plan?.hasDispatches ?? false,
    maxContents: 9999,
    maxSocialArts: 9999,
    maxSites: siteLimits[planId ?? "starter"] ?? 1,
    maxLeads: 9999,
  };
}

// ── Lookup helper ───────────────────────────────────────────────
export function getUnifiedPlan(id: string | null | undefined): UnifiedPlan | undefined {
  return UNIFIED_PLANS.find((p) => p.id === id);
}

// ── Content distribution helper ─────────────────────────────────
export function recommendContentDistribution(saldo: number): {
  feed: number; carrossel: number; reels: number; story: number;
} {
  if (saldo <= 0) return { feed: 0, carrossel: 0, reels: 0, story: 0 };
  const presets: Record<number, { feed: number; carrossel: number; reels: number; story: number }> = {
    8: { feed: 3, carrossel: 2, reels: 2, story: 1 },
    12: { feed: 4, carrossel: 3, reels: 3, story: 2 },
    20: { feed: 7, carrossel: 5, reels: 5, story: 3 },
  };
  if (presets[saldo]) return presets[saldo];
  const feed = Math.round(saldo * 0.4);
  const carrossel = Math.round(saldo * 0.25);
  const reels = Math.round(saldo * 0.25);
  const story = Math.max(0, saldo - feed - carrossel - reels);
  return { feed, carrossel, reels, story };
}

// ── Legacy backward-compat exports ──────────────────────────────
/** @deprecated — use UNIFIED_PLANS */
export const SALES_PLANS = UNIFIED_PLANS;
/** @deprecated — use UNIFIED_PLANS */
export const MARKETING_PLANS = UNIFIED_PLANS;
/** @deprecated */
export const COMBO_DISCOUNT = 0;
/** @deprecated */
export type ModuleChoice = "comercial" | "marketing" | "combo";
/** @deprecated */
export function getComboPrice(a: number, _b: number): number { return a; }
/** @deprecated */
export function getComboSavings(_a: number, _b: number): number { return 0; }
/** @deprecated */
export function getSalesPlan(id: string | null | undefined) { return getUnifiedPlan(id); }
/** @deprecated */
export function getMarketingPlan(id: string | null | undefined) { return getUnifiedPlan(id); }
