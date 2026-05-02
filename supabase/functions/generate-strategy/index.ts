// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { debitIfGPSDone } from '../_shared/credits.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import {
  GPS_SYSTEM_PROMPT,
  STRATEGIC_PLAN_SYSTEM_PROMPT,
  PROJECTIONS_SYSTEM_PROMPT,
  buildUserPrompt as buildStrategyUserPrompt,
  PROMPT_VERSION,
} from '../_shared/prompts/generate-strategy.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { parseOrThrow, validationErrorResponse, GenerateExtendedSchemas } from '../_shared/schemas.ts';
import { assertOrgMember, authErrorResponse } from '../_shared/auth.ts';

const CREDIT_COST = 50;

// ── TOOL SCHEMAS ────────────────────────────────────────────────────

const GPS_DIAGNOSIS_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description: "Gera o diagnóstico GPS do negócio com scores de marketing e comercial, radar 5 eixos, persona, análise de concorrência e análise ECE.",
    parameters: {
      type: "object",
      properties: {
        resumo_executivo: { type: "string", description: "Resumo executivo de 3-4 parágrafos" },
        resumo_cliente: {
          type: "object",
          properties: {
            nome_empresa: { type: "string" },
            segmento: { type: "string" },
            proposta_valor: { type: "string" },
            diferencial: { type: "string" },
            modelo_negocio: { type: "string" },
          },
          required: ["nome_empresa", "segmento", "proposta_valor", "diferencial", "modelo_negocio"],
        },
        score_marketing: { type: "integer", description: "Score de marketing de 0-100, OBRIGATORIAMENTE número inteiro, nunca decimal" },
        score_comercial: { type: "integer", description: "Score comercial de 0-100, OBRIGATORIAMENTE número inteiro, nunca decimal" },
        diagnostico_gps: {
          type: "object",
          properties: {
            score_geral: { type: "integer", description: "Média ponderada dos scores de marketing e comercial, 0-100, OBRIGATORIAMENTE inteiro" },
            nivel: { type: "string", description: "Crítico (0-25), Básico (26-50), Intermediário (51-75), Avançado (76-100)" },
            descricao: { type: "string" },
            radar_data: {
              type: "array",
              items: {
                type: "object",
                properties: { eixo: { type: "string" }, score: { type: "number" }, max: { type: "number" } },
                required: ["eixo", "score", "max"],
              },
              description: "5 eixos: Conteúdo, Tráfego, Web, Sales, Escala. Score 0-100 cada.",
            },
            problemas_por_etapa: {
              type: "object",
              properties: {
                conteudo: { type: "array", items: { type: "string" } },
                trafego: { type: "array", items: { type: "string" } },
                web: { type: "array", items: { type: "string" } },
                sales: { type: "array", items: { type: "string" } },
                validacao: { type: "array", items: { type: "string" } },
              },
              required: ["conteudo", "trafego", "web", "sales", "validacao"],
            },
            gargalos_ece: {
              type: "object",
              properties: {
                estrutura: { type: "string", description: "Problemas na Estrutura (E de ECE) — site, CRM, funil, processos" },
                coleta: { type: "string", description: "Problemas na Coleta de dados (C de ECE) — métricas, tráfego, leads" },
                escala: { type: "string", description: "Problemas na Escala (E de ECE) — validação, crescimento, capacidade" },
              },
              required: ["estrutura", "coleta", "escala"],
            },
            insights: { type: "array", items: { type: "string" }, description: "3-5 insights personalizados" },
          },
          required: ["score_geral", "nivel", "descricao", "radar_data", "problemas_por_etapa", "gargalos_ece", "insights"],
        },
        persona: {
          type: "object",
          properties: {
            descricao: { type: "string", description: "Descrição narrativa da persona ideal" },
            faixa_etaria: { type: "string" },
            genero: { type: "string" },
            canais: { type: "array", items: { type: "string" } },
            dor_principal: { type: "string" },
            decisao_compra: { type: "string" },
            poder_aquisitivo: { type: "string" },
          },
          required: ["descricao", "faixa_etaria", "canais", "dor_principal", "decisao_compra"],
        },
        analise_concorrencia: {
          type: "object",
          properties: {
            concorrentes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  pontos_fortes: { type: "array", items: { type: "string" } },
                  pontos_fracos: { type: "array", items: { type: "string" } },
                  oportunidades: { type: "array", items: { type: "string" } },
                },
                required: ["nome", "pontos_fortes", "pontos_fracos", "oportunidades"],
              },
            },
            diferencial_empresa: { type: "string" },
            posicionamento_recomendado: { type: "string" },
          },
          required: ["concorrentes", "diferencial_empresa", "posicionamento_recomendado"],
        },
        tom_comunicacao: {
          type: "object",
          description: "Tom de voz e comunicação da marca baseado nas respostas do briefing",
          properties: {
            tom_principal: { type: "string", description: "Tom principal da comunicação (ex: Educativo e acessível, Profissional e inspirador)" },
            personalidade_marca: { type: "array", items: { type: "string" }, description: "3-5 traços de personalidade da marca" },
            palavras_usar: { type: "array", items: { type: "string" }, description: "5-8 palavras/expressões que a marca deve usar" },
            palavras_evitar: { type: "array", items: { type: "string" }, description: "5-8 palavras/expressões que a marca deve evitar" },
            exemplo_mensagem: { type: "string", description: "Exemplo de mensagem no tom ideal da marca" },
            nivel_formalidade: { type: "string", description: "Nível de formalidade: Casual, Equilibrado, Formal" },
          },
          required: ["tom_principal", "personalidade_marca", "palavras_usar", "palavras_evitar"],
        },
        kpis_hero: {
          type: "object",
          properties: {
            meta_faturamento: { type: "string" },
            ticket_medio: { type: "string" },
            recorrencia: { type: "string" },
            ltv_cac: { type: "string" },
          },
          required: ["meta_faturamento", "ticket_medio", "recorrencia", "ltv_cac"],
        },
      },
      required: ["resumo_executivo", "resumo_cliente", "score_marketing", "score_comercial", "diagnostico_gps", "persona", "analise_concorrencia", "tom_comunicacao", "kpis_hero"],
      additionalProperties: false,
    },
  },
};

