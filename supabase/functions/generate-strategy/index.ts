import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

const CREDIT_COST = 50;

// ── TOOL SCHEMAS ────────────────────────────────────────────────────

const GPS_DIAGNOSIS_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description: "Gera o diagnóstico GPS do negócio com score, radar 5 eixos e análise ECE.",
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
        diagnostico_gps: {
          type: "object",
          properties: {
            score_geral: { type: "number", description: "Score de 0-100" },
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
                infraestrutura: { type: "string", description: "Problemas na infraestrutura (E de ECE)" },
                coleta: { type: "string", description: "Problemas na coleta de dados (C de ECE)" },
                escala: { type: "string", description: "Problemas na escala (E de ECE)" },
              },
              required: ["infraestrutura", "coleta", "escala"],
            },
            insights: { type: "array", items: { type: "string" }, description: "3-5 insights personalizados" },
          },
          required: ["score_geral", "nivel", "descricao", "radar_data", "problemas_por_etapa", "gargalos_ece", "insights"],
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
      required: ["resumo_executivo", "resumo_cliente", "diagnostico_gps", "kpis_hero"],
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
                metricas_alvo: {
                  type: "object",
                  additionalProperties: { type: "string" },
                  description: "Ex: posts_semana, engajamento_meta, alcance_meta",
                },
                entregaveis: { type: "array", items: { type: "string" }, description: "Nomes de serviços NoExcuse recomendados" },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            trafego: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                diagnostico: { type: "string" },
                score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } },
                acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } },
                entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            web: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                diagnostico: { type: "string" },
                score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } },
                acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } },
                entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            sales: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                diagnostico: { type: "string" },
                score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } },
                acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } },
                entregaveis: { type: "array", items: { type: "string" } },
              },
              required: ["titulo", "diagnostico", "score", "problemas", "acoes", "metricas_alvo", "entregaveis"],
            },
            validacao: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                diagnostico: { type: "string" },
                score: { type: "number" },
                problemas: { type: "array", items: { type: "string" } },
                acoes: { type: "array", items: { type: "string" } },
                metricas_alvo: { type: "object", additionalProperties: { type: "string" } },
                entregaveis: { type: "array", items: { type: "string" } },
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
                cac: { type: "string" },
                ltv: { type: "string" },
                ltv_cac_ratio: { type: "string" },
                ticket_medio: { type: "string" },
                margem: { type: "string" },
              },
              required: ["cac", "ltv", "ltv_cac_ratio", "ticket_medio", "margem"],
            },
            funil_conversao: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  etapa: { type: "string" },
                  volume: { type: "number" },
                  taxa: { type: "string" },
                },
                required: ["etapa", "volume", "taxa"],
              },
            },
            projecao_mensal: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mes: { type: "number" },
                  leads: { type: "number" },
                  clientes: { type: "number" },
                  receita: { type: "number" },
                  investimento: { type: "number" },
                },
                required: ["mes", "leads", "clientes", "receita", "investimento"],
              },
              description: "Projeção de 6 meses",
            },
            crescimento_acumulado: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mes: { type: "number" },
                  receita_acumulada: { type: "number" },
                  clientes_acumulados: { type: "number" },
                },
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
              service_id: {
                type: "string",
                description: "ID do serviço no catálogo NoExcuse. IDs válidos: logo-manual, material-marca, midia-off, naming, registro-inpi, ebook, apresentacao-comercial, artes-organicas, videos-reels, programacao-meta, programacao-linkedin, programacao-tiktok, programacao-youtube, capa-destaques, criacao-avatar, template-canva, edicao-youtube, gestao-meta, gestao-google, gestao-linkedin, gestao-tiktok, config-gmb, artes-campanha, videos-campanha, pagina-site, lp-link-bio, lp-vsl, lp-vendas, lp-captura, lp-ebook, alterar-contato, alterar-secao, ecommerce, config-crm",
              },
              service_name: { type: "string" },
              quantity: { type: "number" },
              justificativa: { type: "string" },
            },
            required: ["service_id", "service_name", "quantity", "justificativa"],
          },
          description: "Lista de entregáveis mapeados para IDs reais do catálogo de serviços NoExcuse",
        },
      },
      required: ["projecoes", "entregaveis_calculadora"],
      additionalProperties: false,
    },
  },
};

// ── SYSTEM PROMPTS ──────────────────────────────────────────────────

