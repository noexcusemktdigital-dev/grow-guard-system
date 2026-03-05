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
  /** @deprecated use basePrice or comboPrice */
  price: number;
}

export const PLANS: PlanConfig[] = [
  {
    id: "trial",
    name: "Trial",
    basePrice: 0,
    comboPrice: 0,
    price: 0,
    credits: 1000,
    maxUsers: 1,
    popular: false,
    maxContents: 3,
    maxSocialArts: 2,
    maxSites: 0,
    siteTypes: [],
    maxAgents: 1,
    maxDispatches: 0,
    maxDispatchRecipients: 0,
    maxStrategies: 1,
    maxTrafficStrategies: 0,
    features: [
      "CRM completo",
      "1.000 créditos",
      "1 usuário",
      "1 Agente de IA",
      "3 conteúdos",
      "2 artes sociais",
      "7 dias grátis",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    basePrice: 197,
    comboPrice: 297,
    price: 197,
    credits: 5000,
    maxUsers: 2,
    popular: false,
    maxContents: 8,
    maxSocialArts: 4,
    maxSites: 1,
    siteTypes: ["lp"],
    maxAgents: 1,
    maxDispatches: 0,
    maxDispatchRecipients: 0,
    maxStrategies: 1,
    maxTrafficStrategies: 1,
    features: [
      "CRM completo",
      "5.000 créditos/mês",
      "2 usuários inclusos",
      "1 Agente de IA",
      "1 Site / Landing Page",
      "8 conteúdos/mês",
      "4 artes sociais/mês",
      "Suporte por chat",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    basePrice: 497,
    comboPrice: 697,
    price: 497,
    credits: 20000,
    maxUsers: 5,
    popular: true,
    maxContents: 12,
    maxSocialArts: 8,
    maxSites: 2,
    siteTypes: ["lp", "3pages", "5pages"],
    maxAgents: 2,
    maxDispatches: 1,
    maxDispatchRecipients: 500,
    maxStrategies: 2,
    maxTrafficStrategies: 2,
    features: [
      "Tudo do Starter",
      "20.000 créditos/mês",
      "5 usuários inclusos",
      "2 Agentes de IA",
      "2 Sites",
      "12 conteúdos/mês",
      "8 artes sociais/mês",
      "1 Disparo WhatsApp (até 500 números)",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    basePrice: 997,
    comboPrice: 1397,
    price: 997,
    credits: 50000,
    maxUsers: 15,
    popular: false,
    maxContents: 20,
    maxSocialArts: 12,
    maxSites: 3,
    siteTypes: ["lp", "3pages", "5pages", "8pages"],
    maxAgents: 4,
    maxDispatches: 3,
    maxDispatchRecipients: 2000,
    maxStrategies: 999,
    maxTrafficStrategies: 4,
    features: [
      "Tudo do Growth",
      "50.000 créditos/mês",
      "15 usuários inclusos",
      "4 Agentes de IA",
      "3 Sites",
      "20 conteúdos/mês",
      "12 artes sociais/mês",
      "3 Disparos WhatsApp (até 2.000 números)",
      "API avançada",
      "Gerente dedicado",
    ],
  },
];

export type ModuleChoice = "comercial" | "marketing" | "combo";

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

export const EXTRA_USER_PRICE = 29; // R$/mês por usuário adicional

/** Custo em créditos por ação de IA */
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

export function getPlanBySlug(slug: string | undefined | null): PlanConfig | undefined {
  return PLANS.find((p) => p.id === slug);
}

export function getPlanPrice(plan: PlanConfig, modules: ModuleChoice): number {
  return modules === "combo" ? plan.comboPrice : plan.basePrice;
}

/** Distribui saldo de conteúdos proporcionalmente entre formatos */
export function recommendContentDistribution(saldo: number): {
  feed: number;
  carrossel: number;
  reels: number;
  story: number;
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
