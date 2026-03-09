/* ═══════════════════════════════════════════════════════════════
   Plan Architecture — Modular (Vendas + Marketing + Combo)
   ═══════════════════════════════════════════════════════════════ */

// ── Sales Module (7 tools) ──────────────────────────────────────
export interface SalesModulePlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  maxUsers: number;
  maxAgents: number;
  maxDispatches: number;
  maxDispatchRecipients: number;
  maxStrategies: number;
  maxLeads: number;
  popular: boolean;
  features: string[];
}

export const SALES_PLANS: SalesModulePlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 197,
    credits: 3000,
    maxUsers: 2,
    maxAgents: 1,
    maxDispatches: 0,
    maxDispatchRecipients: 0,
    maxStrategies: 1,
    maxLeads: 500,
    popular: false,
    features: [
      "CRM completo",
      "Chat WhatsApp",
      "1 Agente de IA",
      "Scripts de vendas",
      "3.000 créditos/mês",
      "2 usuários inclusos",
      "Suporte por chat",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 497,
    credits: 15000,
    maxUsers: 5,
    maxAgents: 2,
    maxDispatches: 1,
    maxDispatchRecipients: 500,
    maxStrategies: 2,
    maxLeads: 5000,
    popular: true,
    features: [
      "Tudo do Starter",
      "15.000 créditos/mês",
      "5 usuários inclusos",
      "2 Agentes de IA",
      "1 Disparo WhatsApp (500 dest.)",
      "Plano de vendas avançado",
      "Relatórios comerciais",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 997,
    credits: 40000,
    maxUsers: 15,
    maxAgents: 4,
    maxDispatches: 3,
    maxDispatchRecipients: 2000,
    maxStrategies: 999,
    maxLeads: 50000,
    popular: false,
    features: [
      "Tudo do Professional",
      "40.000 créditos/mês",
      "15 usuários inclusos",
      "4 Agentes de IA",
      "3 Disparos WhatsApp (2.000 dest.)",
      "API avançada",
      "Gerente dedicado",
    ],
  },
];

// ── Marketing Module (5 tools) ──────────────────────────────────
export interface MarketingModulePlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  maxContents: number;
  maxSocialArts: number;
  maxSites: number;
  siteTypes: string[];
  maxTrafficStrategies: number;
  popular: boolean;
  features: string[];
}

export const MARKETING_PLANS: MarketingModulePlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 147,
    credits: 2000,
    maxContents: 8,
    maxSocialArts: 4,
    maxSites: 1,
    siteTypes: ["lp"],
    maxTrafficStrategies: 1,
    popular: false,
    features: [
      "Estratégia de marketing IA",
      "8 conteúdos/mês",
      "4 artes sociais/mês",
      "1 Landing Page",
      "1 estratégia de tráfego",
      "2.000 créditos/mês",
      "Suporte por chat",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 397,
    credits: 10000,
    maxContents: 12,
    maxSocialArts: 8,
    maxSites: 2,
    siteTypes: ["lp", "3pages", "5pages"],
    maxTrafficStrategies: 2,
    popular: true,
    features: [
      "Tudo do Starter",
      "10.000 créditos/mês",
      "12 conteúdos/mês",
      "8 artes sociais/mês",
      "2 Sites",
      "2 estratégias de tráfego",
      "Calendário editorial",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 797,
    credits: 30000,
    maxContents: 20,
    maxSocialArts: 12,
    maxSites: 3,
    siteTypes: ["lp", "3pages", "5pages", "8pages"],
    maxTrafficStrategies: 4,
    popular: false,
    features: [
      "Tudo do Professional",
      "30.000 créditos/mês",
      "20 conteúdos/mês",
      "12 artes sociais/mês",
      "3 Sites",
      "4 estratégias de tráfego",
      "Gerente dedicado",
    ],
  },
];

