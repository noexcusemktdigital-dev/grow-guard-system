// @ts-nocheck
// ============================================================
// ARCH-ADS-001 — DEPRECATED (manter por ora, NÃO deletar)
// Este arquivo sincroniza métricas de Meta Ads e Google Ads via conexões
// OAuth da tabela ad_platform_connections (sistema antigo de conexões).
//
// O sistema NOVO é: meta-ads-insights (Meta Ads direto, conta fixa NOE)
// meta-ads-insights é a fonte canônica para o dashboard de Anúncios.
// ads-sync-metrics continua ativo para sincronização histórica de outras contas.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

/** Monitora o cabeçalho X-Business-Use-Case-Usage do Meta e loga alertas */
function checkMetaRateLimit(headers: Headers, accountId: string): void {
  const usage = headers.get("x-business-use-case-usage");
  if (!usage) return;
  try {
    const parsed: Record<string, Array<{type: string; call_count: number; total_cputime: number; total_time: number}>> = JSON.parse(usage);
    for (const [acct, entries] of Object.entries(parsed)) {
      for (const entry of entries) {
        const max = Math.max(entry.call_count, entry.total_cputime, entry.total_time);
        if (max > 85) {
          console.warn(`[Meta RateLimit] ALERTA account ${acct} type=${entry.type} uso=${max}% — backoff recomendado`);
        } else if (max > 60) {
          console.log(`[Meta RateLimit] account ${acct} type=${entry.type} uso=${max}%`);
        }
      }
    }
  } catch {
    // non-fatal
  }
}

/** Fetch com backoff exponencial para rate limits do Meta (80000/80004) */
async function fetchWithBackoff(url: string, options?: RequestInit, maxRetries = 3): Promise<Response> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    const res = await fetch(url, options);
    if (res.status === 429 || res.status === 80000 || res.status === 80004) {
      const waitMs = Math.min(2000 * Math.pow(2, attempt), 30000);
      console.warn(`[Meta] Rate limit hit (${res.status}), aguardando ${waitMs}ms antes de retry ${attempt + 1}/${maxRetries}`);
      await new Promise(r => setTimeout(r, waitMs));
      attempt++;
      continue;
    }
    // Verifica JSON de erro para códigos 80000/80004 dentro de 200
    if (res.ok && attempt < maxRetries) {
      const clone = res.clone();
      try {
        const j = await clone.json();
        const errCode = j?.error?.code;
        if (errCode === 80000 || errCode === 80004 || errCode === 17 || errCode === 4) {
          const waitMs = Math.min(2000 * Math.pow(2, attempt), 30000);
          console.warn(`[Meta] Rate limit error code ${errCode}, aguardando ${waitMs}ms`);
          await new Promise(r => setTimeout(r, waitMs));
          attempt++;
          continue;
        }
      } catch { /* non-json */ }
    }
    return res;
  }
  throw new Error(`[Meta] Rate limit excedido após ${maxRetries} tentativas`);
}

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET")!;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("Google token refresh failed:", res.status, errText);
    return null;
  }
  return await res.json();
}

interface AdMetricRow {
  organization_id: string;
  connection_id: string;
  platform: string;
  campaign_id: string;
  campaign_name: string;
  campaign_status: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpl: number;
  raw_data: Record<string, unknown>;
}

interface AdAction {
  action_type: string;
  value: string;
}

