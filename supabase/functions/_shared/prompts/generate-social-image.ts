// @ts-nocheck
// Prompts versionados para generate-social-image.
// Inclui: CoT system prompt, buildFinalPrompt, buildFallbackPrompt,
// helpers de layout/quality/art-style e classificação de restrições.

export const PROMPT_VERSION = "1.0.0";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClassifiedRestrictions {
  restrictions_visual: string[];
  restrictions_copy: string[];
  restrictions_global: string[];
}

export interface TextHierarchy {
  headline: string;
  highlight_headline?: string;
  supporting_text?: string;
  bullet_points?: string;
  cta?: string;
  brand?: string;
}

export interface StructuredPromptResult {
  scene: string;
  environment: string;
  design_layout: string;
  layout_zones: string;
  color_palette: string;
  mood: string;
  style_closing: string;
  brand_design_elements: string;
  reference_style_replication: string;
  text_hierarchy: TextHierarchy;
}

// ── Layout composition rules ──────────────────────────────────────────────────

export function getLayoutRulesForPrompt(layoutType: string): string {
  const rules: Record<string, string> = {
    hero_central: `LAYOUT RULES (Hero Central):
- Large centered headline dominating the upper 60% of the canvas
- Subheadline directly below in smaller weight
- Background uses a textured gradient or subtle photographic image with dark overlay for contrast
- CTA button centered at bottom
- Brand logo small in top-left or top-right corner
- Strong vertical symmetry`,
    split_texto_imagem: `LAYOUT RULES (Split Text + Image):
- Composition split vertically: left 45% is a solid or gradient color block with headline, supporting text and CTA stacked vertically
- Right 55% is a high-quality photograph or illustration filling edge to edge
- Brand logo in the text side, top corner
- Clear dividing line or overlap between zones
- Text is left-aligned within the text zone`,
    card_moldura: `LAYOUT RULES (Card with Frame):
- Background is a solid bold color or subtle gradient
- Centered rounded card (border-radius 24px+) in white or contrasting color containing all text
- Card contains: headline, subheadline, bullet points, CTA
- Card has subtle shadow for depth
- Brand logo outside the card in a corner
- Clean generous padding inside card`,
    imagem_overlay: `LAYOUT RULES (Image + Overlay):
- Full-bleed high-quality photograph covering entire canvas
- Dark gradient overlay (40-60% opacity) concentrated on the area where text appears (typically bottom half)
- White or light-colored headline text with strong contrast
- Supporting text and CTA in lighter weight below
- Brand logo in corner with subtle backdrop blur`,
    grid_carrossel: `LAYOUT RULES (Organized Grid):
- Organized grid layout with 2-3 columns or rows
- Each cell contains an icon/number + short text
- Header zone at top with headline spanning full width
- Footer zone with CTA
- Clean dividers between sections
- Consistent spacing and alignment
- Brand logo in header
- Professional infographic aesthetic`,
    minimalista_clean: `LAYOUT RULES (Minimalist Clean):
- 60% or more negative space (white or very light background)
- Single focal element: one phrase, one object, or one graphic
- Ultra-refined typography
- Maximum 2 colors plus white/black
- No clutter, no busy backgrounds
- Brand logo subtle and small
- Breathing room around every element`,
    anuncio_agressivo: `LAYOUT RULES (Impact Advertisement):
- MAXIMUM IMPACT layout
- Headline text is ENORMOUS — fills 40%+ of the canvas
- Ultra-bold weight, possibly tilted 2-5 degrees for energy
- Vibrant saturated background color (red, yellow, electric blue)
- High contrast between text and background
- CTA in contrasting accent color, prominent
- Brand logo prominent
- Zero subtlety — everything screams attention`,
    premium_luxo: `LAYOUT RULES (Premium / Luxury):
- Dark background (#0a0a0a to #1a1a2e)
- Elegant serif typography for headline
- Gold, champagne, or rose-gold accent color for highlights and decorative elements
- Thin ornamental lines or borders framing content
- Generous letter-spacing on headline
- Brand logo in metallic finish
- Overall mood: exclusive, refined, aspirational`,
    texto_dominante: `LAYOUT RULES (Text Dominant):
- Typography IS the design — text as the main visual element
- Headline uses creative typographic treatment: mixed weights, sizes, or colors within the text
- Minimal or no imagery — background is solid or very subtle texture
- Text occupies 70%+ of canvas
- Supporting text in much smaller size below
- Brand logo integrated into the typographic composition
- Think poster design / editorial typography`,
  };
  return rules[layoutType] || "";
}

