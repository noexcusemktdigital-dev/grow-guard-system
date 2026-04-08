import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

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

async function syncGoogleAds(connection: Record<string, any>, supabase: any) {
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

  const query = `
    SELECT campaign.id, campaign.name, campaign.status,
           segments.date,
           metrics.impressions, metrics.clicks, metrics.cost_micros,
           metrics.conversions, metrics.ctr, metrics.average_cpc
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY segments.date DESC
  `;

  console.log(`[Google] Syncing customer ${customerId}...`);

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

async function syncMetaAds(connection: Record<string, any>, supabase: any) {
  const accessToken = connection.access_token;
  let accountId = connection.account_id;
  if (!accountId) throw new Error("No Meta ad account ID");

  // Ensure account_id does NOT already have act_ prefix — the API call adds it
  accountId = accountId.replace(/^act_/, "");

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
  const since = thirtyDaysAgo.toISOString().split("T")[0];
  const until = today.toISOString().split("T")[0];

  const insightsUrl = `https://graph.facebook.com/v19.0/act_${accountId}/insights?fields=campaign_id,campaign_name,impressions,clicks,spend,actions,ctr,cpc&time_range={"since":"${since}","until":"${until}"}&time_increment=1&level=campaign&limit=500&access_token=${accessToken}`;

  console.log(`[Meta] Syncing account act_${accountId}, period ${since} to ${until}`);

  const res = await fetchWithBackoff(insightsUrl);
  checkMetaRateLimit(res.headers, accountId);
  const bodyText = await res.text();
  console.log(`[Meta] API response status: ${res.status}, body length: ${bodyText.length}, preview: ${bodyText.substring(0, 500)}`);

  if (!res.ok) {
    if (res.status === 190 || res.status === 401) {
      await supabase.from("ad_platform_connections").update({ status: "expired" }).eq("id", connection.id);
    }
    throw new Error(`Meta Ads API error: ${res.status} — ${bodyText.substring(0, 300)}`);
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
      campaign_status: "ACTIVE",
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
        campaign_status: "ACTIVE",
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { connection_id } = await req.json();
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

    if (connection.status !== "active") {
      return new Response(JSON.stringify({ error: "Connection is not active", status: connection.status }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let metrics: AdMetricRow[];
    if (connection.platform === "google_ads") {
      metrics = await syncGoogleAds(connection, supabase);
    } else if (connection.platform === "meta_ads") {
      metrics = await syncMetaAds(connection, supabase);
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
