export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  credits: number;
  maxUsers: number;
  popular: boolean;
  features: string[];
  maxContents: number; // -1 = ilimitado
  maxSocialArts: number; // -1 = ilimitado
  maxSites: number;
  siteTypes: string[]; // "lp" | "3pages" | "5pages" | "8pages"
}

export const PLANS: PlanConfig[] = [
  { id: "starter", name: "Starter", price: 197, credits: 500, maxUsers: 2, popular: false, maxContents: 8, maxSocialArts: 4, maxSites: 1, siteTypes: ["lp"], features: ["CRM completo", "500 créditos/mês", "2 usuários", "8 conteúdos/mês", "4 artes sociais/mês", "Suporte por chat"] },
  { id: "growth", name: "Growth", price: 497, credits: 2000, maxUsers: 5, popular: true, maxContents: 12, maxSocialArts: 8, maxSites: 2, siteTypes: ["lp", "3pages", "5pages"], features: ["Tudo do Starter", "2.000 créditos/mês", "5 usuários", "12 conteúdos/mês", "8 artes sociais/mês", "Agentes de IA", "Disparos WhatsApp"] },
  { id: "scale", name: "Scale", price: 997, credits: 5000, maxUsers: 15, popular: false, maxContents: 20, maxSocialArts: 12, maxSites: 5, siteTypes: ["lp", "3pages", "5pages", "8pages"], features: ["Tudo do Growth", "5.000 créditos/mês", "15 usuários", "20 conteúdos/mês", "12 artes sociais/mês", "API avançada", "Gerente dedicado"] },
];

export function getPlanBySlug(slug: string | undefined | null): PlanConfig | undefined {
  return PLANS.find(p => p.id === slug);
}

/** Distribui saldo de conteúdos proporcionalmente entre formatos */
export function recommendContentDistribution(saldo: number): { feed: number; carrossel: number; reels: number; story: number } {
  if (saldo <= 0) return { feed: 0, carrossel: 0, reels: 0, story: 0 };
  // Predefined distributions for common values
  const presets: Record<number, { feed: number; carrossel: number; reels: number; story: number }> = {
    8: { feed: 3, carrossel: 2, reels: 2, story: 1 },
    12: { feed: 4, carrossel: 3, reels: 3, story: 2 },
    20: { feed: 7, carrossel: 5, reels: 5, story: 3 },
  };
  if (presets[saldo]) return presets[saldo];
  // Proportional: 40% Feed, 25% Carrossel, 25% Reels, 10% Story
  const feed = Math.round(saldo * 0.4);
  const carrossel = Math.round(saldo * 0.25);
  const reels = Math.round(saldo * 0.25);
  const story = Math.max(0, saldo - feed - carrossel - reels);
  return { feed, carrossel, reels, story };
}