const GPS_PROMPT = `Você é um estrategista de negócios sênior da No Excuse Digital. Analise o briefing e gere o DIAGNÓSTICO GPS DO NEGÓCIO.

METODOLOGIA NO EXCUSE:
- 5 Etapas Estratégicas: Conteúdo e Linha Editorial, Tráfego e Distribuição, Web e Conversão, Sales e Fechamento, Validação e Escala
- Framework ECE: Estruturar infraestrutura → Coletar dados → Escalar o que funciona

GERE:
1. RESUMO EXECUTIVO: 3-4 parágrafos sobre a empresa, momento atual e oportunidades
2. RESUMO DO CLIENTE: Nome, segmento, proposta de valor, diferencial, modelo de negócio
3. DIAGNÓSTICO GPS:
   - Score geral 0-100 baseado nas 5 etapas
   - Nível: Crítico (0-25), Básico (26-50), Intermediário (51-75), Avançado (76-100)
   - Radar com 5 eixos (Conteúdo, Tráfego, Web, Sales, Escala) score 0-100 cada
   - Problemas identificados por etapa (2-4 por etapa)
   - Gargalos ECE (infraestrutura, coleta, escala)
   - 3-5 insights personalizados
4. KPIs HERO: Meta faturamento, ticket médio, recorrência, LTV/CAC

REGRAS:
- Seja ESPECÍFICO com base nas respostas
- Use CÁLCULOS REAIS baseados nos dados informados
- Sempre em português brasileiro
- Valores monetários em R$

Use a ferramenta generate_strategy para retornar.`;

const STRATEGIC_PLAN_PROMPT = `Você é um estrategista de marketing e vendas sênior da No Excuse Digital. Gere o PLANEJAMENTO ESTRATÉGICO das 5 ETAPAS.

METODOLOGIA NO EXCUSE - 5 ETAPAS:

01. CONTEÚDO E LINHA EDITORIAL
- Funil de conteúdo (topo/meio/fundo/pós-venda)
- Formatos recomendados por canal
- Calendário e frequência sugeridos
- Pilares de conteúdo

02. TRÁFEGO E DISTRIBUIÇÃO
- Plataformas recomendadas com investimento sugerido
- Métricas-alvo por plataforma (CTR, CPC, CPL, MQLs)
- Estratégia de tráfego orgânico + pago

03. WEB E CONVERSÃO
- LPs necessárias por segmento/público
- Elementos obrigatórios (prova social, CTA, urgência)
- Testes A/B sugeridos
- Otimizações de conversão

04. SALES E FECHAMENTO
- Funil de vendas com taxas por etapa
- Processo comercial detalhado
- Script e abordagem
- Follow-up e cadência

05. VALIDAÇÃO E ESCALA
- KPIs para monitorar por etapa
- Testes controlados sugeridos
- Critérios para escalar
- Gargalos de capacidade

Para CADA etapa, gere: título, diagnóstico da situação atual, score 0-100, problemas (2-4), ações específicas (5-8), métricas-alvo, e entregáveis NoExcuse recomendados.

REGRAS:
- Ações devem ser ESPECÍFICAS e executáveis (não genéricas)
- Métricas com valores numéricos reais baseados no segmento
- Entregáveis devem ser nomes de serviços do catálogo NoExcuse
- Sempre em português brasileiro

Use a ferramenta generate_strategy para retornar.`;

const PROJECTIONS_PROMPT = `Você é um analista financeiro e estrategista da No Excuse Digital. Gere PROJEÇÕES FINANCEIRAS e mapeie ENTREGÁVEIS para a calculadora.

GERE:
1. UNIT ECONOMICS: CAC, LTV, LTV/CAC ratio, ticket médio, margem — CALCULE com base nos dados do briefing
2. FUNIL DE CONVERSÃO: Etapas do funil com volumes e taxas de conversão realistas
3. PROJEÇÃO MENSAL (6 meses): Leads, clientes, receita e investimento — crescimento progressivo
4. CRESCIMENTO ACUMULADO (6 meses): Receita e clientes acumulados com recorrência se aplicável

5. ENTREGÁVEIS PARA CALCULADORA:
Mapeie os serviços necessários usando EXATAMENTE estes IDs do catálogo:
- Branding: logo-manual, material-marca, midia-off, naming, registro-inpi, ebook, apresentacao-comercial
- Social Media: artes-organicas, videos-reels, programacao-meta, programacao-linkedin, programacao-tiktok, programacao-youtube, capa-destaques, criacao-avatar, template-canva, edicao-youtube
- Performance: gestao-meta, gestao-google, gestao-linkedin, gestao-tiktok, config-gmb, artes-campanha, videos-campanha
- Web: pagina-site, lp-link-bio, lp-vsl, lp-vendas, lp-captura, lp-ebook, alterar-contato, alterar-secao, ecommerce
- Dados/CRM: config-crm

Para cada serviço: service_id (ID exato acima), service_name, quantity (número), justificativa.
Escolha 5-12 serviços mais relevantes para o cliente baseado no diagnóstico.

REGRAS:
- CÁLCULOS REAIS baseados em ticket médio, faturamento, margem informados
- Projeções realistas para o segmento
- IDs de serviço devem ser EXATOS conforme lista acima
- Sempre em português brasileiro
- Valores monetários em R$

Use a ferramenta generate_strategy para retornar.`;

