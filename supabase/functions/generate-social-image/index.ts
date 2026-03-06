import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST = 100;

// --- Fetch URL and convert to base64 data URI ---

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch reference image (${res.status}): ${url}`);
      return null;
    }
    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.warn(`Error fetching reference image: ${url}`, err);
    return null;
  }
}

// --- Structured prompt result from chain-of-thought ---

interface StructuredPromptResult {
  scene: string;
  environment: string;
  design_layout: string;
  color_palette: string;
  mood: string;
  style_closing: string;
  brand_design_elements: string;
  text_overlay_instructions: string;
}

async function analyzeAndOptimizePrompt(
  apiKey: string,
  context: {
    userPrompt: string;
    format: string;
    nivel: string;
    estilo: string;
    identidade_visual: any;
    persona: any;
    tipo_postagem?: string;
    headline?: string;
    subheadline?: string;
    cta?: string;
    cena?: string;
    elementos_visuais?: string;
    manual_colors?: string;
    manual_style?: string;
    brand_name?: string;
  }
): Promise<StructuredPromptResult | null> {
  const { userPrompt, format, nivel, estilo, identidade_visual, persona } = context;

  const systemPrompt = `You are an elite visual prompt engineer for AI image generation models. Your ONLY job is to produce a structured visual prompt in FLUENT ENGLISH that will generate a professional social media marketing image.

CRITICAL RULES:
1. ALL output MUST be in ENGLISH. No Portuguese whatsoever.
2. The image model renders text directly into the design — describe WHERE and HOW text should appear.
3. Be hyper-specific about composition, colors, lighting, and spatial layout.
4. Never use vague descriptions like "professional look" or "modern design". Be CONCRETE.

The art_style determines the visual approach:
- Styles starting with "grafica_" → FLAT GRAPHIC DESIGN (vector shapes, color blocks, geometric patterns, NO photographs)
- Styles starting with "foto_" → PHOTOGRAPHIC (cinematic, editorial, real people/objects)
- "ilustracao" → DIGITAL ILLUSTRATION (vector-like, friendly, stylized)
- "collage" → MIXED-MEDIA COLLAGE (layered photos + graphic elements)

OUTPUT SECTIONS (all in English):

1. **scene**: Detailed visual description — who/what is in the image, what's happening, expressions, poses, objects. For graphic styles, describe shapes, icons, and abstract elements instead of people. 100-200 words.

2. **environment**: Background, lighting, atmosphere. Be cinematic and specific (e.g. "soft gradient from deep navy #1a1a2e to charcoal #16213e" not "dark background").

3. **design_layout**: Precise spatial composition — describe the exact layout grid. Example: "Upper 60%: hero photograph with subject off-center right. Lower 40%: solid dark card with rounded corners containing headline text centered, CTA button bottom-right."

4. **color_palette**: List exact colors with hex codes and WHERE each appears (background, text, accents, shapes).

5. **mood**: 5-8 mood keywords, comma-separated.

6. **style_closing**: One definitive style sentence. Examples: "Ultra-realistic editorial photography with integrated marketing typography" or "Bold flat graphic design with geometric shapes and clean sans-serif type."

7. **brand_design_elements**: 5-8 specific design elements as comma-separated items. Example: "navy blue base, lime green accent highlights, rounded card containers, circular icon elements, bold sans-serif headlines, subtle grid pattern overlay."

8. **text_overlay_instructions**: Precise instructions for how text should be rendered in the image. Describe font style (bold, light, serif, sans-serif), size hierarchy (headline largest, subtext smaller), positioning (centered, left-aligned), and visual treatment (white on dark, colored accent on specific words). Example: "Large bold sans-serif headline 'BOOST YOUR SALES' in white, centered in the lower card. Below it, smaller regular weight subtext 'Start today' in light gray. Brand name 'ACME' in top-left corner, small caps, lime green."

EXAMPLE OF EXCELLENT OUTPUT for a fitness brand post:
- scene: "A dynamic composition featuring bold geometric shapes — a large circle in electric blue overlapping a diagonal stripe in coral. Inside the circle, a stylized dumbbell icon in white. Scattered small dots and lines create energy and movement."
- design_layout: "Full bleed design. Left 40%: large overlapping geometric shapes. Right 60%: clean space with text stack. Bottom strip: accent color bar with CTA."
- text_overlay_instructions: "Headline 'TRANSFORM YOUR BODY' in bold condensed sans-serif, white, right-aligned in the upper right quadrant. Subline '30 Day Challenge' in regular weight, coral color, directly below. CTA 'JOIN NOW →' in small bold caps inside the bottom coral bar, centered."`;

  // Build structured briefing in English
  let structuredBrief = `USER REQUEST: ${userPrompt}`;
  if (context.tipo_postagem) structuredBrief += `\nPOST TYPE: ${context.tipo_postagem}`;
  if (context.headline) structuredBrief += `\nHEADLINE TEXT (render in image): "${context.headline}"`;
  if (context.subheadline) structuredBrief += `\nSUBHEADLINE TEXT (render in image): "${context.subheadline}"`;
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

Analyze everything above and produce the structured visual prompt sections. Remember: ALL in English, be SPECIFIC, describe text placement precisely.`;

  try {
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
          { role: "user", content: userMessage },
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
                  color_palette: { type: "string", description: "Exact colors with hex codes and where each appears." },
                  mood: { type: "string", description: "5-8 mood keywords, comma-separated." },
                  style_closing: { type: "string", description: "One definitive style sentence." },
                  brand_design_elements: { type: "string", description: "5-8 specific brand design elements, comma-separated." },
                  text_overlay_instructions: { type: "string", description: "Precise instructions for text rendering: font style, size hierarchy, positioning, color, visual treatment for each text element." },
                },
                required: ["scene", "environment", "design_layout", "color_palette", "mood", "style_closing", "brand_design_elements", "text_overlay_instructions"],
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
      console.log("✅ Chain-of-thought structured prompt:", JSON.stringify(parsed).slice(0, 400) + "...");
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

