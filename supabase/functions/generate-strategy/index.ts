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
      "Gera um diagnóstico estratégico completo baseado na metodologia SPIN Selling + Termômetro NOEXCUSE, com 7 seções: diagnóstico do negócio, problemas, gargalos, projeção de crescimento, estratégia recomendada, serviços indicados e roadmap de execução.",
    parameters: {
      type: "object",
      properties: {
        diagnostico_negocio: {
          type: "object",
          properties: {
            modelo: { type: "string", description: "Descrição do modelo de negócio atual (1-2 parágrafos)" },
            momento: { type: "string", description: "Análise do momento atual do negócio (1-2 parágrafos)" },
            maturidade: {
              type: "object",
              properties: {
                score: { type: "number", description: "Score geral de maturidade de 0-100" },
                nivel: { type: "string", description: "Nível: Inicial, Em Desenvolvimento, Estruturado, Avançado ou Excelência" },
                descricao: { type: "string", description: "Descrição detalhada da maturidade do negócio" },
              },
              required: ["score", "nivel", "descricao"],
              additionalProperties: false,
            },
            radar_data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  eixo: { type: "string", description: "Nome do eixo avaliado" },
                  score: { type: "number", description: "Score de 0 a 5" },
                  max: { type: "number", description: "Valor máximo (sempre 5)" },
                },
                required: ["eixo", "score", "max"],
                additionalProperties: false,
              },
              description: "6 eixos do radar: Estrutura de Marketing, Estrutura Comercial, Organização de Leads, Previsibilidade de Vendas, Posicionamento de Marca, Escala de Aquisição",
            },
          },
          required: ["modelo", "momento", "maturidade", "radar_data"],
          additionalProperties: false,
        },
        problemas_identificados: {
          type: "array",
          items: { type: "string" },
          description: "5-8 problemas reais identificados a partir das respostas SPIN (Problema + Implicação)",
        },
        gargalos: {
          type: "object",
          properties: {
            aquisicao: { type: "string", description: "Gargalo na aquisição de clientes (1-2 parágrafos)" },
            conversao: { type: "string", description: "Gargalo na conversão de leads em clientes (1-2 parágrafos)" },
            estrutura: { type: "string", description: "Gargalo na estrutura comercial e operacional (1-2 parágrafos)" },
            posicionamento: { type: "string", description: "Gargalo no posicionamento de marca e mercado (1-2 parágrafos)" },
          },
          required: ["aquisicao", "conversao", "estrutura", "posicionamento"],
          additionalProperties: false,
        },
        projecao_crescimento: {
          type: "object",
          properties: {
            meta_faturamento: { type: "string", description: "Meta de faturamento mensal informada (R$)" },
            ticket_medio: { type: "string", description: "Ticket médio atual ou desejado (R$)" },
            vendas_necessarias: { type: "number", description: "Número de vendas necessárias por mês (meta ÷ ticket)" },
            leads_necessarios: { type: "number", description: "Leads necessários por mês (vendas ÷ taxa conversão)" },
            taxa_conversao: { type: "number", description: "Taxa de conversão estimada (%)" },
            descricao: { type: "string", description: "Descrição narrativa da projeção de crescimento com cálculos detalhados (2-3 parágrafos)" },
          },
          required: ["meta_faturamento", "ticket_medio", "vendas_necessarias", "leads_necessarios", "taxa_conversao", "descricao"],
          additionalProperties: false,
        },
        estrategia_recomendada: {
          type: "object",
          properties: {
            estrutura: { type: "array", items: { type: "string" }, description: "3-5 ações para estruturar o negócio" },
            aquisicao: { type: "array", items: { type: "string" }, description: "3-5 ações para gerar demanda" },
            conversao: { type: "array", items: { type: "string" }, description: "3-5 ações para otimizar conversão" },
            escala: { type: "array", items: { type: "string" }, description: "3-5 ações para escalar o negócio" },
          },
          required: ["estrutura", "aquisicao", "conversao", "escala"],
          additionalProperties: false,
        },
        servicos_indicados: {
          type: "array",
          items: {
            type: "object",
            properties: {
              servico: { type: "string", description: "Nome do serviço NOEXCUSE indicado" },
              justificativa: { type: "string", description: "Por que esse serviço é necessário" },
              prioridade: { type: "string", enum: ["essencial", "recomendado", "opcional"], description: "Nível de prioridade" },
            },
            required: ["servico", "justificativa", "prioridade"],
            additionalProperties: false,
          },
          description: "5-8 serviços indicados: Estruturação RevOps, CRM, Tráfego Pago, Estratégia de Conteúdo, Automação de Vendas, Dashboards, etc.",
        },
        roadmap: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fase: { type: "number", description: "Número da fase (1-4)" },
              titulo: { type: "string", description: "Título da fase" },
              periodo: { type: "string", description: "Período estimado (ex: Semanas 1-4)" },
              acoes: { type: "array", items: { type: "string" }, description: "3-5 ações da fase" },
            },
            required: ["fase", "titulo", "periodo", "acoes"],
            additionalProperties: false,
          },
          description: "4 fases: 1-Estrutura, 2-Geração de Demanda, 3-Otimização de Conversão, 4-Escala",
        },
        resumo_executivo: { type: "string", description: "Resumo executivo de 2-3 parágrafos da estratégia completa, incluindo diagnóstico, principais problemas, projeção e recomendações" },
      },
      required: [
        "diagnostico_negocio", "problemas_identificados", "gargalos",
        "projecao_crescimento", "estrategia_recomendada", "servicos_indicados",
        "roadmap", "resumo_executivo",
      ],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `Você é um consultor estratégico sênior da NOEXCUSE, especialista em diagnóstico empresarial usando a metodologia SPIN Selling combinada com o Termômetro de Maturidade NOEXCUSE (Estrutura → Dados → Escala).

Sua função é receber as respostas de um diagnóstico estratégico de 8 blocos e gerar um documento completo com 7 seções.

METODOLOGIA:
- SPIN Selling: as respostas dos blocos de Situação, Problemas, Impacto e Resultado Esperado revelam as dores reais e o cenário futuro desejado.
- Termômetro NOEXCUSE: as autoavaliações (1-5) em 6 eixos (Marketing, Comercial, Leads, Previsibilidade, Marca, Escala) definem o nível de maturidade.
- Os dados financeiros (margem, custo máx/cliente, LTV) permitem projeções precisas.

ESTRUTURA DO DIAGNÓSTICO (8 blocos de entrada):
1. Situação (Contexto do Negócio) — produto, ticket, faturamento, meta, canais, investimento marketing
2. Estrutura Comercial — processo, atendimento leads, time, script, funil, CRM, conversão
3. Geração de Demanda — leads/mês, CPL, canal principal, tráfego pago, conteúdo, posicionamento
4. Problemas (SPIN) — dores de geração, vendas, oportunidades perdidas, qualificação, previsibilidade
5. Impacto (SPIN) — consequências, impacto faturamento, vendas perdidas, capacidade de escala
6. Resultado Esperado (Need Payoff) — clientes desejados, faturamento ideal, ticket futuro, cenário ideal
7. Termômetro Maturidade — autoavaliação 1-5 em 6 eixos
8. Financeiro Estratégico — margem, custo máx/cliente, LTV

DOCUMENTO A GERAR (7 seções):

1. DIAGNÓSTICO DO NEGÓCIO: modelo de negócio, momento atual, maturidade (score 0-100, nível, radar com 6 eixos usando as notas do termômetro).

2. PROBLEMAS IDENTIFICADOS: 5-8 problemas REAIS extraídos das respostas SPIN (não genéricos).

3. GARGALOS ESTRATÉGICOS: análise detalhada em 4 dimensões — aquisição, conversão, estrutura, posicionamento.

4. PROJEÇÃO DE CRESCIMENTO: cálculos matemáticos baseados nos dados fornecidos:
   - Meta ÷ Ticket = Vendas necessárias
   - Vendas ÷ Taxa conversão = Leads necessários
   - Use os dados reais informados (faturamento, ticket, taxa conversão).

5. ESTRATÉGIA RECOMENDADA: 4 pilares (Estrutura, Aquisição, Conversão, Escala) com 3-5 ações cada.

6. SERVIÇOS INDICADOS NOEXCUSE: 5-8 serviços da suite NOEXCUSE (RevOps, CRM, Tráfego Pago, Conteúdo, Automação, Dashboards, Branding, etc.) com justificativa e prioridade.

7. ROADMAP DE EXECUÇÃO: 4 fases — Estrutura → Demanda → Conversão → Escala, com 3-5 ações cada e período estimado.

REGRAS:
- Seja ESPECÍFICO com base nos dados fornecidos — nada genérico
- Use CÁLCULOS REAIS para projeções
- Os scores do radar devem refletir as autoavaliações do termômetro
- O score geral de maturidade (0-100) deve ser calculado como a média dos 6 eixos × 20
- Sempre em português brasileiro
- Prioridades dos serviços: essencial (necessário imediatamente), recomendado (importante), opcional (bom ter)

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

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

    // Fetch sales plan for unified context
    const serviceClient2 = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let salesPlanContext = "";
    if (organization_id) {
      const { data: salesPlan } = await serviceClient2
        .from("sales_plans")
        .select("answers")
        .eq("organization_id", organization_id)
        .maybeSingle();
      if (salesPlan?.answers && Object.keys(salesPlan.answers).length > 3) {
        const spText = Object.entries(salesPlan.answers as Record<string, any>)
          .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("\n");
        salesPlanContext = `\n\nCONTEXTO DO PLANO DE VENDAS (já preenchido pelo usuário):\n${spText}\n\nUse esses dados para enriquecer o diagnóstico e as recomendações.`;
      }
    }

    const answersText = Object.entries(answers)
      .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("\n");

    const userPrompt = `Com base nas respostas do diagnóstico estratégico abaixo (8 blocos: Situação, Estrutura Comercial, Geração de Demanda, Problemas SPIN, Impacto SPIN, Resultado Esperado, Termômetro de Maturidade, Financeiro), gere o documento estratégico COMPLETO com as 7 seções.

RESPOSTAS DO DIAGNÓSTICO:
${answersText}
${salesPlanContext}

INSTRUÇÕES:
1. Use as autoavaliações do termômetro (1-5) como base para os scores do radar
2. Calcule o score de maturidade como média dos 6 eixos × 20
3. Extraia problemas REAIS das respostas SPIN (não invente)
4. Faça a projeção de crescimento com cálculos matemáticos reais (meta ÷ ticket = vendas, vendas ÷ conversão = leads)
5. Indique serviços NOEXCUSE relevantes com justificativa baseada nos problemas identificados
6. Monte roadmap em 4 fases progressivas

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
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    // Fallback: if tool_calls is empty, try parsing message.content as JSON
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
        input_message: `[Estratégia SPIN+NOEXCUSE] Diagnóstico com ${Object.keys(answers).length} respostas`,
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
