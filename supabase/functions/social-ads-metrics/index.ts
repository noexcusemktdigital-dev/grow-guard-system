// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from "../_shared/correlation.ts";

// ============================================================
// social-ads-metrics
// Phase 5 — Pull Google Ads campaign performance data via REST API.
// Stores metrics in social_engagement_metrics, using synthetic
// social_posts rows (one per campaign, keyed by platform_post_id = campaign_id).
// Called by pg_cron daily at 6:30 AM UTC — no JWT, verify_jwt = false.
// Auth: Authorization: Bearer {CRON_SECRET}
// ============================================================

// -------------------------------------------------------
// Types
// -------------------------------------------------------
interface GoogleAdsAccount {
  id: string;
  organization_id: string;
  access_token: string;       // current (may be stale — always refresh)
  refresh_token: string;      // stored per-account
  metadata: {
    customer_id?: string;     // Google Ads customer/account ID (digits only)
    [key: string]: unknown;
  };
}

interface CampaignRow {
  campaign: {
    id: string;
    name: string;
    status: string;
  };
  metrics: {
    impressions: string;
    clicks: string;
    cost_micros: string;
    ctr: string;
    average_cpc: string;
    conversions: string;
  };
  segments: {
    date: string; // YYYY-MM-DD
  };
}

interface ProcessResult {
  account_id: string;
  customer_id: string;
  campaigns_synced: number;
  error?: string;
}

// -------------------------------------------------------
// Step 1: Refresh OAuth2 access token
// POST https://oauth2.googleapis.com/token
// -------------------------------------------------------
async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const body = await res.json();

  if (!res.ok) {
    const msg = body?.error_description ?? body?.error ?? `HTTP ${res.status}`;
    throw new Error(`OAuth2 token refresh failed: ${msg}`);
  }

  if (!body.access_token) {
    throw new Error("OAuth2 token refresh: access_token missing from response");
  }

  return body.access_token as string;
}

