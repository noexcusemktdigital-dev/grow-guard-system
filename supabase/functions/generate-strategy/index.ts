import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

const CREDIT_COST = 50;

// ── MARKETING CORE SCHEMA (diagnóstico, ICP, proposta, concorrência, tom, aquisição) ──
const MARKETING_CORE_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description: "Gera a parte CORE da estratégia de marketing: diagnóstico, ICP, proposta de valor, concorrência, tom e aquisição.",
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
                autoridade: { type: "number" }, aquisicao: { type: "number" },
                conversao: { type: "number" }, retencao: { type: "number" },
                conteudo: { type: "number" }, branding: { type: "number" },
              },
              required: ["autoridade", "aquisicao", "conversao", "retencao", "conteudo", "branding"],
            },
            pontos_fortes: { type: "array", items: { type: "string" } },
            oportunidades: { type: "array", items: { type: "string" } },
            riscos: { type: "array", items: { type: "string" } },
          },
          required: ["score_geral", "analise", "radar", "pontos_fortes", "oportunidades", "riscos"],
        },
        objetivo_principal: { type: "string" },
        canal_prioritario: { type: "string" },
        investimento_recomendado: { type: "string" },
        potencial_crescimento: { type: "string" },
        resumo_executivo: { type: "string" },
        icp: {
          type: "object",
          properties: {
            nome_persona: { type: "string" }, avatar_emoji: { type: "string" },
            demografia: { type: "string" }, perfil_profissional: { type: "string" },
            descricao: { type: "string" }, comportamento_digital: { type: "string" },
            dores: { type: "array", items: { type: "string" } },
            desejos: { type: "array", items: { type: "string" } },
            objecoes: { type: "array", items: { type: "string" } },
            gatilhos_compra: { type: "array", items: { type: "string" } },
          },
          required: ["nome_persona", "avatar_emoji", "demografia", "perfil_profissional", "descricao", "comportamento_digital", "dores", "desejos", "objecoes", "gatilhos_compra"],
        },
        proposta_valor: {
          type: "object",
          properties: {
            headline: { type: "string" }, problema: { type: "string" },
            metodo: { type: "string" }, resultado: { type: "string" }, prova: { type: "string" },
          },
          required: ["headline", "problema", "metodo", "resultado", "prova"],
        },
        analise_concorrencia: {
          type: "object",
          properties: {
            visao_geral: { type: "string" },
            concorrentes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" }, url: { type: "string" },
                  pontos_fortes: { type: "string" }, pontos_fracos: { type: "string" },
                  oportunidade_diferenciacao: { type: "string" },
                },
                required: ["nome", "pontos_fortes", "pontos_fracos", "oportunidade_diferenciacao"],
              },
            },
            posicionamento_recomendado: { type: "string" },
          },
          required: ["visao_geral", "concorrentes", "posicionamento_recomendado"],
        },
        tom_comunicacao: {
          type: "object",
          properties: {
            tom_principal: { type: "string" },
            personalidade_marca: { type: "array", items: { type: "string" } },
            voz_exemplo: { type: "string" },
            palavras_usar: { type: "array", items: { type: "string" } },
            palavras_evitar: { type: "array", items: { type: "string" } },
            exemplos_posts: {
              type: "array",
              items: {
                type: "object",
                properties: { tipo: { type: "string" }, exemplo: { type: "string" } },
                required: ["tipo", "exemplo"],
              },
            },
          },
          required: ["tom_principal", "personalidade_marca", "voz_exemplo", "palavras_usar", "palavras_evitar", "exemplos_posts"],
        },
        estrategia_aquisicao: {
          type: "object",
          properties: {
            canais_prioritarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  canal: { type: "string" }, tipo: { type: "string", enum: ["organico", "pago", "parceria"] },
                  percentual: { type: "number" }, acao_principal: { type: "string" },
                },
                required: ["canal", "tipo", "percentual", "acao_principal"],
              },
            },
            funil: {
              type: "object",
              properties: {
                topo: { type: "object", properties: { estimativa_visitantes: { type: "number" }, objetivo: { type: "string" } }, required: ["estimativa_visitantes", "objetivo"] },
                meio: { type: "object", properties: { estimativa_leads: { type: "number" }, objetivo: { type: "string" } }, required: ["estimativa_leads", "objetivo"] },
                fundo: { type: "object", properties: { estimativa_clientes: { type: "number" }, objetivo: { type: "string" } }, required: ["estimativa_clientes", "objetivo"] },
              },
              required: ["topo", "meio", "fundo"],
            },
          },
          required: ["canais_prioritarios", "funil"],
        },
      },
      required: [
        "diagnostico", "objetivo_principal", "canal_prioritario",
        "investimento_recomendado", "potencial_crescimento", "resumo_executivo",
        "icp", "proposta_valor", "analise_concorrencia", "tom_comunicacao",
        "estrategia_aquisicao",
      ],
      additionalProperties: false,
    },
  },
};

