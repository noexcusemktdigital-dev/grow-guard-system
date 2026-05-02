// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { assertOrgMember, authErrorResponse } from '../_shared/auth.ts';

const CREDIT_COST = 25;

// --- Fetch URL and convert to base64 data URI ---

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch reference image (${res.status}): ${url}`);
      return null;
    }
    let contentType = res.headers.get("content-type") || "image/png";

    // SVG: convert to PNG by re-rendering via AI model
    if (contentType.includes("svg")) {
      console.log(`🔄 SVG detected, converting to PNG via AI: ${url}`);
      try {
        const svgText = new TextDecoder().decode(new Uint8Array(await res.clone().arrayBuffer()));
        const svgB64 = `data:image/svg+xml;base64,${btoa(svgText)}`;
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
          console.warn("No LOVABLE_API_KEY for SVG conversion, skipping");
          return null;
        }
        const convResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Render this SVG logo as a clean PNG image on a TRANSPARENT background (alpha channel). Maintain exact colors, proportions and text. Output only the rendered image with no background.",
                },
                { type: "image_url", image_url: { url: svgB64 } },
              ],
            }],
            modalities: ["image", "text"],
          }),
        });
        if (convResp.ok) {
          const convData = await convResp.json();
          const pngUrl = convData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (pngUrl) {
            console.log("✅ SVG converted to PNG successfully");
            return pngUrl;
          }
        }
        console.warn("SVG→PNG conversion failed, using raw SVG base64 as fallback");
        const svgTextFallback = new TextDecoder().decode(new Uint8Array(await res.arrayBuffer()));
        return `data:image/svg+xml;base64,${btoa(svgTextFallback)}`;
      } catch (svgErr) {
        console.warn("SVG→PNG conversion error:", svgErr);
        return null;
      }
    }

    if (!contentType.startsWith("image/")) {
      contentType = "image/png";
    }

    const buffer = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < buffer.length; i += chunkSize) {
      binary += String.fromCharCode(...buffer.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.warn(`Error fetching reference image: ${url}`, err);
    return null;
  }
}

// --- Classify restrictions into visual, copy, global ---

interface ClassifiedRestrictions {
  restrictions_visual: string[];
  restrictions_copy: string[];
  restrictions_global: string[];
}

async function classifyRestrictions(apiKey: string, restrictions: string): Promise<ClassifiedRestrictions> {
  const defaultResult: ClassifiedRestrictions = {
    restrictions_visual: [],
    restrictions_copy: [],
    restrictions_global: [],
  };
  if (!restrictions || restrictions.trim().length === 0) return defaultResult;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You classify user restrictions for a social media art generator into 3 categories:
- visual: restrictions about imagery, colors, photos, design elements (e.g. "no red", "no people", "no busy backgrounds")
- copy: restrictions about text, tone, language (e.g. "no aggressive language", "no promises", "no slang")
- global: restrictions about overall feel that apply to both text and image (e.g. "don't look childish", "not too corporate", "no clutter")

Classify each restriction into the most appropriate category. A single restriction can appear in multiple categories if it applies to both.`,
          },
          { role: "user", content: restrictions },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_restrictions",
              description: "Classify user restrictions into visual, copy, and global categories.",
              parameters: {
                type: "object",
                properties: {
                  restrictions_visual: {
                    type: "array",
                    items: { type: "string" },
                    description: "Visual/image restrictions",
                  },
                  restrictions_copy: {
                    type: "array",
                    items: { type: "string" },
                    description: "Text/copy restrictions",
                  },
                  restrictions_global: {
                    type: "array",
                    items: { type: "string" },
                    description: "Global feel restrictions that apply to both text and image",
                  },
                },
                required: ["restrictions_visual", "restrictions_copy", "restrictions_global"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_restrictions" } },
      }),
    });

    if (!response.ok) {
      console.warn("Restriction classification failed:", response.status);
      return defaultResult;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log("✅ Restrictions classified:", JSON.stringify(parsed));
      return parsed as ClassifiedRestrictions;
    }
    return defaultResult;
  } catch (err) {
    console.warn("Restriction classification error:", err);
    return defaultResult;
  }
}

// --- Structured prompt result from chain-of-thought ---

interface TextHierarchy {
  headline: string;
  highlight_headline: string;
  supporting_text: string;
  bullet_points: string;
  cta: string;
  brand: string;
}

