// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { SYSTEM_PROMPT, STAGE_PROMPTS, buildUserPrompt, PROMPT_VERSION } from '../_shared/prompts/generate-script.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { parseOrThrow, validationErrorResponse, GenerateExtendedSchemas } from '../_shared/schemas.ts';

// Fixed credit cost per script generation
const CREDIT_COST = 20;

// stagePrompts imported as STAGE_PROMPTS from _shared/prompts/generate-script.ts
const stagePrompts = STAGE_PROMPTS;

serve(async (req) => {
  const ctx = newRequestContext(req, 'generate-script');
  const log = makeLogger(ctx);
  const origin = req.headers.get("origin") || "unknown";
  log.info(`${req.method} from origin=${origin}`);

  if (req.method === "OPTIONS")
    return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[generate-script] Missing auth header");
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[generate-script] Auth failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const _rl = await checkRateLimit(userId, null, 'generate-script', { windowSeconds: 60, maxRequests: 20 });
    if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

    const { stage, briefing, context, mode, existingScript, organization_id, referenceLinks, additionalContext, from_gps } = parseOrThrow(GenerateExtendedSchemas.Script, await req.json());

    if (!stage || !stagePrompts[stage]) {
      return new Response(
        JSON.stringify({ error: "Etapa do funil inválida" }),
        {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // Check if trial — GPS auto-generated scripts are free for trial users
    let isTrialGps = false;
    if (from_gps && organization_id) {
      const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: sub } = await adminClient.from("subscriptions").select("status").eq("organization_id", organization_id).maybeSingle();
      isTrialGps = sub?.status === "trial";
    }

    // Pre-check credits (skip for trial GPS auto-generation)
    if (!isTrialGps && organization_id) {
      const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: wallet } = await adminClient.from("credit_wallets").select("balance").eq("organization_id", organization_id).maybeSingle();
      if (!wallet || wallet.balance < CREDIT_COST) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Você precisa de " + CREDIT_COST + " créditos.", code: "INSUFFICIENT_CREDITS" }), { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
      }
    }

    const fullPrompt = buildUserPrompt({
      stage,
      briefing,
      context,
      mode,
      existingScript,
      referenceLinks,
      additionalContext,
    });
    console.log(`[generate-script] stage=${stage} mode=${mode || 'generate'} prompt_version=${PROMPT_VERSION}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            { role: "user", content: fullPrompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Limite de requisições excedido. Tente novamente em alguns minutos.",
          }),
          {
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Créditos insuficientes. Faça upgrade do seu plano.",
          }),
          {
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar script" }),
        {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await aiResponse.json();
    const content =
      aiData.choices?.[0]?.message?.content || "Erro ao gerar conteúdo";
    const tokensUsed = aiData.usage?.total_tokens || 0;

    // Get org id for logging
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: orgData } = await serviceClient.rpc("get_user_org_id", {
      _user_id: userId,
    });

    if (orgData) {
      await serviceClient.from("ai_conversation_logs").insert({
        organization_id: orgData,
        agent_id: "00000000-0000-0000-0000-000000000000",
        contact_id: "00000000-0000-0000-0000-000000000000",
        input_message: `[Script ${stage}] ${briefingBlock?.substring(0, 200) || "generate"}`,
        output_message: content.substring(0, 500),
        tokens_used: tokensUsed,
        model: "google/gemini-3-flash-preview",
      });

      // Debit credits (skip for trial GPS auto-generation)
      if (!isTrialGps) {
        try {
          const { data: gpsApproved } = await serviceClient
            .from("marketing_strategies")
            .select("id")
            .eq("organization_id", orgData)
            .eq("status", "approved")
            .limit(1)
            .maybeSingle();

          if (!gpsApproved) {
            console.log("GPS not yet approved — skipping credit debit");
          } else {
            await serviceClient.rpc("debit_credits", {
              _org_id: orgData,
              _amount: CREDIT_COST,
              _description: `Geração de script (${stage})`,
              _source: "generate-script",
            });
          }
        } catch (debitErr) {
          console.error("Debit error (non-blocking):", debitErr);
        }
      }
    }

    // Generate a suggested title
    const stageLabels: Record<string, string> = {
      prospeccao: "Prospecção",
      diagnostico: "Diagnóstico",
      negociacao: "Negociação",
      fechamento: "Fechamento",
      objecoes: "Quebra de Objeções",
    };

    const suggestedTitle = mode === "improve"
      ? undefined
      : `Script de ${stageLabels[stage]} - ${context?.segment || context?.produtosServicos?.substring(0, 30) || "Geral"}`;

    return new Response(
      JSON.stringify({
        content,
        title: suggestedTitle,
        tags: [stageLabels[stage], context?.segment, context?.modeloNegocio].filter(Boolean),
        tokens_used: tokensUsed,
      }),
      {
        headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    const valRes = validationErrorResponse(e, getCorsHeaders(req));
    if (valRes) return valRes;
    log.error("generate-script error", { error: String(e) });
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro desconhecido",
      }),
      {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
