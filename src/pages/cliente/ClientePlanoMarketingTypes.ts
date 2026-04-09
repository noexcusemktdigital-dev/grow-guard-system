// @ts-nocheck
export interface StrategyResult {
  objetivo_principal?: string;
  canal_prioritario?: string;
  investimento_recomendado?: string;
  potencial_crescimento?: string;
  resumo_executivo?: string;
  diagnostico?: {
    score_geral?: number;
    analise?: string;
    pontos_fortes?: string[];
    oportunidades?: string[];
    riscos?: string[];
    radar?: {
      autoridade?: number;
      aquisicao?: number;
      conversao?: number;
      retencao?: number;
      conteudo?: number;
      branding?: number;
    };
  };
  cliente_ideal?: Record<string, unknown>;
  analise_competitiva?: Record<string, unknown>;
  tom_comunicacao?: Record<string, unknown>;
  estrategia_aquisicao?: Record<string, unknown>;
  estrategia_conteudo?: Record<string, unknown>;
  projecoes?: Record<string, unknown>;
  execucao?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ConcorrenteRow {
  nome: string;
  pontos_fortes?: string[];
  pontos_fracos?: string[];
  diferencial_vs?: string;
  [key: string]: unknown;
}

export interface CanalRow {
  nome: string;
  peso?: number;
  descricao?: string;
  acoes?: string[];
  investimento_sugerido?: string;
  [key: string]: unknown;
}

export interface PilarRow {
  nome: string;
  descricao?: string;
  porcentagem?: number;
  formatos?: string[];
  [key: string]: unknown;
}

export interface CalendarioRow {
  dia: string;
  pilar: string;
  formato: string;
  horario?: string;
  [key: string]: unknown;
}

export interface IdeiaRow {
  titulo: string;
  pilar?: string;
  formato?: string;
  descricao?: string;
  [key: string]: unknown;
}

export interface ProjecaoRow {
  mes: string;
  receita?: number;
  leads?: number;
  investimento?: number;
  [key: string]: unknown;
}

export interface EstruturaRow {
  titulo: string;
  descricao?: string;
  responsavel?: string;
  [key: string]: unknown;
}

export interface PlanoMesRow {
  titulo: string;
  descricao?: string;
  passos?: PassoRow[];
  [key: string]: unknown;
}

export interface PassoRow {
  titulo: string;
  descricao?: string;
  ferramenta?: string;
  [key: string]: unknown;
}

export interface HistoryStrategy {
  id: string;
  created_at: string;
  score_percentage: number;
  nivel: string;
  status: string;
  strategy_result: StrategyResult | null;
  answers: Record<string, unknown>;
  [key: string]: unknown;
}

export const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 160 60% 45%))", "hsl(var(--chart-3, 30 80% 55%))", "hsl(var(--chart-4, 280 65% 60%))", "hsl(var(--chart-5, 340 75% 55%))"];

export const TOOL_ROUTES: Record<string, { label: string; path: string; icon: string }> = {
  conteudos: { label: "Conteudos", path: "/cliente/conteudos", icon: "FileText" },
  postagens: { label: "Postagens", path: "/cliente/postagem", icon: "Palette" },
  sites: { label: "Sites", path: "/cliente/sites", icon: "Monitor" },
  trafego: { label: "Trafego Pago", path: "/cliente/trafego-pago", icon: "Zap" },
  crm: { label: "CRM", path: "/cliente/crm", icon: "Users" },
  scripts: { label: "Scripts", path: "/cliente/scripts", icon: "PenTool" },
  manual: { label: "Manual", path: "#", icon: "CheckSquare" },
};
