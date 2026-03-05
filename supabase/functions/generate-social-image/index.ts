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

  const systemPrompt = `You are an elite prompt engineer specialized in AI image generation for social media marketing.

Your job: Analyze the user's structured briefing and brand context, then produce a STRUCTURED visual prompt that will generate high-quality social media images with integrated text and marketing layout.

The output image WILL contain text rendered directly in the design (headline, CTA, brand name). This is intentional — the AI model supports text rendering.

IMPORTANT: The art_style determines the visual approach:
- Styles starting with "grafica_" → FLAT GRAPHIC DESIGN (shapes, color blocks, patterns)
- Styles starting with "foto_" → PHOTOGRAPHIC image (cinematic, editorial)
- "ilustracao" → DIGITAL ILLUSTRATION
- "collage" → MIXED-MEDIA COLLAGE

Your output must describe:
- scene: What is happening, who is in it, what they're doing. Be specific about ethnicity (Brazilian), expressions, actions. 150-250 words.
- environment: Setting, lighting, atmosphere. Be cinematic and specific.
- design_layout: How the image is composed (e.g. "Top portion: lifestyle photo. Bottom portion: dark rounded card with text and colored highlights"). Include icon elements if relevant.
- color_palette: Specific colors from the brand, where they appear.
- mood: 5-10 mood keywords separated by commas.
- style_closing: A single closing line like "Ultra realistic photography with modern marketing layout" or "Clean flat graphic design with bold typography".

NEVER output generic descriptions. Be as specific as the brand context allows.`;

  // Build structured briefing
  let structuredBrief = `ORIGINAL USER INPUT: ${userPrompt}`;
  if (context.tipo_postagem) structuredBrief += `\nPOST TYPE: ${context.tipo_postagem}`;
  if (context.headline) structuredBrief += `\nHEADLINE: "${context.headline}"`;
  if (context.subheadline) structuredBrief += `\nSUBHEADLINE: "${context.subheadline}"`;
  if (context.cta) structuredBrief += `\nCTA: "${context.cta}"`;
  if (context.cena) structuredBrief += `\nSCENE DESCRIPTION: ${context.cena}`;
  if (context.elementos_visuais) structuredBrief += `\nVISUAL ELEMENTS TO INCLUDE: ${context.elementos_visuais}`;
  if (context.brand_name) structuredBrief += `\nBRAND NAME: ${context.brand_name}`;

  const formatDesc: Record<string, string> = {
    feed: "Square 1:1 (1080×1080px) for Instagram feed",
    portrait: "Portrait 4:5 (1080×1350px) for Instagram feed optimized",
    story: "Vertical 9:16 (1080×1920px) for Stories/Reels",
    banner: "Landscape 16:9 (1920×1080px) for banners",
  };

  let identitySection = "";
  if (identidade_visual) {
    identitySection = `BRAND IDENTITY:
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

${identitySection || "No brand identity provided."}

${persona ? `TARGET AUDIENCE: ${persona.nome ? `${persona.nome} — ` : ""}${persona.descricao || "general audience"}` : "No specific target audience."}

Analyze everything above and produce the structured visual prompt sections.`;

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
              description: "Return the structured visual prompt sections for image generation.",
              parameters: {
                type: "object",
                properties: {
                  scene: { type: "string", description: "Detailed scene description with characters, actions, expressions. 150-250 words." },
                  environment: { type: "string", description: "Setting, lighting, atmosphere details." },
                  design_layout: { type: "string", description: "How the image is composed: photo placement, card layouts, icon elements." },
                  color_palette: { type: "string", description: "Specific brand colors and where they appear." },
                  mood: { type: "string", description: "5-10 mood keywords separated by commas." },
                  style_closing: { type: "string", description: "Single closing style line." },
                  brand_design_elements: { type: "string", description: "List 5-8 specific brand design elements extracted from the identity/references: color scheme details, layout shapes, icon style, typography feel, overall aesthetic. Format as comma-separated items like: black and white base layout, lime green highlight color, rounded card shapes, circular icon elements, modern financial consulting layout, clean sans-serif typography." },
                },
                required: ["scene", "environment", "design_layout", "color_palette", "mood", "style_closing", "brand_design_elements"],
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
      console.log("✅ Chain-of-thought structured prompt:", JSON.stringify(parsed).slice(0, 300) + "...");
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
      return `QUALITY TIER: ULTRA-PREMIUM (Magazine/Campaign Level)
- Cinematic lighting: golden-hour warmth, dramatic shadows, volumetric light rays
- Rich material textures: brushed metal, soft fabric, glossy surfaces
- Depth of field with professional bokeh (f/1.4 - f/2.8)
- Film-like color grading with split-toning`;
    case "elaborado":
      return `QUALITY TIER: PROFESSIONAL (Agency Level)
- Strong directional lighting with fill and accent lights
- Vibrant but harmonious color palette with intentional contrast
- Layered composition: foreground, mid-ground, background depth
- Professional retouching quality`;
    default:
      return `QUALITY TIER: CLEAN PROFESSIONAL (Brand Level)
- Even, well-balanced lighting with soft shadows
- Clean, uncluttered composition with a single focal point
- Professional color balance, properly exposed`;
  }
}