// ── MARKETING GROWTH SCHEMA (conteúdo, crescimento, benchmarks, execução, estrutura) ──
const MARKETING_GROWTH_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description: "Gera a parte GROWTH da estratégia de marketing: conteúdo, crescimento, benchmarks, execução e estrutura.",
    parameters: {
      type: "object",
      properties: {
        estrategia_conteudo: {
          type: "object",
          properties: {
            pilares: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" }, tipo: { type: "string", enum: ["educacao", "autoridade", "prova_social", "oferta"] },
                  percentual: { type: "number" }, descricao: { type: "string" },
                  exemplos: { type: "array", items: { type: "string" } },
                },
                required: ["nome", "tipo", "percentual", "descricao", "exemplos"],
              },
            },
            calendario_semanal: {
              type: "array",
              items: {
                type: "object",
                properties: { dia: { type: "string" }, formato: { type: "string" }, sugestao: { type: "string" } },
                required: ["dia", "formato", "sugestao"],
              },
            },
            ideias_conteudo: {
              type: "array",
              items: {
                type: "object",
                properties: { formato: { type: "string" }, titulo: { type: "string" }, etapa_funil: { type: "string", enum: ["topo", "meio", "fundo"] } },
                required: ["formato", "titulo", "etapa_funil"],
              },
            },
          },
          required: ["pilares", "calendario_semanal", "ideias_conteudo"],
        },
        plano_crescimento: {
          type: "object",
          properties: {
            projecoes_mensais: {
              type: "array",
              items: {
                type: "object",
                properties: { mes: { type: "number" }, leads: { type: "number" }, clientes: { type: "number" }, receita: { type: "number" }, investimento: { type: "number" } },
                required: ["mes", "leads", "clientes", "receita", "investimento"],
              },
            },
            indicadores: {
              type: "object",
              properties: { cpc_medio: { type: "string" }, cpl_estimado: { type: "string" }, cac_estimado: { type: "string" }, roi_esperado: { type: "string" }, ltv_estimado: { type: "string" } },
              required: ["cpc_medio", "cpl_estimado", "cac_estimado", "roi_esperado", "ltv_estimado"],
            },
          },
          required: ["projecoes_mensais", "indicadores"],
        },
        benchmarks_setor: {
          type: "object",
          properties: {
            setor: { type: "string" }, taxa_conversao_media: { type: "string" },
            cpl_medio_setor: { type: "string" }, ticket_medio_setor: { type: "string" },
            tendencias: { type: "array", items: { type: "string" } }, insight_competitivo: { type: "string" },
          },
          required: ["setor", "taxa_conversao_media", "cpl_medio_setor", "ticket_medio_setor", "tendencias", "insight_competitivo"],
        },
        plano_execucao: {
          type: "array",
          items: {
            type: "object",
            properties: {
              mes: { type: "number" }, titulo: { type: "string" },
              passos: {
                type: "array",
                items: {
                  type: "object",
                  properties: { acao: { type: "string" }, ferramenta: { type: "string", enum: ["conteudos", "postagens", "sites", "trafego", "crm", "scripts", "manual"] } },
                  required: ["acao", "ferramenta"],
                },
              },
            },
            required: ["mes", "titulo", "passos"],
          },
        },
        estrutura_recomendada: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item: { type: "string" }, status: { type: "string", enum: ["tem", "nao_tem"] },
              prioridade: { type: "string", enum: ["alta", "media", "baixa"] }, recomendacao: { type: "string" },
            },
            required: ["item", "status", "prioridade", "recomendacao"],
          },
        },
      },
      required: [
        "estrategia_conteudo", "plano_crescimento",
        "benchmarks_setor", "plano_execucao", "estrutura_recomendada",
      ],
      additionalProperties: false,
    },
  },
};

