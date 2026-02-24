export interface NoeService {
  id: string;
  module: string;
  name: string;
  type: "unitario" | "mensal";
  basePrice: number;
  unit: string;
  sortOrder: number;
}

export const NOE_MODULES = [
  "Branding",
  "Social Media",
  "Performance",
  "Web",
  "CRM & Automação",
] as const;

export const NOE_SERVICE_CATALOG: NoeService[] = [
  // Branding
  { id: "b1", module: "Branding", name: "Identidade Visual Completa", type: "unitario", basePrice: 2500, unit: "un", sortOrder: 1 },
  { id: "b2", module: "Branding", name: "Manual de Marca", type: "unitario", basePrice: 1500, unit: "un", sortOrder: 2 },
  { id: "b3", module: "Branding", name: "Papelaria Corporativa", type: "unitario", basePrice: 800, unit: "un", sortOrder: 3 },
  { id: "b4", module: "Branding", name: "Redesign de Logo", type: "unitario", basePrice: 1200, unit: "un", sortOrder: 4 },
  { id: "b5", module: "Branding", name: "Naming", type: "unitario", basePrice: 2000, unit: "un", sortOrder: 5 },
  { id: "b6", module: "Branding", name: "Apresentação Institucional", type: "unitario", basePrice: 1800, unit: "un", sortOrder: 6 },
  { id: "b7", module: "Branding", name: "Fotografia Profissional", type: "unitario", basePrice: 1500, unit: "sessão", sortOrder: 7 },

  // Social Media
  { id: "s1", module: "Social Media", name: "Gestão de Redes (1 rede)", type: "mensal", basePrice: 1200, unit: "mês", sortOrder: 1 },
  { id: "s2", module: "Social Media", name: "Gestão de Redes (2 redes)", type: "mensal", basePrice: 1800, unit: "mês", sortOrder: 2 },
  { id: "s3", module: "Social Media", name: "Gestão de Redes (3+ redes)", type: "mensal", basePrice: 2500, unit: "mês", sortOrder: 3 },
  { id: "s4", module: "Social Media", name: "Criação de Conteúdo (12 posts)", type: "mensal", basePrice: 900, unit: "mês", sortOrder: 4 },
  { id: "s5", module: "Social Media", name: "Criação de Conteúdo (20 posts)", type: "mensal", basePrice: 1400, unit: "mês", sortOrder: 5 },
  { id: "s6", module: "Social Media", name: "Planejamento Editorial", type: "mensal", basePrice: 600, unit: "mês", sortOrder: 6 },
  { id: "s7", module: "Social Media", name: "Produção de Reels/Vídeos (4/mês)", type: "mensal", basePrice: 1600, unit: "mês", sortOrder: 7 },
  { id: "s8", module: "Social Media", name: "Stories Diários", type: "mensal", basePrice: 800, unit: "mês", sortOrder: 8 },

  // Performance
  { id: "p1", module: "Performance", name: "Google Ads - Gestão", type: "mensal", basePrice: 1200, unit: "mês", sortOrder: 1 },
  { id: "p2", module: "Performance", name: "Meta Ads - Gestão", type: "mensal", basePrice: 1200, unit: "mês", sortOrder: 2 },
  { id: "p3", module: "Performance", name: "Google + Meta Ads - Combo", type: "mensal", basePrice: 2000, unit: "mês", sortOrder: 3 },
  { id: "p4", module: "Performance", name: "Remarketing Avançado", type: "mensal", basePrice: 800, unit: "mês", sortOrder: 4 },
  { id: "p5", module: "Performance", name: "SEO On-Page", type: "mensal", basePrice: 1500, unit: "mês", sortOrder: 5 },
  { id: "p6", module: "Performance", name: "SEO Off-Page (Link Building)", type: "mensal", basePrice: 1200, unit: "mês", sortOrder: 6 },
  { id: "p7", module: "Performance", name: "Setup de Campanhas", type: "unitario", basePrice: 1500, unit: "un", sortOrder: 7 },
  { id: "p8", module: "Performance", name: "Auditoria de Mídia Paga", type: "unitario", basePrice: 800, unit: "un", sortOrder: 8 },

  // Web
  { id: "w1", module: "Web", name: "Landing Page", type: "unitario", basePrice: 2000, unit: "un", sortOrder: 1 },
  { id: "w2", module: "Web", name: "Site Institucional (até 5 páginas)", type: "unitario", basePrice: 4500, unit: "un", sortOrder: 2 },
  { id: "w3", module: "Web", name: "Site Institucional (até 10 páginas)", type: "unitario", basePrice: 7000, unit: "un", sortOrder: 3 },
  { id: "w4", module: "Web", name: "E-commerce", type: "unitario", basePrice: 12000, unit: "un", sortOrder: 4 },
  { id: "w5", module: "Web", name: "Blog / Portal de Conteúdo", type: "unitario", basePrice: 3500, unit: "un", sortOrder: 5 },
  { id: "w6", module: "Web", name: "Manutenção de Site", type: "mensal", basePrice: 500, unit: "mês", sortOrder: 6 },
  { id: "w7", module: "Web", name: "Hospedagem Premium", type: "mensal", basePrice: 150, unit: "mês", sortOrder: 7 },

  // CRM & Automação
  { id: "c1", module: "CRM & Automação", name: "Implementação de CRM", type: "unitario", basePrice: 3000, unit: "un", sortOrder: 1 },
  { id: "c2", module: "CRM & Automação", name: "Automação de Vendas", type: "unitario", basePrice: 2500, unit: "un", sortOrder: 2 },
  { id: "c3", module: "CRM & Automação", name: "Chatbot IA (Setup)", type: "unitario", basePrice: 3500, unit: "un", sortOrder: 3 },
  { id: "c4", module: "CRM & Automação", name: "Chatbot IA (Manutenção)", type: "mensal", basePrice: 800, unit: "mês", sortOrder: 4 },
  { id: "c5", module: "CRM & Automação", name: "Automação de Marketing (E-mail)", type: "mensal", basePrice: 900, unit: "mês", sortOrder: 5 },
  { id: "c6", module: "CRM & Automação", name: "Treinamento Comercial", type: "unitario", basePrice: 2000, unit: "sessão", sortOrder: 6 },
  { id: "c7", module: "CRM & Automação", name: "Consultoria Estratégica", type: "unitario", basePrice: 3000, unit: "sessão", sortOrder: 7 },
];

export function getServicesByModule(module: string) {
  return NOE_SERVICE_CATALOG.filter(s => s.module === module).sort((a, b) => a.sortOrder - b.sortOrder);
}
