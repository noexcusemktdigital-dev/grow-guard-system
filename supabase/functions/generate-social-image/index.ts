import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST = 100;

// --- Chain-of-Thought: Step 1 — Analyze & optimize prompt via Flash model ---

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
  }
): Promise<OptimizedPromptResult | null> {
  const { userPrompt, format, nivel, estilo, identidade_visual, persona } = context;

  const systemPrompt = `You are an elite prompt engineer specialized in AI image generation (Gemini, DALL-E, Midjourney).

Your job: Analyze the user's brief and all brand context, then produce an OPTIMIZED visual prompt in English that will generate the highest-quality social media image possible.

Your optimized prompt must:
- Be 200-400 words, highly descriptive and specific
- Describe exact visual elements, lighting, materials, textures, camera angle
- Apply the brand's color palette strategically (specify WHERE each color appears)
- Match the visual style/tone to the target audience
- Include composition details (focal point, negative space for text overlay, visual hierarchy)
- Reference real-world photography/design aesthetics for the AI to emulate
- NEVER include any text, letters, words, logos, or watermarks in the image description

You must also provide composition notes and a color strategy explaining your decisions.`;

  const userMessage = `BRIEF FROM USER: ${userPrompt}

FORMAT: ${format === "feed" ? "Square 1:1 (1080×1080px) for Instagram feed" : "Vertical 9:16 (1080×1920px) for Stories/Reels"}

QUALITY LEVEL: ${nivel || "simples"}

VISUAL STYLE: ${estilo || "modern professional"}

${identidade_visual ? `BRAND IDENTITY:
- Color palette: ${identidade_visual.paleta || "not specified"}
- Style: ${identidade_visual.estilo || "not specified"}
- Visual tone: ${identidade_visual.tom_visual || "not specified"}
- Typography feel: ${identidade_visual.fontes || "not specified"}
- References: ${identidade_visual.referencias || "not specified"}` : "No brand identity provided."}

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
      console.log("📐 Composition notes:", parsed.composition_notes);
      console.log("🎨 Color strategy:", parsed.color_strategy);
      return parsed as OptimizedPromptResult;
    }

    console.warn("Chain-of-thought: no tool call in response, falling back to original prompt.");
    return null;
  } catch (err) {
    console.warn("Chain-of-thought optimization error (non-blocking):", err);
    return null;
  }
}

// --- Helper functions for fallback/fixed instructions ---

function getQualityInstructions(nivel: string): string {
  switch (nivel) {
    case "alto_padrao":
      return `QUALITY TIER: ULTRA-PREMIUM (Magazine/Campaign Level)
- Cinematic lighting: golden-hour warmth, dramatic shadows, volumetric light rays
- Rich material textures: brushed metal, soft fabric, glossy surfaces with realistic reflections
- Depth of field with professional bokeh (f/1.4 - f/2.8 equivalent)
- Color grading: film-like tones, split-toning with warm highlights and cool shadows
- Every element must have photographic or hyper-realistic render quality
- Think: Apple product shoots, Rolex advertisements, luxury fashion editorials`;
    case "elaborado":
      return `QUALITY TIER: PROFESSIONAL (Agency Level)
- Strong directional lighting with fill and accent lights
- Vibrant but harmonious color palette with intentional contrast
- Layered composition: clear foreground interest, mid-ground subject, background depth
- Professional retouching quality: clean edges, consistent shadows
- Think: Nike social media campaigns, Spotify Wrapped visuals`;
    default:
      return `QUALITY TIER: CLEAN PROFESSIONAL (Brand Level)
- Even, well-balanced lighting with soft shadows
- Clean, uncluttered composition with a single clear focal point
- Professional color balance, properly exposed
- Suitable for immediate social media publishing
- Think: Mailchimp illustrations, Stripe marketing visuals`;
  }
}

function getStyleInstructions(estilo: string): string {
  switch (estilo?.toLowerCase()) {
    case "minimalista":
      return `STYLE: MINIMALIST — Vast negative space, max 2-3 elements, monochromatic. Inspired by Muji, Apple.`;
    case "bold":
      return `STYLE: BOLD — Strong color blocking, oversized shapes, dynamic angles. Inspired by Nike, Beats.`;
    case "corporativo":
      return `STYLE: CORPORATE — Navy/charcoal palette, grid-based, subtle gradients. Inspired by McKinsey, IBM.`;
    case "criativo":
      return `STYLE: CREATIVE — Unexpected colors, mixed media, playful asymmetry. Inspired by Airbnb, Notion.`;
    case "elegante":
      return `STYLE: ELEGANT — Dark backgrounds, metallic accents, refined textures. Inspired by Chanel, Dior.`;
    default:
      return `STYLE: MODERN PROFESSIONAL — Contemporary, clean, balanced hierarchy.`;
  }
}

// --- Feedback history helper ---

async function getFeedbackHistory(
  supabase: any,
  organizationId: string
): Promise<string> {
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
    const changes = feedback.filter((f: any) => f.status === "changes_requested");

    let summary = "\n\nFEEDBACK HISTORY (learn from past results):";
    if (approved.length > 0) {
      summary += `\n- ${approved.length} arts were APPROVED. Successful prompts included themes like: ${approved.slice(0, 5).map((a: any) => a.prompt_used?.slice(0, 80) || "N/A").join("; ")}`;
    }
    if (rejected.length > 0) {
      summary += `\n- ${rejected.length} arts were REJECTED. Avoid similar approaches: ${rejected.slice(0, 5).map((r: any) => `"${r.prompt_used?.slice(0, 60) || "N/A"}" ${r.feedback_note ? `(reason: ${r.feedback_note})` : ""}`).join("; ")}`;
    }
    if (changes.length > 0) {
      summary += `\n- ${changes.length} arts had CHANGES REQUESTED: ${changes.slice(0, 5).map((c: any) => c.feedback_note || "no detail").join("; ")}`;
    }
    summary += "\nUse this feedback to improve the quality and match the client's preferences.";
    return summary;
  } catch (err) {
    console.warn("Feedback history query error (non-blocking):", err);
    return "";
  }
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, format, file_path, nivel, persona, identidade_visual, organization_id, reference_images } = await req.json();
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

    const estilo = identidade_visual?.estilo || "";

    // --- Fetch feedback history for this org ---
    let feedbackContext = "";
    if (organization_id) {
      feedbackContext = await getFeedbackHistory(supabase, organization_id);
    }

    // --- Chain-of-Thought Step 1: Optimize the prompt ---
    console.log(`🧠 Starting chain-of-thought analysis for ${format} image (nivel: ${nivel || "simples"}, style: ${estilo}, feedback: ${feedbackContext ? "YES" : "NONE"})...`);

    const optimized = await analyzeAndOptimizePrompt(LOVABLE_API_KEY, {
      userPrompt: prompt + feedbackContext,
      format,
      nivel: nivel || "simples",
      estilo,
      identidade_visual,
      persona,
    });

    // --- Build final image generation prompt ---
    const qualityInstructions = getQualityInstructions(nivel || "simples");
    const styleInstructions = getStyleInstructions(estilo);

    const aspectInstruction = format === "feed"
      ? "OUTPUT FORMAT: Square (1:1), 1080×1080px. Centered, balanced composition optimized for Instagram feed."
      : "OUTPUT FORMAT: Vertical (9:16), 1080×1920px. Vertical composition with stacked elements, optimized for Stories/Reels.";

    // Use optimized prompt if available, otherwise fall back to original
    const visualBrief = optimized
      ? `OPTIMIZED VISUAL BRIEF (AI-analyzed):
${optimized.optimized_prompt}

COMPOSITION STRATEGY: ${optimized.composition_notes}
COLOR APPLICATION: ${optimized.color_strategy}`
      : `VISUAL BRIEF:
${prompt}`;

    const fullPrompt = `You are a world-class art director creating a single social media visual asset.

${qualityInstructions}

${styleInstructions}

${aspectInstruction}

COMPOSITION RULES:
- Reserve clear, low-detail space for text overlay (top 20% OR bottom 25%)
- Create visual hierarchy: one unmistakable focal point
- Professional color theory: complementary/analogous relationships
- Must work at small mobile screen sizes (key elements visible at 150×150px)

ABSOLUTE RULES (NEVER VIOLATE):
- ZERO text, letters, numbers, words, logos, or watermarks in the image
- ZERO generic stock photo aesthetics — every element must be intentional
- ZERO busy backgrounds that compete with the focal point
- Every pixel must serve the composition and brand identity

${visualBrief}

Generate this image now. Prioritize brand color accuracy and compositional excellence above all else.`;

    console.log(`🎨 Generating ${format} image (refs: ${reference_images?.length || 0}, chain-of-thought: ${optimized ? "YES" : "FALLBACK"})...`);

    // Build message content — multimodal if references exist
    const hasRefs = reference_images && reference_images.length > 0;
    const messageContent: any = hasRefs
      ? [
          { type: "text", text: fullPrompt },
          ...reference_images.slice(0, 3).map((url: string) => ({
            type: "image_url",
            image_url: { url },
          })),
          { type: "text", text: "Study the provided reference images above and match their visual style, color treatment, composition approach, and overall aesthetic quality. The generated image must feel like it belongs to the same visual family as these references." },
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

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from("social-arts").getPublicUrl(file_path);

    // Debit credits
    if (organization_id) {
      try {
        await supabase.rpc("debit_credits", {
          _org_id: organization_id,
          _amount: CREDIT_COST,
          _description: `Geração de arte social (${format})`,
          _source: "generate-social-image",
        });
      } catch (debitErr) {
        console.error("Debit error (non-blocking):", debitErr);
      }
    }

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
