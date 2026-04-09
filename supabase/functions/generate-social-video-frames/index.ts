import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

const CREDIT_COST_PER_FRAME = 25;

const STYLE_LABELS: Record<string, string> = {
  corporativo_moderno: "clean corporate advertising style with modern aesthetics",
  premium_minimalista: "premium minimalist commercial style with elegant simplicity",
  publicidade_sofisticada: "sophisticated high-end advertisement style",
  social_media: "vibrant social media content style, eye-catching and dynamic",
  inspiracional: "inspirational corporate video style, uplifting and motivational",
};

const FORMAT_SPECS: Record<string, { label: string; aspect: string; resolution: string }> = {
  story: { label: "vertical", aspect: "9:16", resolution: "1080×1920" },
  feed: { label: "square", aspect: "1:1", resolution: "1080×1080" },
  banner: { label: "landscape", aspect: "16:9", resolution: "1920×1080" },
};

serve(async (req) => {
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

  try {
    const {
      video_description,
      identidade_visual,
      organization_id,
      art_id,
      num_frames = 5,
      reference_images,
      video_style,
      formato_video,
      plataforma,
      estilo_visual,
      acao_cena,
      movimento,
      mensagem,
      cta,
      format,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const totalCost = CREDIT_COST_PER_FRAME * num_frames;

    // Pre-check credits
    if (organization_id) {
      const { data: wallet } = await supabase
        .from("credit_wallets")
        .select("balance")
        .eq("organization_id", organization_id)
        .maybeSingle();

      if (!wallet || wallet.balance < totalCost) {
        return new Response(
          JSON.stringify({ error: `Créditos insuficientes. Você precisa de ${totalCost} créditos para gerar ${num_frames} frames.` }),
          { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    // Resolve format spec
    const resolvedFormat = format || "story";
    const formatSpec = FORMAT_SPECS[resolvedFormat] || FORMAT_SPECS.story;

    // Resolve style
    const resolvedStyle = estilo_visual || video_style || "corporativo_moderno";
    const styleDescription = STYLE_LABELS[resolvedStyle] || STYLE_LABELS.corporativo_moderno;

    // Resolve action
    const action = acao_cena || movimento || "";
    const scene = video_description || "";
    const message = mensagem || "";

    // Brand context
    let brandContext = "";
    if (identidade_visual) {
      const iv = identidade_visual;
      brandContext = `Brand colors: ${iv.paleta || iv.palette || "professional colors"}. ${iv.estilo || iv.style ? `Style: ${iv.estilo || iv.style}.` : ""} ${iv.tom_visual || iv.tone ? `Tone: ${iv.tom_visual || iv.tone}.` : ""}`;
    }

    console.log(`Generating ${num_frames} video frames (style: ${resolvedStyle}, format: ${resolvedFormat}, platform: ${plataforma || "none"})...`);

    const frameUrls: string[] = [];
    const sceneTexts: { main: string; sub?: string }[] = [];

    for (let i = 0; i < num_frames; i++) {
      const isFirst = i === 0;
      const isLast = i === num_frames - 1;

      // Build structured prompt following the reference format
      let framePrompt = `Create a ${isFirst ? "opening" : isLast ? "closing" : "middle"} frame (frame ${i + 1} of ${num_frames}) for a short-form ${formatSpec.label} social media video (${formatSpec.aspect}).

Scene: ${scene}

Action: ${action || "subtle movement suggesting the scene described above"}

Environment: ${extractEnvironment(scene)}

Style: ${styleDescription}${brandContext ? `\n\n${brandContext}` : ""}`;

      if (message) {
        framePrompt += `\n\nText overlay:\n"${message}"`;
      }
      if (cta && isLast) {
        framePrompt += `\n\nFinal message:\n"${cta}"`;
      }

      framePrompt += `\n\nCRITICAL RULES:
- ZERO text, letters, numbers, words, logos, or watermarks in the image
- Leave clear space at the bottom 20% for text overlay
- Cinematic quality with professional lighting
- Maintain visual consistency across all frames
- ${isFirst ? "OPENING FRAME: visually striking, attention-grabbing hook" : ""}
- ${isLast ? "CLOSING FRAME: conclusive with strong visual ending" : ""}
- Vary camera angle/zoom subtly between frames for dynamic motion
- Composition optimized for mobile viewing`;

      const hasRefs = reference_images && reference_images.length > 0;
      const messageContent: string | { type: string; text?: string; image_url?: { url: string } }[] = hasRefs
        ? [
            { type: "text", text: framePrompt },
            ...reference_images.slice(0, 3).map((url: string) => ({
              type: "image_url",
              image_url: { url },
            })),
            { type: "text", text: "Match the visual style, color palette, and aesthetic of these references exactly." },
          ]
        : framePrompt;

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
        console.error(`Frame ${i + 1} error:`, response.status, errorText);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições excedido.", frames_generated: frameUrls }), {
            status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes.", frames_generated: frameUrls }), {
            status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        }
        continue;
      }

      const data = await response.json();
      const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageData) {
        console.error(`No image in frame ${i + 1} response`);
        continue;
      }

      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      const filePath = `videos/${organization_id}/${art_id}/frame-${i}.png`;
      const { error: uploadError } = await supabase.storage
        .from("social-arts")
        .upload(filePath, binaryData, { contentType: "image/png", upsert: true });

      if (uploadError) {
        console.error(`Upload error frame ${i + 1}:`, uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage.from("social-arts").getPublicUrl(filePath);
      frameUrls.push(urlData.publicUrl);
      console.log(`Frame ${i + 1}/${num_frames} uploaded.`);

      // Generate scene text
      if (isFirst && message) {
        const main = message.length > 60 ? message.substring(0, 57) + "..." : message;
        sceneTexts.push({ main });
      } else if (isLast && cta) {
        sceneTexts.push({ main: message || "...", sub: cta });
      } else {
        sceneTexts.push({ main: message || "" });
      }
    }

    return new Response(JSON.stringify({ frameUrls, sceneTexts }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-social-video-frames error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

function extractEnvironment(scene: string): string {
  if (!scene) return "professional modern environment with clean lighting";
  // Extract environment hints from scene description
  const envKeywords = ["escritório", "office", "apartamento", "apartment", "loja", "store", "consultório", "clinic", "sala", "room", "rua", "street", "cidade", "city"];
  const lower = scene.toLowerCase();
  for (const kw of envKeywords) {
    if (lower.includes(kw)) {
      return scene;
    }
  }
  return `${scene}, professional environment with cinematic lighting`;
}