async function syncGoogleAds(connection: Record<string, any>, supabase: any, periodDays = 30) {
  let accessToken = connection.access_token;
  const devToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
  if (!devToken) throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN not configured");

  if (connection.refresh_token && connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
    const refreshed = await refreshGoogleToken(connection.refresh_token);
    if (refreshed) {
      accessToken = refreshed.access_token;
      await supabase.from("ad_platform_connections").update({
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        status: "active",
      }).eq("id", connection.id);
    } else {
      await supabase.from("ad_platform_connections").update({ status: "expired" }).eq("id", connection.id);
      throw new Error("Token expired and refresh failed");
    }
  }

  const customerId = connection.account_id;
  if (!customerId) throw new Error("No Google Ads customer ID");

  // Período customizado: até 365 dias atrás
  const safeDays = Math.max(1, Math.min(365, Number(periodDays) || 30));
  const todayG = new Date();
  const startG = new Date(todayG.getTime() - safeDays * 86400000);
  const sinceG = startG.toISOString().split("T")[0];
  const untilG = todayG.toISOString().split("T")[0];

  const query = `
    SELECT campaign.id, campaign.name, campaign.status,
           segments.date,
           metrics.impressions, metrics.clicks, metrics.cost_micros,
           metrics.conversions, metrics.ctr, metrics.average_cpc
    FROM campaign
    WHERE segments.date BETWEEN '${sinceG}' AND '${untilG}'
    ORDER BY segments.date DESC
  `;

  console.log(`[Google] Syncing customer ${customerId}, period ${sinceG} to ${untilG} (${safeDays}d)...`);

  const res = await fetch(
    `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": devToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const bodyText = await res.text();
  console.log(`[Google] API response status: ${res.status}, body length: ${bodyText.length}`);

  if (!res.ok) {
    console.error("[Google] API error body:", bodyText.substring(0, 1000));
    throw new Error(`Google Ads API error: ${res.status}`);
  }

  const results = JSON.parse(bodyText);
  const metrics: AdMetricRow[] = [];

  for (const batch of results) {
    for (const row of batch.results || []) {
      const spendBrl = (row.metrics?.cost_micros || 0) / 1_000_000;
      const conversions = Math.round(row.metrics?.conversions || 0);
      metrics.push({
        organization_id: connection.organization_id,
        connection_id: connection.id,
        platform: "google_ads",
        campaign_id: row.campaign?.id?.toString() || "unknown",
        campaign_name: row.campaign?.name || "Unknown",
        campaign_status: row.campaign?.status || "UNKNOWN",
        date: row.segments?.date,
        impressions: row.metrics?.impressions || 0,
        clicks: row.metrics?.clicks || 0,
        spend: spendBrl,
        conversions,
        ctr: row.metrics?.ctr || 0,
        cpc: (row.metrics?.average_cpc || 0) / 1_000_000,
        cpl: conversions > 0 ? spendBrl / conversions : 0,
        raw_data: row,
      });
    }
  }

  console.log(`[Google] Parsed ${metrics.length} metric rows`);
  return metrics;
}

async function syncMetaAds(connection: Record<string, any>, supabase: any, periodDays = 30) {
  const accessToken = connection.access_token;
  let accountId = connection.account_id;
  if (!accountId) throw new Error("No Meta ad account ID");

  // Normalize: remove act_ prefix, strip non-numeric chars for safety
  accountId = accountId.replace(/^act_/, "").replace(/\D/g, "") || accountId.replace(/^act_/, "");
  if (!accountId) throw new Error("Invalid Meta ad account ID format");

  // Período customizado: até 365 dias atrás (limite Meta Insights API)
  const safeDays = Math.max(1, Math.min(365, Number(periodDays) || 30));
  const today = new Date();
  const startDate = new Date(today.getTime() - safeDays * 86400000);
  const since = startDate.toISOString().split("T")[0];
  const until = today.toISOString().split("T")[0];

  // DATA-ADS-001: effective_status NÃO é válido em /insights — buscar via /campaigns separadamente
  const insightsUrl = `https://graph.facebook.com/v19.0/act_${accountId}/insights?fields=campaign_id,campaign_name,impressions,clicks,spend,actions,ctr,cpc&time_range={"since":"${since}","until":"${until}"}&time_increment=1&level=campaign&limit=500&access_token=${accessToken}`;

  console.log(`[Meta] Syncing account act_${accountId}, period ${since} to ${until}`);

  // Buscar status real das campanhas em paralelo (endpoint separado)
  const campaignsStatusUrl = `https://graph.facebook.com/v19.0/act_${accountId}/campaigns?fields=id,effective_status,status&limit=500&access_token=${accessToken}`;
  const statusMap: Record<string, string> = {};
  try {
    const campRes = await fetch(campaignsStatusUrl);
    if (campRes.ok) {
      const campJson = await campRes.json();
      for (const c of campJson.data || []) {
        statusMap[c.id] = c.effective_status || c.status || "UNKNOWN";
      }
    }
  } catch (e) {
    console.warn("[Meta] Failed to fetch campaign statuses:", e);
  }

  const res = await fetchWithBackoff(insightsUrl);
  checkMetaRateLimit(res.headers, accountId);
  const bodyText = await res.text();
  console.log(`[Meta] API response status: ${res.status}, body length: ${bodyText.length}, preview: ${bodyText.substring(0, 500)}`);

  if (!res.ok) {
    const errBody = bodyText.substring(0, 500);
    console.error(`[Meta] Sync failed for account ${accountId}:`, errBody);
    if (res.status === 190 || res.status === 401 || bodyText.includes('"code":190') || bodyText.includes('"code":102')) {
      await supabase.from("ad_platform_connections").update({ status: "expired" }).eq("id", connection.id);
      throw new Error("Token Meta expirado. Reconecte a conta de anúncios.");
    }
    if (bodyText.includes('"code":100') || bodyText.includes("Invalid parameter")) {
      throw new Error("ID da conta de anúncios inválido. Tente reconectar e selecionar outra conta.");
    }
    if (bodyText.includes('"code":200') || bodyText.includes("Permission")) {
      throw new Error("Sem permissão para acessar esta conta de anúncios. Verifique se o usuário tem acesso à conta NOE FRANQUIA.");
    }
    throw new Error(`Meta Ads API error: ${res.status} — ${errBody}`);
  }

  const data = JSON.parse(bodyText);
  const metrics: AdMetricRow[] = [];

  for (const row of data.data || []) {
    const spend = parseFloat(row.spend || "0");
    const conversions = (row.actions || [])
      .filter((a: AdAction) => ["lead", "offsite_conversion.fb_pixel_lead", "purchase", "complete_registration"].includes(a.action_type))
      .reduce((sum: number, a: AdAction) => sum + parseInt(a.value || "0"), 0);

    metrics.push({
      organization_id: connection.organization_id,
      connection_id: connection.id,
      platform: "meta_ads",
      campaign_id: row.campaign_id,
      campaign_name: row.campaign_name || "Unknown",
      // DATA-ADS-001: usar status do statusMap (fetched de /campaigns)
      campaign_status: statusMap[row.campaign_id] || "UNKNOWN",
      date: row.date_start,
      impressions: parseInt(row.impressions || "0"),
      clicks: parseInt(row.clicks || "0"),
      spend,
      conversions,
      ctr: parseFloat(row.ctr || "0"),
      cpc: parseFloat(row.cpc || "0"),
      cpl: conversions > 0 ? spend / conversions : 0,
      raw_data: row,
    });
  }

  console.log(`[Meta] Parsed ${metrics.length} metric rows`);

  // Handle pagination
  let nextUrl = data.paging?.next;
  while (nextUrl) {
    console.log(`[Meta] Fetching next page...`);
    const nextRes = await fetchWithBackoff(nextUrl);
    checkMetaRateLimit(nextRes.headers, accountId);
    if (!nextRes.ok) break;
    const nextData = await nextRes.json();
    for (const row of nextData.data || []) {
      const spend = parseFloat(row.spend || "0");
      const conversions = (row.actions || [])
        .filter((a: AdAction) => ["lead", "offsite_conversion.fb_pixel_lead", "purchase", "complete_registration"].includes(a.action_type))
        .reduce((sum: number, a: AdAction) => sum + parseInt(a.value || "0"), 0);
      metrics.push({
        organization_id: connection.organization_id,
        connection_id: connection.id,
        platform: "meta_ads",
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name || "Unknown",
        // DATA-ADS-001: usar status do statusMap (fetched de /campaigns)
        campaign_status: statusMap[row.campaign_id] || "UNKNOWN",
        date: row.date_start,
        impressions: parseInt(row.impressions || "0"),
        clicks: parseInt(row.clicks || "0"),
        spend,
        conversions,
        ctr: parseFloat(row.ctr || "0"),
        cpc: parseFloat(row.cpc || "0"),
        cpl: conversions > 0 ? spend / conversions : 0,
        raw_data: row,
      });
    }
    nextUrl = nextData.paging?.next;
  }

  return metrics;
}

serve(async (req) => {
  const ctx = newRequestContext(req, 'ads-sync-metrics');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const { connection_id, mode, period, period_days } = body;

    // ── NOE_INSIGHTS mode: busca direto na conta central NOE via META_ACCESS_TOKEN ──
    // Substitui meta-ads-insights enquanto o deploy da edge fn não está disponível.
    if (mode === "noe_insights") {
      const accessToken = Deno.env.get("META_ACCESS_TOKEN");
      const adAccountId = Deno.env.get("META_AD_ACCOUNT_ID") ?? "act_961503441507397";
      const META_VER = "v21.0";
      const BASE = `https://graph.facebook.com/${META_VER}`;
      const PERIOD_MAP: Record<string, string> = { today: "today", last_7d: "last_7_d", last_30d: "last_30_d" };
      const datePreset = PERIOD_MAP[period as string] ?? "today";

      if (!accessToken) {
        return new Response(JSON.stringify({ error: "META_ACCESS_TOKEN not set" }), {
          status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const [campaignsRes, insightsRes] = await Promise.all([
        fetch(`${BASE}/${adAccountId}/campaigns?fields=id,name,status,daily_budget,objective&access_token=${accessToken}&limit=100`),
        fetch(`${BASE}/${adAccountId}/insights?` + new URLSearchParams({
          fields: "spend,impressions,clicks,actions", date_preset: datePreset, level: "account", access_token: accessToken,
        })),
      ]);

      const campaigns = (await campaignsRes.json())?.data ?? [];
      const insightRow = (await insightsRes.json())?.data?.[0] ?? {};
      const spend = parseFloat(insightRow.spend ?? "0");
      const impressions = parseInt(insightRow.impressions ?? "0", 10);
      const clicks = parseInt(insightRow.clicks ?? "0", 10);
      const leadTypes = ["lead","leadgen_grouped","onsite_conversion.lead_grouped","offsite_conversion.fb_pixel_lead"];
      const leads = (insightRow.actions ?? []).filter((a: {action_type:string}) => leadTypes.includes(a.action_type)).reduce((s: number, a: {value:string}) => s + parseInt(a.value ?? "0", 10), 0);

      // Busca insights por campanha
      const campaignInsights: Record<string, {spend:string;impressions:string;clicks:string;actions:{action_type:string;value:string}[];}> = {};
      if (campaigns.length > 0) {
        const ciRes = await fetch(`${BASE}/${adAccountId}/insights?` + new URLSearchParams({
          fields: "campaign_id,spend,impressions,clicks,actions", date_preset: datePreset, level: "campaign", access_token: accessToken, limit: "100",
        }));
        if (ciRes.ok) {
          for (const r of ((await ciRes.json())?.data ?? [])) {
            if (r.campaign_id) campaignInsights[r.campaign_id] = r;
          }
        }
      }

      const campaignsOut = campaigns.map((c: {id:string;name:string;status:string;daily_budget?:string;objective?:string}) => {
        const ci = campaignInsights[c.id] ?? {};
        const cspend = parseFloat(ci.spend ?? "0");
        const cimpr = parseInt(ci.impressions ?? "0", 10);
        const cclicks = parseInt(ci.clicks ?? "0", 10);
        const cleads = (ci.actions ?? []).filter((a: {action_type:string}) => leadTypes.includes(a.action_type)).reduce((s: number, a: {value:string}) => s + parseInt(a.value ?? "0", 10), 0);
        return { id: c.id, name: c.name, status: c.status, daily_budget: c.daily_budget ? parseInt(c.daily_budget, 10)/100 : null, objective: c.objective ?? null, spend: cspend, impressions: cimpr, clicks: cclicks, leads: cleads, cpl: cleads > 0 ? parseFloat((cspend/cleads).toFixed(2)) : 0 };
      });

      // Validar user e salvar snapshot
      const authHeader = req.headers.get("Authorization") ?? "";
      const userToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
      if (userToken) {
        const { data: { user } } = await supabase.auth.getUser(userToken);
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
          if (profile?.organization_id) {
            await supabase.from("meta_ads_snapshots").insert({ org_id: profile.organization_id, period: period ?? "today", spend, impressions, clicks, leads, campaigns_data: campaignsOut }).then(({error: e}) => { if (e) console.warn("snapshot error:", e.message); });
          }
        }
      }

      return new Response(JSON.stringify({
        period: period ?? "today",
        account: { id: adAccountId, spend, impressions, clicks, leads, cpl: leads > 0 ? parseFloat((spend/leads).toFixed(2)) : 0, ctr: impressions > 0 ? parseFloat(((clicks/impressions)*100).toFixed(2)) : 0 },
        campaigns: campaignsOut,
      }), { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    if (!connection_id) {
      return new Response(JSON.stringify({ error: "Missing connection_id" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { data: connection, error: connError } = await supabase
      .from("ad_platform_connections")
      .select("*")
      .eq("id", connection_id)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: "Connection not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // BUG-001: reject pending connections and fake __pending__ account_id
    if (!["active", "expired"].includes(connection.status) || connection.account_id === "__pending__") {
      return new Response(JSON.stringify({ error: "Connection is not ready for sync", status: connection.status }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let metrics: AdMetricRow[];
    if (connection.platform === "google_ads") {
      metrics = await syncGoogleAds(connection, supabase, period_days);
    } else if (connection.platform === "meta_ads") {
      // BUG-001: Check Meta token expiration (mirrors Google Ads logic)
      if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
        await supabase.from("ad_platform_connections")
          .update({ status: "expired" })
          .eq("id", connection.id);
        console.log(`[Meta] Token expired for connection ${connection.id}, marked expired`);
        return new Response(JSON.stringify({ error: "Meta token expired", status: "expired" }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      metrics = await syncMetaAds(connection, supabase, period_days);
    } else {
      return new Response(JSON.stringify({ error: "Unknown platform" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (metrics.length > 0) {
      const { error: upsertError } = await supabase
        .from("ad_campaign_metrics")
        .upsert(metrics, { onConflict: "connection_id,campaign_id,date" });

      if (upsertError) {
        console.error("Metrics upsert error:", upsertError);
      }
    }

    await supabase.from("ad_platform_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", connection_id);

    return new Response(JSON.stringify({ success: true, synced: metrics.length }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("ads-sync-metrics error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
