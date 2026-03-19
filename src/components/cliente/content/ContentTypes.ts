export interface CarrosselSlide {
  titulo?: string;
  texto?: string;
  content?: string;
}

export interface PostContent {
  headline?: string;
  texto?: string;
  dica_pratica?: string;
  dado_autoridade?: string;
  cta?: string;
}

export interface VideoContent {
  hook?: string;
  desenvolvimento?: string;
  conclusao?: string;
  texto_tela?: string;
  cta?: string;
}

export interface StoryFrame {
  texto?: string;
  content?: string;
  acao?: string;
}

export interface ArtigoContent {
  titulo?: string;
  introducao?: string;
  secoes?: { subtitulo: string; texto: string }[];
  conclusao?: string;
}

export interface GeneratedContent {
  titulo: string;
  formato: string;
  objetivo: string;
  legenda?: string;
  hashtags?: string[];
  conteudo_principal?: CarrosselSlide[] | PostContent | VideoContent | StoryFrame[] | ArtigoContent | string;
  cta?: string;
}

export interface ContentBatch {
  date: string;
  items: import("@/hooks/useClienteContentV2").ContentItem[];
}

/** Safely parse conteudo_principal (AI may return Python-like string) */
export function parseConteudoPrincipal(raw: any): any {
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
  { value: "carrossel", label: "Carrossel", icon: "Layers" as const },
  { value: "post_unico", label: "Post Único", icon: "AlignLeft" as const },
  { value: "roteiro_video", label: "Roteiro de Vídeo", icon: "Video" as const },
  { value: "story", label: "Story", icon: "Image" as const },
  { value: "artigo", label: "Artigo", icon: "BookOpen" as const },
  { value: "post_educativo", label: "Post Educativo", icon: "Lightbulb" as const },
  { value: "post_autoridade", label: "Post Autoridade", icon: "Target" as const },
] as const;

export const OBJETIVOS = [
  { value: "educar", label: "Educar o público" },
  { value: "autoridade", label: "Gerar autoridade" },
  { value: "engajamento", label: "Engajar a audiência" },
  { value: "quebrar_objecoes", label: "Quebrar objeções" },
  { value: "promover", label: "Promover produto/serviço" },
  { value: "leads", label: "Gerar leads" },
] as const;

export const PLATAFORMAS = ["Instagram", "LinkedIn", "TikTok", "YouTube", "Blog"] as const;

export const loadingPhrases = [
  "Analisando sua estratégia...",
  "Distribuindo formatos no funil...",
  "Criando conteúdos estratégicos...",
  "Gerando headlines criativas...",
  "Estruturando legendas completas...",
  "Finalizando lote de conteúdos...",
];