const STRATEGIC_PLAN_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description: "Gera o planejamento estratégico das 5 etapas NoExcuse.",
    parameters: {
      type: "object",
      properties: {
        etapas: {
          type: "object",
          properties: {
            conteudo: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                diagnostico: { type: "string" },
                score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } },
                acoes: { type: "array", items: { type: "string" }, description: "5-8 ações específicas" },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } },
                entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            trafego: {
              type: "object",
              properties: {
                titulo: { type: "string" }, diagnostico: { type: "string" }, score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } }, acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } }, entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            web: {
              type: "object",
              properties: {
                titulo: { type: "string" }, diagnostico: { type: "string" }, score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } }, acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } }, entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            sales: {
              type: "object",
              properties: {
                titulo: { type: "string" }, diagnostico: { type: "string" }, score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } }, acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } }, entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            validacao: {
              type: "object",
              properties: {
                titulo: { type: "string" }, diagnostico: { type: "string" }, score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } }, acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } }, entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
          },
          required: ["conteudo", "trafego", "web", "sales", "validacao"],
        },
      },
      required: ["etapas"],
      additionalProperties: false,
    },
  },
};

const PROJECTIONS_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description: "Gera projeções financeiras, unit economics e entregáveis para calculadora.",
    parameters: {
      type: "object",
      properties: {
        projecoes: {
          type: "object",
          properties: {
            unit_economics: {
              type: "object",
              properties: {
                cac: { type: "string" }, ltv: { type: "string" }, ltv_cac_ratio: { type: "string" },
                ticket_medio: { type: "string" }, margem: { type: "string" },
              },
              required: ["cac", "ltv", "ltv_cac_ratio", "ticket_medio", "margem"],
            },
            funil_conversao: {
              type: "array",
              items: {
                type: "object",
                properties: { etapa: { type: "string" }, volume: { type: "number" }, taxa: { type: "string" } },
                required: ["etapa", "volume", "taxa"],
              },
            },
            projecao_mensal: {
              type: "array",
              items: {
                type: "object",
                properties: { mes: { type: "number" }, leads: { type: "number" }, clientes: { type: "number" }, receita: { type: "number" }, investimento: { type: "number" } },
                required: ["mes", "leads", "clientes", "receita", "investimento"],
              },
              description: "Projeção de 6 meses",
            },
            crescimento_acumulado: {
              type: "array",
              items: {
                type: "object",
                properties: { mes: { type: "number" }, receita_acumulada: { type: "number" }, clientes_acumulados: { type: "number" } },
                required: ["mes", "receita_acumulada", "clientes_acumulados"],
              },
            },
          },
          required: ["unit_economics", "funil_conversao", "projecao_mensal", "crescimento_acumulado"],
        },
        entregaveis_calculadora: {
          type: "array",
          items: {
            type: "object",
            properties: {
              service_id: { type: "string", description: "ID do serviço no catálogo NoExcuse. IDs válidos: logo-manual, material-marca, midia-off, naming, registro-inpi, ebook, apresentacao-comercial, artes-organicas, videos-reels, programacao-meta, programacao-linkedin, programacao-tiktok, programacao-youtube, capa-destaques, criacao-avatar, template-canva, edicao-youtube, gestao-meta, gestao-google, gestao-linkedin, gestao-tiktok, config-gmb, artes-campanha, videos-campanha, pagina-site, lp-link-bio, lp-vsl, lp-vendas, lp-captura, lp-ebook, alterar-contato, alterar-secao, ecommerce, config-crm" },
              service_name: { type: "string" },
              quantity: { type: "number" },
              justificativa: { type: "string" },
              etapa: { type: "string", enum: ["conteudo", "trafego", "web", "sales", "validacao"], description: "Etapa do plano estratégico à qual este entregável pertence" },
            },
            required: ["service_id", "service_name", "quantity", "justificativa", "etapa"],
          },
          description: "Lista de serviços do catálogo NoExcuse necessários para executar o plano. Cada item deve estar vinculado à etapa estratégica correspondente.",
        },
      },
      required: ["projecoes", "entregaveis_calculadora"],
      additionalProperties: false,
    },
  },
};

