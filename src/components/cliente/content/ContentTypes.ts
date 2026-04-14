// @ts-nocheck
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

/**
 * Converts a Python-style dict/list string into valid JSON.
 * Uses a state-machine to handle internal apostrophes within values.
 */
function pythonToJson(src: string): string {
  let s = src.trim();
  s = s.replace(/\bNone\b/g, "null").replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false");

  const out: string[] = [];
  let inString = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    if (inString) {
      if (c === "'") {
        // Check if this quote ends the string:
        // Look ahead (skip whitespace) for structural chars: , ] } :
        const rest = s.slice(i + 1).trimStart();
        const next = rest[0] || "";
        if ([",", "]", "}", ":"].includes(next) || rest.length === 0) {
          out.push('"');
          inString = false;
          continue;
        }
        // Internal apostrophe — keep as-is
        out.push("'");
        continue;
      }
      if (c === '"') {
        out.push('\\"');
        continue;
      }
      out.push(c);
    } else {
      if (c === "'") {
        out.push('"');
        inString = true;
      } else {
        out.push(c);
      }
    }
  }

  return out.join("");
}

export function parseConteudoPrincipal(raw: unknown): unknown {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch {}
    try { return JSON.parse(pythonToJson(raw)); } catch {}
    // Last resort: brute-force
    try {
      const fixed = raw.replace(/'/g, '"').replace(/\bNone\b/g, "null").replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false");
      return JSON.parse(fixed);
    } catch { return raw; }
  }
  return raw;
}

export const FORMATOS = [
  { value: "roteiro_reels", label: "Reels / TikTok", icon: "Video" as const, desc: "15s a 60s · Alto alcance" },
  { value: "roteiro_stories", label: "Stories", icon: "Smartphone" as const, desc: "Sequência de frames · Engajamento" },
  { value: "roteiro_youtube", label: "YouTube", icon: "Monitor" as const, desc: "3min+ · Autoridade" },
  { value: "roteiro_longo", label: "Vídeo Longo", icon: "Film" as const, desc: "5min+ · Educação profunda" },
] as const;

export const OBJETIVOS = [
  { value: "educar", label: "🎓 Educar", desc: "Ensine algo valioso para seu público" },
  { value: "autoridade", label: "🏆 Autoridade", desc: "Mostre que você é referência no assunto" },
  { value: "engajamento", label: "💬 Engajamento", desc: "Gere comentários, salvamentos e compartilhamentos" },
  { value: "quebrar_objecoes", label: "🚧 Quebrar Objeções", desc: "Responda as dúvidas que impedem a compra" },
  { value: "promover", label: "📢 Promover", desc: "Divulgue seu produto ou serviço" },
  { value: "leads", label: "🎯 Gerar Leads", desc: "Converta visualizações em contatos" },
] as const;

export const PLATAFORMAS = ["Instagram", "TikTok", "YouTube", "LinkedIn"] as const;

export const DURACOES = [
  { value: "15s", label: "15s", desc: "Reels curtíssimo" },
  { value: "30s", label: "30s", desc: "Reels padrão" },
  { value: "60s", label: "60s", desc: "Explicativo" },
  { value: "3min", label: "3min", desc: "Mini-aula" },
  { value: "5min+", label: "5min+", desc: "YouTube longo" },
] as const;

export const loadingPhrases = [
  "Analisando seu GPS do Negócio...",
  "Identificando dores do seu cliente ideal...",
  "Construindo hooks de impacto...",
  "Aplicando seu tom de comunicação...",
  "Estruturando ganchos e CTAs...",
  "Finalizando roteiros personalizados...",
];

// Gera sugestões de temas baseadas nos dados do GPS
export function buildGpsSuggestions(strategy: any): Array<{ tema: string; objetivo: string; why: string; emoji: string }> {
  if (!strategy) return [];

  const suggestions: Array<{ tema: string; objetivo: string; why: string; emoji: string }> = [];

  const dores = strategy.dores || [];
  const objecoes = strategy.objecoes || [];
  const pilares = strategy.pilares || [];
  const ideiasConteudo = strategy.ideiasConteudo || [];
  const dorPrincipal = strategy.salesPlanDorPrincipal || "";
  const segmento = strategy.salesPlanSegmento || "";
  const diferenciais = strategy.salesPlanDiferenciais || "";

  // Sugestão 1: baseada na dor principal do cliente (do GPS)
  if (dorPrincipal && dorPrincipal.length > 5) {
    suggestions.push({
      tema: `Como resolver: ${dorPrincipal.slice(0, 60)}`,
      objetivo: "educar",
      why: "Baseado na maior dor do seu cliente identificada no GPS",
      emoji: "🎯",
    });
  }

  // Sugestão 2: baseada nas objeções de compra
  if (objecoes.length > 0) {
    const obj = typeof objecoes[0] === "string" ? objecoes[0] : objecoes[0]?.descricao || "";
    if (obj) {
      suggestions.push({
        tema: `"${obj.slice(0, 50)}" — Respondendo de vez`,
        objetivo: "quebrar_objecoes",
        why: "Sua principal objeção de venda — quebre antes de perder o lead",
        emoji: "🚧",
      });
    }
  }

  // Sugestão 3: baseada nos diferenciais
  if (diferenciais && diferenciais.length > 5) {
    suggestions.push({
      tema: `Por que escolher ${segmento ? `um ${segmento}` : "nós"}: ${diferenciais.slice(0, 50)}`,
      objetivo: "autoridade",
      why: "Seu diferencial competitivo — mostre o que te torna único",
      emoji: "🏆",
    });
  }

  // Sugestão 4: ideia de conteúdo do GPS
  if (ideiasConteudo.length > 0) {
    const ideia = typeof ideiasConteudo[0] === "string" ? ideiasConteudo[0] : ideiasConteudo[0]?.titulo || "";
    if (ideia) {
      suggestions.push({
        tema: ideia.slice(0, 70),
        objetivo: "engajamento",
        why: "Ideia gerada pelo seu GPS com base no seu público",
        emoji: "💡",
      });
    }
  }

  // Sugestão 5: pilares de conteúdo
  if (pilares.length > 0) {
    const pilar = typeof pilares[0] === "string" ? pilares[0] : pilares[0]?.nome || pilares[0]?.titulo || "";
    if (pilar) {
      suggestions.push({
        tema: pilar.slice(0, 70),
        objetivo: "leads",
        why: "Pilar de conteúdo prioritário da sua estratégia",
        emoji: "📌",
      });
    }
  }

  return suggestions.slice(0, 4);
}