// ── HELPERS ─────────────────────────────────────────────────────────

function buildUserPrompt(answers: Record<string, unknown>, section: string): string {
  const answersText = Object.entries(answers)
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("\n");

  return `Com base nas respostas do briefing do cliente abaixo, gere o ${
    section === "gps" ? "DIAGNÓSTICO GPS DO NEGÓCIO" :
    section === "strategic" ? "PLANEJAMENTO ESTRATÉGICO DAS 5 ETAPAS" :
    "PROJEÇÕES FINANCEIRAS E ENTREGÁVEIS"
  }.

RESPOSTAS DO BRIEFING:
${answersText}

Use a ferramenta generate_strategy para retornar.`;
}

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

    const { answers, organization_id, section } = await req.json();
    if (!answers) {
      return new Response(
        JSON.stringify({ error: "Respostas do briefing são obrigatórias" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // If section is specified, handle single-section calls (legacy or selective)
    if (section) {
      const configs: Record<string, { schema: any; prompt: string }> = {
        "gps": { schema: GPS_DIAGNOSIS_SCHEMA, prompt: GPS_PROMPT },
        "strategic": { schema: STRATEGIC_PLAN_SCHEMA, prompt: STRATEGIC_PLAN_PROMPT },
        "projections": { schema: PROJECTIONS_SCHEMA, prompt: PROJECTIONS_PROMPT },
      };
      const config = configs[section];
      if (!config) {
        return new Response(JSON.stringify({ error: "Seção inválida" }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const userPrompt = buildUserPrompt(answers, section);
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

    const userPromptBase = Object.entries(answers)
      .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("\n");

    const makePrompt = (s: string) => `Com base nas respostas do briefing do cliente abaixo, gere o ${
      s === "gps" ? "DIAGNÓSTICO GPS DO NEGÓCIO" :
      s === "strategic" ? "PLANEJAMENTO ESTRATÉGICO DAS 5 ETAPAS" :
      "PROJEÇÕES FINANCEIRAS E ENTREGÁVEIS"
    }.\n\nRESPOSTAS DO BRIEFING:\n${userPromptBase}\n\nUse a ferramenta generate_strategy para retornar.`;

    const [gpsResult, strategicResult, projectionsResult] = await Promise.all([
      callAI(LOVABLE_API_KEY, GPS_PROMPT, makePrompt("gps"), GPS_DIAGNOSIS_SCHEMA),
      callAI(LOVABLE_API_KEY, STRATEGIC_PLAN_PROMPT, makePrompt("strategic"), STRATEGIC_PLAN_SCHEMA),
      callAI(LOVABLE_API_KEY, PROJECTIONS_PROMPT, makePrompt("projections"), PROJECTIONS_SCHEMA),
    ]);

    const totalTokens = gpsResult.tokensUsed + strategicResult.tokensUsed + projectionsResult.tokensUsed;

    if (!gpsResult.result) {
      return new Response(
        JSON.stringify({ error: "Falha ao gerar diagnóstico GPS. Tente novamente." }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Merge all results into single object
    const mergedResult = {
      ...(gpsResult.result || {}),
      ...(strategicResult.result || {}),
      ...(projectionsResult.result || {}),
    };

    console.log(`Full strategy generated. Total tokens: ${totalTokens}`);

    // Log usage
    const { data: orgData } = await serviceClient.rpc("get_user_org_id", { _user_id: userId, _portal: "franchise" });
    if (orgData) {
      await serviceClient.from("ai_conversation_logs").insert({
        organization_id: orgData,
        agent_id: "00000000-0000-0000-0000-000000000000",
        contact_id: "00000000-0000-0000-0000-000000000000",
        input_message: `[Estratégia Franqueado] Briefing com ${Object.keys(answers).length} respostas`,
        output_message: JSON.stringify(mergedResult).substring(0, 500),
        tokens_used: totalTokens,
        model: "google/gemini-2.5-flash",
      });
    }

    return new Response(
      JSON.stringify({ result: mergedResult, tokens_used: totalTokens }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Strategy generation error:", err);
    const message = err instanceof Error ? err.message : "Erro interno";

    if (message === "RATE_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
        { status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }
    if (message === "AI_CREDITS") {
      return new Response(
        JSON.stringify({ error: "Créditos de IA insuficientes." }),
        { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