// ── SYSTEM PROMPTS (imported from _shared/prompts/generate-strategy.ts) ─────

const GPS_PROMPT = GPS_SYSTEM_PROMPT;
const STRATEGIC_PLAN_PROMPT = STRATEGIC_PLAN_SYSTEM_PROMPT;
const PROJECTIONS_PROMPT = PROJECTIONS_SYSTEM_PROMPT;

async function callAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  toolSchema: Record<string, unknown>,
): Promise<{ result: Record<string, unknown> | null; tokensUsed: number }> {
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [toolSchema],
      tool_choice: { type: "function", function: { name: "generate_strategy" } },
    }),
  });

  if (!aiResponse.ok) {
    const status = aiResponse.status;
    const errText = await aiResponse.text();
    console.error("AI gateway error:", status, errText);
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("AI_CREDITS");
    throw new Error("AI_ERROR");
  }

  const aiData = await aiResponse.json();
  const tokensUsed = aiData.usage?.total_tokens || 0;

  let result: Record<string, unknown> | null = null;
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try {
      result = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch (e) {
      console.error("Failed to parse tool call arguments:", e);
    }
  }

  if (!result) {
    const messageContent = aiData.choices?.[0]?.message?.content;
    if (messageContent) {
      try {
        const cleaned = messageContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        result = JSON.parse(cleaned);
      } catch (e) {
        console.error("Fallback JSON parse failed:", e);
      }
    }
  }

  return { result, tokensUsed };
}

