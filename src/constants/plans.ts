export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  credits: number;
  maxUsers: number;
  popular: boolean;
  features: string[];
  maxContentCampaigns: number; // -1 = ilimitado
  maxSocialArts: number; // -1 = ilimitado
  maxSites: number;
  siteTypes: string[]; // "lp" | "3pages" | "5pages" | "8pages"
}

export const PLANS: PlanConfig[] = [
  { id: "starter", name: "Starter", price: 197, credits: 500, maxUsers: 2, popular: false, maxContentCampaigns: 1, maxSocialArts: 8, maxSites: 1, siteTypes: ["lp"], features: ["CRM completo", "500 créditos/mês", "2 usuários", "Suporte por chat"] },
  { id: "growth", name: "Growth", price: 497, credits: 2000, maxUsers: 5, popular: true, maxContentCampaigns: 3, maxSocialArts: 20, maxSites: 2, siteTypes: ["lp", "3pages", "5pages"], features: ["Tudo do Starter", "2.000 créditos/mês", "5 usuários", "Agentes de IA", "Disparos WhatsApp"] },
  { id: "scale", name: "Scale", price: 997, credits: 5000, maxUsers: 15, popular: false, maxContentCampaigns: -1, maxSocialArts: -1, maxSites: 5, siteTypes: ["lp", "3pages", "5pages", "8pages"], features: ["Tudo do Growth", "5.000 créditos/mês", "15 usuários", "API avançada", "Gerente dedicado"] },
];

export function getPlanBySlug(slug: string | undefined | null): PlanConfig | undefined {
  return PLANS.find(p => p.id === slug);
}