async function getFeedbackHistory(supabase: any, organizationId: string): Promise<string> {
  try {
    const { data: feedback } = await supabase
      .from("social_art_feedback")
      .select("status, prompt_used, style, nivel, feedback_note")
      .eq("organization_id", organizationId)
      .in("status", ["approved", "rejected", "changes_requested"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (!feedback || feedback.length === 0) return "";

    const approved = feedback.filter((f: any) => f.status === "approved");
    const rejected = feedback.filter((f: any) => f.status === "rejected");

    let summary = "\n\nPAST FEEDBACK CONTEXT:";
    if (approved.length > 0) {
      summary += `\n- ${approved.length} images APPROVED. Successful themes: ${approved.slice(0, 5).map((a: any) => a.prompt_used?.slice(0, 80) || "N/A").join("; ")}`;
    }
    if (rejected.length > 0) {
      summary += `\n- ${rejected.length} images REJECTED. Avoid these approaches: ${rejected.slice(0, 5).map((r: any) => `"${r.prompt_used?.slice(0, 60)}" ${r.feedback_note ? `(reason: ${r.feedback_note})` : ""}`).join("; ")}`;
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
): string {
  return `Create a ${formatDescription}.

${qualityInstructions}
${artStyleInstructions ? `\n${artStyleInstructions}\n` : ""}
SCENE:
${optimized.scene}

ENVIRONMENT:
${optimized.environment}

LAYOUT COMPOSITION:
${optimized.design_layout}

COLOR PALETTE:
${optimized.color_palette}

TEXT TO RENDER IN THE IMAGE:
${optimized.text_overlay_instructions}

MOOD: ${optimized.mood}

STYLE: ${optimized.style_closing}

IMPORTANT RENDERING RULES:
- Text must be sharp, legible, and properly spelled
- Maintain strong visual hierarchy between headline, subtext, and CTA
- All text must have sufficient contrast against its background
- Typography should feel intentional and designed, not auto-generated
- The overall composition must be balanced and publication-ready`;
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
  identidade_visual: any,
  manual_colors?: string,
  manual_style?: string,
): string {
  const scene = context.cena || context.prompt || "A professional, visually striking social media marketing post";

  let textBlock = "";
  if (context.headline || context.subheadline || context.cta || context.brand_name) {
    textBlock = "\nTEXT TO RENDER IN THE IMAGE:";
    if (context.headline) textBlock += `\n- HEADLINE (large, bold, prominent): "${context.headline}"`;
    if (context.subheadline) textBlock += `\n- SUBHEADLINE (medium, below headline): "${context.subheadline}"`;
    if (context.supporting_text) textBlock += `\n- SUPPORTING TEXT (small, body copy): "${context.supporting_text}"`;
    if (context.bullet_points) textBlock += `\n- BULLET POINTS (small, listed): "${context.bullet_points}"`;
    if (context.cta) textBlock += `\n- CTA BUTTON or TEXT (accent color, bottom area): "${context.cta}"`;
    if (context.brand_name) textBlock += `\n- BRAND NAME (small, corner placement): "${context.brand_name}"`;
    textBlock += `\n- All text must be sharp, legible, correctly spelled, and have strong contrast.`;
  }

  let colorInfo = "";
  if (identidade_visual?.paleta || identidade_visual?.palette) {
    colorInfo = `\nBRAND COLORS: ${identidade_visual.paleta || identidade_visual.palette}`;
  } else if (manual_colors) {
    colorInfo = `\nBRAND COLORS: ${manual_colors}`;
  }

  let styleInfo = "";
  if (identidade_visual?.estilo || identidade_visual?.style) {
    styleInfo = `\nBRAND STYLE: ${identidade_visual.estilo || identidade_visual.style}`;
  } else if (manual_style) {
    styleInfo = `\nBRAND STYLE: ${manual_style}`;
  }

  return `Create a ${formatDescription}.

${qualityInstructions}
${artStyleInstructions ? `\n${artStyleInstructions}\n` : ""}
SCENE:
${scene}
${context.elementos_visuais ? `\nVisual elements to include: ${context.elementos_visuais}` : ""}
${colorInfo}
${styleInfo}
${textBlock}

COMPOSITION RULES:
- Clear visual hierarchy with a single dominant focal point
- Professional color theory: complementary or analogous color relationships
- Must be legible and impactful at small mobile screen sizes
- Clean, balanced layout that feels intentionally designed

Generate this image now.`;
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      prompt, format, file_path, nivel, persona, identidade_visual,
      organization_id, reference_images, art_style,
      tipo_postagem, headline, subheadline, cta, cena, elementos_visuais,
      manual_colors, manual_style, brand_name,
      supporting_text, bullet_points,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Pre-check credits
    if (organization_id) {
      const { data: wallet } = await supabase
        .from("credit_wallets")
        .select("balance")
        .eq("organization_id", organization_id)
        .maybeSingle();

      if (!wallet || wallet.balance < CREDIT_COST) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Você precisa de " + CREDIT_COST + " créditos." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const estilo = identidade_visual?.estilo || identidade_visual?.style || manual_style || "";

    // Feedback history
    let feedbackContext = "";
    if (organization_id) {
      feedbackContext = await getFeedbackHistory(supabase, organization_id);
    }

    // Build enriched prompt for CoT (in English labels)
    let enrichedPrompt = prompt || "";
    if (cena) enrichedPrompt += `\nScene: ${cena}`;
    if (elementos_visuais) enrichedPrompt += `\nVisual elements: ${elementos_visuais}`;
    if (headline) enrichedPrompt += `\nHeadline: ${headline}`;
    if (subheadline) enrichedPrompt += `\nSubheadline: ${subheadline}`;
    if (cta) enrichedPrompt += `\nCTA: ${cta}`;
    if (tipo_postagem) enrichedPrompt += `\nPost type: ${tipo_postagem}`;
    if (brand_name) enrichedPrompt += `\nBrand: ${brand_name}`;
    if (feedbackContext) enrichedPrompt += feedbackContext;

    // Chain-of-Thought optimization
    console.log(`🧠 Starting chain-of-thought for ${format} image...`);

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
    });

    // Quality and style instructions
    const qualityInstructions = getQualityInstructions(nivel || "simples");
    const artStyleInstructions = art_style ? getArtStyleInstructions(art_style) : "";

    const formatDescMap: Record<string, string> = {
      feed: "square 1:1 (1080×1080px) social media post for Instagram feed",
      portrait: "portrait 4:5 (1080×1350px) social media post for Instagram",
      story: "vertical 9:16 (1080×1920px) story/reel for Instagram Stories",
      banner: "landscape 16:9 (1920×1080px) banner for social media cover",
    };
    const formatDescription = formatDescMap[format] || formatDescMap.feed;

    // Build final prompt
    let fullPrompt: string;

    if (optimized) {
      fullPrompt = buildFinalPrompt(optimized, qualityInstructions, artStyleInstructions, formatDescription);
    } else {
      fullPrompt = buildFallbackPrompt(
        { prompt, cena, headline, subheadline, cta, brand_name, elementos_visuais, supporting_text, bullet_points },
        qualityInstructions, artStyleInstructions, formatDescription,
        identidade_visual, manual_colors, manual_style,
      );
    }

    console.log(`🎨 Generating ${format} image (refs: ${reference_images?.length || 0}, CoT: ${optimized ? "YES" : "FALLBACK"})...`);
    console.log(`📝 Final prompt preview: ${fullPrompt.slice(0, 500)}...`);

    // Build message content with reference images
    const hasRefs = reference_images && reference_images.length > 0;
    const brandElements = optimized?.brand_design_elements
      ? optimized.brand_design_elements
      : "color palette, layout structure, card shapes, icon elements, typography style, overall design language";

    const referenceInstruction = `BRAND STYLE REFERENCE IMAGES:
The attached images are examples of the brand's existing visual identity. Study them carefully and replicate:
${brandElements.split(",").map((e: string) => `• ${e.trim()}`).join("\n")}

CRITICAL: Do NOT copy the exact scene, people, or composition from references.
Create a COMPLETELY NEW design that follows the same visual language, color system, and layout patterns.`;

    let messageContent: any = fullPrompt;

    if (hasRefs) {
      console.log(`📥 Converting ${Math.min(reference_images.length, 3)} reference images to base64...`);
      const base64Refs: { type: string; image_url: { url: string } }[] = [];
      for (const refUrl of reference_images.slice(0, 3)) {
        const b64 = await urlToBase64(refUrl);
        if (b64) {
          base64Refs.push({ type: "image_url", image_url: { url: b64 } });
        }
      }
      if (base64Refs.length > 0) {
        console.log(`✅ ${base64Refs.length} reference images converted`);
        messageContent = [
          { type: "text", text: referenceInstruction },
          ...base64Refs,
          { type: "text", text: fullPrompt },
        ];
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: messageContent }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI image gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI image gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      throw new Error("No image generated");
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-social-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
