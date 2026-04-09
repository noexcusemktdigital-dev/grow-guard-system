// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

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
    const { briefing_text, content_data, identidade_visual, persona } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let contextParts: string[] = [];

    if (briefing_text) {
      contextParts.push(`USER BRIEFING: ${briefing_text}`);
    }

    if (content_data) {
      const title = content_data.title || "";
      const body = content_data.body || "";
      const result = content_data.result;
      contextParts.push(`CONTENT DATA:\nTitle: ${title}\nBody: ${body}`);
      if (result) {
        if (result.conteudo_principal?.headline) contextParts.push(`Headline: ${result.conteudo_principal.headline}`);
        if (result.conteudo_principal?.cta) contextParts.push(`CTA: ${result.conteudo_principal.cta}`);
        if (result.legenda) contextParts.push(`Caption: ${result.legenda.slice(0, 300)}`);
      }
    }

    if (identidade_visual) {
      contextParts.push(`BRAND IDENTITY: palette=${JSON.stringify(identidade_visual.palette || [])}, style=${identidade_visual.style || ""}, tone=${identidade_visual.tone || ""}`);
    }

    if (persona) {
      contextParts.push(`PERSONA: ${JSON.stringify(persona)}`);
    }

    const systemPrompt = `You are a video creative director for social media. You analyze user briefings and extract structured fields for short-form video production (5-8 seconds). Always respond in Portuguese (Brazil). Think about what makes a compelling short video: clear scene, specific action/movement, punchy message, and defined visual style.`;

    const userPrompt = `Analyze this briefing and extract the structured video fields:\n\n${contextParts.join("\n\n")}\n\nExtract: platform, video format, duration, scene description, scene action/movement, video message, visual style, and a suggested CTA.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_video_briefing",
              description: "Extract structured video production fields from a briefing.",
              parameters: {
                type: "object",
                properties: {
                  plataforma: {
                    type: "string",
                    enum: ["instagram_reels", "tiktok", "youtube_shorts", "instagram_feed", "youtube"],
                    description: "Target platform for the video",
                  },
                  formato_video: {
                    type: "string",
                    enum: ["9:16", "1:1", "16:9"],
                    description: "Video aspect ratio",
                  },
                  duracao: {
                    type: "string",
                    enum: ["5s", "8s"],
                    description: "Video duration",
                  },
                  descricao_cena: {
                    type: "string",
                    description: "Detailed scene description: who, where, environment, lighting. In Portuguese.",
                  },
                  acao_cena: {
                    type: "string",
                    description: "What happens in the scene: the specific movement/action. In Portuguese.",
                  },
                  mensagem_video: {
                    type: "string",
                    description: "Main text overlay message for the video. In Portuguese.",
                  },
                  estilo_visual: {
                    type: "string",
                    enum: ["corporativo_moderno", "premium_minimalista", "publicidade_sofisticada", "social_media", "inspiracional"],
                    description: "Visual style of the video",
                  },
                  suggested_cta: {
                    type: "string",
                    description: "Suggested call-to-action or final message. In Portuguese.",
                  },
                },
                required: ["plataforma", "formato_video", "duracao", "descricao_cena", "acao_cena", "mensagem_video", "estilo_visual"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_video_briefing" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-video-briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