interface StructuredPromptResult {
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

// --- Layout composition rules ---

function getLayoutRulesForPrompt(layoutType: string): string {
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

async function analyzeAndOptimizePrompt(
  apiKey: string,
  context: {
    userPrompt: string;
    format: string;
    nivel: string;
    estilo: string;
    identidade_visual: Record<string, unknown>;
    persona: Record<string, unknown>;
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
  },
  referenceBase64s?: { type: string; image_url: { url: string } }[],
): Promise<StructuredPromptResult | null> {
  const { userPrompt, format, nivel, estilo, identidade_visual, persona } = context;

  const hasRefs = referenceBase64s && referenceBase64s.length > 0;

  // Build restriction blocks for the CoT system prompt
  let restrictionBlocks = "";
  if (context.classifiedRestrictions) {
    const cr = context.classifiedRestrictions;
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

  const systemPrompt = `You are an elite visual prompt engineer for AI image generation models. Your ONLY job is to produce a structured visual prompt in FLUENT ENGLISH that will generate a professional social media marketing image.

CRITICAL RULES:
1. ALL output MUST be in ENGLISH. No Portuguese whatsoever.
2. The image model renders text directly into the design — describe WHERE and HOW text should appear.
3. Be hyper-specific about composition, colors, lighting, and spatial layout.
4. Never use vague descriptions like "professional look" or "modern design". Be CONCRETE.
5. CRITICAL COLOR RULE: The color palette you output MUST match the dominant colors from the reference images. Do NOT invent new colors. Extract the EXACT hex codes visible in the references. If references show yellow/gold tones, your palette MUST be yellow/gold — NEVER substitute with red, blue, or any other color family.
${hasRefs ? `6. You have been given BRAND REFERENCE IMAGES. Analyze them carefully and extract the exact visual design system: color usage patterns, layout structures, card shapes, icon styles, typography approach, photographic vs graphic style. Your output must faithfully replicate this design language in a NEW scene.
7. IMPORTANT: Do NOT recreate the same people, same scene or same composition from the references. Create a NEW scene that follows the same brand design language.
8. ${context.primary_ref_index !== undefined ? `Reference image #${(context.primary_ref_index || 0) + 1} is the PRIMARY reference (weight 60%). Match its design language MOST closely. The remaining references share the other 40% of influence.` : "All reference images have equal weight."}` : ""}
${context.logo_url ? `9. A BRAND LOGO image has been provided separately. DO NOT render any logo, logotype, brand mark, or brand name text in the image. Leave the logo placement space COMPLETELY EMPTY — the real logo will be composited in post-production.` : ""}
${context.layout_type ? `10. LAYOUT TYPE SELECTED: "${context.layout_type}". You MUST follow the specific layout composition rules for this type. The layout determines WHERE elements go — follow it precisely.` : ""}

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

${context.layout_type ? getLayoutRulesForPrompt(context.layout_type) : ""}
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

  // Build structured briefing in English
  let structuredBrief = `USER REQUEST: ${userPrompt}`;
  if (context.tipo_postagem) structuredBrief += `\nPOST TYPE: ${context.tipo_postagem}`;
  if (context.headline) structuredBrief += `\nHEADLINE TEXT (render in image): "${context.headline}"`;
  if (context.subheadline) structuredBrief += `\nSUBHEADLINE / HIGHLIGHT TEXT (render in image): "${context.subheadline}"`;
  if (context.supporting_text) structuredBrief += `\nSUPPORTING TEXT (render in image): "${context.supporting_text}"`;
  if (context.bullet_points) structuredBrief += `\nBULLET POINTS (render in image): "${context.bullet_points}"`;
  if (context.cta) structuredBrief += `\nCTA TEXT (render in image): "${context.cta}"`;
  if (context.cena) structuredBrief += `\nSCENE DESCRIPTION: ${context.cena}`;
  if (context.elementos_visuais) structuredBrief += `\nVISUAL ELEMENTS TO INCLUDE: ${context.elementos_visuais}`;
  if (context.brand_name) structuredBrief += `\nBRAND NAME (render in image): "${context.brand_name}"`;

  const formatDesc: Record<string, string> = {
    feed: "Square 1:1 (1080×1080px) Instagram feed post",
    portrait: "Portrait 4:5 (1080×1350px) Instagram optimized feed",
    story: "Vertical 9:16 (1080×1920px) Stories/Reels",
    banner: "Landscape 16:9 (1920×1080px) banner/cover",
  };

  let identitySection = "";
  if (identidade_visual) {
    identitySection = `BRAND VISUAL IDENTITY:
- Color palette: ${identidade_visual.paleta || identidade_visual.palette || "not specified"}
- Style: ${identidade_visual.estilo || identidade_visual.style || "not specified"}
- Visual tone: ${identidade_visual.tom_visual || identidade_visual.tone || "not specified"}
- Typography feel: ${identidade_visual.fontes || identidade_visual.fonts || "not specified"}`;
  } else if (context.manual_colors || context.manual_style) {
    identitySection = `BRAND IDENTITY (manual):
- Colors: ${context.manual_colors || "not specified"}
- Style: ${context.manual_style || "not specified"}`;
  }

  const userMessage = `${structuredBrief}

FORMAT: ${formatDesc[format] || formatDesc.feed}
QUALITY LEVEL: ${nivel || "simples"}
VISUAL STYLE: ${estilo || "modern professional"}

${identitySection || "No brand identity provided — use a clean, modern aesthetic."}

${persona ? `TARGET AUDIENCE: ${persona.nome ? `${persona.nome} — ` : ""}${persona.descricao || "general audience"}` : ""}
${hasRefs ? "\nREFERENCE IMAGES: I have attached brand reference images. Analyze them carefully to extract the design system." : ""}

Analyze everything above and produce the structured visual prompt sections. Remember: ALL in English, be SPECIFIC, describe text placement precisely.`;

  try {
    let messageContent: string | { type: string; text?: string; image_url?: { url: string } }[];
    if (hasRefs) {
      messageContent = [
        { type: "text", text: userMessage },
        ...referenceBase64s!,
      ];
    } else {
      messageContent = userMessage;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: messageContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "structured_visual_prompt",
              description: "Return the structured visual prompt sections for image generation. ALL content MUST be in English.",
              parameters: {
                type: "object",
                properties: {
                  scene: { type: "string", description: "Detailed scene description. 100-200 words. English only." },
                  environment: { type: "string", description: "Background, lighting, atmosphere with specific colors/hex codes." },
                  design_layout: { type: "string", description: "Precise spatial composition describing exact layout grid and element positions." },
                  layout_zones: { type: "string", description: "2-3 distinct zones of the composition with specific descriptions of what goes in each zone." },
                  color_palette: { type: "string", description: "Exact colors with hex codes and where each appears." },
                  mood: { type: "string", description: "5-8 mood keywords, comma-separated." },
                  style_closing: { type: "string", description: "One definitive style sentence." },
                  brand_design_elements: { type: "string", description: "5-8 specific brand design elements, comma-separated." },
                  reference_style_replication: { type: "string", description: "6-10 specific visual elements extracted from brand reference images that must be replicated. Empty if no references." },
                  text_hierarchy: {
                    type: "object",
                    description: "Structured text elements to render in the image, each with content and rendering instructions.",
                    properties: {
                      headline: { type: "string", description: "Main headline with rendering instructions (font, size, position, color). Include the exact text in quotes." },
                      highlight_headline: { type: "string", description: "Secondary/highlight headline with distinct styling (different color or weight). Include exact text in quotes." },
                      supporting_text: { type: "string", description: "Body/explanatory text with rendering instructions. Include exact text in quotes." },
                      bullet_points: { type: "string", description: "Listed items with rendering instructions. Include exact text in quotes." },
                      cta: { type: "string", description: "Call-to-action text with rendering instructions (accent color, button style, position)." },
                      brand: { type: "string", description: "Brand name with rendering instructions (small, corner placement)." },
                    },
                    required: ["headline"],
                    additionalProperties: false,
                  },
                },
                required: ["scene", "environment", "design_layout", "layout_zones", "color_palette", "mood", "style_closing", "brand_design_elements", "reference_style_replication", "text_hierarchy"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "structured_visual_prompt" } },
      }),
    });

    if (!response.ok) {
      console.warn("Chain-of-thought optimization failed (HTTP):", response.status);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log("✅ Chain-of-thought structured prompt:", JSON.stringify(parsed).slice(0, 600) + "...");
      return parsed as StructuredPromptResult;
    }

    console.warn("Chain-of-thought: no tool call in response, falling back.");
    return null;
  } catch (err) {
    console.warn("Chain-of-thought optimization error (non-blocking):", err);
    return null;
  }
}

function getQualityInstructions(nivel: string): string {
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

function getArtStyleInstructions(art_style: string): string {
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

async function getFeedbackHistory(supabase: ReturnType<typeof createClient>, organizationId: string): Promise<string> {
  try {
    const { data: feedback } = await supabase
      .from("social_art_feedback")
      .select("status, prompt_used, style, nivel, feedback_note")
      .eq("organization_id", organizationId)
      .in("status", ["approved", "rejected", "changes_requested"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (!feedback || feedback.length === 0) return "";

    const approved = feedback.filter((f: { status: string }) => f.status === "approved");
    const rejected = feedback.filter((f: { status: string }) => f.status === "rejected");

    let summary = "\n\nPAST FEEDBACK CONTEXT:";
    if (approved.length > 0) {
      summary += `\n- ${approved.length} images APPROVED. Successful themes: ${approved.slice(0, 5).map((a: { prompt_used?: string }) => a.prompt_used?.slice(0, 80) || "N/A").join("; ")}`;
    }
    if (rejected.length > 0) {
      summary += `\n- ${rejected.length} images REJECTED. Avoid these approaches: ${rejected.slice(0, 5).map((r: { prompt_used?: string; feedback_note?: string }) => `"${r.prompt_used?.slice(0, 60)}" ${r.feedback_note ? `(reason: ${r.feedback_note})` : ""}`).join("; ")}`;
    }
    return summary;
  } catch {
    return "";
  }
}

// --- Build final image prompt from structured CoT result ---

function buildFinalPrompt(
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

  // Build classified restriction blocks
  let restrictionBlock = "";
  if (classifiedRestrictions) {
    const cr = classifiedRestrictions;
    if (cr.restrictions_visual.length > 0) {
      restrictionBlock += `\n\nVISUAL RESTRICTIONS — DO NOT INCLUDE:\n${cr.restrictions_visual.map(r => `- ${r}`).join("\n")}`;
    }
    if (cr.restrictions_copy.length > 0) {
      restrictionBlock += `\n\nCOPY RESTRICTIONS — TONE MUST AVOID:\n${cr.restrictions_copy.map(r => `- ${r}`).join("\n")}`;
    }
    if (cr.restrictions_global.length > 0) {
      restrictionBlock += `\n\nGLOBAL RESTRICTIONS — AVOID IN BOTH TEXT AND VISUALS:\n${cr.restrictions_global.map(r => `- ${r}`).join("\n")}`;
    }
    if (cr.restrictions_visual.length > 0 || cr.restrictions_copy.length > 0 || cr.restrictions_global.length > 0) {
      restrictionBlock += `\n\nSTRICTLY AVOID all user-defined restrictions in both text and visuals. These are NON-NEGOTIABLE constraints.`;
    }
  }

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

// --- Build fallback prompt when CoT fails ---

function buildFallbackPrompt(
  context: {
    prompt?: string;
    cena?: string;
    headline?: string;
    subheadline?: string;
    cta?: string;
    brand_name?: string;
    elementos_visuais?: string;
    supporting_text?: string;
    bullet_points?: string;
  },
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

  // Build classified restriction blocks
  let restrictionBlock = "";
  if (classifiedRestrictions) {
    const cr = classifiedRestrictions;
    if (cr.restrictions_visual.length > 0) {
      restrictionBlock += `\n\nVISUAL RESTRICTIONS — DO NOT INCLUDE:\n${cr.restrictions_visual.map(r => `- ${r}`).join("\n")}`;
    }
    if (cr.restrictions_copy.length > 0) {
      restrictionBlock += `\n\nCOPY RESTRICTIONS — TONE MUST AVOID:\n${cr.restrictions_copy.map(r => `- ${r}`).join("\n")}`;
    }
    if (cr.restrictions_global.length > 0) {
      restrictionBlock += `\n\nGLOBAL RESTRICTIONS — AVOID IN BOTH TEXT AND VISUALS:\n${cr.restrictions_global.map(r => `- ${r}`).join("\n")}`;
    }
    if (cr.restrictions_visual.length > 0 || cr.restrictions_copy.length > 0 || cr.restrictions_global.length > 0) {
      restrictionBlock += `\n\nSTRICTLY AVOID all user-defined restrictions in both text and visuals.`;
    }
  }

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

// --- Main handler ---

serve(async (req) => {
  const ctx = newRequestContext(req, 'generate-social-image');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  // SEC-NOE-002: User auth required
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: _authUser }, error: _authErr } = await userClient.auth.getUser();
  if (_authErr || !_authUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const _rl = await checkRateLimit(_authUser.id, null, 'generate-social-image', { windowSeconds: 60, maxRequests: 15 });
  if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

  try {
    const body = await req.json();
    const {
      prompt, format, file_path, nivel, persona, identidade_visual,
      organization_id, reference_images, art_style,
      tipo_postagem, headline, subheadline, cta, cena, elementos_visuais,
      manual_colors, manual_style, brand_name,
      supporting_text, bullet_points,
      layout_type, logo_url, primary_ref_index, objective,
      extract_logo,
      photo_images,
      output_mode,
      print_format,
      // New art direction engine fields
      topic, audience, text_mode, restrictions, elements,
      base_image_url, character_image_url, background_image_url,
      // Layout customization (Step 8)
      logo_position, title_position, background_type, color_tone,
      primary_color, secondary_color,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── Extract logo mode ───
    if (extract_logo && reference_images?.length > 0) {
      console.log("🔍 Extract logo mode: analyzing references...");
      const refB64s: { type: string; image_url: { url: string } }[] = [];
      for (const refUrl of reference_images.slice(0, 3)) {
        const b64 = await urlToBase64(refUrl);
        if (b64) refB64s.push({ type: "image_url", image_url: { url: b64 } });
      }
      if (refB64s.length === 0) {
        return new Response(JSON.stringify({ error: "Could not load reference images" }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: `Look at these reference images carefully. Find the brand logo/logotype that appears in them.
Extract ONLY the logo — remove all other elements.
Place the extracted logo on a clean solid white background.
Maintain the original colors, proportions, and text of the logo exactly.
If there are multiple logos, extract the most prominent one.
Output ONLY the extracted logo image.`,
              },
              ...refB64s,
            ],
          }],
          modalities: ["image", "text"],
        }),
      });

      if (!extractResponse.ok) {
        console.error("Logo extraction failed:", extractResponse.status);
        return new Response(JSON.stringify({ error: "Logo extraction failed" }), {
          status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const extractData = await extractResponse.json();
      const extractedImage = extractData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!extractedImage) {
        return new Response(JSON.stringify({ error: "No logo found in references" }), {
          status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      // Upload extracted logo
      const logoPath = `logos/${organization_id}/${Date.now()}_extracted.png`;
      const logoBase64 = extractedImage.replace(/^data:image\/\w+;base64,/, "");
      const logoBinary = Uint8Array.from(atob(logoBase64), (c) => c.charCodeAt(0));
      const { error: uploadErr } = await supabase.storage
        .from("social-arts")
        .upload(logoPath, logoBinary, { contentType: "image/png", upsert: true });
      if (uploadErr) throw new Error(`Logo upload failed: ${uploadErr.message}`);
      const { data: logoUrlData } = supabase.storage.from("social-arts").getPublicUrl(logoPath);

      console.log("✅ Logo extracted and uploaded:", logoUrlData.publicUrl);
      return new Response(JSON.stringify({ logo_url: logoUrlData.publicUrl }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // BOLA/IDOR guard: ensure caller belongs to the target org
    if (organization_id) {
      await assertOrgMember(supabase, _authUser.id, organization_id);
    }

    // Debit credits BEFORE generation (skip for test orgs and before GPS is approved)
    const isTestOrg = typeof organization_id === "string" && organization_id.startsWith("test-");
    if (organization_id && !isTestOrg) {
      const { data: gpsApproved } = await supabase
        .from("marketing_strategies")
        .select("id")
        .eq("organization_id", organization_id)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();

      if (!gpsApproved) {
        console.log("GPS not yet approved — skipping credit debit");
      } else {
        const { error: debitError } = await supabase.rpc("debit_credits", {
          _org_id: organization_id,
          _amount: CREDIT_COST,
          _description: "Arte de rede social gerada",
          _source: "client-posts",
        });
        if (debitError) {
          const isInsufficient = debitError.message?.includes("INSUFFICIENT_CREDITS") || debitError.message?.includes("WALLET_NOT_FOUND");
          return new Response(
            JSON.stringify({ error: isInsufficient ? "INSUFFICIENT_CREDITS" : debitError.message }),
            { status: isInsufficient ? 402 : 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }
        console.log(`✅ Debited ${CREDIT_COST} credits from org ${organization_id}`);
      }
    }

    const estilo = identidade_visual?.estilo || identidade_visual?.style || manual_style || "";

    // Feedback history
    let feedbackContext = "";
    if (organization_id) {
      feedbackContext = await getFeedbackHistory(supabase, organization_id);
    }

    // ─── Classify restrictions (Phase 1: Smart Restrictions) ───
    let classifiedRestrictions: ClassifiedRestrictions | undefined;
    if (restrictions && restrictions.trim().length > 0) {
      console.log("🔍 Classifying user restrictions...");
      classifiedRestrictions = await classifyRestrictions(LOVABLE_API_KEY, restrictions);
    }

    // Build enriched prompt for CoT (in English labels)
    let enrichedPrompt = prompt || "";
    if (topic) enrichedPrompt += `\nTopic/Subject: ${topic}`;
    if (audience) enrichedPrompt += `\nTarget Audience: ${audience}`;
    if (objective) enrichedPrompt += `\nObjective: ${objective}`;
    if (cena) enrichedPrompt += `\nScene: ${cena}`;
    if (elementos_visuais) enrichedPrompt += `\nVisual elements: ${elementos_visuais}`;
    if (elements && elements.length > 0) enrichedPrompt += `\nDesired elements: ${elements.join(", ")}`;
    if (headline) enrichedPrompt += `\nHeadline: ${headline}`;
    if (subheadline) enrichedPrompt += `\nSubheadline: ${subheadline}`;
    if (supporting_text) enrichedPrompt += `\nSupporting text: ${supporting_text}`;
    if (bullet_points) enrichedPrompt += `\nBullet points: ${bullet_points}`;
    if (cta) enrichedPrompt += `\nCTA: ${cta}`;
    if (tipo_postagem) enrichedPrompt += `\nPost type: ${tipo_postagem}`;
    if (brand_name) enrichedPrompt += `\nBrand: ${brand_name}`;
    if (layout_type) enrichedPrompt += `\nLayout type: ${layout_type}`;
    if (logo_url) enrichedPrompt += `\nBrand logo: provided as separate image`;
    if (restrictions) enrichedPrompt += `\nNEGATIVE CONSTRAINTS (AVOID): ${restrictions}`;
    if (feedbackContext) enrichedPrompt += feedbackContext;

    // Convert reference images to base64 EARLY so CoT can use them too
    const hasRefs = reference_images && reference_images.length > 0;
    const base64Refs: { type: string; image_url: { url: string } }[] = [];

    if (hasRefs) {
      console.log(`📥 Converting ${Math.min(reference_images.length, 5)} reference images to base64...`);
      for (const refUrl of reference_images.slice(0, 5)) {
        const b64 = await urlToBase64(refUrl);
        if (b64) {
          base64Refs.push({ type: "image_url", image_url: { url: b64 } });
        }
      }
      console.log(`✅ ${base64Refs.length} reference images converted`);
    }

    // Chain-of-Thought optimization (NOW receives reference images + classified restrictions!)
    console.log(`🧠 Starting chain-of-thought for ${format} image (refs for CoT: ${base64Refs.length}, restrictions classified: ${!!classifiedRestrictions})...`);

    const optimized = await analyzeAndOptimizePrompt(LOVABLE_API_KEY, {
      userPrompt: enrichedPrompt,
      format,
      nivel: nivel || "simples",
      estilo,
      identidade_visual,
      persona,
      tipo_postagem,
      headline,
      subheadline,
      cta,
      cena,
      elementos_visuais,
      manual_colors,
      manual_style,
      brand_name,
      supporting_text,
      bullet_points,
      layout_type,
      logo_url,
      primary_ref_index,
      objective,
      classifiedRestrictions,
    }, base64Refs.length > 0 ? base64Refs : undefined);

    // Quality, style and layout instructions
    const qualityInstructions = getQualityInstructions(nivel || "simples");
    const artStyleInstructions = art_style ? getArtStyleInstructions(art_style) : "";
    const layoutInstructions = layout_type ? getLayoutRulesForPrompt(layout_type) : "";

    const formatDescMap: Record<string, string> = {
      feed: "square 1:1 (1080×1080px) social media post for Instagram feed",
      portrait: "portrait 4:5 (1080×1350px) social media post for Instagram",
      story: "vertical 9:16 (1080×1920px) story/reel for Instagram Stories",
      banner: "landscape 16:9 (1920×1080px) banner for social media cover",
      // Print formats
      cartao_visita: "business card front (1063×591px, 9×5cm at 300dpi) for CMYK print",
      cartao_visita_verso: "business card back (1063×591px, 9×5cm at 300dpi) for CMYK print",
      flyer_a5: "A5 flyer (1748×2480px, 14.8×21cm at 300dpi) for CMYK print",
      flyer_a4: "A4 flyer (2480×3508px, 21×29.7cm at 300dpi) for CMYK print",
      banner_100x60: "large banner (1920×1152px, 100×60cm) for CMYK print",
    };
    const formatDescription = formatDescMap[format] || formatDescMap.feed;

    // Print mode instructions
    const isPrint = output_mode === "print";

    // Build final prompt
    let fullPrompt: string;

    if (optimized) {
      fullPrompt = buildFinalPrompt(optimized, qualityInstructions, artStyleInstructions, formatDescription, hasRefs, classifiedRestrictions);
    } else {
      fullPrompt = buildFallbackPrompt(
        { prompt, cena, headline, subheadline, cta, brand_name, elementos_visuais, supporting_text, bullet_points },
        qualityInstructions, artStyleInstructions, formatDescription,
        identidade_visual, manual_colors, manual_style, classifiedRestrictions,
      );
    }

    // Add print-specific instructions
    if (isPrint) {
      fullPrompt += `\n\nPRINT MODE (CMYK): This design is for PHYSICAL PRINTING. Use CMYK-safe colors only — NO neon, fluorescent, or overly saturated RGB colors. Ensure high resolution suitable for 300dpi print. Design should have proper bleed margins. Text must be extra crisp for print quality.`;
    }

    // Append layout instructions to prompt if not already in CoT
    if (layoutInstructions && !optimized) {
      fullPrompt += `\n\n${layoutInstructions}`;
    }

    // Inject objective-based style direction
    const objectiveStyleMap: Record<string, string> = {
      sales: "OBJECTIVE STYLE: High contrast, bold headline, aggressive layout, prominent CTA. Colors should be vibrant and attention-grabbing.",
      leads: "OBJECTIVE STYLE: Clean and clear layout, objective message, clean visual, focus on action. CTA must be the most prominent element.",
      engagement: "OBJECTIVE STYLE: Eye-catching visual, dynamic rhythm, appealing imagery. Layout should invite interaction.",
      authority: "OBJECTIVE STYLE: Minimal clutter, elegant, well-organized, generous breathing room. Premium and refined feel.",
      informative: "OBJECTIVE STYLE: Clear hierarchy of information, blocks of content, logical organization. Easy to scan and digest.",
    };
    if (objective && objectiveStyleMap[objective]) {
      fullPrompt += `\n\n${objectiveStyleMap[objective]}`;
    }

    // Inject audience context
    if (audience) {
      fullPrompt += `\n\nTARGET AUDIENCE: ${audience}. Adapt visual language, tone, and imagery to resonate with this audience.`;
    }

    // Instruct the model to RESERVE SPACE for the logo instead of rendering it
    if (logo_url) {
      fullPrompt += `\n\nBRAND LOGO PLACEMENT: Leave a CLEAN, EMPTY rectangular space (approximately 10-15% of image width) in the top-left corner of the design for the brand logo. This space must have a solid, uniform background matching the surrounding design — do NOT place any text, graphics, or busy patterns there. The logo will be composited in post-production. DO NOT render any logo, logotype, brand mark, or brand name text ANYWHERE in the image.`;
    }

    // Convert photo_images to base64 for inclusion in the design
    const photoBase64s: { type: string; image_url: { url: string } }[] = [];
    if (photo_images && photo_images.length > 0) {
      console.log(`📷 Converting ${photo_images.length} photo images for inclusion in art...`);
      for (const photoUrl of photo_images.slice(0, 4)) {
        const b64 = await urlToBase64(photoUrl);
        if (b64) photoBase64s.push({ type: "image_url", image_url: { url: b64 } });
      }
      fullPrompt += `\n\nPHOTOS TO INCLUDE IN THE DESIGN: ${photoBase64s.length} photo(s) have been attached. These photos MUST appear as visual elements IN the final design composition. Incorporate them naturally into the layout — they are real product/person/place photos that the client wants visible in the art. Do NOT use them just as style reference.
MANDATORY PHOTO RESTRICTION: Use ONLY the attached photos as visual/photographic elements. Do NOT generate, add, or include ANY additional photographs, people, objects, or illustrated elements beyond the provided photos.`;
    }

    // ─── LAYOUT CUSTOMIZATION RULES (from Step 8 personalizer) ───
    // Injected before CRITICAL TEXT RULES so they take precedence over template defaults.
    const customizationRules: string[] = [];

    if (logo_position === "none") {
      customizationRules.push("DO NOT include any brand logo, logotype, brand mark or brand name text anywhere in the image.");
    } else if (logo_position) {
      const posLabel = String(logo_position).replace("_", " ");
      customizationRules.push(`LOGO POSITION: Reserve clean empty space for the brand logo at the ${posLabel} corner of the composition.`);
    }

    if (title_position) {
      const zoneMap: Record<string, string> = {
        top:    "upper third (top zone) of the canvas",
        center: "center of the canvas, vertically and horizontally balanced",
        bottom: "lower third (bottom zone) of the canvas",
      };
      customizationRules.push(`TITLE POSITION: Place the main headline in the ${zoneMap[title_position] || "center"}.`);
    }

    if (background_type === "solid_color" && primary_color) {
      customizationRules.push(`BACKGROUND: Solid flat color ${primary_color}. NO photographs, NO textures, NO gradients — completely uniform color across the entire canvas.`);
    } else if (background_type === "gradient") {
      const a = primary_color || "#000000";
      const b = secondary_color || "#ffffff";
      customizationRules.push(`BACKGROUND: Smooth diagonal gradient from ${a} to ${b}. NO photographs, NO textures — only the gradient.`);
    } else if (background_type === "clean") {
      customizationRules.push(`BACKGROUND: Pure white or very light off-white background, completely clean with NO imagery, NO photos, NO textures.`);
    } else if (background_type === "ai_photo") {
      customizationRules.push(`BACKGROUND: A high-quality photographic background appropriate to the topic, with subtle dark overlay for text legibility.`);
    }

    if (color_tone) {
      const toneMap: Record<string, string> = {
        brand:   `Use the brand palette strictly: primary color ${primary_color || "#000000"}, secondary color ${secondary_color || "#ffffff"}. Do not introduce other dominant colors.`,
        neutral: "Color palette: neutral tones — warm grays, off-white, charcoal, beige. NO saturated colors. Refined and editorial.",
        vibrant: "Color palette: vibrant saturated bold colors — high-energy and attention-grabbing. Use bright primaries and contrasting accents.",
        dark:    "Color palette: dark luxurious — near-black or deep navy background with a single bright metallic or jewel-tone accent color.",
        pastel:  "Color palette: soft pastels — muted desaturated tones with high lightness (light pinks, mint, lavender, peach). Gentle and friendly.",
      };
      customizationRules.push(`COLOR TONE: ${toneMap[color_tone] || toneMap.brand}`);
    }

    if (customizationRules.length > 0) {
      fullPrompt += `\n\nLAYOUT CUSTOMIZATION (MANDATORY — overrides template defaults):\n- ${customizationRules.join("\n- ")}`;
    }

    // ─── CRITICAL TEXT RENDERING RULES (always appended last) ───
    fullPrompt += `

CRITICAL TEXT RENDERING RULES (MANDATORY):
- All text must be crisp, sharp, and perfectly legible at thumbnail size
- Use HIGH CONTRAST: white text on dark backgrounds OR dark text on light backgrounds — never low-contrast combinations
- Font size hierarchy (relative to a 1080px design): headline minimum ~60px equivalent, subheadline ~36px, body ~24px
- NEVER place text over busy/detailed image areas — use solid color overlays, gradients, or clean negative space behind text
- Text alignment must be centered or left-aligned only — NEVER diagonal, vertical, curved, or rotated
- Maximum 3 lines per text block
- Leave at least 40px equivalent padding around all text elements
- Maximum 3 text blocks total in the whole composition (headline + subheadline + CTA), no more than ~40 words combined
- NO text shadows, glows, outlines or blur effects — text must be flat, clean, and typographically pure
- Spelling and accents in Brazilian Portuguese must be 100% correct`;

    console.log(`🎨 Generating ${format} image (refs: ${base64Refs.length}, photos: ${photoBase64s.length}, layout: ${layout_type || "none"}, logo: ${logo_url ? "YES" : "NO"}, CoT: ${optimized ? "YES" : "FALLBACK"}, restrictions: ${classifiedRestrictions ? "CLASSIFIED" : "none"})...`);
    console.log(`📝 Final prompt preview: ${fullPrompt.slice(0, 800)}...`);

    // Stage 2: Generate image (with photo images if provided)
    let messageContent: string | { type: string; text?: string; image_url?: { url: string } }[];
    if (photoBase64s.length > 0) {
      messageContent = [
        { type: "text", text: fullPrompt },
        ...photoBase64s,
      ];
    } else {
      messageContent = fullPrompt;
    }

    // ─── Stage 2: Generate with primary model + fallback ───
    // Primary: Gemini 3.1 Flash Image (Nano Banana 2) — fast & cheap
    // Fallback: Gemini 3 Pro Image — slower but stronger on complex typography
    // 429/402 errors propagate immediately (fallback won't help with rate/credits)
    const PRIMARY_MODEL = "google/gemini-3.1-flash-image-preview";
    const FALLBACK_MODEL = "google/gemini-3-pro-image-preview";

    async function callImageModel(model: string) {
      return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: messageContent }],
          modalities: ["image", "text"],
        }),
      });
    }

    let usedModel = PRIMARY_MODEL;
    const response = await callImageModel(PRIMARY_MODEL);

    // Hard stops on rate limit / credit exhaustion — never fall back
    if (response.status === 429) {
      const errorText = await response.text();
      console.error("AI image gateway rate-limited:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento." }), {
        status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      const errorText = await response.text();
      console.error("AI image gateway credits exhausted:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let data: any = null;
    let imageData: string | undefined;

    if (response.ok) {
      data = await response.json();
      imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    } else {
      const errorText = await response.text();
      console.warn(`⚠️ Primary model ${PRIMARY_MODEL} failed (${response.status}): ${errorText.slice(0, 300)}`);
    }

    // Fallback when primary returned non-OK or returned no image
    if (!imageData) {
      console.log(`🔁 Falling back to ${FALLBACK_MODEL}...`);
      const fbResponse = await callImageModel(FALLBACK_MODEL);

      if (fbResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento." }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (fbResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (!fbResponse.ok) {
        const errorText = await fbResponse.text();
        console.error("AI image gateway fallback error:", fbResponse.status, errorText);
        throw new Error(`AI image gateway error: ${fbResponse.status}`);
      }
      data = await fbResponse.json();
      imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      usedModel = FALLBACK_MODEL;
    }

    if (!imageData) {
      console.error("No image in response (both models):", JSON.stringify(data).slice(0, 500));
      throw new Error("No image generated");
    }

    console.log(`✅ Image generated by model: ${usedModel}`);

    // ─── Stage 3: Logo Composition (overlay real logo) ───
    if (logo_url) {
      console.log("🖼️ Stage 3: Compositing brand logo onto generated art...");
      const logoB64 = await urlToBase64(logo_url);
      if (logoB64) {
        try {
          const compositeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3.1-flash-image-preview",
              messages: [{
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `You are a professional graphic designer doing final production. 

TASK: Place the brand logo (second image) onto the design artwork (first image).

RULES:
- Place the logo in the top-left corner area of the design
- Scale the logo to approximately 8-12% of the image width
- The logo must appear EXACTLY as provided — same colors, same shape, same proportions, same text
- Do NOT redraw, stylize, modify, reinterpret, or simplify the logo in ANY way
- Do NOT change any other part of the design — keep everything else pixel-perfect
- If there is already a logo or brand mark visible in the design, REMOVE IT and replace with the provided logo
- There must be EXACTLY ONE logo in the final image — the one provided
- Maintain the overall design composition and quality
- Do NOT add any text, elements, or modifications beyond placing the logo

CONTRAST PROTECTION (CRITICAL):
- Analyze the dominant color of the area where the logo will be placed
- If the logo and background have LOW CONTRAST (both dark or both light), you MUST use ONE of these two strategies:
  STRATEGY A — BACKGROUND SHAPE: Place a solid rounded rectangle (pill shape) in a contrasting color behind the logo. Use a fully opaque, clean shape that matches the design style. Example: white pill behind dark logo on dark background, or dark pill behind light logo on light background.
  STRATEGY B — COLOR INVERSION: Invert the logo colors to contrast with the background. Example: if the logo is black and the background is dark, render the logo in white instead.
- Choose the strategy that looks most professional for the specific design
- Do NOT use glow, shadow, halo, blur, or semi-transparent effects — they produce unreliable results
- The logo must ALWAYS have 100% legibility regardless of the background

OUTPUT: The same design with the real brand logo composited in, fully legible.`,
                  },
                  { type: "image_url", image_url: { url: imageData } },
                  { type: "image_url", image_url: { url: logoB64 } },
                ],
              }],
              modalities: ["image", "text"],
            }),
          });

          if (compositeResponse.ok) {
            const compositeData = await compositeResponse.json();
            const compositedImage = compositeData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (compositedImage) {
              console.log("✅ Logo composited successfully");
              imageData = compositedImage;
            } else {
              console.warn("⚠️ Stage 3 returned no image, using Stage 2 result");
            }
          } else {
            console.warn("⚠️ Stage 3 failed (HTTP " + compositeResponse.status + "), using Stage 2 result");
          }
        } catch (compErr) {
          console.warn("⚠️ Stage 3 error (non-blocking):", compErr);
        }
      } else {
        console.warn("⚠️ Could not convert logo to base64, skipping Stage 3");
      }
    }

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("social-arts")
      .upload(file_path, binaryData, { contentType: "image/png", upsert: true });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("social-arts").getPublicUrl(file_path);
    console.log(`✅ Image uploaded: ${urlData.publicUrl}`);

    return new Response(JSON.stringify({ url: urlData.publicUrl }), {
      headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("generate-social-image error", { error: String(e) });
    return authErrorResponse(e, getCorsHeaders(req));
  }
});
