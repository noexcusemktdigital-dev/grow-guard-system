import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST = 100;

// --- Chain-of-Thought: Analyze & optimize prompt via Flash model ---

interface OptimizedPromptResult {
  optimized_prompt: string;
  composition_notes: string;
  color_strategy: string;
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
    // Structured fields
    tipo_postagem?: string;
    headline?: string;
    subheadline?: string;
    cta?: string;
    cena?: string;
    elementos_visuais?: string;
    manual_colors?: string;
    manual_style?: string;
  }
): Promise<OptimizedPromptResult | null> {
  const { userPrompt, format, nivel, estilo, identidade_visual, persona } = context;

  const systemPrompt = `You are an elite prompt engineer specialized in AI image generation (Gemini, DALL-E, Midjourney).

Your job: Analyze the user's structured briefing and all brand context, then produce an OPTIMIZED visual prompt in English that will generate the highest-quality social media image possible.

IMPORTANT: The art_style determines whether this should be a GRAPHIC DESIGN or a PHOTOGRAPH/IMAGE.
- Styles starting with "grafica_" → Generate a FLAT GRAPHIC DESIGN (shapes, color blocks, patterns). NOT a photograph.
- Styles starting with "foto_" → Generate a PHOTOGRAPHIC image (cinematic, editorial, product photography).
- "ilustracao" → Generate a DIGITAL ILLUSTRATION (flat/3D, vector-like aesthetic).
- "collage" → Generate a MIXED-MEDIA COLLAGE (layered elements, textures, photo cutouts).

Your optimized prompt must:
- Be 200-400 words, highly descriptive and specific
- Describe exact visual elements, lighting, materials, textures, camera angle
- Apply the brand's color palette strategically (specify WHERE each color appears)
- Match the visual style/tone to the target audience
- Include composition details (focal point, negative space for text overlay, visual hierarchy)
- Reference real-world photography/design aesthetics for the AI to emulate
- NEVER include any text, letters, words, logos, or watermarks in the image description
- Use the structured briefing fields (headline, scene, elements) to build a precise visual description`;

  // Build structured briefing section
  let structuredBrief = `ORIGINAL USER INPUT: ${userPrompt}`;
  if (context.tipo_postagem) structuredBrief += `\nPOST TYPE: ${context.tipo_postagem}`;
  if (context.headline) structuredBrief += `\nHEADLINE TEXT (to be overlaid, NOT rendered in image): "${context.headline}"`;
  if (context.subheadline) structuredBrief += `\nSUBHEADLINE: "${context.subheadline}"`;
  if (context.cta) structuredBrief += `\nCTA: "${context.cta}"`;
  if (context.cena) structuredBrief += `\nSCENE DESCRIPTION: ${context.cena}`;
  if (context.elementos_visuais) structuredBrief += `\nSPECIFIC VISUAL ELEMENTS TO INCLUDE: ${context.elementos_visuais}`;

  const formatDesc: Record<string, string> = {
    feed: "Square 1:1 (1080×1080px) for Instagram feed",
    portrait: "Portrait 4:5 (1080×1350px) for Instagram feed optimized",
    story: "Vertical 9:16 (1080×1920px) for Stories/Reels",
    banner: "Landscape 16:9 (1920×1080px) for banners",
  };

  // Build identity section
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

Analyze everything above and produce the optimized visual prompt, composition notes, and color strategy.`;

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
              name: "optimized_visual_prompt",
              description: "Return the optimized visual prompt, composition notes, and color strategy.",
              parameters: {
                type: "object",
                properties: {
                  optimized_prompt: { type: "string", description: "Detailed visual prompt in English, 200-400 words" },
                  composition_notes: { type: "string", description: "Notes about composition, focal point, layout" },
                  color_strategy: { type: "string", description: "How brand colors will be applied in the image" },
                },
                required: ["optimized_prompt", "composition_notes", "color_strategy"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "optimized_visual_prompt" } },
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
      console.log("✅ Chain-of-thought optimized prompt:", parsed.optimized_prompt.slice(0, 200) + "...");
      return parsed as OptimizedPromptResult;
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
      // Structured fields
      tipo_postagem, headline, subheadline, cta, cena, elementos_visuais,
      manual_colors, manual_style,
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
    if (headline) enrichedPrompt += `\nHeadline (text overlay, NOT in image): ${headline}`;
    if (subheadline) enrichedPrompt += `\nSubheadline: ${subheadline}`;
    if (cta) enrichedPrompt += `\nCTA: ${cta}`;
    if (tipo_postagem) enrichedPrompt += `\nTipo: ${tipo_postagem}`;
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
    });

    // Build final prompt
    const qualityInstructions = getQualityInstructions(nivel || "simples");
    const artStyleInstructions = art_style ? getArtStyleInstructions(art_style) : "";

    const aspectMap: Record<string, string> = {
      feed: "OUTPUT FORMAT: Square (1:1), 1080×1080px.",
      portrait: "OUTPUT FORMAT: Portrait (4:5), 1080×1350px.",
      story: "OUTPUT FORMAT: Vertical (9:16), 1080×1920px.",
      banner: "OUTPUT FORMAT: Landscape (16:9), 1920×1080px.",
    };
    const aspectInstruction = aspectMap[format] || aspectMap.feed;

    const visualBrief = optimized
      ? `OPTIMIZED VISUAL BRIEF (AI-analyzed):
${optimized.optimized_prompt}

COMPOSITION STRATEGY: ${optimized.composition_notes}
COLOR APPLICATION: ${optimized.color_strategy}`
      : `VISUAL BRIEF:
${enrichedPrompt}`;

    const fullPrompt = `You are a world-class art director creating a single social media visual asset.

${qualityInstructions}

${artStyleInstructions ? `\n${artStyleInstructions}\n` : ""}

${aspectInstruction}

COMPOSITION RULES:
- Reserve clear, low-detail space for text overlay (top 20% OR bottom 25%)
- Create visual hierarchy: one unmistakable focal point
- Professional color theory: complementary/analogous relationships
- Must work at small mobile screen sizes

ABSOLUTE RULES (NEVER VIOLATE):
- ZERO text, letters, numbers, words, logos, or watermarks in the image
- ZERO generic stock photo aesthetics
- ZERO busy backgrounds that compete with the focal point

${visualBrief}

Generate this image now. Prioritize brand color accuracy and compositional excellence.`;

    console.log(`🎨 Generating ${format} image (refs: ${reference_images?.length || 0}, chain-of-thought: ${optimized ? "YES" : "FALLBACK"})...`);

    const hasRefs = reference_images && reference_images.length > 0;
    const messageContent: any = hasRefs
      ? [
          { type: "text", text: fullPrompt },
          ...reference_images.slice(0, 3).map((url: string) => ({
            type: "image_url",
            image_url: { url },
          })),
          { type: "text", text: "Study the provided reference images and match their visual style, color treatment, composition approach, and overall aesthetic. The generated image must feel like it belongs to the same visual family." },
        ]
      : fullPrompt;

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
