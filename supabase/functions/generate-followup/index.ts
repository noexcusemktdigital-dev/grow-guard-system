// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const { strategy_result, month_ref, analise_parcial, ciclos_anteriores } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é um consultor estratégico da NoExcuse Marketing. Sua função é analisar a estratégia do cliente e gerar o relatório mensal de acompanhamento.

CONTEXTO:
- Você recebe a estratégia completa do cliente (diagnóstico, etapas, entregáveis)
- Você recebe dados parciais de análise do mês atual (métricas, entregas feitas)
- Você recebe o histórico de ciclos anteriores para continuidade

RESPONDA EM JSON com esta estrutura exata:
{
  "analise": {
    "destaques": ["o que funcionou bem neste mês - seja específico"],
    "gaps": ["o que não funcionou ou precisa melhorar - seja direto e objetivo"],
    "observacoes": "análise geral do mês em 2-3 frases diretas no padrão NoExcuse"
  },
  "plano_proximo": {
    "conteudo": {
      "acoes": ["ação específica e executável para conteúdo"],
      "entregas": ["entrega concreta: ex: 12 posts feed, 8 reels, 4 stories"]
    },
    "trafego": {
      "acoes": ["ação específica para tráfego pago"],
      "budget": 0,
      "plataformas": ["Meta Ads", "Google Ads"]
    },
    "web": {
      "acoes": ["ação específica para site/landing pages"],
      "entregas": ["entrega concreta"]
    },
    "sales": {
      "acoes": ["ação específica para CRM/vendas"],
      "entregas": ["entrega concreta"]
    }
  }
}

REGRAS:
- Ações devem ser AGRESSIVAS e ESCALÁVEIS no padrão NoExcuse
- Cada ação deve ter nível de detalhe executável
- Considere a capacidade operacional do cliente
- Baseie o plano no que foi feito no mês anterior (continuidade)
- Se algo não funcionou, proponha ajuste claro
- Conteúdo deve incluir ângulo emocional + identificação, não só educativo
- Responda APENAS o JSON, sem markdown`;

    const userPrompt = `Mês de referência: ${month_ref}

ESTRATÉGIA DO CLIENTE:
${JSON.stringify(strategy_result, null, 2)}

DADOS PARCIAIS DE ANÁLISE DO MÊS:
${JSON.stringify(analise_parcial || {}, null, 2)}

CICLOS ANTERIORES:
${JSON.stringify(ciclos_anteriores || [], null, 2)}

Gere a análise completa e o plano detalhado para o próximo mês.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Erro no gateway de IA");
    }

    const aiData = await response.json();
    const raw = aiData.choices?.[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    return new Response(JSON.stringify(result), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-followup error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