// ── Quality instructions ──────────────────────────────────────────────────────

export function getQualityInstructions(nivel: string): string {
  switch (nivel) {
    case "alto_padrao":
      return `IMAGE QUALITY: ULTRA-PREMIUM
- Cinematic lighting with golden-hour warmth, dramatic directional shadows, volumetric light
- Rich material textures: brushed metal, soft fabric, glossy reflective surfaces
- Shallow depth of field with professional bokeh (f/1.4-f/2.8)
- Film-grade color grading with split-toning and refined contrast`;
    case "elaborado":
      return `IMAGE QUALITY: PROFESSIONAL
- Strong three-point lighting with fill and accent
- Vibrant harmonious colors with intentional contrast
- Multi-layered composition with foreground, mid-ground, background depth
- Professional retouching quality with clean edges`;
    default:
      return `IMAGE QUALITY: CLEAN & POLISHED
- Even well-balanced lighting with soft natural shadows
- Clean uncluttered composition with single clear focal point
- Professional color balance, properly exposed, no artifacts`;
  }
}

// ── Art style instructions ────────────────────────────────────────────────────

export function getArtStyleInstructions(art_style: string): string {
  const artStyleMap: Record<string, string> = {
    grafica_moderna: `VISUAL APPROACH: FLAT GRAPHIC DESIGN. Bold solid color blocks, clean geometric shapes, sharp vector-like lines. Modern marketing template aesthetic. NO photographs, NO realistic textures.`,
    grafica_elegante: `VISUAL APPROACH: LUXURY GRAPHIC DESIGN. Deep dark background (#1a1a1a or similar), metallic gold/silver accents, ornamental serif details, premium minimalist feel. NO photographs.`,
    grafica_bold: `VISUAL APPROACH: HIGH-ENERGY GRAPHIC DESIGN. Oversized bold color blocks, diagonal stripes, vibrant saturated palette, maximum visual impact. Eye-catching and dynamic. NO photographs.`,
    grafica_minimalista: `VISUAL APPROACH: ULTRA-MINIMALIST GRAPHIC DESIGN. 60%+ negative space, 1-2 subtle graphic elements, monochromatic or duo-tone palette, refined and restrained.`,
    foto_editorial: `VISUAL APPROACH: CINEMATIC EDITORIAL PHOTOGRAPHY. Real people/objects, professional bokeh, rule-of-thirds composition, dramatic directional lighting, fashion-magazine quality.`,
    foto_produto: `VISUAL APPROACH: LIFESTYLE PRODUCT PHOTOGRAPHY. Textured surface styling, soft directional window-like lighting, curated prop arrangement, aspirational lifestyle feel.`,
    ilustracao: `VISUAL APPROACH: MODERN DIGITAL ILLUSTRATION. Flat or soft 3D vector style, friendly rounded shapes, professional and approachable, stylized characters if needed.`,
    collage: `VISUAL APPROACH: MIXED-MEDIA COLLAGE. Layered cut-out photos combined with graphic shapes, torn paper edges, contemporary editorial collage with bold typography overlay.`,
  };
  return artStyleMap[art_style] || "";
}

// ── Restriction classifier system prompt (used with tool-call API) ────────────