// ── COMERCIAL SCHEMA ────────────────────────────────────────────────
const COMERCIAL_TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "generate_strategy",
    description: "Gera o diagnóstico comercial completo com radar, projeções, funil reverso, estratégias de vendas e plano de ação.",
    parameters: {
      type: "object",
      properties: {
        diagnostico_comercial: {
          type: "object",
          properties: {
            score_comercial: { type: "number" },
            nivel: { type: "string" },
            radar_comercial: {
              type: "object",
              properties: {
                processo: { type: "number" }, gestao_leads: { type: "number" },
                ferramentas: { type: "number" }, canais: { type: "number" },
                performance: { type: "number" },
              },
              required: ["processo", "gestao_leads", "ferramentas", "canais", "performance"],
            },
            analise_comercial: { type: "string" },
            gaps: { type: "array", items: { type: "string" } },
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  texto: { type: "string" },
                  tipo: { type: "string", enum: ["success", "warning", "opportunity"] },
                },
                required: ["texto", "tipo"],
              },
            },
            estrategias_vendas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" }, descricao: { type: "string" },
                  passos: { type: "array", items: { type: "string" } },
                  resultado_esperado: { type: "string" },
                },
                required: ["nome", "descricao", "passos", "resultado_esperado"],
              },
            },
            funil_reverso: {
              type: "object",
              properties: {
                meta_faturamento: { type: "string" }, ticket_medio: { type: "string" },
                vendas_necessarias: { type: "number" }, leads_necessarios: { type: "number" },
                trafego_necessario: { type: "number" }, taxa_conversao_usada: { type: "string" },
              },
              required: ["meta_faturamento", "ticket_medio", "vendas_necessarias", "leads_necessarios", "trafego_necessario", "taxa_conversao_usada"],
            },
            projecao_leads: {
              type: "array",
              items: {
                type: "object",
                properties: { mes: { type: "string" }, atual: { type: "number" }, com_estrategia: { type: "number" } },
                required: ["mes", "atual", "com_estrategia"],
              },
            },
            projecao_receita: {
              type: "array",
              items: {
                type: "object",
                properties: { mes: { type: "string" }, atual: { type: "number" }, com_estrategia: { type: "number" } },
                required: ["mes", "atual", "com_estrategia"],
              },
            },
            plano_acao: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  fase: { type: "string" }, periodo: { type: "string" },
                  items: { type: "array", items: { type: "string" } },
                },
                required: ["fase", "periodo", "items"],
              },
            },
          },
          required: ["score_comercial", "nivel", "radar_comercial", "analise_comercial", "gaps", "insights", "estrategias_vendas", "funil_reverso", "projecao_leads", "projecao_receita", "plano_acao"],
        },
      },
      required: ["diagnostico_comercial"],
      additionalProperties: false,
    },
  },
};

// ── SYSTEM PROMPTS ──────────────────────────────────────────────────
const MARKETING_CORE_PROMPT = `Você é uma estrategista de marketing sênior. Sua função é receber as respostas de um briefing de marketing e gerar a PARTE CORE da estratégia.

SEÇÕES A GERAR:

1. DIAGNÓSTICO: Score geral (0-100), radar de 6 dimensões (0-10 cada: autoridade, aquisição, conversão, retenção, conteúdo, branding), análise textual, pontos fortes, oportunidades e riscos.

2. OBJETIVO & CANAL: Objetivo principal recomendado, canal prioritário, investimento recomendado, potencial de crescimento, resumo executivo.

3. ICP (CLIENTE IDEAL): Persona detalhada com nome, emoji avatar, demografia, perfil profissional, descrição, comportamento digital, dores (4-6), desejos (4-6), objeções (3-5), gatilhos de compra (3-5).

4. PROPOSTA DE VALOR: Headline impactante, framework Problema → Método → Resultado, prova social.

5. ANÁLISE DE CONCORRÊNCIA: Visão geral, análise de 2-4 concorrentes (inferidos do segmento), posicionamento recomendado.

6. TOM DE COMUNICAÇÃO: Tom principal, personalidade da marca, exemplo de voz, palavras para usar/evitar, exemplos de posts.

7. ESTRATÉGIA DE AQUISIÇÃO: Canais prioritários com percentuais, funil detalhado (topo/meio/fundo com estimativas).

REGRAS:
- Seja ESPECÍFICO com base nas respostas — nada genérico
- Todas as dores, objeções e gatilhos devem refletir o segmento real
- Tom de comunicação deve respeitar as preferências informadas
- Sempre em português brasileiro
- Valores monetários em R$

Use a ferramenta generate_strategy para retornar.`;

