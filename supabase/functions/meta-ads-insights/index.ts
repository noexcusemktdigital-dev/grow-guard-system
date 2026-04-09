import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// ============================================================
// meta-ads-insights
// Retorna métricas da conta Meta Ads (act_961503441507397)
// diretamente da Graph API v21.0. Sem autenticação JWT (verify_jwt=false).
// Chamado pelo frontend via supabase.functions.invoke('meta-ads-insights').
// ============================================================

const META_ACCOUNT_ID = "act_961503441507397";
const META_API_VERSION = "v21.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Mapeia período para o date_preset aceito pela Graph API
const PERIOD_MAP: Record<string, string> = {
  today: "today",
  last_7d: "last_7_d",
  last_30d: "last_30_d",
};

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
  objective?: string;
}

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaInsightRow {
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: MetaAction[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  // --- Env var ---
  const accessToken = Deno.env.get("META_ACCESS_TOKEN");
  if (!accessToken) {
    console.error("meta-ads-insights: META_ACCESS_TOKEN not set — fail-closed");
    return new Response(
      JSON.stringify({ error: "Server misconfigured: META_ACCESS_TOKEN not set" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  // --- Parse body ---
  let period = "today";
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.period && typeof body.period === "string") {
      period = body.period;
    }
  } catch {
    // corpo vazio ou inválido — usa default "today"
  }

  const datePreset = PERIOD_MAP[period] ?? "today";

  try {
    // 1. Busca campanhas da conta
    const campaignsUrl = new URL(`${META_BASE_URL}/${META_ACCOUNT_ID}/campaigns`);
    campaignsUrl.searchParams.set("fields", "id,name,status,daily_budget,objective");
    campaignsUrl.searchParams.set("access_token", accessToken);
    campaignsUrl.searchParams.set("limit", "100");

    const [campaignsRes, accountInsightsRes] = await Promise.all([
      fetch(campaignsUrl.toString()),
      // 2. Busca insights agregados da conta inteira
      fetch(
        `${META_BASE_URL}/${META_ACCOUNT_ID}/insights?` +
          new URLSearchParams({
            fields: "spend,impressions,clicks,actions",
            date_preset: datePreset,
            level: "account",
            access_token: accessToken,
          }).toString(),
      ),
    ]);

    if (!campaignsRes.ok) {
      const errText = await campaignsRes.text();
      console.error("meta-ads-insights: campaigns API error:", errText);
      return new Response(
        JSON.stringify({ error: "Meta API error (campaigns)", detail: errText.slice(0, 500) }),
        { status: 502, headers: jsonHeaders },
      );
    }

    if (!accountInsightsRes.ok) {
      const errText = await accountInsightsRes.text();
      console.error("meta-ads-insights: account insights API error:", errText);
      return new Response(
        JSON.stringify({ error: "Meta API error (account insights)", detail: errText.slice(0, 500) }),
        { status: 502, headers: jsonHeaders },
      );
    }

    const campaignsJson = await campaignsRes.json();
    const accountInsightsJson = await accountInsightsRes.json();

    const campaigns: MetaCampaign[] = campaignsJson?.data ?? [];
    const accountInsightData: MetaInsightRow = accountInsightsJson?.data?.[0] ?? {};

    // 3. Busca insights por campanha (apenas campanhas ACTIVE / PAUSED)
    const campaignIds = campaigns.map((c) => c.id);
    let campaignInsights: Record<string, MetaInsightRow> = {};

    if (campaignIds.length > 0) {
      const campaignInsightsRes = await fetch(
        `${META_BASE_URL}/${META_ACCOUNT_ID}/insights?` +
          new URLSearchParams({
            fields: "campaign_id,campaign_name,spend,impressions,clicks,actions",
            date_preset: datePreset,
            level: "campaign",
            access_token: accessToken,
            limit: "100",
          }).toString(),
      );

      if (campaignInsightsRes.ok) {
        const cInsightsJson = await campaignInsightsRes.json();
        const cInsightData: Array<MetaInsightRow & { campaign_id?: string }> =
          cInsightsJson?.data ?? [];
        for (const row of cInsightData) {
          if (row.campaign_id) {
            campaignInsights[row.campaign_id] = row;
          }
        }
      } else {
        console.warn("meta-ads-insights: campaign-level insights failed, continuing without");
      }
    }

    // 4. Normaliza métricas de conta
    const accountLeads = extractLeads(accountInsightData.actions ?? []);
    const accountSpend = parseFloat(accountInsightData.spend ?? "0");
    const accountImpressions = parseInt(accountInsightData.impressions ?? "0", 10);
    const accountClicks = parseInt(accountInsightData.clicks ?? "0", 10);

    // 5. Constrói lista de campanhas com métricas
    const campaignsWithMetrics = campaigns.map((campaign) => {
      const insights = campaignInsights[campaign.id] ?? {};
      const spend = parseFloat(insights.spend ?? "0");
      const impressions = parseInt(insights.impressions ?? "0", 10);
      const clicks = parseInt(insights.clicks ?? "0", 10);
      const leads = extractLeads(insights.actions ?? []);
      const cpl = leads > 0 ? spend / leads : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status, // ACTIVE | PAUSED | ARCHIVED etc.
        daily_budget: campaign.daily_budget
          ? parseInt(campaign.daily_budget, 10) / 100 // centavos → BRL
          : null,
        objective: campaign.objective ?? null,
        spend,
        impressions,
        clicks,
        leads,
        cpl: parseFloat(cpl.toFixed(2)),
      };
    });

    const payload = {
      period,
      account: {
        id: META_ACCOUNT_ID,
        spend: accountSpend,
        impressions: accountImpressions,
        clicks: accountClicks,
        leads: accountLeads,
        cpl: accountLeads > 0 ? parseFloat((accountSpend / accountLeads).toFixed(2)) : 0,
        ctr:
          accountImpressions > 0
            ? parseFloat(((accountClicks / accountImpressions) * 100).toFixed(2))
            : 0,
      },
      campaigns: campaignsWithMetrics,
    };

    console.log(
      `meta-ads-insights: period=${period} spend=${accountSpend} leads=${accountLeads} campaigns=${campaigns.length}`,
    );

    return new Response(JSON.stringify(payload), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error("meta-ads-insights unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", detail: String(err) }),
      { status: 500, headers: jsonHeaders },
    );
  }
});

// Extrai leads (conversas, lead_generation, etc.) do array de actions
function extractLeads(actions: MetaAction[]): number {
  const leadTypes = [
    "lead",
    "leadgen_grouped",
    "onsite_conversion.lead_grouped",
    "offsite_conversion.fb_pixel_lead",
    "offsite_conversion.lead",
  ];
  let total = 0;
  for (const action of actions) {
    if (leadTypes.includes(action.action_type)) {
      total += parseInt(action.value ?? "0", 10);
    }
  }
  return total;
}