export const CLASSIFY_RESTRICTIONS_SYSTEM_PROMPT = `You classify user restrictions for a social media art generator into 3 categories:
- visual: restrictions about imagery, colors, photos, design elements (e.g. "no red", "no people", "no busy backgrounds")
- copy: restrictions about text, tone, language (e.g. "no aggressive language", "no promises", "no slang")
- global: restrictions about overall feel that apply to both text and image (e.g. "don't look childish", "not too corporate", "no clutter")

Classify each restriction into the most appropriate category. A single restriction can appear in multiple categories if it applies to both.`;

// ── Chain-of-Thought (CoT) prompt builder ─────────────────────────────────────

export interface CotPromptContext {
  userPrompt: string;
  format: string;
  nivel: string;
  estilo: string;
  identidade_visual?: Record<string, unknown>;
  persona?: Record<string, unknown>;
  tipo_postagem?: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  cena?: string;
  elementos_visuais?: string;
  manual_colors?: string;
  manual_style?: string;
  brand_name?: string;
  supporting_text?: string;
  bullet_points?: string;
  layout_type?: string;
  logo_url?: string;
  primary_ref_index?: number;
  objective?: string;
  classifiedRestrictions?: ClassifiedRestrictions;
  hasRefs?: boolean;
}

export function buildCotSystemPrompt(ctx: CotPromptContext): string {
  const { hasRefs, layout_type, logo_url, primary_ref_index, classifiedRestrictions } = ctx;

  let restrictionBlocks = "";
  if (classifiedRestrictions) {
    const cr = classifiedRestrictions;
    if (cr.restrictions_copy.length > 0) {
      restrictionBlocks += `\n\nCOPY RESTRICTIONS (text/tone must avoid):\n${cr.restrictions_copy.map(r => `- ${r}`).join("\n")}`;
    }
    if (cr.restrictions_visual.length > 0) {
      restrictionBlocks += `\n\nVISUAL RESTRICTIONS (imagery/design must avoid):\n${cr.restrictions_visual.map(r => `- ${r}`).join("\n")}`;
    }
    if (cr.restrictions_global.length > 0) {
      restrictionBlocks += `\n\nGLOBAL RESTRICTIONS (applies to both text and visuals):\n${cr.restrictions_global.map(r => `- ${r}`).join("\n")}`;
    }
  }

  return `You are an elite visual prompt engineer for AI image generation models. Your ONLY job is to produce a structured visual prompt in FLUENT ENGLISH that will generate a professional social media marketing image.

CRITICAL RULES:
1. ALL output MUST be in ENGLISH. No Portuguese whatsoever.
2. The image model renders text directly into the design — describe WHERE and HOW text should appear.
3. Be hyper-specific about composition, colors, lighting, and spatial layout.
4. Never use vague descriptions like "professional look" or "modern design". Be CONCRETE.
5. CRITICAL COLOR RULE: The color palette you output MUST match the dominant colors from the reference images. Do NOT invent new colors. Extract the EXACT hex codes visible in the references. If references show yellow/gold tones, your palette MUST be yellow/gold — NEVER substitute with red, blue, or any other color family.
${hasRefs ? `6. You have been given BRAND REFERENCE IMAGES. Analyze them carefully and extract the exact visual design system: color usage patterns, layout structures, card shapes, icon styles, typography approach, photographic vs graphic style. Your output must faithfully replicate this design language in a NEW scene.
7. IMPORTANT: Do NOT recreate the same people, same scene or same composition from the references. Create a NEW scene that follows the same brand design language.
8. ${primary_ref_index !== undefined ? `Reference image #${(primary_ref_index || 0) + 1} is the PRIMARY reference (weight 60%). Match its design language MOST closely. The remaining references share the other 40% of influence.` : "All reference images have equal weight."}` : ""}
${logo_url ? `9. A BRAND LOGO image has been provided separately. DO NOT render any logo, logotype, brand mark, or brand name text in the image. Leave the logo placement space COMPLETELY EMPTY — the real logo will be composited in post-production.` : ""}
${layout_type ? `10. LAYOUT TYPE SELECTED: "${layout_type}". You MUST follow the specific layout composition rules for this type. The layout determines WHERE elements go — follow it precisely.` : ""}

HIERARCHY RULES (MANDATORY):
- Headline must be the DOMINANT element — largest, boldest, most visible
- Subheadline is SECONDARY — smaller weight, supporting the headline
- Logo is TERTIARY — small, subtle, corner placement
- Ensure clear visual hierarchy between all text elements

READABILITY RULES (MANDATORY):
- Ensure HIGH READABILITY: strong contrast between text and background
- Avoid busy backgrounds directly behind text areas
- Text areas must have clean, uncluttered backing

LAYOUT INTEGRITY (MANDATORY):
- Do NOT improvise layout — follow the defined grid precisely
- Do NOT reposition elements outside the defined grid zones
- Strictly follow visual identity extracted from references

${layout_type ? getLayoutRulesForPrompt(layout_type) : ""}
${restrictionBlocks}

The art_style determines the visual approach:
- Styles starting with "grafica_" → FLAT GRAPHIC DESIGN (vector shapes, color blocks, geometric patterns, NO photographs)
- Styles starting with "foto_" → PHOTOGRAPHIC (cinematic, editorial, real people/objects)
- "ilustracao" → DIGITAL ILLUSTRATION (vector-like, friendly, stylized)
- "collage" → MIXED-MEDIA COLLAGE (layered photos + graphic elements)
- Layout types (hero_central, split_texto_imagem, etc.) → Follow the specific layout composition rules above

OUTPUT SECTIONS (all in English):

1. **scene**: Detailed visual description — who/what is in the image, what's happening, expressions, poses, objects. For graphic styles, describe shapes, icons, and abstract elements instead of people. 100-200 words.

2. **environment**: Background, lighting, atmosphere. Be cinematic and specific (e.g. "soft gradient from deep navy #1a1a2e to charcoal #16213e" not "dark background").

3. **design_layout**: Precise spatial composition — describe the exact layout grid. Example: "Upper 60%: hero photograph with subject off-center right. Lower 40%: solid dark card with rounded corners containing headline text centered, CTA button bottom-right."

4. **layout_zones**: Describe 2-3 distinct zones of the composition. Example: "Top portion: lifestyle photo with the couple. Bottom portion: dark rounded card layout with text and lime green highlights. Include three circular icon elements."

5. **color_palette**: List exact colors with hex codes and WHERE each appears (background, text, accents, shapes).

6. **mood**: 5-8 mood keywords, comma-separated.

7. **style_closing**: One definitive style sentence. Examples: "Ultra-realistic editorial photography with modern marketing layout" or "Bold flat graphic design with geometric shapes and clean sans-serif type."

8. **brand_design_elements**: 5-8 specific design elements as comma-separated items. Example: "navy blue base, lime green accent highlights, rounded card containers, circular icon elements, bold sans-serif headlines, subtle grid pattern overlay."

9. **reference_style_replication**: ${hasRefs ? "Based on the reference images provided, list 6-10 SPECIFIC visual elements you observe that MUST be replicated. Example: 'black and white base layout, lime green highlight color, rounded card shapes, circular icon elements, modern financial consulting layout, clean sans-serif typography, marketing educational style'. Be extremely specific about what you see." : "Leave empty string if no reference images provided."}

10. **text_hierarchy**: A structured object with EACH text element that should appear in the image:
  - headline: The main large headline text (render exactly as provided, in Portuguese)
  - highlight_headline: A secondary headline or emphasized portion (different color/weight)
  - supporting_text: Body text or explanatory paragraph
  - bullet_points: Listed items (if applicable)
  - cta: Call-to-action text
  - brand: Brand name for corner placement

Each field should include the TEXT CONTENT and rendering instructions (font style, size, position, color).`;
}

