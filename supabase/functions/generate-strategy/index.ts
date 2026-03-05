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
      "Retorna uma estratégia de marketing completa e estruturada em 8 módulos: diagnóstico com radar, ICP, proposta de valor, aquisição, conteúdo, projeções numéricas, estrutura recomendada e plano de execução.",
    parameters: {
      type: "object",
      properties: {
        diagnostico: {
          type: "object",
          properties: {
            analise: { type: "string", description: "Análise detalhada do negócio e contexto de mercado (2-3 parágrafos)" },
            pontos_fortes: { type: "array", items: { type: "string" } },
            oportunidades: { type: "array", items: { type: "string" } },
            riscos: { type: "array", items: { type: "string" } },
            radar: {
              type: "object",
              properties: {
                autoridade: { type: "number", description: "Score 0-10 para Autoridade da marca" },
                aquisicao: { type: "number", description: "Score 0-10 para Aquisição de clientes" },
                conversao: { type: "number", description: "Score 0-10 para Conversão de leads" },
                retencao: { type: "number", description: "Score 0-10 para Retenção de clientes" },
              },
              required: ["autoridade", "aquisicao", "conversao", "retencao"],
              additionalProperties: false,
            },
          },
          required: ["analise", "pontos_fortes", "oportunidades", "riscos", "radar"],
          additionalProperties: false,
        },
        icp: {
          type: "object",
          properties: {
            demografia: { type: "string", description: "Faixa etária, gênero, localização, renda" },
            perfil_profissional: { type: "string", description: "Cargo, setor, experiência" },
            dores: { type: "array", items: { type: "string" }, description: "3-5 principais dores" },
            desejos: { type: "array", items: { type: "string" }, description: "3-5 principais desejos" },
            objecoes: { type: "array", items: { type: "string" }, description: "3-5 objeções comuns" },
            descricao: { type: "string", description: "Parágrafo descritivo do cliente ideal" },
          },
          required: ["demografia", "perfil_profissional", "dores", "desejos", "objecoes", "descricao"],
          additionalProperties: false,
        },
        proposta_valor: {
          type: "object",
          properties: {
            problema: { type: "string", description: "O problema principal que o cliente enfrenta" },
            metodo: { type: "string", description: "O método/solução que a empresa oferece" },
            resultado: { type: "string", description: "O resultado prometido ao cliente" },
          },
          required: ["problema", "metodo", "resultado"],
          additionalProperties: false,
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
                  percentual: { type: "number", description: "Percentual de investimento recomendado (0-100)" },
                  tipo: { type: "string", enum: ["organico", "pago", "parcerias"], description: "Tipo do canal" },
                },
                required: ["canal", "justificativa", "acao_principal", "percentual", "tipo"],
                additionalProperties: false,
              },
            },
            funil: {
              type: "object",
              properties: {
                topo: { type: "object", properties: { objetivo: { type: "string" }, acoes: { type: "array", items: { type: "string" } }, estimativa_visitantes: { type: "number" } }, required: ["objetivo", "acoes", "estimativa_visitantes"], additionalProperties: false },
                meio: { type: "object", properties: { objetivo: { type: "string" }, acoes: { type: "array", items: { type: "string" } }, estimativa_leads: { type: "number" } }, required: ["objetivo", "acoes", "estimativa_leads"], additionalProperties: false },
                fundo: { type: "object", properties: { objetivo: { type: "string" }, acoes: { type: "array", items: { type: "string" } }, estimativa_clientes: { type: "number" } }, required: ["objetivo", "acoes", "estimativa_clientes"], additionalProperties: false },
              },
              required: ["topo", "meio", "fundo"],
              additionalProperties: false,
            },
          },
          required: ["canais_prioritarios", "funil"],
          additionalProperties: false,
        },
        estrategia_conteudo: {
          type: "object",
          properties: {
            pilares: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  tipo: { type: "string", enum: ["educacao", "autoridade", "prova_social", "oferta"] },
                  descricao: { type: "string" },
                  exemplos: { type: "array", items: { type: "string" }, description: "3-5 exemplos de conteúdo" },
                },
                required: ["nome", "tipo", "descricao", "exemplos"],
                additionalProperties: false,
              },
              description: "Exatamente 4 pilares: educação, autoridade, prova social, oferta",
            },
            ideias_conteudo: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  formato: { type: "string", description: "Carrossel, Reels, Post, Story, Artigo" },
                  pilar: { type: "string" },
                  etapa_funil: { type: "string", enum: ["topo", "meio", "fundo"] },
                },
                required: ["titulo", "formato", "pilar", "etapa_funil"],
                additionalProperties: false,
              },
              description: "10 a 15 ideias de conteúdo",
            },
          },
          required: ["pilares", "ideias_conteudo"],
          additionalProperties: false,
        },
        plano_crescimento: {
          type: "object",
          properties: {
            projecoes_mensais: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mes: { type: "number", description: "Número do mês (1-6)" },
                  investimento: { type: "number", description: "Investimento em R$" },
                  leads: { type: "number" },
                  clientes: { type: "number" },
                  receita: { type: "number", description: "Receita estimada em R$" },
                },
                required: ["mes", "investimento", "leads", "clientes", "receita"],
                additionalProperties: false,
              },
              description: "Projeções para 6 meses",
            },
            indicadores: {
              type: "object",
              properties: {
                cpc_medio: { type: "string", description: "Custo por clique estimado" },
                cpl_estimado: { type: "string", description: "Custo por lead estimado" },
                cac_estimado: { type: "string", description: "Custo de aquisição de cliente" },
                roi_esperado: { type: "string", description: "ROI projetado" },
              },
              required: ["cpc_medio", "cpl_estimado", "cac_estimado", "roi_esperado"],
              additionalProperties: false,
            },
          },
          required: ["projecoes_mensais", "indicadores"],
          additionalProperties: false,
        },
        estrutura_recomendada: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item: { type: "string", description: "Ex: Site institucional, Landing page, Tráfego pago, etc." },
              status: { type: "string", enum: ["tem", "falta"], description: "Se o cliente já tem ou não" },
              prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
              recomendacao: { type: "string", description: "Recomendação específica" },
            },
            required: ["item", "status", "prioridade", "recomendacao"],
            additionalProperties: false,
          },
          description: "Checklist de estrutura: site, landing page, tráfego, conteúdo, automação, CRM",
        },
        plano_execucao: {
          type: "array",
          items: {
            type: "object",
            properties: {
              mes: { type: "number", description: "Mês 1, 2 ou 3" },
              titulo: { type: "string", description: "Título do mês" },
              passos: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    acao: { type: "string" },
                    ferramenta: { type: "string", enum: ["conteudos", "postagens", "sites", "trafego", "crm", "scripts", "manual"], description: "Ferramenta do sistema vinculada" },
                  },
                  required: ["acao", "ferramenta"],
                  additionalProperties: false,
                },
              },
            },
            required: ["mes", "titulo", "passos"],
            additionalProperties: false,
          },
          description: "Roadmap de 3 meses com passos vinculados às ferramentas do sistema",
        },
        resumo_executivo: { type: "string", description: "Resumo de 2-3 parágrafos da estratégia completa" },
        objetivo_principal: { type: "string", description: "Objetivo principal identificado" },
        canal_prioritario: { type: "string", description: "Canal prioritário recomendado" },
        investimento_recomendado: { type: "string", description: "Investimento mensal recomendado" },
        potencial_crescimento: { type: "string", description: "Potencial de crescimento estimado (ex: 3x em 6 meses)" },
      },
      required: [
        "diagnostico", "icp", "proposta_valor", "estrategia_aquisicao",
        "estrategia_conteudo", "plano_crescimento", "estrutura_recomendada",
        "plano_execucao", "resumo_executivo", "objetivo_principal",
        "canal_prioritario", "investimento_recomendado", "potencial_crescimento",
      ],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `Você é um consultor sênior de marketing digital brasileiro com 15 anos de experiência, especialista em estratégia, posicionamento de marca, geração de leads e vendas digitais.

Sua função é receber as respostas de um briefing empresarial com 14 perguntas em 8 blocos e gerar uma estratégia de marketing COMPLETA, DETALHADA e ACIONÁVEL.

DIRETRIZES OBRIGATÓRIAS:

1. DIAGNÓSTICO: Analise profundamente o negócio. Gere scores realistas de 0-10 para o radar (Autoridade, Aquisição, Conversão, Retenção) baseados nas respostas.

2. ICP (Cliente Ideal): Crie um perfil detalhado com demografia, perfil profissional, dores específicas, desejos e objeções reais do mercado brasileiro.

3. PROPOSTA DE VALOR: Estruture claramente: Problema → Método/Solução → Resultado prometido.

4. AQUISIÇÃO: Defina canais prioritários com percentuais de investimento e tipo (orgânico/pago/parcerias). Estruture o funil com estimativas numéricas para cada etapa.

5. CONTEÚDO: Crie exatamente 4 pilares (educação, autoridade, prova social, oferta) com exemplos práticos. Gere 10-15 ideias de conteúdo distribuídas pelo funil.

6. PROJEÇÕES: Gere projeções NUMÉRICAS realistas para 6 meses (investimento, leads, clientes, receita). Use benchmarks reais do mercado brasileiro para CPC, CPL, CAC e ROI.

7. ESTRUTURA: Analise o que o cliente já tem e o que falta (site, landing page, tráfego, conteúdo, automação, CRM). Baseie-se nos canais informados no briefing.

8. EXECUÇÃO: Crie roadmap de 3 meses com passos concretos vinculados às ferramentas do sistema (conteudos, postagens, sites, trafego, crm, scripts).

REGRAS:
- Seja ESPECÍFICO e PRÁTICO — nada genérico
- Todas as projeções devem ser baseadas no orçamento e ticket médio informados
- Use benchmarks reais do mercado brasileiro
- Sempre responda em português brasileiro
- O plano de execução deve vincular ações às ferramentas disponíveis no sistema

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
      .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("\n");

    const userPrompt = `Com base nas respostas do briefing abaixo (14 perguntas em 8 blocos), gere uma estratégia de marketing COMPLETA e DETALHADA.

RESPOSTAS DO BRIEFING:
${answersText}

INSTRUÇÕES IMPORTANTES:
1. Gere scores realistas para o radar de diagnóstico (0-10)
2. Crie projeções numéricas para 6 meses baseadas no orçamento e ticket médio informados
3. Defina exatamente 4 pilares de conteúdo (educação, autoridade, prova social, oferta)
4. Gere 10-15 ideias de conteúdo distribuídas pelo funil
5. Analise a estrutura atual (canais informados) e recomende o que falta
6. Crie roadmap de 3 meses com ações vinculadas às ferramentas: conteudos, postagens, sites, trafego, crm, scripts
7. Use benchmarks reais do mercado brasileiro para CPC, CPL, CAC

Use a ferramenta generate_strategy para retornar a estratégia estruturada.`;

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
        input_message: `[Estratégia v2] Briefing com ${Object.keys(answers).length} respostas`,
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
