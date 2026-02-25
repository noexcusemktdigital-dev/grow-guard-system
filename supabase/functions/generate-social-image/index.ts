import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST = 100;

function getQualityInstructions(nivel: string): string {
  switch (nivel) {
    case "alto_padrao":
      return `QUALITY: Ultra-premium, luxury brand quality. Magazine-level photography or design.
Rich textures, dramatic lighting with deep shadows and golden-hour highlights.
Cinematic color grading. Every pixel must be perfect. Think high-end advertising campaign.
Depth of field, bokeh effects, premium materials visible in textures.`;
    case "elaborado":
      return `QUALITY: High-quality professional design. Strong composition with visual depth.
Vibrant but harmonious colors, polished finish. Professional lighting setup.
Layered visual interest with foreground/midground/background elements.
Agency-quality creative work with attention to detail.`;
    default:
      return `QUALITY: Clean, professional design. Simple but effective composition.
Clear focal point, balanced layout. Professional and trustworthy appearance.
Well-lit, properly exposed, ready for social media publishing.`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, format, file_path, nivel, persona, identidade_visual, organization_id } = await req.json();
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

    const qualityInstructions = getQualityInstructions(nivel || "simples");

    const aspectInstruction = format === "feed"
      ? "Square format (1:1 aspect ratio), 1080x1080 pixels. Centered, balanced composition."
      : "Vertical format (9:16 aspect ratio), 1080x1920 pixels. Vertical composition with stacked visual elements.";

    let brandContext = "";
    if (identidade_visual) {
      const iv = identidade_visual;
      brandContext = `\nBRAND IDENTITY:
${iv.paleta ? `- Primary colors: ${iv.paleta}` : ""}
${iv.estilo ? `- Visual style: ${iv.estilo}` : ""}
${iv.tom_visual ? `- Visual tone: ${iv.tom_visual}` : ""}

Match these brand guidelines precisely in the generated image.
Use the brand colors as dominant palette elements.`;
    }

    let audienceContext = "";
    if (persona?.descricao || persona?.nome) {
      audienceContext = `\nTARGET AUDIENCE: ${persona.nome ? `${persona.nome} — ` : ""}${persona.descricao || ""}
Ensure the visual style, color palette, and composition appeal to this specific audience.`;
    }

    const fullPrompt = `You are a world-class art director and visual designer for premium social media campaigns.

${qualityInstructions}

${aspectInstruction}
${brandContext}
${audienceContext}

COMPOSITION RULES:
- Leave clear space for text overlay (top 20% or bottom 25% of the image should have simpler areas)
- Create visual hierarchy with a clear focal point
- Use professional color theory and complementary colors
- Ensure the image works at small mobile screen sizes

CRITICAL RULES:
- Do NOT include any text, letters, numbers, words, or watermarks in the image
- No generic stock photo aesthetics
- Every element must serve the composition

VISUAL BRIEF:
${prompt}

Generate this image now with the highest possible quality and attention to detail.`;

    console.log(`Generating ${format} image (nivel: ${nivel || "simples"})...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: fullPrompt }],
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
      .upload(file_path, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("social-arts")
      .getPublicUrl(file_path);

    // Debit credits after successful generation
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

    console.log(`Image uploaded: ${urlData.publicUrl}`);

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