export function buildCotUserMessage(ctx: CotPromptContext): string {
  const { userPrompt, format, nivel, estilo, identidade_visual, persona,
    tipo_postagem, headline, subheadline, cta, cena, elementos_visuais,
    manual_colors, manual_style, brand_name, supporting_text, bullet_points, hasRefs } = ctx;

  const formatDesc: Record<string, string> = {
    feed: "Square 1:1 (1080×1080px) Instagram feed post",
    portrait: "Portrait 4:5 (1080×1350px) Instagram optimized feed",
    story: "Vertical 9:16 (1080×1920px) Stories/Reels",
    banner: "Landscape 16:9 (1920×1080px) banner/cover",
  };

  let structuredBrief = `USER REQUEST: ${userPrompt}`;
  if (tipo_postagem) structuredBrief += `\nPOST TYPE: ${tipo_postagem}`;
  if (headline) structuredBrief += `\nHEADLINE TEXT (render in image): "${headline}"`;
  if (subheadline) structuredBrief += `\nSUBHEADLINE / HIGHLIGHT TEXT (render in image): "${subheadline}"`;
  if (supporting_text) structuredBrief += `\nSUPPORTING TEXT (render in image): "${supporting_text}"`;
  if (bullet_points) structuredBrief += `\nBULLET POINTS (render in image): "${bullet_points}"`;
  if (cta) structuredBrief += `\nCTA TEXT (render in image): "${cta}"`;
  if (cena) structuredBrief += `\nSCENE DESCRIPTION: ${cena}`;
  if (elementos_visuais) structuredBrief += `\nVISUAL ELEMENTS TO INCLUDE: ${elementos_visuais}`;
  if (brand_name) structuredBrief += `\nBRAND NAME (render in image): "${brand_name}"`;

  let identitySection = "";
  if (identidade_visual) {
    identitySection = `BRAND VISUAL IDENTITY:
- Color palette: ${(identidade_visual as Record<string,unknown>).paleta || (identidade_visual as Record<string,unknown>).palette || "not specified"}
- Style: ${(identidade_visual as Record<string,unknown>).estilo || (identidade_visual as Record<string,unknown>).style || "not specified"}
- Visual tone: ${(identidade_visual as Record<string,unknown>).tom_visual || (identidade_visual as Record<string,unknown>).tone || "not specified"}
- Typography feel: ${(identidade_visual as Record<string,unknown>).fontes || (identidade_visual as Record<string,unknown>).fonts || "not specified"}`;
  } else if (manual_colors || manual_style) {
    identitySection = `BRAND IDENTITY (manual):
- Colors: ${manual_colors || "not specified"}
- Style: ${manual_style || "not specified"}`;
  }

  const personaRec = persona as Record<string,unknown> | undefined;

  return `${structuredBrief}

FORMAT: ${formatDesc[format] || formatDesc.feed}
QUALITY LEVEL: ${nivel || "simples"}
VISUAL STYLE: ${estilo || "modern professional"}

${identitySection || "No brand identity provided — use a clean, modern aesthetic."}

${personaRec ? `TARGET AUDIENCE: ${personaRec.nome ? `${personaRec.nome} — ` : ""}${personaRec.descricao || "general audience"}` : ""}
${hasRefs ? "\nREFERENCE IMAGES: I have attached brand reference images. Analyze them carefully to extract the design system." : ""}

Analyze everything above and produce the structured visual prompt sections. Remember: ALL in English, be SPECIFIC, describe text placement precisely.`;
}