// ── Trial Plan ──────────────────────────────────────────────────
export interface TrialPlan {
  credits: number;
  maxUsers: number;
  maxAgents: number;
  maxContents: number;
  maxSocialArts: number;
  maxSites: number;
  maxDispatches: number;
  maxStrategies: number;
  maxTrafficStrategies: number;
  maxLeads: number;
}

export const TRIAL_PLAN: TrialPlan = {
  credits: 1000,
  maxUsers: 1,
  maxAgents: 1,
  maxContents: 3,
  maxSocialArts: 2,
  maxSites: 0,
  maxDispatches: 0,
  maxStrategies: 1,
  maxTrafficStrategies: 0,
  maxLeads: 50,
};

// ── Combo Logic ─────────────────────────────────────────────────
export const COMBO_DISCOUNT = 0.15; // 15%
export const EXTRA_USER_PRICE = 29; // R$/mês

export function getComboPrice(salesPrice: number, marketingPrice: number): number {
  const sum = salesPrice + marketingPrice;
  return Math.round(sum * (1 - COMBO_DISCOUNT));
}

export function getComboSavings(salesPrice: number, marketingPrice: number): number {
  return (salesPrice + marketingPrice) - getComboPrice(salesPrice, marketingPrice);
}

// ── Effective Limits Calculator ─────────────────────────────────
export interface EffectiveLimits {
  totalCredits: number;
  maxUsers: number;
  maxAgents: number;
  maxDispatches: number;
  maxDispatchRecipients: number;
  maxStrategies: number;
  maxContents: number;
  maxSocialArts: number;
  maxSites: number;
  siteTypes: string[];
  maxTrafficStrategies: number;
  maxLeads: number;
  hasSalesModule: boolean;
  hasMarketingModule: boolean;
}

export function getEffectiveLimits(
  salesPlanId: string | null | undefined,
  marketingPlanId: string | null | undefined,
  isTrial: boolean = false,
): EffectiveLimits {
  if (isTrial) {
    return {
      totalCredits: TRIAL_PLAN.credits,
      maxUsers: TRIAL_PLAN.maxUsers,
      maxAgents: TRIAL_PLAN.maxAgents,
      maxDispatches: TRIAL_PLAN.maxDispatches,
      maxStrategies: TRIAL_PLAN.maxStrategies,
      maxContents: TRIAL_PLAN.maxContents,
      maxSocialArts: TRIAL_PLAN.maxSocialArts,
      maxSites: TRIAL_PLAN.maxSites,
      siteTypes: [],
      maxTrafficStrategies: TRIAL_PLAN.maxTrafficStrategies,
      maxDispatchRecipients: 0,
      hasSalesModule: true,
      hasMarketingModule: true,
    };
  }

  const sales = SALES_PLANS.find((p) => p.id === salesPlanId);
  const marketing = MARKETING_PLANS.find((p) => p.id === marketingPlanId);

  return {
    totalCredits: (sales?.credits ?? 0) + (marketing?.credits ?? 0),
    maxUsers: Math.max(sales?.maxUsers ?? 0, marketing ? 1 : 0),
    maxAgents: sales?.maxAgents ?? 0,
    maxDispatches: sales?.maxDispatches ?? 0,
    maxDispatchRecipients: sales?.maxDispatchRecipients ?? 0,
    maxStrategies: sales?.maxStrategies ?? 0,
    maxContents: marketing?.maxContents ?? 0,
    maxSocialArts: marketing?.maxSocialArts ?? 0,
    maxSites: marketing?.maxSites ?? 0,
    siteTypes: marketing?.siteTypes ?? [],
    maxTrafficStrategies: marketing?.maxTrafficStrategies ?? 0,
    hasSalesModule: !!sales,
    hasMarketingModule: !!marketing,
  };
}