// -------------------------------------------------------
// Step 2: Query Google Ads searchStream for YESTERDAY's campaign metrics
// Returns an array of CampaignRow
// -------------------------------------------------------
async function fetchCampaignMetrics(
  customerId: string,
  accessToken: string,
  developerToken: string,
): Promise<CampaignRow[]> {
  const url = `https://googleads.googleapis.com/v23/customers/${customerId}/googleAds:searchStream`;

  const query =
    "SELECT campaign.id, campaign.name, campaign.status, " +
    "metrics.impressions, metrics.clicks, metrics.cost_micros, " +
    "metrics.ctr, metrics.average_cpc, metrics.conversions, " +
    "segments.date " +
    "FROM campaign " +
    "WHERE segments.date DURING YESTERDAY " +
    "AND campaign.status = 'ENABLED'";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "login-customer-id": customerId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const rawText = await res.text();

  // Handle special error: developer token not approved
  if (res.status === 403) {
    let errBody: Record<string, unknown> = {};
    try { errBody = JSON.parse(rawText); } catch { /* ignore */ }
    const errDetails = JSON.stringify(errBody);
    if (
      errDetails.includes("DEVELOPER_TOKEN_NOT_APPROVED") ||
      errDetails.includes("developerTokenNotApproved")
    ) {
      throw new DeveloperTokenNotApprovedError();
    }
    throw new Error(`Google Ads API 403: ${rawText.slice(0, 500)}`);
  }

  if (!res.ok) {
    throw new Error(`Google Ads API error ${res.status}: ${rawText.slice(0, 500)}`);
  }

  // searchStream returns an array of objects, each potentially having a `results` array
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Google Ads API: invalid JSON response: ${rawText.slice(0, 200)}`);
  }

  const chunks: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
  const rows: CampaignRow[] = [];

  for (const chunk of chunks) {
    const chunkObj = chunk as Record<string, unknown>;
    const results = Array.isArray(chunkObj?.results) ? chunkObj.results : [];
    for (const r of results) {
      rows.push(r as CampaignRow);
    }
  }

  return rows;
}

// Sentinel error class for graceful handling of unapproved developer token
class DeveloperTokenNotApprovedError extends Error {
  constructor() {
    super("DEVELOPER_TOKEN_NOT_APPROVED");
    this.name = "DeveloperTokenNotApprovedError";
  }
}

// -------------------------------------------------------
// Step 3: Find or create a social_posts row for a campaign
// Uses: SELECT ... WHERE social_account_id = $1 AND platform_post_id = $2
// If not found: INSERT a synthetic 'published' row
// -------------------------------------------------------
async function findOrCreateCampaignPost(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  accountId: string,
  campaignId: string,
  campaignName: string,
): Promise<string> {
  // Try to find existing post row for this campaign
  const { data: existing, error: selectError } = await supabase
    .from("social_posts")
    .select("id")
    .eq("social_account_id", accountId)
    .eq("platform_post_id", campaignId)
    .maybeSingle();

  if (selectError) {
    throw new Error(`social_posts lookup failed: ${selectError.message}`);
  }

  if (existing?.id) {
    // Update campaign name (caption) in case it changed
    await supabase
      .from("social_posts")
      .update({ caption: campaignName, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    return existing.id as string;
  }

  // Insert synthetic post row for this Google Ads campaign
  const { data: inserted, error: insertError } = await supabase
    .from("social_posts")
    .insert({
      organization_id: organizationId,
      social_account_id: accountId,
      platform: "google_ads",
      platform_post_id: campaignId,
      caption: campaignName,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`social_posts insert failed: ${insertError.message}`);
  }

  return inserted.id as string;
}

// -------------------------------------------------------
// Step 4: Upsert daily metrics into social_engagement_metrics
// UNIQUE(social_post_id, date)
// -------------------------------------------------------
async function upsertCampaignMetrics(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  socialPostId: string,
  row: CampaignRow,
  date: string,
): Promise<void> {
  const costMicros = parseInt(row.metrics.cost_micros ?? "0", 10) || 0;
  const clicks = parseInt(row.metrics.clicks ?? "0", 10) || 0;
  const impressions = parseInt(row.metrics.impressions ?? "0", 10) || 0;
  const averageCpcMicros = parseInt(row.metrics.average_cpc ?? "0", 10) || 0;

  // cost_micros → spend_cents (BRL centavos): micros / 10_000
  const spendCents = Math.round(costMicros / 10_000);

  // average_cpc: micros / 1_000_000 * 100 = micros / 10_000 centavos
  const cpcCents = Math.round(averageCpcMicros / 10_000);

  // engagement_rate: CTR stored as a ratio (e.g. 0.02 = 2%)
  // For ads we use CTR as the engagement signal — round to 2 decimal places
  const ctr = parseFloat(row.metrics.ctr ?? "0") || 0;
  const engagementRate = Math.round(ctr * 10000) / 100; // convert ratio to percentage

  const { error } = await supabase
    .from("social_engagement_metrics")
    .upsert(
      {
        organization_id: organizationId,
        social_post_id: socialPostId,
        platform: "google_ads",
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        reach: impressions,       // For ads, reach = impressions (no unique reach in basic API)
        impressions,
        engagement_rate: engagementRate,
        spend_cents: spendCents,
        clicks,
        cpc_cents: cpcCents,
        date,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "social_post_id,date" },
    );

  if (error) {
    throw new Error(`social_engagement_metrics upsert failed: ${error.message}`);
  }
}

// -------------------------------------------------------
// Main handler
// -------------------------------------------------------
serve(async (req) => {
  const ctx = newRequestContext(req, 'social-ads-metrics');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  const corsHeaders = getCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  // --- Fail-closed: validate CRON_SECRET ---
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    console.error("social-ads-metrics: CRON_SECRET env var not set — fail-closed");
    return new Response(
      JSON.stringify({ error: "Server misconfigured" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token !== cronSecret) {
    console.warn("social-ads-metrics: unauthorized request — invalid or missing Bearer token");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: jsonHeaders },
    );
  }

  // --- Required env vars ---
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
  const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("social-ads-metrics: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(
      JSON.stringify({ error: "Server misconfigured" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  if (!clientId || !clientSecret || !developerToken) {
    console.error(
      "social-ads-metrics: missing GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, or GOOGLE_ADS_DEVELOPER_TOKEN",
    );
    return new Response(
      JSON.stringify({ error: "Google Ads credentials not configured" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const results: ProcessResult[] = [];

  try {
    // --- 1. Fetch all active Google Ads accounts ---
    const { data: accounts, error: accountsError } = await supabase
      .from("social_accounts")
      .select("id, organization_id, access_token, refresh_token, metadata")
      .eq("platform", "google_ads")
      .eq("status", "active");

    if (accountsError) {
      console.error("social-ads-metrics: failed to fetch google_ads accounts:", accountsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch accounts", detail: accountsError.message }),
        { status: 500, headers: jsonHeaders },
      );
    }

    if (!accounts || accounts.length === 0) {
      console.log("social-ads-metrics: no active google_ads accounts found");
      return new Response(
        JSON.stringify({ processed: 0, results: [] }),
        { status: 200, headers: jsonHeaders },
      );
    }

    console.log(`social-ads-metrics: processing ${accounts.length} google_ads account(s)`);

    // --- 2. Process each account ---
    for (const account of accounts as GoogleAdsAccount[]) {
      const customerId = account.metadata?.customer_id;

      if (!customerId) {
        console.warn(
          `social-ads-metrics: account ${account.id} missing metadata.customer_id — skipping`,
        );
        results.push({
          account_id: account.id,
          customer_id: "(missing)",
          campaigns_synced: 0,
          error: "metadata.customer_id not set",
        });
        continue;
      }

      if (!account.refresh_token) {
        console.warn(
          `social-ads-metrics: account ${account.id} (customer ${customerId}) missing refresh_token — skipping`,
        );
        results.push({
          account_id: account.id,
          customer_id: customerId,
          campaigns_synced: 0,
          error: "refresh_token not set",
        });
        continue;
      }

      let accessToken: string;

      // --- 3. Always refresh the access token ---
      try {
        accessToken = await refreshAccessToken(clientId, clientSecret, account.refresh_token);
        console.log(
          `social-ads-metrics: refreshed access token for account ${account.id} (customer ${customerId})`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `social-ads-metrics: token refresh failed for account ${account.id}: ${msg}`,
        );
        results.push({
          account_id: account.id,
          customer_id: customerId,
          campaigns_synced: 0,
          error: `Token refresh failed: ${msg}`,
        });

        // Mark account as expired so the UI can prompt re-auth
        await supabase
          .from("social_accounts")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", account.id);

        continue;
      }

      // --- 4. Fetch campaign metrics from Google Ads API ---
      let rows: CampaignRow[];

      try {
        rows = await fetchCampaignMetrics(customerId, accessToken, developerToken);
        console.log(
          `social-ads-metrics: account ${account.id} (customer ${customerId}) — ${rows.length} campaign row(s) returned`,
        );
      } catch (err) {
        if (err instanceof DeveloperTokenNotApprovedError) {
          console.warn(
            "social-ads-metrics: developer token not approved — returning pending status",
          );
          return new Response(
            JSON.stringify({
              status: "pending_approval",
              message:
                "Google Ads developer token not yet approved. " +
                "Visit https://ads.google.com/nav/selectaccount?authuser=0 to check approval status.",
            }),
            { status: 200, headers: jsonHeaders },
          );
        }

        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `social-ads-metrics: campaign fetch failed for account ${account.id}: ${msg}`,
        );
        results.push({
          account_id: account.id,
          customer_id: customerId,
          campaigns_synced: 0,
          error: `Campaign fetch failed: ${msg}`,
        });
        continue;
      }

      if (rows.length === 0) {
        console.log(
          `social-ads-metrics: no ENABLED campaign data for yesterday (account ${account.id})`,
        );
        results.push({
          account_id: account.id,
          customer_id: customerId,
          campaigns_synced: 0,
        });
        continue;
      }

      // --- 5. For each campaign row: find/create social_posts row, upsert metrics ---
      let campaignsSynced = 0;

      for (const row of rows) {
        const campaignId = row.campaign?.id;
        const campaignName = row.campaign?.name ?? `Campaign ${campaignId}`;
        const date = row.segments?.date; // YYYY-MM-DD (YESTERDAY)

        if (!campaignId || !date) {
          console.warn(
            `social-ads-metrics: row missing campaign.id or segments.date — skipping`,
            JSON.stringify(row).slice(0, 200),
          );
          continue;
        }

        try {
          const socialPostId = await findOrCreateCampaignPost(
            supabase,
            account.organization_id,
            account.id,
            campaignId,
            campaignName,
          );

          await upsertCampaignMetrics(
            supabase,
            account.organization_id,
            socialPostId,
            row,
            date,
          );

          campaignsSynced++;
          console.log(
            `social-ads-metrics: synced campaign "${campaignName}" (${campaignId}) ` +
              `impressions=${row.metrics.impressions} clicks=${row.metrics.clicks} ` +
              `cost_micros=${row.metrics.cost_micros}`,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(
            `social-ads-metrics: error syncing campaign ${campaignId} (account ${account.id}): ${msg}`,
          );
          // Continue with remaining campaigns — don't abort the batch
        }
      }

      results.push({
        account_id: account.id,
        customer_id: customerId,
        campaigns_synced: campaignsSynced,
      });

      // Update last_synced_at on the account
      await supabase
        .from("social_accounts")
        .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", account.id);
    }

    const totalSynced = results.reduce((sum, r) => sum + r.campaigns_synced, 0);
    console.log(
      `social-ads-metrics done: accounts=${results.length} total_campaigns_synced=${totalSynced}`,
    );

    return new Response(
      JSON.stringify({ processed: results.length, total_campaigns_synced: totalSynced, results }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    console.error("social-ads-metrics unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", detail: String(err) }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