// ── Final image prompt builders ───────────────────────────────────────────────

function buildRestrictionBlock(classifiedRestrictions?: ClassifiedRestrictions): string {
  if (!classifiedRestrictions) return "";
  const cr = classifiedRestrictions;
  let block = "";
  if (cr.restrictions_visual.length > 0) {
    block += `\n\nVISUAL RESTRICTIONS — DO NOT INCLUDE:\n${cr.restrictions_visual.map(r => `- ${r}`).join("\n")}`;
  }
  if (cr.restrictions_copy.length > 0) {
    block += `\n\nCOPY RESTRICTIONS — TONE MUST AVOID:\n${cr.restrictions_copy.map(r => `- ${r}`).join("\n")}`;
  }
  if (cr.restrictions_global.length > 0) {
    block += `\n\nGLOBAL RESTRICTIONS — AVOID IN BOTH TEXT AND VISUALS:\n${cr.restrictions_global.map(r => `- ${r}`).join("\n")}`;
  }
  if (cr.restrictions_visual.length > 0 || cr.restrictions_copy.length > 0 || cr.restrictions_global.length > 0) {
    block += `\n\nSTRICTLY AVOID all user-defined restrictions in both text and visuals. These are NON-NEGOTIABLE constraints.`;
  }
  return block;
}

