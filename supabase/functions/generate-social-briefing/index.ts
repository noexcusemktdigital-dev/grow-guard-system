// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { SYSTEM_PROMPT, buildUserPrompt, PROMPT_VERSION } from '../_shared/prompts/generate-social-briefing.ts';

serve(async (req) => {
  const ctx = newRequestContext(req, 'generate-social-briefing');
  const log = makeLogger(ctx);
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

  const _rl = await checkRateLimit(_authUser.id, null, 'generate-social-briefing', { windowSeconds: 60, maxRequests: 15 });
  if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

  try {
    const { briefing_text, content_data, identidade_visual, persona } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!briefing_text && !content_data) {
      return new Response(
        JSON.stringify({ error: "Informe um briefing ou selecione um conteúdo." }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Build context for the AI
    const contextBlock = buildUserPrompt({ briefing_text, content_data, identidade_visual, persona });
    console.log(`[generate-social-briefing] prompt_version=${PROMPT_VERSION}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: contextBlock },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_briefing_fields",
              description: "Extract structured fields from the briefing for social media art generation, with multiple headline and subheadline options.",
              parameters: {
                type: "object",
                properties: {
                  headlines: {
                    type: "array",
                    items: { type: "string" },
                    description: "Exactly 3 headline options: [direct/impactful, provocative/question, emotional/aspirational]. Max 6 words each.",
                  },
                  subheadlines: {
                    type: "array",
                    items: { type: "string" },
                    description: "Exactly 2 subheadline options (2-4 words each).",
                  },
                  // Keep legacy fields for backward compat
                  headline: { type: "string", description: "Best headline option (same as headlines[0])." },
                  subheadline: { type: "string", description: "Best subheadline option (same as subheadlines[0])." },
                  cta: { type: "string", description: "Call to action text." },
                  cena: { type: "string", description: "Detailed visual scene description (100-200 words)." },
                  elementos_visuais: { type: "string", description: "Comma-separated concrete visual elements to include." },
                  supporting_text: { type: "string", description: "Supporting text that contextualizes the message (1-2 sentences)." },
                  bullet_points: { type: "string", description: "2-4 keywords separated by comma." },
                  suggested_format: { type: "string", enum: ["feed", "portrait", "story"], description: "Best format for this post." },
                  suggested_tipo: { type: "string", enum: ["post_unico", "capa_carrossel", "slide_carrossel", "story"], description: "Best post type." },
                  legenda: { type: "string", description: "Complete social media caption ready to copy-paste. Structure: hook with emoji → value/benefit → CTA → hashtags. 2-4 lines, professional but accessible tone." },
                },
                required: ["headlines", "subheadlines", "headline", "subheadline", "cta", "cena", "elementos_visuais", "supporting_text", "bullet_points", "suggested_format", "suggested_tipo", "legenda"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_briefing_fields" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA insuficientes." }),
          { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      throw new Error("Erro ao processar briefing com IA");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("IA não retornou os campos estruturados");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Ensure backward compatibility: if headlines array exists but headline doesn't, set it
    if (result.headlines && result.headlines.length > 0 && !result.headline) {
      result.headline = result.headlines[0];
    }
    if (result.subheadlines && result.subheadlines.length > 0 && !result.subheadline) {
      result.subheadline = result.subheadlines[0];
    }
    // Ensure arrays exist even if model didn't return them
    if (!result.headlines) {
      result.headlines = [result.headline || ""];
    }
    if (!result.subheadlines) {
      result.subheadlines = [result.subheadline || ""];
    }

    console.log("✅ Briefing structured:", JSON.stringify(result).slice(0, 300));

    return new Response(JSON.stringify(result), {
      headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" },
    });
  } catch (err) {
    log.error("generate-social-briefing error", { error: String(err) });
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
