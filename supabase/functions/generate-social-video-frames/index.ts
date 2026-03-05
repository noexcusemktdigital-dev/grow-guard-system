import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST_PER_FRAME = 100;

interface SceneConfigMeta {
  textAnimation: string;
  transition: string;
  showLogo: boolean;
  graphicStyle: string;
  brandOverlayOpacity: number;
  showParticles: boolean;
}

function getSceneConfigsForStyle(videoStyle: string | undefined, numScenes: number): SceneConfigMeta[] {
  const styleMap: Record<string, Omit<SceneConfigMeta, "showLogo">> = {
    slideshow: { textAnimation: "fadeIn", transition: "dissolve", graphicStyle: "minimal", brandOverlayOpacity: 0.15, showParticles: true },
    kinetic: { textAnimation: "kinetic", transition: "slideLeft", graphicStyle: "geometric", brandOverlayOpacity: 0.25, showParticles: false },
    revelacao: { textAnimation: "scaleIn", transition: "zoomIn", graphicStyle: "organic", brandOverlayOpacity: 0.2, showParticles: true },
    countdown: { textAnimation: "slideUp", transition: "wipe", graphicStyle: "geometric", brandOverlayOpacity: 0.3, showParticles: false },
  };
  const base = styleMap[videoStyle || ""] || styleMap.slideshow;
  return Array.from({ length: numScenes }, (_, i) => ({
    ...base,
    showLogo: i === 0 || i === numScenes - 1,
  }));
}

function getFormatInstruction(format: string | undefined): string {
  switch (format) {
    case "feed": return "OUTPUT FORMAT: Square (1:1), 1080×1080px.";
    case "banner": return "OUTPUT FORMAT: Landscape (16:9), 1920×1080px.";
    default: return "OUTPUT FORMAT: Vertical (9:16), 1080×1920px.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      video_description,
      visual_prompt_thumbnail,
      identidade_visual,
      organization_id,
      art_id,
      num_frames = 5,
      reference_images,
      video_style,
      // Structured fields
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
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const scenes = parseScenes(video_description, num_frames);
    const sceneTexts = generateSceneTexts(video_description, scenes, mensagem, cta);
    const sceneConfigs = getSceneConfigsForStyle(video_style, scenes.length);
    const formatInstruction = getFormatInstruction(format);

    console.log(`Generating ${scenes.length} video frames (style: ${video_style}, movimento: ${movimento || "none"})...`);

    // Brand context
    let brandContext = "";
    if (identidade_visual) {
      const iv = identidade_visual;
      brandContext = `BRAND IDENTITY (MANDATORY):
- COLOR PALETTE: ${iv.paleta || iv.palette || "professional colors"}
${iv.estilo || iv.style ? `- VISUAL STYLE: ${iv.estilo || iv.style}` : ""}
${iv.tom_visual || iv.tone ? `- VISUAL TONE: ${iv.tom_visual || iv.tone}` : ""}`;
    }

    // Movement context
    const movementContext = movimento
      ? `SCENE ACTION/MOVEMENT: The scene involves "${movimento}". Each frame should capture a slightly different moment of this action, creating a sense of motion when played sequentially.`
      : "";

    // Message context
    const messageContext = mensagem
      ? `VIDEO MESSAGE: "${mensagem}"${cta ? ` | CTA: "${cta}"` : ""}
Leave clear space for text overlay in each frame.`
      : "";

    const frameUrls: string[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const framePrompt = `You are creating frame ${i + 1} of ${scenes.length} for a short-form video.

${formatInstruction}

${brandContext}

This is a SEQUENTIAL STORYBOARD. Each frame represents a different moment.
Frame ${i + 1}/${scenes.length}: ${scene}

${i === 0 ? "OPENING FRAME — visually striking and attention-grabbing (hook)." : ""}
${i === scenes.length - 1 ? "CLOSING FRAME — conclusive with a strong visual ending." : ""}

${movementContext}
${messageContext}

CRITICAL RULES:
- ZERO text, letters, numbers, words, logos, or watermarks
- Composition optimized for mobile viewing
- Cinematic quality with professional lighting
- Maintain visual consistency across all frames
- Leave space for text overlay (bottom 20%)
- VARY camera angle/zoom subtly between frames for dynamic motion

${visual_prompt_thumbnail ? `Visual reference: ${visual_prompt_thumbnail}` : ""}

Generate this single frame now.`;

      const hasRefs = reference_images && reference_images.length > 0;
      const messageContent: any = hasRefs
        ? [
            { type: "text", text: framePrompt },
            ...reference_images.slice(0, 2).map((url: string) => ({
              type: "image_url",
              image_url: { url },
            })),
            { type: "text", text: "Match the visual style of these references." },
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
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes.", frames_generated: frameUrls }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      console.log(`Frame ${i + 1}/${scenes.length} uploaded.`);
    }

    return new Response(JSON.stringify({ frameUrls, sceneTexts, sceneConfigs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-social-video-frames error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseScenes(videoDescription: string, maxFrames: number): string[] {
  if (!videoDescription) {
    return Array.from({ length: maxFrames }, (_, i) => `Scene ${i + 1} of the video`);
  }
  const lines = videoDescription.split(/\n/).map(l => l.trim()).filter(l => l.length > 10);
  if (lines.length >= 3) {
    if (lines.length <= maxFrames) return lines;
    const step = lines.length / maxFrames;
    return Array.from({ length: maxFrames }, (_, i) => lines[Math.floor(i * step)]);
  }
  const sentences = videoDescription.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 15);
  if (sentences.length >= 3) {
    if (sentences.length <= maxFrames) return sentences;
    const step = sentences.length / maxFrames;
    return Array.from({ length: maxFrames }, (_, i) => sentences[Math.floor(i * step)]);
  }
  return [videoDescription];
}

function generateSceneTexts(
  videoDescription: string,
  scenes: string[],
  mensagem?: string,
  cta?: string,
): { main: string; sub?: string }[] {
  return scenes.map((scene, i) => {
    const isFirst = i === 0;
    const isLast = i === scenes.length - 1;

    // Use the user's message for the first frame if provided
    if (isFirst && mensagem) {
      const main = mensagem.length > 60 ? mensagem.substring(0, 57) + "..." : mensagem;
      return { main };
    }

    if (isLast && cta) {
      const firstSentence = scene.split(/[.!?]/)[0]?.trim() || scene;
      const main = firstSentence.length > 60 ? firstSentence.substring(0, 57) + "..." : firstSentence;
      return { main, sub: cta };
    }

    const firstSentence = scene.split(/[.!?]/)[0]?.trim() || scene;
    const main = firstSentence.length > 60 ? firstSentence.substring(0, 57) + "..." : firstSentence;
    return { main, sub: isLast ? "Saiba mais →" : undefined };
  });
}
