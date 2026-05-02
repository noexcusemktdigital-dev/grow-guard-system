// Prompts para geração de layout de template de arte para redes sociais.
// Extraído de supabase/functions/generate-template-layout/index.ts em 2026-05-02.

export const PROMPT_VERSION = '1.0.0';

export type CanvasFormat = 'feed' | 'story';

/**
 * Retorna o system prompt com as dimensões do canvas já interpoladas.
 * format: 'feed' = 1080x1080, 'story' = 1080x1920.
 */
export function buildSystemPrompt(format: CanvasFormat = 'feed'): string {
  const w = 1080;
  const h = format === 'feed' ? 1080 : 1920;

  return `You are an elite graphic designer who creates social media template layouts as JSON.

You must return a valid TemplateConfig JSON object that specifies exact positions and styles for all visual elements.

CANVAS SIZE: ${w}x${h}px

AVAILABLE ELEMENT TYPES:
1. TextElement: { type: "text", content, x, y, width, fontSize, fontFamily, fontWeight ("normal"|"bold"|"black"), color, align ("left"|"center"|"right"), letterSpacing?, lineHeight?, textTransform? ("uppercase"|"none"), shadow?: { blur, color, offsetX, offsetY } }
2. ShapeElement: { type: "shape", shape ("rect"|"circle"|"line"|"diagonal-stripe"|"frame"), x, y, width, height, color, opacity, rotation?, borderRadius?, borderWidth?, borderColor? }
3. ImageElement: { type: "image", src, x, y, width, height, opacity?, borderRadius? }

AVAILABLE FONTS: Montserrat, Poppins, Playfair Display, Space Grotesk, Inter, Bebas Neue, Oswald, Raleway

DESIGN RULES:
- Create a visually striking, professional layout
- Use proper typographic hierarchy (title: 48-80px, subtitle: 20-36px, CTA: 16-24px)
- Apply brand colors strategically
- Include geometric shapes for visual interest (stripes, frames, rectangles, circles)
- Ensure sufficient contrast between text and background
- Leave appropriate white space
- Position elements following rule of thirds
- CTA buttons should have a shape element behind them as background

STYLE GUIDELINES BY ESTILO:
- minimalista: Lots of white space, thin frames, subtle colors, serif fonts, max 3-4 elements
- bold: Diagonal stripes, large uppercase text, high contrast, Montserrat/Bebas Neue, strong color blocks
- corporativo: Clean grid, navy/charcoal colors, Inter font, structured layout, subtle accents
- elegante: Dark backgrounds, gold/metallic accents (#C9A961), Playfair Display, decorative frames
- criativo: Organic shapes, vibrant colors, asymmetric layout, Poppins/Space Grotesk, rounded elements`;
}

export interface TemplateLayoutInput {
  titulo: string;
  subtitulo?: string;
  cta?: string;
  format: CanvasFormat;
  estilo?: string;
  identidade_visual?: {
    paleta?: string;
    fontes?: string;
    tom_visual?: string;
  };
}

/**
 * Monta o user prompt para geração do layout do template.
 * titulo é truncado a 200 chars; subtitulo/cta a 200 chars cada.
 */
export function buildUserPrompt(input: TemplateLayoutInput): string {
  const titulo = (input.titulo ?? '').slice(0, 200);
  const subtitulo = (input.subtitulo ?? '').slice(0, 200);
  const cta = (input.cta ?? '').slice(0, 200);
  const estilo = (input.estilo ?? 'bold').slice(0, 50);
  const iv = input.identidade_visual ?? {};

  return `Create a template layout for this post:

TITLE: "${titulo}"
SUBTITLE: "${subtitulo}"
CTA: "${cta}"
FORMAT: ${input.format === 'feed' ? 'Square 1080x1080' : 'Story 1080x1920'}
STYLE: ${estilo}

BRAND IDENTITY:
- Colors: ${(iv.paleta ?? 'use professional defaults').slice(0, 200)}
- Fonts: ${(iv.fontes ?? 'choose appropriate').slice(0, 100)}
- Visual tone: ${(iv.tom_visual ?? 'modern professional').slice(0, 100)}

BACKGROUND IMAGE: Will be used as full background (type: "image", imageUrl will be set separately)

Return ONLY the JSON object with this structure:
{
  "background": {
    "type": "image",
    "imageFit": "cover",
    "imageMask": "full|left-half|right-half|center-circle|frame-inset",
    "overlay": { "color": "#hex", "opacity": 0.0-1.0 }
  },
  "elements": [ ...array of TextElement, ShapeElement, ImageElement... ]
}

Important: Do NOT include width, height, brandColors, or logoUrl - those are added automatically.
The background.imageUrl will be set separately - just define the mask and overlay.`;
}
