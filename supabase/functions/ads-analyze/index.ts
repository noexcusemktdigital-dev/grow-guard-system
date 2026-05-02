// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

serve(async (req) => {
  const ctx = newRequestContext(req, 'ads-analyze');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { organization_id, period_days = 30 } = await req.json();

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "Missing organization_id" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Debit 30 credits — only after first GPS is approved
    const { data: gpsApproved } = await supabase
      .from("marketing_strategies")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (!gpsApproved) {
      console.log("GPS not yet approved — skipping credit debit");
    } else {
      const { error: debitError } = await supabase.rpc("debit_credits", {
        _org_id: organization_id,
        _amount: 30,
        _description: "Análise IA de campanhas de tráfego pago",
        _source: "ads_analyze",
      });

      if (debitError) {
        const status = debitError.message?.includes("INSUFFICIENT") ? 402 : 500;
        return new Response(JSON.stringify({ error: debitError.message }), {
          status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    // Fetch metrics
    const sinceDate = new Date(Date.now() - period_days * 86400000).toISOString().split("T")[0];
    const { data: metrics, error: metricsError } = await supabase
      .from("ad_campaign_metrics")
      .select("*")
      .eq("organization_id", organization_id)
      .gte("date", sinceDate)
      .order("date", { ascending: false });

    if (metricsError) {
      return new Response(JSON.stringify({ error: "Failed to fetch metrics" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (!metrics || metrics.length === 0) {
      return new Response(JSON.stringify({
        analysis: "Nenhuma métrica encontrada para análise. Sincronize as contas de anúncio primeiro.",
        insights: [],
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Aggregate data for AI
    const summary = {
      total_spend: metrics.reduce((s, m) => s + Number(m.spend), 0),
      total_impressions: metrics.reduce((s, m) => s + Number(m.impressions), 0),
      total_clicks: metrics.reduce((s, m) => s + Number(m.clicks), 0),
      total_conversions: metrics.reduce((s, m) => s + Number(m.conversions), 0),
      campaigns: {} as Record<string, { platform: string; name: string; spend: number; impressions: number; clicks: number; conversions: number }>,
    };

    for (const m of metrics) {
      const key = `${m.platform}|${m.campaign_id}`;
      if (!summary.campaigns[key]) {
        summary.campaigns[key] = {
          platform: m.platform,
          name: m.campaign_name,
          spend: 0, impressions: 0, clicks: 0, conversions: 0,
        };
      }
      summary.campaigns[key].spend += Number(m.spend);
      summary.campaigns[key].impressions += Number(m.impressions);
      summary.campaigns[key].clicks += Number(m.clicks);
      summary.campaigns[key].conversions += Number(m.conversions);
    }

    const campaignsList = Object.values(summary.campaigns);

    const prompt = `Você é um especialista em tráfego pago (Google Ads e Meta Ads). Analise os dados de campanhas abaixo e forneça insights acionáveis em português brasileiro.

DADOS DO PERÍODO (últimos ${period_days} dias):
- Investimento total: R$ ${summary.total_spend.toFixed(2)}
- Impressões totais: ${summary.total_impressions.toLocaleString()}
- Cliques totais: ${summary.total_clicks.toLocaleString()}
- Conversões totais: ${summary.total_conversions}
- CTR médio: ${summary.total_clicks > 0 ? ((summary.total_clicks / summary.total_impressions) * 100).toFixed(2) : 0}%
- CPC médio: R$ ${summary.total_clicks > 0 ? (summary.total_spend / summary.total_clicks).toFixed(2) : "0.00"}
- CPL médio: R$ ${summary.total_conversions > 0 ? (summary.total_spend / summary.total_conversions).toFixed(2) : "N/A"}

CAMPANHAS:
${JSON.stringify(campaignsList, null, 2)}

Retorne um JSON com a seguinte estrutura:
{
  "resumo": "Parágrafo resumo geral da performance",
  "pontos_fortes": ["lista de pontos positivos"],
  "pontos_fracos": ["lista de problemas identificados"],
  "recomendacoes": ["lista de ações recomendadas com detalhes"],
  "campanhas_destaque": [{"nome": "...", "motivo": "...", "acao": "..."}],
  "projecao": "Projeção para os próximos 30 dias baseada nos dados"
}`;

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI API error:", errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const analysisText = aiData.choices?.[0]?.message?.content || "";

    // Try to parse JSON from response
    let analysis: Record<string, unknown>;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { resumo: analysisText };
    } catch {
      analysis = { resumo: analysisText };
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      summary: {
        total_spend: summary.total_spend,
        total_impressions: summary.total_impressions,
        total_clicks: summary.total_clicks,
        total_conversions: summary.total_conversions,
      },
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("ads-analyze error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
