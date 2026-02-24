import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { answers } = await req.json();
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

    const answersText = Object.entries(answers)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const userPrompt = `Com base nas respostas do diagnóstico abaixo, gere uma estratégia comercial completa.

RESPOSTAS DO DIAGNÓSTICO:
${answersText}

Use a ferramenta generate_strategy para retornar a estratégia estruturada. Calcule scores realistas baseados nas respostas. As projeções devem ser calculadas com base no faturamento atual, ticket médio e dados fornecidos. Recomende serviços NOEXCUSE que façam sentido para o cenário.`;

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
              content: `Você é um consultor sênior de vendas e marketing digital brasileiro, especialista em diagnóstico empresarial e criação de estratégias para agências e franquias de marketing. 

Sua análise deve ser profunda, quantitativa e actionável. Use os dados fornecidos para calcular scores de maturidade realistas (0-100) em cada eixo. As projeções de leads e receita devem ser baseadas em benchmarks reais do mercado brasileiro de marketing digital.

Serviços NOEXCUSE disponíveis para recomendação:
- Branding (Identidade Visual, Manual de Marca, Papelaria)
- Social Media (Gestão de Redes, Criação de Conteúdo, Planejamento Editorial)
- Performance (Google Ads, Meta Ads, Remarketing, SEO)
- Web (Landing Pages, Sites Institucionais, E-commerce)
- CRM (Implementação CRM, Automação de Vendas, Chatbot IA)
- Consultoria (Diagnóstico, Planejamento Estratégico, Treinamento Comercial)

Sempre responda em português brasileiro.`,
            },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_strategy",
                description: "Retorna uma estratégia comercial completa e estruturada com maturidade, radar, plano de ação, projeções e entregas recomendadas.",
                parameters: {
                  type: "object",
                  properties: {
                    maturidade: {
                      type: "object",
                      properties: {
                        score: { type: "number", description: "Score geral de 0 a 100" },
                        nivel: { type: "string", description: "Caótico, Reativo, Estruturado ou Analítico" },
                        descricao: { type: "string", description: "Análise do nível atual" },
                      },
                      required: ["score", "nivel", "descricao"],
                      additionalProperties: false,
                    },
                    radar_data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          eixo: { type: "string" },
                          score: { type: "number" },
                          max: { type: "number" },
                        },
                        required: ["eixo", "score", "max"],
                        additionalProperties: false,
                      },
                      description: "5 eixos: Marketing, Comercial, Receita, Gestão de Dados, Presença Digital",
                    },
                    plano_acao: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          fase: { type: "string", description: "Nome da fase" },
                          periodo: { type: "string", description: "Ex: Mês 1-2" },
                          acoes: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                acao: { type: "string" },
                                responsavel: { type: "string" },
                                prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                              },
                              required: ["acao", "responsavel", "prioridade"],
                              additionalProperties: false,
                            },
                          },
                        },
                        required: ["fase", "periodo", "acoes"],
                        additionalProperties: false,
                      },
                      description: "3 fases: Estruturação, Crescimento, Escala",
                    },
                    projecoes: {
                      type: "object",
                      properties: {
                        leads: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              mes: { type: "string" },
                              sem_estrategia: { type: "number" },
                              com_estrategia: { type: "number" },
                            },
                            required: ["mes", "sem_estrategia", "com_estrategia"],
                            additionalProperties: false,
                          },
                        },
                        receita: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              mes: { type: "string" },
                              sem_estrategia: { type: "number" },
                              com_estrategia: { type: "number" },
                            },
                            required: ["mes", "sem_estrategia", "com_estrategia"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["leads", "receita"],
                      additionalProperties: false,
                    },
                    entregas_recomendadas: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          servico: { type: "string" },
                          modulo: { type: "string" },
                          justificativa: { type: "string" },
                          prioridade: { type: "string", enum: ["essencial", "recomendado", "opcional"] },
                        },
                        required: ["servico", "modulo", "justificativa", "prioridade"],
                        additionalProperties: false,
                      },
                    },
                    resumo_executivo: { type: "string", description: "Resumo de 2-3 parágrafos da análise" },
                  },
                  required: ["maturidade", "radar_data", "plano_acao", "projecoes", "entregas_recomendadas", "resumo_executivo"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_strategy" },
          },
        }),
      }
    );

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

    const { data: orgData } = await serviceClient.rpc("get_user_org_id", {
      _user_id: userId,
    });

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
