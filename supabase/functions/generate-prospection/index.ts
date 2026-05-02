// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { parseOrThrow, validationErrorResponse, GenerateSchemas } from '../_shared/schemas.ts';
import { SYSTEM_PROMPT, buildUserPrompt, PROMPT_VERSION } from '../_shared/prompts/generate-prospection.ts';

const CREDIT_COST = 30;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const _rl = await checkRateLimit(userId, null, 'generate-prospection', { windowSeconds: 60, maxRequests: 20 });
    if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

    const rawBody = await req.json();
    const { regiao, nicho, porte, desafio, objetivo, nome_empresa, site, redes_sociais, conhecimento_previo, nivel_contato, contato_decisor, cargo_decisor, organization_id } = parseOrThrow(GenerateSchemas.Prospection, rawBody);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Pre-check credits
    if (organization_id) {
      const adminCheck = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: wallet } = await adminCheck.from("credit_wallets").select("balance").eq("organization_id", organization_id).maybeSingle();
      if (!wallet || wallet.balance < CREDIT_COST) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Você precisa de " + CREDIT_COST + " créditos." }), { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
      }
    }

    const userPrompt = buildUserPrompt({
      regiao,
      nicho,
      porte,
      desafio,
      objetivo,
      nome_empresa,
      site,
      redes_sociais,
      conhecimento_previo,
      nivel_contato,
      contato_decisor,
      cargo_decisor,
    });
    console.log(`[generate-prospection] prompt_version=${PROMPT_VERSION}`);

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
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_prospection_plan",
                description:
                  "Retorna um plano de prospecção completo e estruturado com 5 seções.",
                parameters: {
                  type: "object",
                  properties: {
                    estrategia_abordagem: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        descricao: { type: "string" },
                        passos: {
                          type: "array",
                          items: { type: "string" },
                        },
                        dicas: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["titulo", "descricao", "passos", "dicas"],
                      additionalProperties: false,
                    },
                    avaliacao_inicial: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        descricao: { type: "string" },
                        perguntas: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              pergunta: { type: "string" },
                              objetivo: { type: "string" },
                            },
                            required: ["pergunta", "objetivo"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["titulo", "descricao", "perguntas"],
                      additionalProperties: false,
                    },
                    roteiro_contato: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        descricao: { type: "string" },
                        script_telefone: { type: "string" },
                        script_whatsapp: { type: "string" },
                      },
                      required: [
                        "titulo",
                        "descricao",
                        "script_telefone",
                        "script_whatsapp",
                      ],
                      additionalProperties: false,
                    },
                    quebra_objecoes: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        descricao: { type: "string" },
                        objecoes: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              objecao: { type: "string" },
                              resposta: { type: "string" },
                            },
                            required: ["objecao", "resposta"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["titulo", "descricao", "objecoes"],
                      additionalProperties: false,
                    },
                    passo_a_passo_reuniao: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        descricao: { type: "string" },
                        checklist: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["titulo", "descricao", "checklist"],
                      additionalProperties: false,
                    },
                  },
                  required: [
                    "estrategia_abordagem",
                    "avaliacao_inicial",
                    "roteiro_contato",
                    "quebra_objecoes",
                    "passo_a_passo_reuniao",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_prospection_plan" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Faça upgrade do seu plano." }),
          { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar plano de prospecção" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const tokensUsed = aiData.usage?.total_tokens || 0;

    // Extract tool call result
    let result: Record<string, unknown> | null = null;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        result =
          typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Falha ao estruturar resposta da IA" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Log usage
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
        input_message: `[Prospecção] ${nicho} - ${regiao}`,
        output_message: JSON.stringify(result).substring(0, 500),
        tokens_used: tokensUsed,
        model: "google/gemini-3-flash-preview",
      });

      // Debit credits — only after first GPS is approved
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
            _description: `Prospecção IA (${nicho})`,
            _source: "generate-prospection",
          });
        }
      } catch (debitErr) {
        console.error("Debit error (non-blocking):", debitErr);
      }
    }

    return new Response(
      JSON.stringify({ result, tokens_used: tokensUsed }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (e) {
    const valResp = validationErrorResponse(e, getCorsHeaders(req));
    if (valResp) return valResp;
    console.error("generate-prospection error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