const MARKETING_GROWTH_PROMPT = `Você é uma estrategista de marketing sênior. Sua função é gerar a PARTE DE CRESCIMENTO da estratégia de marketing.

SEÇÕES A GERAR:

1. ESTRATÉGIA DE CONTEÚDO: Pilares (3-4 com percentuais), calendário semanal (5-7 dias), ideias de conteúdo (8-12).

2. PROJEÇÃO DE CRESCIMENTO: Projeções de 6 meses (leads, clientes, receita, investimento), indicadores (CPC, CPL, CAC, ROI, LTV).

3. BENCHMARKS DO SETOR: Métricas médias do setor, tendências, insight competitivo.

4. PLANO DE EXECUÇÃO: Roadmap de 3 meses com ações vinculadas às ferramentas da plataforma (conteudos, postagens, sites, trafego, crm, scripts, manual).

5. CHECKLIST DE ESTRUTURA: 6-10 itens com status (tem/nao_tem), prioridade e recomendação.

REGRAS:
- Seja ESPECÍFICO com base nas respostas — nada genérico
- Use CÁLCULOS REAIS para projeções financeiras
- O calendário semanal deve ser prático e executável
- O plano de execução deve referenciar ferramentas reais da plataforma
- Sempre em português brasileiro
- Valores monetários em R$

Use a ferramenta generate_strategy para retornar.`;

const COMERCIAL_SYSTEM_PROMPT = `Você é um consultor comercial sênior especialista em vendas B2B e B2C. Sua função é analisar o briefing comercial e gerar um DIAGNÓSTICO COMERCIAL COMPLETO.

SEÇÕES A GERAR:

1. SCORE COMERCIAL: Score geral (0-100) e nível (Iniciante/Básico/Intermediário/Avançado/Expert).

2. RADAR COMERCIAL: 5 eixos (0-10 cada: processo de vendas, gestão de leads, ferramentas/CRM, canais de aquisição, performance/metas).

3. ANÁLISE COMERCIAL: Texto de 2-3 parágrafos com diagnóstico detalhado.

4. GAPS: 3-5 gaps comerciais identificados.

5. INSIGHTS: 3-6 insights personalizados com tipo (success/warning/opportunity).

6. ESTRATÉGIAS DE VENDAS: 2-3 estratégias detalhadas com nome, descrição, passos e resultado esperado.

7. FUNIL REVERSO: Cálculos reais — meta de faturamento ÷ ticket médio = vendas necessárias, considerando taxas de conversão para estimar leads e tráfego necessários.

8. PROJEÇÃO DE LEADS: 6 meses com cenário atual vs com estratégia.

9. PROJEÇÃO DE RECEITA: 6 meses com cenário atual vs com estratégia.

10. PLANO DE AÇÃO: 3 fases (30/60/90 dias) com itens específicos.

REGRAS:
- Seja ESPECÍFICO com base nas respostas — nada genérico
- Use CÁLCULOS REAIS no funil reverso (meta ÷ ticket = vendas, etc.)
- As projeções devem ser realistas baseadas no ticket médio e faturamento informados
- As estratégias de vendas devem ser específicas para o segmento e modelo de negócio
- Sempre em português brasileiro
- Valores monetários em R$

Use a ferramenta generate_strategy para retornar.`;

