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
      "Retorna uma estratégia de marketing completa e estruturada em 11 módulos: diagnóstico com radar, ICP, proposta de valor, análise de concorrência, tom de comunicação, aquisição, conteúdo com calendário editorial, projeções numéricas, estrutura recomendada, benchmarks do setor e plano de execução.",
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
            score_geral: { type: "number", description: "Score geral de maturidade de marketing de 0-100" },
            radar: {
              type: "object",
              properties: {
                autoridade: { type: "number", description: "Score 0-10 para Autoridade da marca" },
                aquisicao: { type: "number", description: "Score 0-10 para Aquisição de clientes" },
                conversao: { type: "number", description: "Score 0-10 para Conversão de leads" },
                retencao: { type: "number", description: "Score 0-10 para Retenção de clientes" },
                conteudo: { type: "number", description: "Score 0-10 para Estratégia de conteúdo" },
                branding: { type: "number", description: "Score 0-10 para Força da marca" },
              },
              required: ["autoridade", "aquisicao", "conversao", "retencao", "conteudo", "branding"],
              additionalProperties: false,
            },
          },
          required: ["analise", "pontos_fortes", "oportunidades", "riscos", "score_geral", "radar"],
          additionalProperties: false,
        },
        icp: {
          type: "object",
          properties: {
            nome_persona: { type: "string", description: "Nome fictício da persona (ex: Carlos, o Empresário)" },
            avatar_emoji: { type: "string", description: "Emoji que representa a persona (ex: 👨‍💼)" },
            demografia: { type: "string", description: "Faixa etária, gênero, localização, renda" },
            perfil_profissional: { type: "string", description: "Cargo, setor, experiência" },
            comportamento_digital: { type: "string", description: "Como consome conteúdo, redes preferidas, horários ativos" },
            dores: { type: "array", items: { type: "string" }, description: "3-5 principais dores" },
            desejos: { type: "array", items: { type: "string" }, description: "3-5 principais desejos" },
            objecoes: { type: "array", items: { type: "string" }, description: "3-5 objeções comuns" },
            gatilhos_compra: { type: "array", items: { type: "string" }, description: "3-5 gatilhos que motivam a compra" },
            descricao: { type: "string", description: "Parágrafo descritivo do cliente ideal" },
          },
          required: ["nome_persona", "avatar_emoji", "demografia", "perfil_profissional", "comportamento_digital", "dores", "desejos", "objecoes", "gatilhos_compra", "descricao"],
          additionalProperties: false,
        },
        proposta_valor: {
          type: "object",
          properties: {
            headline: { type: "string", description: "Frase de impacto da proposta de valor (max 15 palavras)" },
            problema: { type: "string", description: "O problema principal que o cliente enfrenta" },
            metodo: { type: "string", description: "O método/solução que a empresa oferece" },
            resultado: { type: "string", description: "O resultado prometido ao cliente" },
            prova: { type: "string", description: "Elemento de prova social ou credibilidade" },
          },
          required: ["headline", "problema", "metodo", "resultado", "prova"],
          additionalProperties: false,
        },
        analise_concorrencia: {
          type: "object",
          properties: {
            visao_geral: { type: "string", description: "Análise geral do cenário competitivo (1-2 parágrafos)" },
            concorrentes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  pontos_fortes: { type: "string" },
                  pontos_fracos: { type: "string" },
                  oportunidade_diferenciacao: { type: "string" },
                },
                required: ["nome", "pontos_fortes", "pontos_fracos", "oportunidade_diferenciacao"],
                additionalProperties: false,
              },
              description: "2-4 concorrentes analisados",
            },
            posicionamento_recomendado: { type: "string", description: "Como se posicionar em relação à concorrência" },
          },
          required: ["visao_geral", "concorrentes", "posicionamento_recomendado"],
          additionalProperties: false,
        },
        tom_comunicacao: {
          type: "object",
          properties: {
            tom_principal: { type: "string", description: "Tom principal (ex: Profissional e Acessível)" },
            personalidade_marca: { type: "array", items: { type: "string" }, description: "3-5 adjetivos que definem a personalidade (ex: Confiável, Inovadora, Próxima)" },
            voz_exemplo: { type: "string", description: "Exemplo de como a marca fala (1 parágrafo)" },
            palavras_usar: { type: "array", items: { type: "string" }, description: "5-10 palavras/expressões que a marca deve usar" },
            palavras_evitar: { type: "array", items: { type: "string" }, description: "5-10 palavras/expressões que a marca deve evitar" },
            exemplos_posts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo: { type: "string", description: "educativo, autoridade, engajamento, oferta" },
                  exemplo: { type: "string", description: "Exemplo de copy/post" },
                },
                required: ["tipo", "exemplo"],
                additionalProperties: false,
              },
              description: "4 exemplos de posts em diferentes tons",
            },
          },
          required: ["tom_principal", "personalidade_marca", "voz_exemplo", "palavras_usar", "palavras_evitar", "exemplos_posts"],
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
                  percentual: { type: "number", description: "Percentual de conteúdos deste pilar (deve somar 100)" },
                  descricao: { type: "string" },
                  exemplos: { type: "array", items: { type: "string" }, description: "3-5 exemplos de conteúdo" },
                },
                required: ["nome", "tipo", "percentual", "descricao", "exemplos"],
                additionalProperties: false,
              },
              description: "Exatamente 4 pilares: educação, autoridade, prova social, oferta",
            },
            calendario_semanal: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  dia: { type: "string", description: "Segunda, Terça, etc." },
                  formato: { type: "string", description: "Carrossel, Reels, Post, Story" },
                  pilar: { type: "string" },
                  sugestao: { type: "string", description: "Sugestão de tema para o dia" },
                },
                required: ["dia", "formato", "pilar", "sugestao"],
                additionalProperties: false,
              },
              description: "Calendário semanal com 5-7 dias",
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
          required: ["pilares", "calendario_semanal", "ideias_conteudo"],
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
                ltv_estimado: { type: "string", description: "LTV estimado do cliente" },
              },
              required: ["cpc_medio", "cpl_estimado", "cac_estimado", "roi_esperado", "ltv_estimado"],
              additionalProperties: false,
            },
          },
          required: ["projecoes_mensais", "indicadores"],
          additionalProperties: false,
        },
        benchmarks_setor: {
          type: "object",
          properties: {
            setor: { type: "string", description: "Nome do setor analisado" },
            taxa_conversao_media: { type: "string" },
            cpl_medio_setor: { type: "string" },
            ticket_medio_setor: { type: "string" },
            canais_mais_eficientes: { type: "array", items: { type: "string" } },
            tendencias: { type: "array", items: { type: "string" }, description: "3-5 tendências do setor" },
            insight_competitivo: { type: "string", description: "Insight principal sobre o cenário competitivo" },
          },
          required: ["setor", "taxa_conversao_media", "cpl_medio_setor", "ticket_medio_setor", "canais_mais_eficientes", "tendencias", "insight_competitivo"],
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
        "diagnostico", "icp", "proposta_valor", "analise_concorrencia", "tom_comunicacao",
        "estrategia_aquisicao", "estrategia_conteudo", "plano_crescimento", "benchmarks_setor",
        "estrutura_recomendada", "plano_execucao", "resumo_executivo", "objetivo_principal",
        "canal_prioritario", "investimento_recomendado", "potencial_crescimento",
      ],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `Você é um consultor sênior de marketing digital brasileiro com 15 anos de experiência, especialista em estratégia, posicionamento de marca, geração de leads e vendas digitais.

Sua função é receber as respostas de um briefing empresarial e gerar uma estratégia de marketing COMPLETA, DETALHADA e ACIONÁVEL.

DIRETRIZES OBRIGATÓRIAS:

1. DIAGNÓSTICO: Analise profundamente o negócio. Gere scores realistas de 0-10 para o radar (Autoridade, Aquisição, Conversão, Retenção, Conteúdo, Branding) e um score geral de 0-100.

2. ICP (Cliente Ideal): Crie uma persona com nome fictício, emoji, comportamento digital detalhado, dores, desejos, objeções e gatilhos de compra.

3. PROPOSTA DE VALOR: Estruture com headline impactante + Problema → Método → Resultado → Prova. Se o briefing incluir "resultados_clientes", use esses dados reais como prova social.

4. ANÁLISE DE CONCORRÊNCIA: 
   - Se o briefing incluir "concorrentes_urls" com links de sites ou Instagram, use essas URLs para INFERIR o posicionamento, tipo de conteúdo, tom de comunicação, pontos fortes e fracos de cada concorrente.
   - Para cada URL fornecida, analise o domínio/perfil e gere uma análise de "presença digital estimada" incluindo: tipo de conteúdo provável, frequência estimada, posicionamento de marca inferido.
   - Se não houver URLs, use o campo "concorrente_faz_melhor" e o segmento para inferir concorrentes genéricos do setor.
   - Identifique oportunidades de diferenciação concretas.

5. TOM DE COMUNICAÇÃO: Defina o tom, personalidade da marca, palavras para usar/evitar, e crie 4 exemplos de posts em diferentes tons. Se o briefing incluir "nao_quero_comunicacao", incorpore essas restrições nas palavras a evitar e no tom geral.

6. AQUISIÇÃO: Defina canais prioritários com percentuais e funil com estimativas numéricas.

7. CONTEÚDO: Crie 4 pilares COM percentuais (devem somar 100%), calendário semanal (5-7 dias) com formato e pilar, e 10-15 ideias distribuídas pelo funil.

8. PROJEÇÕES: Gere projeções numéricas para 6 meses incluindo LTV. Use benchmarks reais brasileiros.

9. BENCHMARKS DO SETOR: Forneça dados de referência do setor (taxa conversão, CPL, ticket médio, tendências).

10. ESTRUTURA: Analise o que tem e o que falta.

11. EXECUÇÃO: Roadmap de 3 meses vinculado às ferramentas. IMPORTANTE: vincule APENAS a ferramentas de MARKETING (conteudos, postagens, sites, trafego, scripts). NÃO vincule a CRM ou ferramentas comerciais.

REGRAS:
- Seja ESPECÍFICO e PRÁTICO — nada genérico
- Todas as projeções baseadas no orçamento e ticket médio
- Use benchmarks reais do mercado brasileiro
- Sempre português brasileiro
- Vincule ações às ferramentas de marketing: conteudos, postagens, sites, trafego, scripts
- Se houver campo "resultados_clientes", use como prova social real
- Se houver campo "nao_quero_comunicacao", respeite essas restrições

Use a ferramenta generate_strategy para retornar.`;

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

    const userPrompt = `Com base nas respostas do briefing abaixo, gere uma estratégia de marketing COMPLETA e DETALHADA com todos os 11 módulos.

RESPOSTAS DO BRIEFING:
${answersText}

INSTRUÇÕES:
1. Scores radar realistas (0-10) para 6 dimensões + score geral (0-100)
2. Persona detalhada com nome, emoji, comportamento digital e gatilhos de compra
3. Proposta de valor com headline impactante
4. Análise de 2-4 concorrentes com oportunidades de diferenciação
5. Tom de comunicação com exemplos de posts e palavras para usar/evitar
6. Canais com percentuais e funil com estimativas
7. 4 pilares de conteúdo com percentuais + calendário semanal + 10-15 ideias
8. Projeções 6 meses com LTV
9. Benchmarks do setor com tendências
10. Checklist de estrutura
11. Roadmap 3 meses vinculado às ferramentas

Use a ferramenta generate_strategy para retornar.`;

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
        input_message: `[Estratégia v3] Briefing com ${Object.keys(answers).length} respostas`,
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
