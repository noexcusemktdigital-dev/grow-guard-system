import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "extract_answers",
    description: "Extrai e mapeia as respostas do briefing para os campos do formulário de diagnóstico estratégico.",
    parameters: {
      type: "object",
      properties: {
        produto_servico: { type: "string", description: "Principal produto ou serviço vendido" },
        ticket_medio: { type: "string", description: "Ticket médio em R$" },
        faturamento_mensal: { type: "string", description: "Faturamento médio mensal em R$" },
        clientes_novos_mes: { type: "string", description: "Número de clientes novos por mês" },
        meta_faturamento: { type: "string", description: "Meta de faturamento mensal em R$" },
        prazo_meta: { type: "string", enum: ["3 meses", "6 meses", "12 meses", "Outro"] },
        canais_atuais: { type: "array", items: { type: "string" }, description: "Canais que geram clientes hoje" },
        investe_marketing: { type: "string", enum: ["Sim", "Não"] },
        valor_investimento_marketing: { type: "string", description: "Valor investido por mês em marketing" },
        canais_investimento: { type: "string", description: "Canais de investimento em marketing" },
        processo_comercial: { type: "string", enum: ["Não", "Parcial", "Sim"] },
        atendimento_leads: { type: "string", enum: ["WhatsApp manual", "CRM", "Planilha", "Equipe de vendas", "Outro"] },
        tamanho_time_comercial: { type: "string", description: "Tamanho do time comercial" },
        script_atendimento: { type: "string", enum: ["Sim", "Não", "Parcial"] },
        funil_definido: { type: "string", enum: ["Sim", "Não", "Parcial"] },
        usa_crm: { type: "string", enum: ["Sim", "Não"] },
        qual_crm: { type: "string", description: "Qual CRM utiliza" },
        mede_conversao: { type: "string", enum: ["Sim", "Não", "Parcialmente"] },
        leads_mes: { type: "string", description: "Leads gerados por mês" },
        custo_por_lead: { type: "string", description: "Custo médio por lead em R$" },
        canal_mais_clientes: { type: "string", description: "Canal que mais gera clientes" },
        investe_trafego_pago: { type: "string", enum: ["Sim", "Não"] },
        plataformas_trafego: { type: "array", items: { type: "string" }, description: "Plataformas de tráfego pago" },
        maior_resultado_marketing: { type: "string", description: "Maior resultado com marketing" },
        producao_conteudo: { type: "string", enum: ["Sim", "Não", "Irregular"] },
        estrategia_posicionamento: { type: "string", enum: ["Sim", "Não", "Parcial"] },
        problema_geracao_clientes: { type: "string", description: "Maior problema na geração de clientes" },
        problema_processo_vendas: { type: "string", description: "Maior problema no processo de vendas" },
        perde_oportunidades: { type: "string", enum: ["Sim", "Não", "Talvez"] },
        motivo_perda_oportunidades: { type: "string", description: "Motivo de perda de oportunidades" },
        dificuldade_organizar_leads: { type: "string", enum: ["Sim", "Não", "Parcialmente"] },
        marketing_gera_qualificados: { type: "string", enum: ["Sim", "Não", "Parcialmente"] },
        falta_previsibilidade: { type: "string", enum: ["Sim", "Não"] },
        impacto_se_continuar: { type: "string", description: "Impacto se vendas continuarem como estão" },
        impacto_faturamento: { type: "string", description: "Impacto dos problemas no faturamento" },
        vendas_perdidas_mes: { type: "string", description: "Vendas perdidas por mês" },
        impacto_se_resolver: { type: "string", description: "Impacto financeiro se problemas resolvidos" },
        aguenta_dobrar_demanda: { type: "string", enum: ["Sim, tranquilamente", "Sim, com dificuldade", "Não, precisaria estruturar", "Não, seria caótico"] },
        clientes_desejados_mes: { type: "string", description: "Clientes novos desejados por mês" },
        faturamento_ideal: { type: "string", description: "Faturamento mensal ideal em R$" },
        ticket_medio_futuro: { type: "string", description: "Ticket médio futuro desejado em R$" },
        cenario_ideal_12_meses: { type: "string", description: "Cenário ideal em 12 meses" },
        o_que_precisa_mudar: { type: "string", description: "O que precisa mudar para chegar no resultado" },
        nota_marketing: { type: "number", description: "Nota autoavaliação marketing 1-5" },
        nota_comercial: { type: "number", description: "Nota autoavaliação comercial 1-5" },
        nota_leads: { type: "number", description: "Nota autoavaliação leads 1-5" },
        nota_previsibilidade: { type: "number", description: "Nota autoavaliação previsibilidade 1-5" },
        nota_marca: { type: "number", description: "Nota autoavaliação marca 1-5" },
        nota_escala: { type: "number", description: "Nota autoavaliação escala 1-5" },
        margem_lucro: { type: "string", description: "Margem de lucro %" },
        custo_maximo_cliente: { type: "string", description: "Custo máximo aceitável por cliente R$" },
        ltv_medio: { type: "string", description: "LTV médio do cliente R$" },
      },
      required: ["produto_servico", "nota_marketing", "nota_comercial", "nota_leads", "nota_previsibilidade", "nota_marca", "nota_escala"],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `Você é um assistente de extração de dados da NOEXCUSE. Sua função é ler um briefing/documento de texto bruto enviado por um consultor e extrair as informações relevantes, mapeando-as para os campos de um formulário de diagnóstico estratégico.

O formulário tem 8 blocos:
1. Situação (produto, ticket médio, faturamento, meta, canais, investimento marketing)
2. Estrutura Comercial (processo, atendimento, time, script, funil, CRM, conversão)
3. Geração de Demanda (leads/mês, CPL, canal principal, tráfego, conteúdo, posicionamento)
4. Problemas SPIN (dores de geração, vendas, oportunidades perdidas)
5. Impacto SPIN (consequências, impacto faturamento, capacidade de escala)
6. Resultado Esperado (clientes desejados, faturamento ideal, cenário ideal)
7. Termômetro de Maturidade (notas 1-5 em 6 eixos — se não mencionado, use 3 como padrão)
8. Financeiro (margem, custo/cliente, LTV)

REGRAS:
- Extraia APENAS informações que estejam EXPLICITAMENTE no texto
- Para campos não encontrados, use string vazia "" (exceto notas do termômetro, use 3)
- Para campos select, escolha a opção que melhor se encaixa no texto
- Para checkbox-group (canais_atuais, plataformas_trafego), retorne array com as opções mencionadas
- Valores numéricos: extraia apenas o número, sem R$ ou %
- Notas do termômetro: infira com base no contexto (1=muito fraco, 5=excelente), padrão 3

Use a ferramenta extract_answers para retornar os dados extraídos.`;

serve(async (req) => {
  const ctx = newRequestContext(req, 'extract-strategy-answers');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  // SEC-NOE-002: User auth required
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: _authUser }, error: _authErr } = await userClient.auth.getUser();
  if (_authErr || !_authUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Texto do briefing é obrigatório (mínimo 20 caracteres)" }),
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
          { role: "user", content: `Extraia as informações do seguinte briefing e mapeie para os campos do diagnóstico:\n\n${text}` },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "extract_answers" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente." }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao processar briefing" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let answers: Record<string, unknown> | null = null;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        answers = typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    if (!answers) {
      return new Response(JSON.stringify({ error: "Falha ao extrair dados do briefing" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Ensure slider defaults
    const sliderKeys = ["nota_marketing", "nota_comercial", "nota_leads", "nota_previsibilidade", "nota_marca", "nota_escala"];
    for (const k of sliderKeys) {
      if (typeof answers[k] !== "number" || answers[k] < 1 || answers[k] > 5) {
        answers[k] = 3;
      }
    }

    return new Response(JSON.stringify({ answers }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-strategy-answers error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
