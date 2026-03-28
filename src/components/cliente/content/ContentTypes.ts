export interface VideoContent {
  hook?: string;
  desenvolvimento?: string;
  conclusao?: string;
  texto_tela?: string;
  cta?: string;
}

export interface GeneratedContent {
  titulo: string;
  formato: string;
  objetivo: string;
  legenda?: string;
  hashtags?: string[];
  conteudo_principal?: VideoContent | any;
  cta?: string;
}

export interface ContentBatch {
  date: string;
  items: import("@/hooks/useClienteContentV2").ContentItem[];
}

/** Safely parse conteudo_principal (AI may return Python-like string) */
export function parseConteudoPrincipal(raw: unknown): unknown {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { /* ignore */ }
    try {
      const fixed = raw.replace(/'/g, '"').replace(/None/g, "null").replace(/True/g, "true").replace(/False/g, "false");
      return JSON.parse(fixed);
    } catch { return raw; }
  }
  return raw;
}

export const FORMATOS = [
  { value: "roteiro_reels", label: "Reels / TikTok", icon: "Video" as const },
  { value: "roteiro_youtube", label: "YouTube", icon: "Monitor" as const },
  { value: "roteiro_stories", label: "Stories", icon: "Smartphone" as const },
  { value: "roteiro_longo", label: "Vídeo Longo", icon: "Film" as const },
] as const;

export const OBJETIVOS = [
  { value: "educar", label: "Educar o público" },
  { value: "autoridade", label: "Gerar autoridade" },
  { value: "engajamento", label: "Engajar a audiência" },
  { value: "quebrar_objecoes", label: "Quebrar objeções" },
  { value: "promover", label: "Promover produto/serviço" },
  { value: "leads", label: "Gerar leads" },
] as const;

export const PLATAFORMAS = ["Instagram", "TikTok", "YouTube", "LinkedIn"] as const;

export const DURACOES = [
  { value: "15s", label: "15 segundos", desc: "Reels curto, gancho rápido" },
  { value: "30s", label: "30 segundos", desc: "Reels padrão" },
  { value: "60s", label: "1 minuto", desc: "Conteúdo explicativo" },
  { value: "3min", label: "3 minutos", desc: "YouTube Shorts / mini-aula" },
  { value: "5min+", label: "5+ minutos", desc: "YouTube longo" },
] as const;

export const loadingPhrases = [
  "Analisando sua estratégia...",
  "Construindo hooks de impacto...",
  "Criando roteiros estratégicos...",
  "Estruturando ganchos e CTAs...",
  "Aplicando técnicas de algoritmo...",
  "Finalizando roteiros...",
];
