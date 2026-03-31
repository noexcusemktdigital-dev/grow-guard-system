import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

const CREDIT_COST = 50;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description: "Gera uma estratégia de marketing completa e personalizada com 12 seções.",
    parameters: {
      type: "object",
      properties: {
        diagnostico: {
          type: "object",
          properties: {
            score_geral: { type: "number", description: "Score geral de maturidade de marketing 0-100" },
            analise: { type: "string", description: "Análise geral da situação de marketing do negócio (2-3 parágrafos)" },
            radar: {
              type: "object",
              properties: {
                autoridade: { type: "number", description: "Score 0-10 de autoridade de marca" },
                aquisicao: { type: "number", description: "Score 0-10 de capacidade de aquisição" },
                conversao: { type: "number", description: "Score 0-10 de taxa de conversão" },
                retencao: { type: "number", description: "Score 0-10 de retenção de clientes" },
                conteudo: { type: "number", description: "Score 0-10 de qualidade de conteúdo" },
                branding: { type: "number", description: "Score 0-10 de branding e identidade" },
              },
              required: ["autoridade", "aquisicao", "conversao", "retencao", "conteudo", "branding"],
              additionalProperties: false,
            },
            pontos_fortes: { type: "array", items: { type: "string" }, description: "3-5 pontos fortes identificados" },
            oportunidades: { type: "array", items: { type: "string" }, description: "3-5 oportunidades de crescimento" },
            riscos: { type: "array", items: { type: "string" }, description: "2-4 riscos identificados" },
          },
          required: ["score_geral", "analise", "radar", "pontos_fortes", "oportunidades", "riscos"],
          additionalProperties: false,
        },
        objetivo_principal: { type: "string", description: "Objetivo principal recomendado (ex: Gerar 50 leads/mês)" },
        canal_prioritario: { type: "string", description: "Canal prioritário recomendado (ex: Instagram + Tráfego Pago)" },
        investimento_recomendado: { type: "string", description: "Investimento mensal recomendado em marketing (ex: R$ 3.000 a R$ 5.000/mês)" },
        potencial_crescimento: { type: "string", description: "Potencial de crescimento estimado (ex: 3x em 12 meses)" },
        resumo_executivo: { type: "string", description: "Resumo executivo de 2-3 parágrafos da estratégia completa" },
        icp: {
          type: "object",
          properties: {
            nome_persona: { type: "string", description: "Nome da persona (ex: João Empreendedor)" },
            avatar_emoji: { type: "string", description: "Emoji que representa a persona (ex: 👨‍💼)" },
            demografia: { type: "string", description: "Dados demográficos (ex: Homem, 35-45 anos, classe A/B)" },
            perfil_profissional: { type: "string", description: "Perfil profissional (ex: Dono de empresa com 10-50 funcionários)" },
            descricao: { type: "string", description: "Descrição detalhada da persona (1-2 parágrafos)" },
            comportamento_digital: { type: "string", description: "Como a persona se comporta no digital" },
            dores: { type: "array", items: { type: "string" }, description: "4-6 dores da persona" },
            desejos: { type: "array", items: { type: "string" }, description: "4-6 desejos da persona" },
            objecoes: { type: "array", items: { type: "string" }, description: "3-5 objeções comuns" },
            gatilhos_compra: { type: "array", items: { type: "string" }, description: "3-5 gatilhos de compra" },
          },
          required: ["nome_persona", "avatar_emoji", "demografia", "perfil_profissional", "descricao", "comportamento_digital", "dores", "desejos", "objecoes", "gatilhos_compra"],
          additionalProperties: false,
        },
        proposta_valor: {
          type: "object",
          properties: {
            headline: { type: "string", description: "Headline da proposta de valor (1 frase impactante)" },
            problema: { type: "string", description: "O problema que o negócio resolve" },
            metodo: { type: "string", description: "O método/abordagem único" },
            resultado: { type: "string", description: "O resultado que o cliente alcança" },
            prova: { type: "string", description: "Prova social ou evidência" },
          },
          required: ["headline", "problema", "metodo", "resultado", "prova"],
          additionalProperties: false,
        },
        analise_concorrencia: {
          type: "object",
          properties: {
            visao_geral: { type: "string", description: "Visão geral do cenário competitivo (1-2 parágrafos)" },
            concorrentes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  url: { type: "string", description: "URL do site ou rede social do concorrente (se fornecido pelo usuário)" },
                  pontos_fortes: { type: "string" },
                  pontos_fracos: { type: "string" },
                  oportunidade_diferenciacao: { type: "string" },
                },
                required: ["nome", "pontos_fortes", "pontos_fracos", "oportunidade_diferenciacao"],
                additionalProperties: false,
              },
              description: "2-4 concorrentes analisados",
            },
            posicionamento_recomendado: { type: "string", description: "Posicionamento de mercado recomendado" },
          },
          required: ["visao_geral", "concorrentes", "posicionamento_recomendado"],
          additionalProperties: false,
        },
        tom_comunicacao: {
          type: "object",
          properties: {
            tom_principal: { type: "string", description: "Tom principal de comunicação (ex: Educativo e Acessível)" },
            personalidade_marca: { type: "array", items: { type: "string" }, description: "3-5 adjetivos que definem a personalidade" },
            voz_exemplo: { type: "string", description: "Exemplo de como a marca falaria em um post" },
            palavras_usar: { type: "array", items: { type: "string" }, description: "8-12 palavras/expressões para usar" },
            palavras_evitar: { type: "array", items: { type: "string" }, description: "5-8 palavras/expressões para evitar" },
            exemplos_posts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo: { type: "string", description: "Tipo do post (carrossel, reels, stories, etc)" },
                  exemplo: { type: "string", description: "Exemplo de texto do post" },
                },
                required: ["tipo", "exemplo"],
                additionalProperties: false,
              },
              description: "3-5 exemplos de posts com o tom definido",
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
                  canal: { type: "string", description: "Nome do canal (ex: Instagram)" },
                  tipo: { type: "string", enum: ["organico", "pago", "parceria"], description: "Tipo do canal" },
                  percentual: { type: "number", description: "Percentual do investimento/esforço (0-100)" },
                  acao_principal: { type: "string", description: "Ação principal neste canal" },
                },
                required: ["canal", "tipo", "percentual", "acao_principal"],
                additionalProperties: false,
              },
            },
            funil: {
              type: "object",
              properties: {
                topo: {
                  type: "object",
                  properties: {
                    estimativa_visitantes: { type: "number" },
                    objetivo: { type: "string" },
                  },
                  required: ["estimativa_visitantes", "objetivo"],
                  additionalProperties: false,
                },
                meio: {
                  type: "object",
                  properties: {
                    estimativa_leads: { type: "number" },
                    objetivo: { type: "string" },
                  },
                  required: ["estimativa_leads", "objetivo"],
                  additionalProperties: false,
                },
                fundo: {
                  type: "object",
                  properties: {
                    estimativa_clientes: { type: "number" },
                    objetivo: { type: "string" },
                  },
                  required: ["estimativa_clientes", "objetivo"],
                  additionalProperties: false,
                },
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
                  percentual: { type: "number", description: "Percentual do calendário (0-100)" },
                  descricao: { type: "string" },
                  exemplos: { type: "array", items: { type: "string" }, description: "3-5 ideias de conteúdo para este pilar" },
                },
                required: ["nome", "tipo", "percentual", "descricao", "exemplos"],
                additionalProperties: false,
              },
              description: "3-4 pilares de conteúdo",
            },
            calendario_semanal: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  dia: { type: "string", description: "Dia da semana (Seg, Ter, Qua, etc)" },
                  formato: { type: "string", description: "Formato (Carrossel, Reels, Stories, Post, etc)" },
                  sugestao: { type: "string", description: "Sugestão de tema/conteúdo" },
                },
                required: ["dia", "formato", "sugestao"],
                additionalProperties: false,
              },
              description: "5-7 dias com sugestão de conteúdo",
            },
            ideias_conteudo: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  formato: { type: "string" },
                  titulo: { type: "string" },
                  etapa_funil: { type: "string", enum: ["topo", "meio", "fundo"] },
                },
                required: ["formato", "titulo", "etapa_funil"],
                additionalProperties: false,
              },
              description: "8-12 ideias de conteúdo para o próximo mês",
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
                  mes: { type: "number" },
                  leads: { type: "number" },
                  clientes: { type: "number" },
                  receita: { type: "number" },
                  investimento: { type: "number" },
                },
                required: ["mes", "leads", "clientes", "receita", "investimento"],
                additionalProperties: false,
              },
              description: "Projeção de 6 meses",
            },
            indicadores: {
              type: "object",
              properties: {
                cpc_medio: { type: "string" },
                cpl_estimado: { type: "string" },
                cac_estimado: { type: "string" },
                roi_esperado: { type: "string" },
                ltv_estimado: { type: "string" },
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
            setor: { type: "string" },
            taxa_conversao_media: { type: "string" },
            cpl_medio_setor: { type: "string" },
            ticket_medio_setor: { type: "string" },
            tendencias: { type: "array", items: { type: "string" }, description: "3-5 tendências do setor" },
            insight_competitivo: { type: "string" },
          },
          required: ["setor", "taxa_conversao_media", "cpl_medio_setor", "ticket_medio_setor", "tendencias", "insight_competitivo"],
          additionalProperties: false,
        },
        plano_execucao: {
          type: "array",
          items: {
            type: "object",
            properties: {
              mes: { type: "number" },
              titulo: { type: "string" },
              passos: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    acao: { type: "string" },
                    ferramenta: { type: "string", enum: ["conteudos", "postagens", "sites", "trafego", "crm", "scripts", "manual"] },
                  },
                  required: ["acao", "ferramenta"],
                  additionalProperties: false,
                },
              },
            },
            required: ["mes", "titulo", "passos"],
            additionalProperties: false,
          },
          description: "Roadmap de 3 meses com ações e ferramentas da plataforma",
        },
        estrutura_recomendada: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item: { type: "string", description: "Item de estrutura (ex: Site profissional, CRM configurado)" },
              status: { type: "string", enum: ["tem", "nao_tem"], description: "Se o negócio já possui ou não" },
              prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
              recomendacao: { type: "string" },
            },
            required: ["item", "status", "prioridade", "recomendacao"],
            additionalProperties: false,
          },
          description: "6-10 itens de checklist de estrutura",
        },
        diagnostico_comercial: {
          type: "object",
          properties: {
            score_comercial: { type: "number", description: "Score de maturidade comercial 0-100" },
            nivel: { type: "string", description: "Nível: Iniciante, Básico, Intermediário, Avançado ou Expert" },
            radar_comercial: {
              type: "object",
              properties: {
                processo: { type: "number", description: "Score 0-10 de processo de vendas" },
                gestao_leads: { type: "number", description: "Score 0-10 de gestão de leads" },
                ferramentas: { type: "number", description: "Score 0-10 de ferramentas e CRM" },
                canais: { type: "number", description: "Score 0-10 de canais de aquisição" },
                performance: { type: "number", description: "Score 0-10 de performance e metas" },
              },
              required: ["processo", "gestao_leads", "ferramentas", "canais", "performance"],
              additionalProperties: false,
            },
            analise_comercial: { type: "string", description: "Análise geral da situação comercial (2-3 parágrafos)" },
            gaps: { type: "array", items: { type: "string" }, description: "3-5 gaps comerciais identificados" },
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  texto: { type: "string" },
                  tipo: { type: "string", enum: ["success", "warning", "opportunity"] },
                },
                required: ["texto", "tipo"],
                additionalProperties: false,
              },
              description: "3-6 insights personalizados",
            },
            estrategias_vendas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  descricao: { type: "string" },
                  passos: { type: "array", items: { type: "string" } },
                  resultado_esperado: { type: "string" },
                },
                required: ["nome", "descricao", "passos", "resultado_esperado"],
                additionalProperties: false,
              },
              description: "2-3 estratégias de vendas detalhadas",
            },
            funil_reverso: {
              type: "object",
              properties: {
                meta_faturamento: { type: "string" },
                ticket_medio: { type: "string" },
                vendas_necessarias: { type: "number" },
                leads_necessarios: { type: "number" },
                trafego_necessario: { type: "number" },
                taxa_conversao_usada: { type: "string" },
              },
              required: ["meta_faturamento", "ticket_medio", "vendas_necessarias", "leads_necessarios", "trafego_necessario", "taxa_conversao_usada"],
              additionalProperties: false,
            },
            projecao_leads: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mes: { type: "string" },
                  atual: { type: "number" },
                  com_estrategia: { type: "number" },
                },
                required: ["mes", "atual", "com_estrategia"],
                additionalProperties: false,
              },
              description: "Projeção de leads para 6 meses",
            },
            projecao_receita: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mes: { type: "string" },
                  atual: { type: "number" },
                  com_estrategia: { type: "number" },
                },
                required: ["mes", "atual", "com_estrategia"],
                additionalProperties: false,
              },
              description: "Projeção de receita para 6 meses",
            },
            plano_acao: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  fase: { type: "string" },
                  periodo: { type: "string" },
                  items: { type: "array", items: { type: "string" } },
                },
                required: ["fase", "periodo", "items"],
                additionalProperties: false,
              },
              description: "Plano de ação em 3 fases (30/60/90 dias)",
            },
          },
          required: ["score_comercial", "nivel", "radar_comercial", "analise_comercial", "gaps", "insights", "estrategias_vendas", "funil_reverso", "projecao_leads", "projecao_receita", "plano_acao"],
          additionalProperties: false,
        },
      },
      required: [
        "diagnostico", "objetivo_principal", "canal_prioritario",
        "investimento_recomendado", "potencial_crescimento", "resumo_executivo",
        "icp", "proposta_valor", "analise_concorrencia", "tom_comunicacao",
        "estrategia_aquisicao", "estrategia_conteudo", "plano_crescimento",
        "benchmarks_setor", "plano_execucao", "estrutura_recomendada",
        "diagnostico_comercial",
      ],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `Você é uma estrategista de marketing sênior. Sua função é receber as respostas de um briefing de marketing e gerar uma ESTRATÉGIA COMPLETA E PERSONALIZADA.

SEÇÕES A GERAR:

1. DIAGNÓSTICO: Score geral (0-100), radar de 6 dimensões (0-10 cada: autoridade, aquisição, conversão, retenção, conteúdo, branding), análise textual, pontos fortes, oportunidades e riscos.

2. OBJETIVO & CANAL: Objetivo principal recomendado, canal prioritário, investimento recomendado, potencial de crescimento.

3. ICP (CLIENTE IDEAL): Persona detalhada com nome, emoji avatar, demografia, perfil profissional, descrição, comportamento digital, dores (4-6), desejos (4-6), objeções (3-5), gatilhos de compra (3-5).

4. PROPOSTA DE VALOR: Headline impactante, framework Problema → Método → Resultado, prova social.

5. ANÁLISE DE CONCORRÊNCIA: Visão geral, análise de 2-4 concorrentes (inferidos do segmento ou dos URLs fornecidos), posicionamento recomendado.

6. TOM DE COMUNICAÇÃO: Tom principal, personalidade da marca (adjetivos), exemplo de voz, palavras para usar (8-12), palavras para evitar (5-8), exemplos de posts (3-5).

7. ESTRATÉGIA DE AQUISIÇÃO: Canais prioritários com percentuais, funil detalhado (topo/meio/fundo com estimativas).

8. ESTRATÉGIA DE CONTEÚDO: Pilares (3-4 com percentuais), calendário semanal (5-7 dias), ideias de conteúdo (8-12).

9. PROJEÇÃO DE CRESCIMENTO: Projeções de 6 meses (leads, clientes, receita, investimento), indicadores (CPC, CPL, CAC, ROI, LTV).

10. BENCHMARKS DO SETOR: Métricas médias do setor, tendências, insight competitivo.

11. PLANO DE EXECUÇÃO: Roadmap de 3 meses com ações vinculadas às ferramentas da plataforma (conteudos, postagens, sites, trafego, crm, scripts, manual).

12. CHECKLIST DE ESTRUTURA: 6-10 itens com status (tem/nao_tem), prioridade e recomendação.

REGRAS:
- Seja ESPECÍFICO com base nas respostas — nada genérico
- Use CÁLCULOS REAIS para projeções financeiras
- Todas as dores, objeções e gatilhos devem refletir o segmento real
- Tom de comunicação deve respeitar as preferências informadas
- Sempre em português brasileiro
- Valores monetários em R$
- Os exemplos de posts devem usar o tom definido

Use a ferramenta generate_strategy para retornar.`;

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { answers, organization_id } = await req.json();
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

    // Pre-check credits
    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    if (organization_id) {
      const { data: wallet } = await serviceClient
        .from("credit_wallets")
        .select("balance")
        .eq("organization_id", organization_id)
        .maybeSingle();
      if (!wallet || wallet.balance < CREDIT_COST) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Você precisa de " + CREDIT_COST + " créditos para gerar a estratégia." }),
          { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch sales plan for unified context
    let salesPlanContext = "";
    if (organization_id) {
      const { data: salesPlan } = await serviceClient
        .from("sales_plans")
        .select("answers")
        .eq("organization_id", organization_id)
        .maybeSingle();
      if (salesPlan?.answers && Object.keys(salesPlan.answers).length > 3) {
        const spText = Object.entries(salesPlan.answers as Record<string, unknown>)
          .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("\n");
        salesPlanContext = `\n\nCONTEXTO DO PLANO DE VENDAS (já preenchido):\n${spText}\n\nUse esses dados para enriquecer ICP, proposta de valor e projeções.`;
      }
    }

    const answersText = Object.entries(answers)
      .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("\n");

    const userPrompt = `Com base nas respostas do briefing unificado (GPS do Negócio — parte comercial + parte marketing) abaixo, gere a ESTRATÉGIA COMPLETA com todas as 13 seções, incluindo o DIAGNÓSTICO COMERCIAL detalhado.

RESPOSTAS DO BRIEFING:
${answersText}
${salesPlanContext}

INSTRUÇÕES IMPORTANTES:
1. O ICP deve refletir exatamente o público descrito nas respostas
2. O tom de comunicação deve respeitar as preferências informadas (incluindo o que NÃO quer)
3. Faça projeções financeiras realistas baseadas no ticket médio e faturamento informados
4. Os concorrentes devem ser inferidos do segmento (ou usar URLs se fornecidos)
5. O calendário semanal deve ser prático e executável
6. O plano de execução deve referenciar ferramentas reais da plataforma (conteudos, postagens, sites, trafego, crm, scripts)
7. A estrutura recomendada deve avaliar o que o negócio já tem vs o que precisa
8. O DIAGNÓSTICO COMERCIAL deve ter cálculos reais no funil reverso (meta ÷ ticket = vendas, etc.)
9. As projeções de leads e receita devem ter 6 meses com cenário atual vs com estratégia
10. As estratégias de vendas devem ser específicas para o segmento e modelo de negócio informado

Use a ferramenta generate_strategy para retornar.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
        JSON.stringify({ error: "Erro ao gerar estratégia" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const tokensUsed = aiData.usage?.total_tokens || 0;

    let result: Record<string, unknown> | null = null;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        result =
          typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    // Fallback: try parsing message.content as JSON
    if (!result) {
      const messageContent = aiData.choices?.[0]?.message?.content;
      if (messageContent) {
        try {
          const cleaned = messageContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          result = JSON.parse(cleaned);
          console.log("Parsed result from message.content fallback");
        } catch (e) {
          console.error("Fallback JSON parse failed:", e, "Content preview:", messageContent?.substring(0, 300));
        }
      }
    }

    if (!result) {
      console.error("Full AI response:", JSON.stringify(aiData).substring(0, 1000));
      return new Response(
        JSON.stringify({ error: "Falha ao estruturar resposta da IA. Tente novamente." }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Log usage
    const { data: orgData } = await serviceClient.rpc("get_user_org_id", { _user_id: userId });

    if (orgData) {
      await serviceClient.from("ai_conversation_logs").insert({
        organization_id: orgData,
        agent_id: "00000000-0000-0000-0000-000000000000",
        contact_id: "00000000-0000-0000-0000-000000000000",
        input_message: `[Estratégia Marketing] Briefing com ${Object.keys(answers).length} respostas`,
        output_message: JSON.stringify(result).substring(0, 500),
        tokens_used: tokensUsed,
        model: "google/gemini-2.5-flash",
      });
    }

    return new Response(
      JSON.stringify({ result, tokens_used: tokensUsed }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Strategy generation error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
