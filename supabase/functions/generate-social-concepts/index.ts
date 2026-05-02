// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { assertOrgMember, authErrorResponse } from '../_shared/auth.ts';
import { buildSystemPrompt, buildConceptsUserPrompt, PROMPT_VERSION } from '../_shared/prompts/generate-social-concepts.ts';

const CREDIT_COST = 25;

serve(async (req) => {
  const ctx = newRequestContext(req, 'generate-social-concepts');
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

  const _rl = await checkRateLimit(_authUser.id, null, 'generate-social-concepts', { windowSeconds: 60, maxRequests: 15 });
  if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

  try {
    const { briefing, quantidade, estilo, tipo_post, nivel, descricao_produto, roteiros_importados, persona, identidade_visual, referencias_tipo, organization_id, reference_images, incluir_video, art_style, video_style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // BOLA/IDOR guard + Pre-check credits
    if (organization_id) {
      await assertOrgMember(supabaseAdmin, _authUser.id, organization_id);
      const { data: wallet } = await supabaseAdmin
        .from("credit_wallets")
        .select("balance")
        .eq("organization_id", organization_id)
        .maybeSingle();

      if (!wallet || wallet.balance < CREDIT_COST) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Você precisa de " + CREDIT_COST + " créditos." }),
          { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch sales plan for enrichment
    let salesPlanCtx = "";
    if (organization_id) {
      const { data: salesPlan } = await supabaseAdmin
        .from("sales_plans")
        .select("answers")
        .eq("organization_id", organization_id)
        .maybeSingle();
      if (salesPlan?.answers && Object.keys(salesPlan.answers).length > 3) {
        const sp = salesPlan.answers as Record<string, unknown>;
        const parts: string[] = [];
        if (sp.produtos_servicos) parts.push(`Products: ${sp.produtos_servicos}`);
        if (sp.diferenciais) parts.push(`Differentials: ${sp.diferenciais}`);
        if (sp.dor_principal) parts.push(`Customer pain: ${sp.dor_principal}`);
        if (parts.length > 0) {
          salesPlanCtx = `\n\nSALES PLAN CONTEXT:\n${parts.map(p => `- ${p}`).join("\n")}\nUse these business details to make visuals and copy more relevant and specific.`;
        }
      }
    }

    // Build multimodal user message if references exist
    const hasRefs = reference_images && reference_images.length > 0;

    const promptInput = {
      briefing,
      quantidade,
      estilo,
      tipo_post,
      nivel,
      descricao_produto,
      roteiros_importados,
      persona,
      identidade_visual,
      referencias_tipo,
      incluir_video,
      art_style,
      video_style,
      salesPlanCtx,
      hasReferenceImages: hasRefs,
      referenceImageCount: reference_images?.length ?? 0,
    };
    const systemPrompt = buildSystemPrompt(promptInput);
    const userTextPrompt = buildConceptsUserPrompt(promptInput);
    console.log(`[generate-social-concepts] prompt_version=${PROMPT_VERSION}`);
    const userContent: string | { type: string; text?: string; image_url?: { url: string } }[] = hasRefs
      ? [
          { type: "text", text: userTextPrompt },
          ...reference_images.slice(0, 5).map((url: string) => ({
            type: "image_url",
            image_url: { url },
          })),
          { type: "text", text: "Analyze the images above as visual references. Replicate their style, composition, lighting, and color treatment in your generated visual prompts." },
        ]
      : userTextPrompt;

    // Use multimodal model when references are provided
    const model = hasRefs ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_concepts",
              description: "Return the generated social media post concepts",
              parameters: {
                type: "object",
                properties: {
                  concepts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        legenda: { type: "string" },
                        cta: { type: "string" },
                        hashtags: { type: "array", items: { type: "string" } },
                        visual_prompt_feed: { type: "string" },
                        visual_prompt_story: { type: "string" },
                        ...(incluir_video ? {
                          video_script: { type: "string" },
                          video_description: { type: "string" },
                          audio_suggestion: { type: "string" },
                          visual_prompt_thumbnail: { type: "string" },
                        } : {}),
                      },
                      required: ["titulo", "legenda", "cta", "hashtags", "visual_prompt_feed", "visual_prompt_story", ...(incluir_video ? ["video_script", "video_description", "audio_suggestion", "visual_prompt_thumbnail"] : [])],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["concepts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_concepts" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para gerar conteúdo." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call response");

    const concepts = JSON.parse(toolCall.function.arguments);

    // Debit credits after successful generation — only after first GPS is approved
    if (organization_id) {
      try {
        const { data: gpsApproved } = await supabaseAdmin
          .from("marketing_strategies")
          .select("id")
          .eq("organization_id", organization_id)
          .eq("status", "approved")
          .limit(1)
          .maybeSingle();

        if (!gpsApproved) {
          console.log("GPS not yet approved — skipping credit debit");
        } else {
          await supabaseAdmin.rpc("debit_credits", {
            _org_id: organization_id,
            _amount: CREDIT_COST,
            _description: `Geração de ${quantidade} conceitos visuais`,
            _source: "generate-social-concepts",
          });
        }
      } catch (debitErr) {
        console.error("Debit error (non-blocking):", debitErr);
      }
    }

    return new Response(JSON.stringify(concepts), {
      headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("generate-social-concepts error", { error: String(e) });
    return authErrorResponse(e, getCorsHeaders(req));
  }
});
