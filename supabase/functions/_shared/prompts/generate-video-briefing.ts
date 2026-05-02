// @ts-nocheck
// Prompts versionados para generate-video-briefing.
// Extrai campos estruturados de briefing de vídeo usando tool-call.

export const PROMPT_VERSION = "1.0.0";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VideoBriefingInput {
  briefing_text?: string;
  content_data?: {
    title?: string;
    body?: string;
    result?: {
      conteudo_principal?: { headline?: string; cta?: string };
      legenda?: string;
    };
  };
  identidade_visual?: {
    palette?: unknown[];
    style?: string;
    tone?: string;
  };
  persona?: unknown;
}

// ── System prompt ─────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are a video creative director for social media. You analyze user briefings and extract structured fields for short-form video production (5-8 seconds). Always respond in Portuguese (Brazil). Think about what makes a compelling short video: clear scene, specific action/movement, punchy message, and defined visual style.`;

// ── User prompt builder ───────────────────────────────────────────────────────

export function buildUserPrompt(data: VideoBriefingInput): string {
  const { briefing_text, content_data, identidade_visual, persona } = data;
  const contextParts: string[] = [];

  if (briefing_text) {
    contextParts.push(`USER BRIEFING: ${briefing_text}`);
  }

  if (content_data) {
    const title = content_data.title || "";
    const body = content_data.body || "";
    const result = content_data.result;
    contextParts.push(`CONTENT DATA:\nTitle: ${title}\nBody: ${body}`);
    if (result) {
      if (result.conteudo_principal?.headline) contextParts.push(`Headline: ${result.conteudo_principal.headline}`);
      if (result.conteudo_principal?.cta) contextParts.push(`CTA: ${result.conteudo_principal.cta}`);
      if (result.legenda) contextParts.push(`Caption: ${result.legenda.slice(0, 300)}`);
    }
  }

  if (identidade_visual) {
    contextParts.push(`BRAND IDENTITY: palette=${JSON.stringify(identidade_visual.palette || [])}, style=${identidade_visual.style || ""}, tone=${identidade_visual.tone || ""}`);
  }

  if (persona) {
    contextParts.push(`PERSONA: ${JSON.stringify(persona)}`);
  }

  return `Analyze this briefing and extract the structured video fields:\n\n${contextParts.join("\n\n")}\n\nExtract: platform, video format, duration, scene description, scene action/movement, video message, visual style, and a suggested CTA.`;
}

// ── Tool definition (passed to AI API) ───────────────────────────────────────

export const EXTRACT_VIDEO_BRIEFING_TOOL = {
  type: "function",
  function: {
    name: "extract_video_briefing",
    description: "Extract structured video production fields from a briefing.",
    parameters: {
      type: "object",
      properties: {
        plataforma: {
          type: "string",
          enum: ["instagram_reels", "tiktok", "youtube_shorts", "instagram_feed", "youtube"],
          description: "Target platform for the video",
        },
        formato_video: {
          type: "string",
          enum: ["9:16", "1:1", "16:9"],
          description: "Video aspect ratio",
        },
        duracao: {
          type: "string",
          enum: ["5s", "8s"],
          description: "Video duration",
        },
        descricao_cena: {
          type: "string",
          description: "Detailed scene description: who, where, environment, lighting. In Portuguese.",
        },
        acao_cena: {
          type: "string",
          description: "What happens in the scene: the specific movement/action. In Portuguese.",
        },
        mensagem_video: {
          type: "string",
          description: "Main text overlay message for the video. In Portuguese.",
        },
        estilo_visual: {
          type: "string",
          enum: ["corporativo_moderno", "premium_minimalista", "publicidade_sofisticada", "social_media", "inspiracional"],
          description: "Visual style of the video",
        },
        suggested_cta: {
          type: "string",
          description: "Suggested call-to-action or final message. In Portuguese.",
        },
      },
      required: ["plataforma", "formato_video", "duracao", "descricao_cena", "acao_cena", "mensagem_video", "estilo_visual"],
      additionalProperties: false,
    },
  },
};
