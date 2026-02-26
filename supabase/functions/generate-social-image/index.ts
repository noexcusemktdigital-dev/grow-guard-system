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

function getTypeComposition(tipo: string): string {
  switch (tipo) {
    case "produto":
      return `COMPOSITION TYPE: PRODUCT SHOWCASE
- Product centered on solid or gradient background
- Clean negative space around the product (60%+ of frame)
- Subtle shadow grounding the product
- Hero lighting from upper-left or upper-right
- Lifestyle context hints through props or environment blur`;
    case "servico":
      return `COMPOSITION TYPE: SERVICE VISUAL
- Abstract representation of the service concept
- Human elements: hands, silhouettes, or workspace environments
- Metaphorical visual storytelling
- Warm, inviting atmosphere suggesting trust and expertise`;
    case "promocao":
      return `COMPOSITION TYPE: PROMOTIONAL IMPACT
- Bold visual impact with strong color blocking
- Dynamic diagonal or asymmetric composition
- High contrast between elements for eye-catching effect
- Energy and urgency through visual rhythm
- Large clear area for price/offer text overlay (30%+ of frame)`;
    case "educativo":
      return `COMPOSITION TYPE: EDUCATIONAL/INFORMATIVE
- Clean, organized visual hierarchy
- Infographic-inspired layouts with visual data representation
- Icons and geometric shapes as visual anchors
- Professional, trustworthy aesthetic`;
    case "depoimento":
      return `COMPOSITION TYPE: TESTIMONIAL/SOCIAL PROOF
- Warm, authentic atmosphere
- Human-centric with space for quote overlay
- Soft lighting suggesting approachability
- Subtle brand color accents in background`;
    default:
      return `COMPOSITION TYPE: INSTITUTIONAL/BRAND
- Brand-forward composition emphasizing values
- Balanced, symmetrical or rule-of-thirds layout
- Professional yet approachable mood
- Clear visual hierarchy with focal point`;
  }
}

function getStyleInstructions(estilo: string): string {
  switch (estilo?.toLowerCase()) {
    case "minimalista":
      return `STYLE: MINIMALIST
- Vast negative space (70%+ of frame)
- Maximum 2-3 visual elements
- Monochromatic or analogous color scheme
- Geometric precision, clean lines, no decoration
- Inspired by: Japanese design, Muji, Apple`;
    case "bold":
      return `STYLE: BOLD / MAXIMALIST
- Strong color blocking with high saturation
- Oversized typography-inspired shapes
- Dynamic angles and overlapping elements
- High contrast, energetic composition
- Inspired by: Nike, Beats, Spotify`;
    case "corporativo":
      return `STYLE: CORPORATE / PROFESSIONAL
- Navy, charcoal, and accent color palette
- Structured grid-based composition
- Subtle gradients and professional photography
- Trust-building visual language
- Inspired by: McKinsey, Deloitte, IBM`;
    case "criativo":
      return `STYLE: CREATIVE / ARTISTIC
- Unexpected color combinations
- Mixed media aesthetics: collage, illustration + photo
- Playful asymmetry and organic shapes
- Textural interest: grain, halftone, watercolor
- Inspired by: Airbnb, Dropbox, Notion`;
    case "elegante":
      return `STYLE: ELEGANT / LUXURY
- Dark backgrounds with metallic accents (gold, silver)
- Refined serif-inspired visual weight
- Subtle textures: marble, linen, leather
- Generous spacing and visual breathing room
- Inspired by: Chanel, Dior, Four Seasons`;
    default:
      return `STYLE: MODERN PROFESSIONAL
- Contemporary design language
- Clean sans-serif visual weight
- Balanced composition with clear hierarchy`;
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
      ? "OUTPUT FORMAT: Square (1:1), 1080×1080px. Centered, balanced composition optimized for Instagram feed."
      : "OUTPUT FORMAT: Vertical (9:16), 1080×1920px. Vertical composition with stacked elements, optimized for Stories/Reels.";

    // Extract visual style from identidade_visual
    const estilo = identidade_visual?.estilo || "";
    const styleInstructions = getStyleInstructions(estilo);

    // Build brand context from identity
    let brandContext = "";
    if (identidade_visual) {
      const iv = identidade_visual;
      const colors = iv.paleta || "";
      brandContext = `
BRAND IDENTITY (MANDATORY):
- COLOR PALETTE: Use ONLY these colors as the dominant palette: ${colors}
  → Primary color for focal elements
  → Secondary colors for accents and backgrounds
  → Do NOT introduce colors outside this palette
${iv.estilo ? `- VISUAL STYLE: ${iv.estilo}` : ""}
${iv.tom_visual ? `- VISUAL TONE: ${iv.tom_visual}` : ""}
${iv.fontes ? `- TYPOGRAPHY REFERENCE: ${iv.fontes} (do not render text, but match the weight/feel)` : ""}
${iv.referencias ? `- VISUAL REFERENCES: ${iv.referencias}` : ""}

The generated image MUST feel like it belongs to this brand's visual ecosystem.`;
    }

    let audienceContext = "";
    if (persona?.descricao || persona?.nome) {
      audienceContext = `
TARGET AUDIENCE: ${persona.nome ? `${persona.nome} — ` : ""}${persona.descricao || ""}
Visual style, mood, and composition must appeal to and resonate with this specific audience.`;
    }

    const fullPrompt = `You are a world-class art director creating a single social media visual asset.

${qualityInstructions}

${styleInstructions}

${aspectInstruction}

${brandContext}
${audienceContext}

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

VISUAL BRIEF:
${prompt}

Generate this image now. Prioritize brand color accuracy and compositional excellence above all else.`;

    console.log(`Generating ${format} image (nivel: ${nivel || "simples"}, style: ${estilo})...`);

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
