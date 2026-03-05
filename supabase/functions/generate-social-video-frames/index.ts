import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COST_PER_FRAME = 100;

/* ── Scene config mapping by video style ── */

interface SceneConfigMeta {
  textAnimation: string;
  transition: string;
  showLogo: boolean;
  graphicStyle: string;
  brandOverlayOpacity: number;
  showParticles: boolean;
}

function getSceneConfigsForStyle(
  videoStyle: string | undefined,
  numScenes: number,
): SceneConfigMeta[] {
  const styleMap: Record<string, Omit<SceneConfigMeta, "showLogo">> = {
    slideshow: { textAnimation: "fadeIn", transition: "dissolve", graphicStyle: "minimal", brandOverlayOpacity: 0.15, showParticles: true },
    kinetic: { textAnimation: "kinetic", transition: "slideLeft", graphicStyle: "geometric", brandOverlayOpacity: 0.25, showParticles: false },
    revelacao: { textAnimation: "scaleIn", transition: "zoomIn", graphicStyle: "organic", brandOverlayOpacity: 0.2, showParticles: true },
    countdown: { textAnimation: "slideUp", transition: "wipe", graphicStyle: "geometric", brandOverlayOpacity: 0.3, showParticles: false },
  };

  const base = styleMap[videoStyle || ""] || styleMap.slideshow;

  return Array.from({ length: numScenes }, (_, i) => ({
    ...base,
    showLogo: i === 0 || i === numScenes - 1, // logo on first and last
  }));
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
          JSON.stringify({ error: `Créditos insuficientes. Você precisa de ${totalCost} créditos para gerar ${num_frames} frames de vídeo.` }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse scene descriptions from video_description
    const scenes = parseScenes(video_description, num_frames);
    const sceneTexts = generateSceneTexts(video_description, scenes);
    const sceneConfigs = getSceneConfigsForStyle(video_style, scenes.length);
    console.log(`Generating ${scenes.length} video frames for art ${art_id} (style: ${video_style})...`);

    // Build brand context
    let brandContext = "";
    if (identidade_visual) {
      const iv = identidade_visual;
      brandContext = `
BRAND IDENTITY (MANDATORY):
- COLOR PALETTE: Use ONLY these colors: ${iv.paleta || "professional colors"}
${iv.estilo ? `- VISUAL STYLE: ${iv.estilo}` : ""}
${iv.tom_visual ? `- VISUAL TONE: ${iv.tom_visual}` : ""}
The generated frames MUST feel like they belong to this brand's visual ecosystem.`;
    }

    // Video style context
    let videoStyleContext = "";
    if (video_style) {
      const styleGuides: Record<string, string> = {
        slideshow: "VIDEO STYLE: Cinematic slideshow. Each frame should be a distinct visual moment with subtle angle/zoom variations for smooth Ken Burns transitions.",
        kinetic: "VIDEO STYLE: Kinetic typography backgrounds. Generate bold, high-contrast backgrounds/textures. Frames should be visually striking but leave space for animated text overlays.",
        revelacao: "VIDEO STYLE: Product reveal sequence. Progress from wide/mysterious to close-up detail. Dramatic lighting, suspenseful visual progression across frames.",
        countdown: "VIDEO STYLE: Countdown/urgency. Escalating visual intensity across frames. Each frame more dynamic than the last. Bold compositions, energetic mood.",
      };
      videoStyleContext = styleGuides[video_style] || "";
    }

    const frameUrls: string[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const framePrompt = `You are creating frame ${i + 1} of ${scenes.length} for a short-form vertical video (Instagram Reels / TikTok).

OUTPUT FORMAT: Vertical (9:16), 1080×1920px.

${brandContext}

This is a SEQUENTIAL STORYBOARD. Each frame represents a different moment in the video.
Frame ${i + 1}/${scenes.length}: ${scene}

${i === 0 ? "This is the OPENING FRAME — make it visually striking and attention-grabbing (hook)." : ""}
${i === scenes.length - 1 ? "This is the CLOSING FRAME — make it conclusive with a strong visual ending." : ""}

CRITICAL RULES:
- ZERO text, letters, numbers, words, logos, or watermarks
- Vertical composition optimized for mobile viewing
- Cinematic quality with professional lighting
- Each frame should feel like a still from a high-end video production
- Maintain visual consistency across all frames (same style, lighting, color grading)
- Leave space for text overlay (bottom 20%)
- VARY the camera angle/composition subtly between frames for dynamic Ken Burns motion
- Use slightly different zoom levels and perspectives across frames

${visual_prompt_thumbnail ? `Visual reference style: ${visual_prompt_thumbnail}` : ""}
${videoStyleContext}

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
          return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento.", frames_generated: frameUrls }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes.", frames_generated: frameUrls }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.error(`Skipping frame ${i + 1}`);
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
      console.log(`Frame ${i + 1}/${scenes.length} uploaded: ${urlData.publicUrl}`);
    }

    // Credits are now debited on approval, not on generation

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

  const lines = videoDescription
    .split(/\n/)
    .map(l => l.trim())
    .filter(l => l.length > 10);

  if (lines.length >= 3) {
    if (lines.length <= maxFrames) return lines;
    const step = lines.length / maxFrames;
    return Array.from({ length: maxFrames }, (_, i) => lines[Math.floor(i * step)]);
  }

  const sentences = videoDescription
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  if (sentences.length >= 3) {
    if (sentences.length <= maxFrames) return sentences;
    const step = sentences.length / maxFrames;
    return Array.from({ length: maxFrames }, (_, i) => sentences[Math.floor(i * step)]);
  }

  return [videoDescription];
}

function generateSceneTexts(videoDescription: string, scenes: string[]): { main: string; sub?: string }[] {
  return scenes.map((scene, i) => {
    const firstSentence = scene.split(/[.!?]/)[0]?.trim() || scene;
    const main = firstSentence.length > 60 ? firstSentence.substring(0, 57) + "..." : firstSentence;
    const isLast = i === scenes.length - 1;
    const sub = isLast ? "Saiba mais →" : undefined;
    return { main, sub };
  });
}