function getArtStyleInstructions(art_style: string): string {
  const artStyleMap: Record<string, string> = {
    grafica_moderna: `ART APPROACH: FLAT GRAPHIC DESIGN — NOT a photograph. Bold color blocks, geometric shapes, clean lines. Like a Canva Pro template.`,
    grafica_elegante: `ART APPROACH: LUXURY GRAPHIC DESIGN — Dark background, gold/metallic accents, ornamental details. Premium feel.`,
    grafica_bold: `ART APPROACH: HIGH-ENERGY GRAPHIC DESIGN — Large bold color blocks, diagonal stripes, vibrant and attention-grabbing.`,
    grafica_minimalista: `ART APPROACH: ULTRA-MINIMALIST GRAPHIC DESIGN — 60%+ negative space, 1-2 subtle elements, monochromatic.`,
    foto_editorial: `ART APPROACH: CINEMATIC EDITORIAL PHOTOGRAPHY. Professional bokeh, rule of thirds, dramatic lighting.`,
    foto_produto: `ART APPROACH: LIFESTYLE PRODUCT PHOTOGRAPHY. Textured surface, soft directional lighting, curated styling.`,
    ilustracao: `ART APPROACH: MODERN DIGITAL ILLUSTRATION. Flat/soft 3D, vector-like, friendly and professional.`,
    collage: `ART APPROACH: CREATIVE MIXED-MEDIA COLLAGE. Layered photos with graphic shapes, torn paper edges, contemporary.`,
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

    let summary = "\n\nFEEDBACK HISTORY:";
    if (approved.length > 0) {
      summary += `\n- ${approved.length} arts APPROVED. Themes: ${approved.slice(0, 5).map((a: any) => a.prompt_used?.slice(0, 80) || "N/A").join("; ")}`;
    }
    if (rejected.length > 0) {
      summary += `\n- ${rejected.length} arts REJECTED. Avoid: ${rejected.slice(0, 5).map((r: any) => `"${r.prompt_used?.slice(0, 60)}" ${r.feedback_note ? `(${r.feedback_note})` : ""}`).join("; ")}`;
    }
    return summary;
  } catch {
    return "";
  }
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

    // Build enriched prompt from structured fields
    let enrichedPrompt = prompt || "";
    if (cena) enrichedPrompt += `\nCena: ${cena}`;
    if (elementos_visuais) enrichedPrompt += `\nElementos: ${elementos_visuais}`;
    if (headline) enrichedPrompt += `\nHeadline: ${headline}`;
    if (subheadline) enrichedPrompt += `\nSubheadline: ${subheadline}`;
    if (cta) enrichedPrompt += `\nCTA: ${cta}`;
    if (tipo_postagem) enrichedPrompt += `\nTipo: ${tipo_postagem}`;
    if (brand_name) enrichedPrompt += `\nMarca: ${brand_name}`;
    if (feedbackContext) enrichedPrompt += feedbackContext;

    // Chain-of-Thought optimization
    console.log(`🧠 Starting chain-of-thought for ${format} image (structured: ${!!cena})...`);

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

    // Build final structured prompt
    const qualityInstructions = getQualityInstructions(nivel || "simples");
    const artStyleInstructions = art_style ? getArtStyleInstructions(art_style) : "";

    const formatDescMap: Record<string, string> = {
      feed: "Square 1:1 (1080×1080px) social media post",
      portrait: "Portrait 4:5 (1080×1350px) social media post",
      story: "Vertical 9:16 (1080×1920px) story/reels",
      banner: "Landscape 16:9 (1920×1080px) banner",
    };

    // Build text section
    let textSection = "";
    if (headline || subheadline || cta || brand_name || supporting_text || bullet_points) {
      textSection = "\nText in Portuguese:";
      if (headline) textSection += `\nHeadline: ${headline}`;
      if (subheadline) textSection += `\nHighlight headline: ${subheadline}`;
      if (supporting_text) textSection += `\nSupporting text: ${supporting_text}`;
      if (bullet_points) textSection += `\nBullet points: ${bullet_points}`;
      if (cta) textSection += `\nCTA: ${cta}`;
      if (brand_name) textSection += `\nBrand: ${brand_name}`;
    }

    let fullPrompt: string;

    if (optimized) {
      // Structured prompt from chain-of-thought
      fullPrompt = `${qualityInstructions}
${artStyleInstructions ? `\n${artStyleInstructions}\n` : ""}
Scene:
${optimized.scene}

Environment:
${optimized.environment}

Design layout:
${optimized.design_layout}

Color palette:
${optimized.color_palette}

Format:
${formatDescMap[format] || formatDescMap.feed}.
${textSection}

Mood:
${optimized.mood}

${optimized.style_closing}`;
    } else {
      // Fallback: build from raw inputs
      fullPrompt = `You are a world-class art director creating a social media visual asset.

${qualityInstructions}
${artStyleInstructions ? `\n${artStyleInstructions}\n` : ""}
Scene:
${cena || prompt || "Professional social media post"}

Format:
${formatDescMap[format] || formatDescMap.feed}.
${textSection}

COMPOSITION RULES:
- Create visual hierarchy with a clear focal point
- Professional color theory: complementary/analogous relationships
- Must work at small mobile screen sizes

${enrichedPrompt}

Generate this image now.`;
    }

    console.log(`🎨 Generating ${format} image (refs: ${reference_images?.length || 0}, chain-of-thought: ${optimized ? "YES" : "FALLBACK"})...`);

    // Build message content with reference images (converted to base64)
    const hasRefs = reference_images && reference_images.length > 0;
    const brandElements = optimized?.brand_design_elements
      ? optimized.brand_design_elements
      : "color palette, layout structure, card shapes, icon elements, typography style, and overall design language";
    const referenceInstruction = `Use the attached images ONLY as brand style references for the visual identity.
Replicate the brand design system including:
${brandElements.split(",").map((e: string) => `- ${e.trim()}`).join("\n")}
IMPORTANT: Do NOT recreate the same people, same scene or same composition from the references.
Create a NEW scene that follows the same brand design language.`;

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
        console.log(`✅ ${base64Refs.length} reference images converted to base64`);
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