// ── Credit Packs ────────────────────────────────────────────────
export interface CreditPack {
  id: string;
  credits: number;
  price: number;
  popular: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack-5000", credits: 5000, price: 49, popular: false },
  { id: "pack-20000", credits: 20000, price: 149, popular: true },
  { id: "pack-50000", credits: 50000, price: 299, popular: false },
];

// ── Credit Costs ────────────────────────────────────────────────
export const CREDIT_COSTS: Record<string, { cost: number; label: string }> = {
  "generate-content":           { cost: 200,  label: "Conteúdo aprovado (por peça)" },
  "generate-site":              { cost: 500,  label: "Site aprovado" },
  "generate-script":            { cost: 150,  label: "Script de vendas" },
  "generate-strategy":          { cost: 300,  label: "Estratégia de marketing aprovada" },
  "generate-prospection":       { cost: 250,  label: "Plano de prospecção" },
  "generate-social-concepts":   { cost: 200,  label: "Conceitos visuais aprovados" },
  "generate-social-image":      { cost: 100,  label: "Arte social aprovada" },
  "generate-social-video":      { cost: 200,  label: "Vídeo social aprovado" },
  "generate-traffic-strategy":  { cost: 200,  label: "Estratégia de tráfego aprovada" },
  "ai-agent-simulate":          { cost: 100,  label: "Simular agente IA" },
  "ai-generate-agent-config":   { cost: 100,  label: "Config. automática agente" },
  "generate-daily-checklist":   { cost: 50,   label: "Checklist diário IA" },
  "generate-social-briefing":   { cost: 0,    label: "Briefing de arte (gratuito)" },
  "generate-video-briefing":    { cost: 0,    label: "Briefing de vídeo (gratuito)" },
  "ai-agent-reply":             { cost: 0,    label: "Resposta agente (variável)" },
  "agent-followup-cron":        { cost: 0,    label: "Follow-up automático (variável)" },
};

// ── Legacy helpers (backward compat) ────────────────────────────
export type ModuleChoice = "comercial" | "marketing" | "combo";

/** @deprecated — use SALES_PLANS / MARKETING_PLANS + getEffectiveLimits instead */
export interface PlanConfig {
  id: string;
  name: string;
  basePrice: number;
  comboPrice: number;
  credits: number;
  maxUsers: number;
  popular: boolean;
  features: string[];
  maxContents: number;
  maxSocialArts: number;
  maxSites: number;
  siteTypes: string[];
  maxAgents: number;
  maxDispatches: number;
  maxDispatchRecipients: number;
  maxStrategies: number;
  maxTrafficStrategies: number;
  price: number;
}

/** @deprecated — use SALES_PLANS / MARKETING_PLANS */
export const PLANS: PlanConfig[] = [
  {
    id: "trial", name: "Trial", basePrice: 0, comboPrice: 0, price: 0,
    credits: 1000, maxUsers: 1, popular: false,
    maxContents: 3, maxSocialArts: 2, maxSites: 0, siteTypes: [],
    maxAgents: 1, maxDispatches: 0, maxDispatchRecipients: 0,
    maxStrategies: 1, maxTrafficStrategies: 0,
    features: ["CRM completo", "1.000 créditos", "1 usuário", "7 dias grátis"],
  },
];

/** @deprecated */
export function getPlanBySlug(slug: string | undefined | null): PlanConfig | undefined {
  return PLANS.find((p) => p.id === slug);
}

/** @deprecated */
export function getPlanPrice(plan: PlanConfig, modules: ModuleChoice): number {
  return modules === "combo" ? plan.comboPrice : plan.basePrice;
}

/** Distribui saldo de conteúdos proporcionalmente entre formatos */
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

// ── Lookup helpers ──────────────────────────────────────────────
export function getSalesPlan(id: string | null | undefined): SalesModulePlan | undefined {
  return SALES_PLANS.find((p) => p.id === id);
}

export function getMarketingPlan(id: string | null | undefined): MarketingModulePlan | undefined {
  return MARKETING_PLANS.find((p) => p.id === id);
}