// ── HELPERS ─────────────────────────────────────────────────────────
function buildUserPrompt(answers: Record<string, unknown>, salesPlanContext: string, section: string): string {
  const answersText = Object.entries(answers)
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("\n");

  if (section === "comercial") {
    return `Com base nas respostas do briefing unificado (GPS do Negócio) abaixo, gere o DIAGNÓSTICO COMERCIAL COMPLETO.

RESPOSTAS DO BRIEFING:
${answersText}
${salesPlanContext}

INSTRUÇÕES IMPORTANTES:
1. O DIAGNÓSTICO COMERCIAL deve ter cálculos reais no funil reverso (meta ÷ ticket = vendas, etc.)
2. As projeções de leads e receita devem ter 6 meses com cenário atual vs com estratégia
3. As estratégias de vendas devem ser específicas para o segmento e modelo de negócio informado
4. Use os dados de ticket médio, faturamento atual, número de vendedores e metas informados
5. Os gaps devem refletir problemas reais detectados nas respostas

Use a ferramenta generate_strategy para retornar.`;
  }

  if (section === "marketing-growth") {
    return `Com base nas respostas do briefing unificado (GPS do Negócio) abaixo, gere a PARTE DE CRESCIMENTO da estratégia de marketing (conteúdo, projeções, benchmarks, execução e estrutura).

RESPOSTAS DO BRIEFING:
${answersText}
${salesPlanContext}

INSTRUÇÕES IMPORTANTES:
1. Faça projeções financeiras realistas baseadas no ticket médio e faturamento informados
2. O calendário semanal deve ser prático e executável
3. O plano de execução deve referenciar ferramentas reais da plataforma (conteudos, postagens, sites, trafego, crm, scripts)
4. A estrutura recomendada deve avaliar o que o negócio já tem vs o que precisa

Use a ferramenta generate_strategy para retornar.`;
  }

  // marketing-core (default)
  return `Com base nas respostas do briefing unificado (GPS do Negócio — parte comercial + parte marketing) abaixo, gere a PARTE CORE da estratégia de marketing (diagnóstico, ICP, proposta de valor, concorrência, tom e aquisição).

RESPOSTAS DO BRIEFING:
${answersText}
${salesPlanContext}

INSTRUÇÕES IMPORTANTES:
1. O ICP deve refletir exatamente o público descrito nas respostas
2. O tom de comunicação deve respeitar as preferências informadas (incluindo o que NÃO quer)
3. Os concorrentes devem ser inferidos do segmento (ou usar URLs se fornecidos)

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
      model: "google/gemini-3-flash-preview",
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

  return { result, tokensUsed };
}

// ── Section config map ──────────────────────────────────────────────
function getSectionConfig(section: string) {
  switch (section) {
    case "marketing-core":
      return { schema: MARKETING_CORE_SCHEMA, prompt: MARKETING_CORE_PROMPT };
    case "marketing-growth":
      return { schema: MARKETING_GROWTH_SCHEMA, prompt: MARKETING_GROWTH_PROMPT };
    case "comercial":
      return { schema: COMERCIAL_TOOL_SCHEMA, prompt: COMERCIAL_SYSTEM_PROMPT };
    // Legacy: "marketing" maps to core for backward compat
    default:
      return { schema: MARKETING_CORE_SCHEMA, prompt: MARKETING_CORE_PROMPT };
  }
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { answers, organization_id, section = "marketing-core" } = await req.json();
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

    // Only check credits on first call (marketing-core)
    if (section === "marketing-core" && organization_id) {
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
        salesPlanContext = `\n\nCONTEXTO DO PLANO DE VENDAS (já preenchido):\n${spText}\n\nUse esses dados para enriquecer a análise.`;
      }
    }

    // Pick schema & prompt based on section
    const { schema: toolSchema, prompt: systemPrompt } = getSectionConfig(section);
    const userPrompt = buildUserPrompt(answers, salesPlanContext, section);

    console.log(`Generating ${section} section...`);

    const { result, tokensUsed } = await callAI(LOVABLE_API_KEY, systemPrompt, userPrompt, toolSchema);

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Falha ao estruturar resposta da IA. Tente novamente." }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log(`${section} section generated successfully. Tokens: ${tokensUsed}`);

    // Log usage
    const { data: orgData } = await serviceClient.rpc("get_user_org_id", { _user_id: userId });
    if (orgData) {
      await serviceClient.from("ai_conversation_logs").insert({
        organization_id: orgData,
        agent_id: "00000000-0000-0000-0000-000000000000",
        contact_id: "00000000-0000-0000-0000-000000000000",
        input_message: `[GPS ${section}] Briefing com ${Object.keys(answers).length} respostas`,
        output_message: JSON.stringify(result).substring(0, 500),
        tokens_used: tokensUsed,
        model: "google/gemini-3-flash-preview",
      });
    }

    return new Response(
      JSON.stringify({ result, tokens_used: tokensUsed }),
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
        JSON.stringify({ error: "Créditos insuficientes. Faça upgrade do seu plano." }),
        { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