// ── MAIN HANDLER ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'generate-strategy');
  const log = makeLogger(ctx);
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const _rl = await checkRateLimit(userId, null, 'generate-strategy', { windowSeconds: 60, maxRequests: 20 });
    if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

    const { answers, organization_id, section } = parseOrThrow(GenerateExtendedSchemas.Strategy, await req.json());

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // BOLA/IDOR guard: ensure caller belongs to the target org
    if (organization_id) {
      await assertOrgMember(serviceClient, userId, organization_id);
    }

    // Débito condicional ao GPS aprovado (no-op no primeiro GPS; debita em regenerações)
    if (organization_id) {
      const debited = await debitIfGPSDone(
        serviceClient, organization_id, CREDIT_COST, "Estratégia de marketing", "generate-strategy",
        Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      if (debited === false) {
        const { data: wallet } = await serviceClient
          .from("credit_wallets")
          .select("balance")
          .eq("organization_id", organization_id)
          .maybeSingle();
        if (wallet && wallet.balance < CREDIT_COST) {
          return new Response(
            JSON.stringify({ error: `Créditos insuficientes. Você precisa de ${CREDIT_COST} créditos.`, code: "INSUFFICIENT_CREDITS" }),
            { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }
      }
    }

    // ── Enrich answers with site content (if URL provided) ──────────
    const siteUrl = (answers?.website_url || answers?.site_url || answers?.website || answers?.site || "").toString().trim();
    let siteContent = "";
    if (siteUrl && /^https?:\/\//i.test(siteUrl)) {
      try {
        const siteRes = await fetch(siteUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; NOEXCUSE-Bot/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        const html = await siteRes.text();
        siteContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 3000);
        console.log("Site content extracted:", siteContent.length, "chars from", siteUrl);
      } catch (e) {
        console.warn("Failed to fetch site:", siteUrl, (e as Error)?.message);
      }
    }
    if (section) {
      const configs: Record<string, { schema: any; prompt: string }> = {
        "gps": { schema: GPS_DIAGNOSIS_SCHEMA, prompt: GPS_PROMPT },
        "marketing-core": { schema: GPS_DIAGNOSIS_SCHEMA, prompt: GPS_PROMPT },
        "marketing-growth": { schema: GPS_DIAGNOSIS_SCHEMA, prompt: GPS_PROMPT },
        "comercial": { schema: GPS_DIAGNOSIS_SCHEMA, prompt: GPS_PROMPT },
        "strategic": { schema: STRATEGIC_PLAN_SCHEMA, prompt: STRATEGIC_PLAN_PROMPT },
        "projections": { schema: PROJECTIONS_SCHEMA, prompt: PROJECTIONS_PROMPT },
      };
      const config = configs[section];
      if (!config) {
        return new Response(JSON.stringify({ error: "Seção inválida" }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const userPrompt = buildStrategyUserPrompt({ answers, section, siteContent, siteUrl });
      console.log(`[generate-strategy] section=${section} prompt_version=${PROMPT_VERSION}`);
      const { result, tokensUsed } = await callAI(LOVABLE_API_KEY, config.prompt, userPrompt, config.schema);

      if (!result) {
        return new Response(
          JSON.stringify({ error: "Falha ao gerar. Tente novamente." }),
          { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ result, tokens_used: tokensUsed }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ── Full generation: 3 parallel calls ───────────────────────────
    console.log("Generating full strategy (3 parallel calls)...");

    console.log(`[generate-strategy] full generation prompt_version=${PROMPT_VERSION}`);

    const [gpsResult, strategicResult, projectionsResult] = await Promise.all([
      callAI(LOVABLE_API_KEY, GPS_PROMPT, buildStrategyUserPrompt({ answers, section: 'gps', siteContent, siteUrl }), GPS_DIAGNOSIS_SCHEMA),
      callAI(LOVABLE_API_KEY, STRATEGIC_PLAN_PROMPT, buildStrategyUserPrompt({ answers, section: 'strategic', siteContent, siteUrl }), STRATEGIC_PLAN_SCHEMA),
      callAI(LOVABLE_API_KEY, PROJECTIONS_PROMPT, buildStrategyUserPrompt({ answers, section: 'projections', siteContent, siteUrl }), PROJECTIONS_SCHEMA),
    ]);

    const totalTokens = gpsResult.tokensUsed + strategicResult.tokensUsed + projectionsResult.tokensUsed;

    if (!gpsResult.result) {
      return new Response(
        JSON.stringify({ error: "Falha ao gerar diagnóstico GPS. Tente novamente." }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Garantir que scores são sempre inteiros antes de retornar
    const sanitizeScores = (obj: Record<string, unknown>): Record<string, unknown> => {
      const scoreFields = ["score_marketing", "score_comercial", "score_geral"];
      const sanitized = { ...obj };
      for (const field of scoreFields) {
        if (typeof sanitized[field] === "number") {
          sanitized[field] = Math.round(sanitized[field] as number);
        }
        if (sanitized.diagnostico_gps && typeof (sanitized.diagnostico_gps as any)?.[field] === "number") {
          (sanitized.diagnostico_gps as any)[field] = Math.round((sanitized.diagnostico_gps as any)[field]);
        }
      }
      return sanitized;
    };

    const mergedResult = sanitizeScores({
      ...(gpsResult.result || {}),
      ...(strategicResult.result || {}),
      ...(projectionsResult.result || {}),
    });

    console.log(`Full strategy generated. Total tokens: ${totalTokens}`);

    // Resolve org for logging + campaign trigger (try saas first, fallback to franchise)
    let { data: orgData } = await serviceClient.rpc("get_user_org_id", { _user_id: userId, _portal: "saas" });
    if (!orgData) {
      const fb = await serviceClient.rpc("get_user_org_id", { _user_id: userId, _portal: "franchise" });
      orgData = fb.data;
    }

    if (orgData) {
      await serviceClient.from("ai_conversation_logs").insert({
        organization_id: orgData,
        agent_id: "00000000-0000-0000-0000-000000000000",
        contact_id: "00000000-0000-0000-0000-000000000000",
        input_message: `[Estratégia] Briefing com ${Object.keys(answers).length} respostas`,
        output_message: JSON.stringify(mergedResult).substring(0, 500),
        tokens_used: totalTokens,
        model: "google/gemini-2.5-flash",
      });

      // Trigger gps_completed campaign email (idempotent — once per org)
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${supabaseUrl}/functions/v1/send-campaign-email`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trigger_event: "gps_completed",
            organization_id: orgData,
            user_id: userId,
            metadata: { tokens_used: totalTokens },
          }),
        });
      } catch (e) {
        console.error("gps_completed campaign trigger failed:", e);
      }
    }

    return new Response(
      JSON.stringify({ result: mergedResult, tokens_used: totalTokens }),
      { headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const valRes = validationErrorResponse(err, getCorsHeaders(req));
    if (valRes) return valRes;
    log.error("Strategy generation error", { error: String(err) });
    return authErrorResponse(err, getCorsHeaders(req));
  }
});
