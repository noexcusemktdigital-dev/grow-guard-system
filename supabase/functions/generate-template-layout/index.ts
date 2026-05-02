// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

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

  const _rl = await checkRateLimit(_authUser.id, null, 'generate-template-layout', { windowSeconds: 60, maxRequests: 15 });
  if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

  try {
    const { titulo, subtitulo, cta, format, estilo, identidade_visual, background_image_url } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const w = 1080;
    const h = format === "feed" ? 1080 : 1920;

    const systemPrompt = `You are an elite graphic designer who creates social media template layouts as JSON.

You must return a valid TemplateConfig JSON object that specifies exact positions and styles for all visual elements.

CANVAS SIZE: ${w}x${h}px

AVAILABLE ELEMENT TYPES:
1. TextElement: { type: "text", content, x, y, width, fontSize, fontFamily, fontWeight ("normal"|"bold"|"black"), color, align ("left"|"center"|"right"), letterSpacing?, lineHeight?, textTransform? ("uppercase"|"none"), shadow?: { blur, color, offsetX, offsetY } }
2. ShapeElement: { type: "shape", shape ("rect"|"circle"|"line"|"diagonal-stripe"|"frame"), x, y, width, height, color, opacity, rotation?, borderRadius?, borderWidth?, borderColor? }
3. ImageElement: { type: "image", src, x, y, width, height, opacity?, borderRadius? }

AVAILABLE FONTS: Montserrat, Poppins, Playfair Display, Space Grotesk, Inter, Bebas Neue, Oswald, Raleway

DESIGN RULES:
- Create a visually striking, professional layout
- Use proper typographic hierarchy (title: 48-80px, subtitle: 20-36px, CTA: 16-24px)
- Apply brand colors strategically
- Include geometric shapes for visual interest (stripes, frames, rectangles, circles)
- Ensure sufficient contrast between text and background
- Leave appropriate white space
- Position elements following rule of thirds
- CTA buttons should have a shape element behind them as background

STYLE GUIDELINES BY ESTILO:
- minimalista: Lots of white space, thin frames, subtle colors, serif fonts, max 3-4 elements
- bold: Diagonal stripes, large uppercase text, high contrast, Montserrat/Bebas Neue, strong color blocks
- corporativo: Clean grid, navy/charcoal colors, Inter font, structured layout, subtle accents
- elegante: Dark backgrounds, gold/metallic accents (#C9A961), Playfair Display, decorative frames
- criativo: Organic shapes, vibrant colors, asymmetric layout, Poppins/Space Grotesk, rounded elements`;

    const userPrompt = `Create a template layout for this post:

TITLE: "${titulo}"
SUBTITLE: "${subtitulo || ''}"
CTA: "${cta || ''}"
FORMAT: ${format === "feed" ? "Square 1080x1080" : "Story 1080x1920"}
STYLE: ${estilo || "bold"}

BRAND IDENTITY:
- Colors: ${identidade_visual?.paleta || "use professional defaults"}
- Fonts: ${identidade_visual?.fontes || "choose appropriate"}
- Visual tone: ${identidade_visual?.tom_visual || "modern professional"}

BACKGROUND IMAGE: Will be used as full background (type: "image", imageUrl will be set separately)

Return ONLY the JSON object with this structure:
{
  "background": {
    "type": "image",
    "imageFit": "cover",
    "imageMask": "full|left-half|right-half|center-circle|frame-inset",
    "overlay": { "color": "#hex", "opacity": 0.0-1.0 }
  },
  "elements": [ ...array of TextElement, ShapeElement, ImageElement... ]
}

Important: Do NOT include width, height, brandColors, or logoUrl - those are added automatically.
The background.imageUrl will be set separately - just define the mask and overlay.`;

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
