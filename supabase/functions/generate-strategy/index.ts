import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CREDIT_COST = 300;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description:
      "Retorna uma estratégia de marketing completa e estruturada com diagnóstico, posicionamento, persona, pilares de conteúdo, funil, ideias de conteúdo, estrutura de site, tráfego pago, indicadores e projeções.",
    parameters: {
      type: "object",
      properties: {
        diagnostico: {
          type: "object",
          properties: {
            analise: { type: "string", description: "Análise detalhada do negócio e contexto de mercado" },
            pontos_fortes: { type: "array", items: { type: "string" } },
            oportunidades: { type: "array", items: { type: "string" } },
            riscos: { type: "array", items: { type: "string" } },
          },
          required: ["analise", "pontos_fortes", "oportunidades", "riscos"],
          additionalProperties: false,
        },
        posicionamento: {
          type: "object",
          properties: {
            proposta_valor: { type: "string" },
            mensagem_central: { type: "string" },
            diferenciacao: { type: "string" },
            tom_de_voz: { type: "string" },
          },
          required: ["proposta_valor", "mensagem_central", "diferenciacao", "tom_de_voz"],
          additionalProperties: false,
        },
        persona: {
          type: "object",
          properties: {
            nome: { type: "string" },
            idade: { type: "string" },
            profissao: { type: "string" },
            dores: { type: "array", items: { type: "string" } },
            desejos: { type: "array", items: { type: "string" } },
            objecoes: { type: "array", items: { type: "string" } },
            canais_preferidos: { type: "array", items: { type: "string" } },
            descricao: { type: "string" },
          },
          required: ["nome", "idade", "profissao", "dores", "desejos", "objecoes", "canais_preferidos", "descricao"],
          additionalProperties: false,
        },
        pilares_conteudo: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nome: { type: "string" },
              descricao: { type: "string" },
              exemplos: { type: "array", items: { type: "string" } },
            },
            required: ["nome", "descricao", "exemplos"],
            additionalProperties: false,
          },
          description: "3 a 5 pilares de conteúdo estratégicos",
        },
        estrategia_aquisicao: {
          type: "object",
          properties: {
            canais_prioritarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  canal: { type: "string" },
                  justificativa: { type: "string" },
                  acao_principal: { type: "string" },
                },
                required: ["canal", "justificativa", "acao_principal"],
                additionalProperties: false,
              },
            },
          },
          required: ["canais_prioritarios"],
          additionalProperties: false,
        },
        funil: {
          type: "object",
          properties: {
            topo: { type: "object", properties: { objetivo: { type: "string" }, acoes: { type: "array", items: { type: "string" } } }, required: ["objetivo", "acoes"], additionalProperties: false },
            meio: { type: "object", properties: { objetivo: { type: "string" }, acoes: { type: "array", items: { type: "string" } } }, required: ["objetivo", "acoes"], additionalProperties: false },
            fundo: { type: "object", properties: { objetivo: { type: "string" }, acoes: { type: "array", items: { type: "string" } } }, required: ["objetivo", "acoes"], additionalProperties: false },
          },
          required: ["topo", "meio", "fundo"],
          additionalProperties: false,
        },
        ideias_conteudo: {
          type: "array",
          items: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              formato: { type: "string", description: "Ex: Carrossel, Reels, Post, Story, Artigo" },
              pilar: { type: "string" },
              etapa_funil: { type: "string", enum: ["topo", "meio", "fundo"] },
            },
            required: ["titulo", "formato", "pilar", "etapa_funil"],
            additionalProperties: false,
          },
          description: "10 a 15 ideias de conteúdo iniciais",
        },
        estrutura_site: {
          type: "object",
          properties: {
            paginas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  objetivo: { type: "string" },
                  secoes: { type: "array", items: { type: "string" } },
                },
                required: ["nome", "objetivo", "secoes"],
                additionalProperties: false,
              },
            },
            recomendacoes: { type: "array", items: { type: "string" } },
          },
          required: ["paginas", "recomendacoes"],
          additionalProperties: false,
        },
        trafego_pago: {
          type: "object",
          properties: {
            campanhas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  plataforma: { type: "string" },
                  objetivo: { type: "string" },
                  publico: { type: "string" },
                  formato: { type: "string" },
                },
                required: ["nome", "plataforma", "objetivo", "publico", "formato"],
                additionalProperties: false,
              },
            },
            orcamento_sugerido: { type: "string" },
            recomendacoes: { type: "array", items: { type: "string" } },
          },
          required: ["campanhas", "orcamento_sugerido", "recomendacoes"],
          additionalProperties: false,
        },
        indicadores: {
          type: "object",
          properties: {
            cpl_estimado: { type: "string" },
            cac_estimado: { type: "string" },
            roi_esperado: { type: "string" },
            taxa_conversao_meta: { type: "string" },
          },
          required: ["cpl_estimado", "cac_estimado", "roi_esperado", "taxa_conversao_meta"],
          additionalProperties: false,
        },
        projecoes: {
          type: "object",
          properties: {
            leads: {
              type: "array",
              items: {
                type: "object",
                properties: { mes: { type: "string" }, sem_estrategia: { type: "number" }, com_estrategia: { type: "number" } },
                required: ["mes", "sem_estrategia", "com_estrategia"],
                additionalProperties: false,
              },
            },
            faturamento: {
              type: "array",
              items: {
                type: "object",
                properties: { mes: { type: "string" }, sem_estrategia: { type: "number" }, com_estrategia: { type: "number" } },
                required: ["mes", "sem_estrategia", "com_estrategia"],
                additionalProperties: false,
              },
            },
          },
          required: ["leads", "faturamento"],
          additionalProperties: false,
        },
        resumo_executivo: { type: "string", description: "Resumo de 2-3 parágrafos da estratégia completa" },
      },
      required: [
        "diagnostico", "posicionamento", "persona", "pilares_conteudo",
        "estrategia_aquisicao", "funil", "ideias_conteudo", "estrutura_site",
        "trafego_pago", "indicadores", "projecoes", "resumo_executivo",
      ],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `Você é um consultor sênior de marketing digital brasileiro, especialista em estratégia, posicionamento de marca, geração de leads e vendas digitais.

Sua função é receber as respostas de um diagnóstico empresarial com 10 perguntas e gerar uma estratégia de marketing completa, estruturada e acionável.

Diretrizes:
- Analise profundamente o contexto do negócio com base nas respostas
- Gere uma persona detalhada e realista
- Defina 3-5 pilares de conteúdo estratégicos
- Sugira 10-15 ideias de conteúdo iniciais distribuídas pelo funil
- Estruture campanhas de tráfego pago realistas
- Calcule indicadores baseados em benchmarks reais do mercado brasileiro
- Gere projeções de 6 meses para leads e faturamento
- Todas as recomendações devem ser práticas e executáveis
- Sempre responda em português brasileiro

Use a ferramenta generate_strategy para retornar a estratégia estruturada.`;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { answers, organization_id } = await req.json();
    if (!answers) {
      return new Response(
        JSON.stringify({ error: "Respostas do diagnóstico são obrigatórias" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-check credits
    if (organization_id) {
      const adminCheck = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: wallet } = await adminCheck
        .from("credit_wallets")
        .select("balance")
        .eq("organization_id", organization_id)
        .maybeSingle();
      if (!wallet || wallet.balance < CREDIT_COST) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Você precisa de " + CREDIT_COST + " créditos." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const answersText = Object.entries(answers)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const userPrompt = `Com base nas respostas do diagnóstico abaixo, gere uma estratégia de marketing completa.

RESPOSTAS DO DIAGNÓSTICO:
${answersText}

Use a ferramenta generate_strategy para retornar a estratégia estruturada. Gere projeções de 6 meses. Sugira 10-15 ideias de conteúdo. Defina 3-5 pilares de conteúdo.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "generate_strategy" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Faça upgrade do seu plano." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar estratégia" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const tokensUsed = aiData.usage?.total_tokens || 0;

    let result: any = null;
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
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log usage
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: orgData } = await serviceClient.rpc("get_user_org_id", { _user_id: userId });

    if (orgData) {
      await serviceClient.from("ai_conversation_logs").insert({
        organization_id: orgData,
        agent_id: "00000000-0000-0000-0000-000000000000",
        contact_id: "00000000-0000-0000-0000-000000000000",
        input_message: `[Estratégia] Diagnóstico com ${Object.keys(answers).length} respostas`,
        output_message: JSON.stringify(result).substring(0, 500),
        tokens_used: tokensUsed,
        model: "google/gemini-3-flash-preview",
      });
    }

    return new Response(
      JSON.stringify({ result, tokens_used: tokensUsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-strategy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
