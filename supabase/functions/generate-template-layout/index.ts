// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { buildSystemPrompt, buildUserPrompt, PROMPT_VERSION } from '../_shared/prompts/generate-template-layout.ts';

serve(async (req) => {
  const ctx = newRequestContext(req, 'generate-template-layout');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

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

  const _rl = await checkRateLimit(_authUser.id, null, 'generate-template-layout', { windowSeconds: 60, maxRequests: 15 });
  if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

  try {
    const { titulo, subtitulo, cta, format, estilo, identidade_visual, background_image_url } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const w = 1080;
    const h = format === "feed" ? 1080 : 1920;

    const systemPrompt = buildSystemPrompt(format || "feed");
    const userPrompt = buildUserPrompt({ titulo, subtitulo, cta, format: format || "feed", estilo, identidade_visual });
    console.log(`[generate-template-layout] prompt_version=${PROMPT_VERSION}`);

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
              name: "create_template_layout",
              description: "Create a complete template layout configuration for the social media post.",
              parameters: {
                type: "object",
                properties: {
                  background: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["image", "solid", "gradient"] },
                      imageFit: { type: "string", enum: ["cover", "contain", "fill"] },
                      imageMask: { type: "string", enum: ["full", "left-half", "right-half", "center-circle", "frame-inset"] },
                      overlay: {
                        type: "object",
                        properties: {
                          color: { type: "string" },
                          opacity: { type: "number" },
                        },
                      },
                      color: { type: "string" },
                      gradientColors: { type: "array", items: { type: "string" } },
                      gradientAngle: { type: "number" },
                    },
                    required: ["type", "imageFit"],
                  },
                  elements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["text", "shape", "image"] },
                        content: { type: "string" },
                        shape: { type: "string" },
                        src: { type: "string" },
                        x: { type: "number" },
                        y: { type: "number" },
                        width: { type: "number" },
                        height: { type: "number" },
                        fontSize: { type: "number" },
                        fontFamily: { type: "string" },
                        fontWeight: { type: "string" },
                        color: { type: "string" },
                        align: { type: "string" },
                        opacity: { type: "number" },
                        rotation: { type: "number" },
                        borderRadius: { type: "number" },
                        borderWidth: { type: "number" },
                        borderColor: { type: "string" },
                        letterSpacing: { type: "number" },
                        lineHeight: { type: "number" },
                        textTransform: { type: "string" },
                        shadow: {
                          type: "object",
                          properties: {
                            blur: { type: "number" },
                            color: { type: "string" },
                            offsetX: { type: "number" },
                            offsetY: { type: "number" },
                          },
                        },
                      },
                      required: ["type", "x", "y"],
                    },
                  },
                },
                required: ["background", "elements"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_template_layout" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response");
      return new Response(JSON.stringify({ error: "AI did not return layout", fallback: true }), {
        status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const layout = JSON.parse(toolCall.function.arguments);

    // Inject the background image URL
    if (background_image_url) {
      layout.background.imageUrl = background_image_url;
    }

    // Build full config
    const brandColors = identidade_visual?.paleta
      ? identidade_visual.paleta.split(",").map((c: string) => c.trim()).filter(Boolean)
      : [];

    const templateConfig = {
      width: w,
      height: h,
      background: layout.background,
      elements: layout.elements,
      brandColors,
    };

    console.log(`✅ Template layout generated: ${layout.elements.length} elements`);

    return new Response(JSON.stringify({ templateConfig }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-template-layout error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", fallback: true }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
