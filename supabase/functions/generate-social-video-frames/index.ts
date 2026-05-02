// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import {
  PROMPT_VERSION,
  STYLE_LABELS,
  FORMAT_SPECS,
  buildFramePrompt,
  buildBrandContext,
  extractEnvironment,
} from '../_shared/prompts/generate-social-video-frames.ts';

const CREDIT_COST_PER_FRAME = 25;

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

  const _rl = await checkRateLimit(_authUser.id, null, 'generate-social-video-frames', { windowSeconds: 60, maxRequests: 10 });
  if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

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
    const brandContext = buildBrandContext(identidade_visual);

    console.log(`[generate-social-video-frames] PROMPT_VERSION=${PROMPT_VERSION}`);
    console.log(`Generating ${num_frames} video frames (style: ${resolvedStyle}, format: ${resolvedFormat}, platform: ${plataforma || "none"})...`);

    const frameUrls: string[] = [];
    const sceneTexts: { main: string; sub?: string }[] = [];

    for (let i = 0; i < num_frames; i++) {
      const isFirst = i === 0;
      const isLast = i === num_frames - 1;

      // Build structured prompt using shared builder
      const framePrompt = buildFramePrompt({
        frameIndex: i,
        totalFrames: num_frames,
        scene,
        action,
        message,
        cta,
        formatSpec,
        styleDescription,
        brandContext,
        isFirst,
        isLast,
      });

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