export function buildFinalPrompt(
  optimized: StructuredPromptResult,
  qualityInstructions: string,
  artStyleInstructions: string,
  formatDescription: string,
  hasRefs: boolean,
  classifiedRestrictions?: ClassifiedRestrictions,
): string {
  let referenceBlock = "";
  if (hasRefs && optimized.reference_style_replication) {
    const elements = optimized.reference_style_replication.split(",").map((e: string) => e.trim()).filter(Boolean);
    referenceBlock = `Use the attached images ONLY as brand style references for the visual identity.

Replicate the brand design system including:
${elements.map((e: string) => `- ${e}`).join("\n")}

IMPORTANT:
Do NOT recreate the same people, same scene or same composition from the references.
Create a NEW scene that follows the same brand design language.

`;
  }

  const th = optimized.text_hierarchy;
  let textBlock = "Text in Portuguese:";
  if (th?.headline) textBlock += `\n\nHeadline:\n${th.headline}`;
  if (th?.highlight_headline) textBlock += `\n\nHighlight headline:\n${th.highlight_headline}`;
  if (th?.supporting_text) textBlock += `\n\nSupporting text:\n${th.supporting_text}`;
  if (th?.bullet_points) textBlock += `\n\nBullet points:\n${th.bullet_points}`;
  if (th?.cta) textBlock += `\n\nCTA:\n${th.cta}`;
  if (th?.brand) textBlock += `\n\nBrand:\n${th.brand}`;

  const restrictionBlock = buildRestrictionBlock(classifiedRestrictions);

  return `${referenceBlock}Scene:
${optimized.scene}

Environment:
${optimized.environment}

Design layout:
${optimized.design_layout}
${optimized.layout_zones ? `\nLayout zones:\n${optimized.layout_zones}` : ""}

Color palette:
${optimized.color_palette}

Format:
${formatDescription}

${qualityInstructions}
${artStyleInstructions ? `\n${artStyleInstructions}\n` : ""}

${textBlock}

Mood:
${optimized.mood}

${optimized.style_closing}

IMPORTANT RENDERING RULES:
- Text must be sharp, legible, and properly spelled
- Maintain strong visual hierarchy: Headline DOMINANT, Subheadline SECONDARY, Logo TERTIARY
- All text must have sufficient contrast against its background — avoid busy backgrounds behind text
- Typography should feel intentional and designed, not auto-generated
- The overall composition must be balanced and publication-ready
- MANDATORY COLOR RULE: Use ONLY the colors listed in the color_palette section. Do NOT substitute or invent different colors. If the palette says yellow, use yellow — NEVER red or any other hue.
- DO NOT render any logo, logotype, brand mark, or brand name text in the image. Leave the logo space COMPLETELY EMPTY — it will be composited in post-production.
- MANDATORY TEXT RESTRICTION: Render ONLY the text elements explicitly provided above (headline, highlight headline, supporting text, bullet points, CTA, brand). Do NOT add, invent, or include ANY additional text, words, phrases, taglines, watermarks, or labels beyond what is explicitly listed.
- Do NOT improvise layout — follow the defined grid precisely
- Do NOT reposition elements outside the defined grid zones
- Strictly follow visual identity extracted from references${restrictionBlock}`;
}

