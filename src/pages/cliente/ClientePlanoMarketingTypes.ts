export interface IcpData {
  avatar_emoji?: string;
  nome_persona?: string;
  demografia?: string;
  perfil_profissional?: string;
  descricao?: string;
  comportamento_digital?: string;
  dores?: string[];
  desejos?: string[];
  objecoes?: string[];
  gatilhos_compra?: string[];
  [key: string]: unknown;
}

export interface PropostaValorData {
  headline?: string;
  problema?: string;
  metodo?: string;
  resultado?: string;
  prova?: string;
  [key: string]: unknown;
}

export interface AnaliseConcorrenciaData {
  visao_geral?: string;
  concorrentes?: ConcorrenteRow[];
  posicionamento_recomendado?: string;
  [key: string]: unknown;
}

export interface TomComunicacaoData {
  tom_principal?: string;
  personalidade_marca?: string[];
  voz_exemplo?: string;
  palavras_usar?: string[];
  palavras_evitar?: string[];
  exemplos_posts?: Array<{ tipo?: string; exemplo?: string }>;
  [key: string]: unknown;
}

export interface FunilAquisicao {
  topo?: { estimativa_visitantes?: number };
  meio?: { estimativa_leads?: number };
  fundo?: { estimativa_clientes?: number };
  [key: string]: unknown;
}

export interface EstrategiaAquisicaoData {
  funil?: FunilAquisicao;
  canais_prioritarios?: CanalRow[];
  [key: string]: unknown;
}

export interface EstrategiaConteudoData {
  pilares?: PilarRow[];
  calendario_semanal?: CalendarioRow[];
  ideias_conteudo?: IdeiaRow[];
  [key: string]: unknown;
}

export interface PlanoIndicadores {
  cpc_medio?: string;
  cpl_estimado?: string;
  cac_estimado?: string;
  roi_esperado?: string;
  ltv_estimado?: string;
  [key: string]: unknown;
}

export interface PlanoCrescimentoData {
  projecoes_mensais?: ProjecaoRow[];
  indicadores?: PlanoIndicadores;
  [key: string]: unknown;
}

export interface BenchmarkSetorData {
  setor?: string;
  taxa_conversao_media?: string;
  cpl_medio_setor?: string;
  ticket_medio_setor?: string;
  tendencias?: string[];
  insight_competitivo?: string;
  [key: string]: unknown;
}

export interface DiagnosticoData {
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
  radar_data?: Array<{ eixo: string; score: number; max?: number }>;
  [key: string]: unknown;
}

export interface StrategyResult {
  objetivo_principal?: string;
  canal_prioritario?: string;
  investimento_recomendado?: string;
  potencial_crescimento?: string;
  resumo_executivo?: string;
  diagnostico?: DiagnosticoData;
  diagnostico_gps?: DiagnosticoData & { radar_data?: Array<{ eixo: string; score: number; max?: number }> };
  icp?: IcpData;
  proposta_valor?: PropostaValorData;
  analise_concorrencia?: AnaliseConcorrenciaData;
  tom_comunicacao?: TomComunicacaoData;
  estrategia_aquisicao?: EstrategiaAquisicaoData;
  estrategia_conteudo?: EstrategiaConteudoData;
  plano_crescimento?: PlanoCrescimentoData;
  benchmarks_setor?: BenchmarkSetorData;
  estrutura_recomendada?: EstruturaRow[];
  plano_execucao?: PlanoMesRow[];
  diagnostico_comercial?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface ConcorrenteRow {
  nome: string;
  pontos_fortes?: string | string[];
  pontos_fracos?: string | string[];
  diferencial_vs?: string;
  oportunidade_diferenciacao?: string;
  [key: string]: unknown;
}

export interface CanalRow {
  nome: string;
  peso?: number;
  percentual?: number;
  descricao?: string;
  acoes?: string[];
  acao_principal?: string;
  tipo?: string;
  investimento_sugerido?: string;
  [key: string]: unknown;
}

export interface PilarRow {
  nome: string;
  descricao?: string;
  porcentagem?: number;
  percentual?: number;
  tipo?: string;
  exemplos?: string[];
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
  status?: string;
  prioridade?: string;
  recomendacao?: string;
  [key: string]: unknown;
}

export interface PlanoMesRow {
  titulo: string;
  descricao?: string;
  mes?: number | string;
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
