// @ts-nocheck
// Prompts versionados para generate-social-video-frames.
// Gera prompts de imagem por frame para vídeos curtos de redes sociais.

export const PROMPT_VERSION = "1.0.0";

// ── Constants ─────────────────────────────────────────────────────────────────

export const STYLE_LABELS: Record<string, string> = {
  corporativo_moderno: "clean corporate advertising style with modern aesthetics",
  premium_minimalista: "premium minimalist commercial style with elegant simplicity",
  publicidade_sofisticada: "sophisticated high-end advertisement style",
  social_media: "vibrant social media content style, eye-catching and dynamic",
  inspiracional: "inspirational corporate video style, uplifting and motivational",
};

export const FORMAT_SPECS: Record<string, { label: string; aspect: string; resolution: string }> = {
  story: { label: "vertical", aspect: "9:16", resolution: "1080×1920" },
  feed: { label: "square", aspect: "1:1", resolution: "1080×1080" },
  banner: { label: "landscape", aspect: "16:9", resolution: "1920×1080" },
};

// ── Helper ────────────────────────────────────────────────────────────────────

export function extractEnvironment(scene: string): string {
  if (!scene) return "professional modern environment with clean lighting";
  const envKeywords = [
    "escritório", "office", "apartamento", "apartment", "loja", "store",
    "consultório", "clinic", "sala", "room", "rua", "street", "cidade", "city",
  ];
  const lower = scene.toLowerCase();
  for (const kw of envKeywords) {
    if (lower.includes(kw)) return scene;
  }
  return `${scene}, professional environment with cinematic lighting`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VideoFrameInput {
  video_description?: string;
  identidade_visual?: {
    paleta?: string;
    palette?: string;
    estilo?: string;
    style?: string;
    tom_visual?: string;
    tone?: string;
  };
  num_frames?: number;
  reference_images?: string[];
  video_style?: string;
  formato_video?: string;
  plataforma?: string;
  estilo_visual?: string;
  acao_cena?: string;
  movimento?: string;
  mensagem?: string;
  cta?: string;
  format?: string;
}

export interface FramePromptOptions {
  frameIndex: number;
  totalFrames: number;
  scene: string;
  action: string;
  message: string;
  cta?: string;
  formatSpec: { label: string; aspect: string; resolution: string };
  styleDescription: string;
  brandContext?: string;
  isLast: boolean;
  isFirst: boolean;
}

// ── Frame prompt builder ──────────────────────────────────────────────────────

export function buildFramePrompt(opts: FramePromptOptions): string {
  const { frameIndex, totalFrames, scene, action, message, cta, formatSpec, styleDescription, brandContext, isFirst, isLast } = opts;

  let prompt = `Create a ${isFirst ? "opening" : isLast ? "closing" : "middle"} frame (frame ${frameIndex + 1} of ${totalFrames}) for a short-form ${formatSpec.label} social media video (${formatSpec.aspect}).

Scene: ${scene}

Action: ${action || "subtle movement suggesting the scene described above"}

Environment: ${extractEnvironment(scene)}

Style: ${styleDescription}${brandContext ? `\n\n${brandContext}` : ""}`;

  if (message) {
    prompt += `\n\nText overlay:\n"${message}"`;
  }
  if (cta && isLast) {
    prompt += `\n\nFinal message:\n"${cta}"`;
  }

  prompt += `\n\nCRITICAL RULES:
- ZERO text, letters, numbers, words, logos, or watermarks in the image
- Leave clear space at the bottom 20% for text overlay
- Cinematic quality with professional lighting
- Maintain visual consistency across all frames
- ${isFirst ? "OPENING FRAME: visually striking, attention-grabbing hook" : ""}
- ${isLast ? "CLOSING FRAME: conclusive with strong visual ending" : ""}
- Vary camera angle/zoom subtly between frames for dynamic motion
- Composition optimized for mobile viewing`;

  return prompt;
}

export function buildBrandContext(identidade_visual?: VideoFrameInput["identidade_visual"]): string {
  if (!identidade_visual) return "";
  const iv = identidade_visual;
  return `Brand colors: ${iv.paleta || iv.palette || "professional colors"}. ${iv.estilo || iv.style ? `Style: ${iv.estilo || iv.style}.` : ""} ${iv.tom_visual || iv.tone ? `Tone: ${iv.tom_visual || iv.tone}.` : ""}`;
}

// Convenience wrappers expected by index.ts convention
export const SYSTEM_PROMPT = ""; // no system prompt; frame prompts go directly as user messages
export function buildUserPrompt(data: VideoFrameInput & { frameIndex: number; totalFrames: number }): string {
  const resolvedFormat = data.format || "story";
  const formatSpec = FORMAT_SPECS[resolvedFormat] || FORMAT_SPECS.story;
  const resolvedStyle = data.estilo_visual || data.video_style || "corporativo_moderno";
  const styleDescription = STYLE_LABELS[resolvedStyle] || STYLE_LABELS.corporativo_moderno;
  const action = data.acao_cena || data.movimento || "";
  const scene = data.video_description || "";
  const message = data.mensagem || "";
  const brandContext = buildBrandContext(data.identidade_visual);
  const { frameIndex, totalFrames } = data;
  const isFirst = frameIndex === 0;
  const isLast = frameIndex === totalFrames - 1;

  return buildFramePrompt({
    frameIndex,
    totalFrames,
    scene,
    action,
    message,
    cta: data.cta,
    formatSpec,
    styleDescription,
    brandContext,
    isFirst,
    isLast,
  });
}