export interface FallbackPromptContext {
  prompt?: string;
  cena?: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  brand_name?: string;
  elementos_visuais?: string;
  supporting_text?: string;
  bullet_points?: string;
}

export function buildFallbackPrompt(
  context: FallbackPromptContext,
  qualityInstructions: string,
  artStyleInstructions: string,
  formatDescription: string,
  identidade_visual: Record<string, unknown>,
  manual_colors?: string,
  manual_style?: string,
  classifiedRestrictions?: ClassifiedRestrictions,
): string {
  const scene = context.cena || context.prompt || "A professional, visually striking social media marketing post";

  let textBlock = "";
  if (context.headline || context.subheadline || context.cta || context.brand_name) {
    textBlock = "\nText in Portuguese:";
    if (context.headline) textBlock += `\n\nHeadline:\n"${context.headline}"`;
    if (context.subheadline) textBlock += `\n\nHighlight headline:\n"${context.subheadline}"`;
    if (context.supporting_text) textBlock += `\n\nSupporting text:\n"${context.supporting_text}"`;
    if (context.bullet_points) textBlock += `\n\nBullet points:\n"${context.bullet_points}"`;
    if (context.cta) textBlock += `\n\nCTA:\n"${context.cta}"`;
    if (context.brand_name) textBlock += `\n\nBrand:\n"${context.brand_name}"`;
    textBlock += `\n\nAll text must be sharp, legible, correctly spelled, and have strong contrast.`;
  }

  let colorInfo = "";
  if (identidade_visual?.paleta || identidade_visual?.palette) {
    colorInfo = `\nColor palette:\n${identidade_visual.paleta || identidade_visual.palette}`;
  } else if (manual_colors) {
    colorInfo = `\nColor palette:\n${manual_colors}`;
  }

  let styleInfo = "";
  if (identidade_visual?.estilo || identidade_visual?.style) {
    styleInfo = `\nBrand style: ${identidade_visual.estilo || identidade_visual.style}`;
  } else if (manual_style) {
    styleInfo = `\nBrand style: ${manual_style}`;
  }

  const restrictionBlock = buildRestrictionBlock(classifiedRestrictions);

  return `Scene:
${scene}
${context.elementos_visuais ? `\nVisual elements to include: ${context.elementos_visuais}` : ""}

Format:
${formatDescription}

${qualityInstructions}
${artStyleInstructions ? `\n${artStyleInstructions}\n` : ""}
${colorInfo}
${styleInfo}
${textBlock}

COMPOSITION RULES:
- Clear visual hierarchy: Headline DOMINANT, Subheadline SECONDARY, Logo TERTIARY
- Professional color theory: complementary or analogous color relationships
- Must be legible and impactful at small mobile screen sizes
- Clean, balanced layout that feels intentionally designed
- Strong contrast between text and background — no busy backgrounds behind text
- Do NOT improvise layout or reposition elements outside defined grid
- MANDATORY TEXT RESTRICTION: Render ONLY the text elements explicitly provided above. Do NOT add, invent, or include ANY additional text, words, phrases, taglines, watermarks, or labels beyond what is explicitly listed.

TEXT DENSITY RULE (CRITICAL):
- Maximum 3 visible text blocks: Headline (required), Subheadline (optional), CTA (optional)
- Supporting text and bullet points must be condensed to at most 2 short lines — if provided text exceeds 40 words total, prioritize the Headline and CTA, and summarize or omit supporting text
- The image must remain at least 50% visual/graphic — text should NEVER dominate the canvas
- If too much text is provided, REDUCE it to keep the design clean, scannable, and visually balanced
- Each text block must have generous breathing room — no cramped or overlapping text${restrictionBlock}

Generate this image now.`;
}

// Convenience: unified buildUserPrompt (alias for CoT message)
export const buildUserPrompt = buildCotUserMessage;
export const SYSTEM_PROMPT = ""; // dynamic via buildCotSystemPrompt / buildGenerateSystemPrompt
