// @ts-nocheck
/**
 * ads-oauth-callback
 * Callback OAuth unificado para Meta Ads e Google Ads.
 *
 * Suporta dois formatos de state:
 *   1. Novo (ads-oauth-start): btoa("org_id:random") — salva em ads_connections
 *   2. Legado (social-oauth-meta): btoa(JSON{platform, organization_id, origin}) — salva em ad_platform_connections
 *
 * verify_jwt=false — chamado externamente pelo provedor OAuth
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from "../_shared/correlation.ts";

const ALLOWED_ORIGINS = [
  "https://grow-guard-system.lovable.app",
  "https://app.noexcuse.com.br",
  "https://sistema.noexcusedigital.com.br",
  "http://localhost:5173",
  "http://localhost:3000",
];

const DEFAULT_REDIRECT = "https://sistema.noexcusedigital.com.br";
const ANUNCIOS_PATH = "/franqueado/anuncios";
const LEGACY_PATH = "/cliente/trafego-pago";

// ─── helpers ─────────────────────────────────────────────────────────────────

function safeBase64(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(s));
  } catch {
    return null;
  }
}

/** Detect if state is new format: base64("uuid:hex") */
function isNewStateFormat(stateRaw: string): boolean {
  try {
    const decoded = atob(stateRaw);
    const parts = decoded.split(":");
    // new format: "org_id_uuid:hexrandom" — two parts, first is UUID-like
    return parts.length === 2 && /^[0-9a-f-]{36}$/.test(parts[0]);
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  const ctx = newRequestContext(req, 'ads-oauth-callback');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Use GET callback" }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateRaw = url.searchParams.get("state") ?? "";
    const oauthError = url.searchParams.get("error");

    // ── Error from provider ────────────────────────────────────────────────────
    if (oauthError) {
      const base = (() => {
        const parsed = safeBase64(stateRaw);
        const origin = typeof parsed?.origin === "string" ? parsed.origin : null;
        return ALLOWED_ORIGINS.includes(origin ?? "") ? origin! : DEFAULT_REDIRECT;
      })();
      const newFormat = isNewStateFormat(stateRaw);
      const path = newFormat ? ANUNCIOS_PATH : LEGACY_PATH;
      return new Response(null, {
        status: 302,
        headers: { Location: `${base}${path}?ads_error=${encodeURIComponent(oauthError)}` },
      });
    }

    if (!code || !stateRaw) {
      return new Response("Missing code or state", { status: 400 });
    }

    // ── Route by state format ──────────────────────────────────────────────────
    if (isNewStateFormat(stateRaw)) {
      return await handleNewFlow(req, supabase, supabaseUrl, serviceKey, code, stateRaw);
    } else {
      return await handleLegacyFlow(req, supabase, supabaseUrl, serviceKey, code, stateRaw);
    }
  } catch (err: unknown) {
    console.error("ads-oauth-callback unhandled error:", err);
    return new Response(null, {
      status: 302,
      headers: { Location: `${DEFAULT_REDIRECT}${ANUNCIOS_PATH}?ads_error=unknown` },
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEW FLOW — saves to ads_connections, validates state via ads_oauth_states
// ═══════════════════════════════════════════════════════════════════════════════
async function handleNewFlow(
  _req: Request,
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  _serviceKey: string,
  code: string,
  stateRaw: string
): Promise<Response> {
  const appId = Deno.env.get("META_APP_ID")!;
  const appSecret = Deno.env.get("META_APP_SECRET")!;
  const redirectUri = `${supabaseUrl}/functions/v1/ads-oauth-callback`;
  const successBase = "https://sistema.noexcusedigital.com.br";

  const errRedirect = (reason: string) =>
    new Response(null, {
      status: 302,
      headers: { Location: `${successBase}${ANUNCIOS_PATH}?ads_error=${encodeURIComponent(reason)}` },
    });

  // 1. Validate state against ads_oauth_states
  const { data: stateRow, error: stateErr } = await supabase
    .from("ads_oauth_states")
    .select("org_id, user_id, expires_at")
    .eq("state", stateRaw)
    .single();

  if (stateErr || !stateRow) {
    console.error("Invalid or missing OAuth state:", stateErr);
    return errRedirect("invalid_state");
  }

  if (new Date(stateRow.expires_at) < new Date()) {
    console.error("OAuth state expired");
    await supabase.from("ads_oauth_states").delete().eq("state", stateRaw);
    return errRedirect("state_expired");
  }

  const { org_id: orgId, user_id: userId } = stateRow;

  // Delete state immediately (one-time use)
  await supabase.from("ads_oauth_states").delete().eq("state", stateRaw);

  // 2. Exchange code for short-lived access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    `client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&client_secret=${appSecret}` +
    `&code=${code}`
  );
  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    console.error("Meta token exchange failed:", tokenData);
    return errRedirect("token_exchange_failed");
  }

  // 3. Exchange short-lived for long-lived token (~60 days)
  const longRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    `grant_type=fb_exchange_token` +
    `&client_id=${appId}` +
    `&client_secret=${appSecret}` +
    `&fb_exchange_token=${tokenData.access_token}`
  );
  const longData = await longRes.json();

  const accessToken: string = longData.access_token || tokenData.access_token;
  const tokenExpiresAt: string = longData.expires_in
    ? new Date(Date.now() + longData.expires_in * 1000).toISOString()
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // fallback: 60 days

  // 4. Fetch available ad accounts (personal + Business Manager)
  interface AdAccountEntry {
    account_id: string;
    name: string;
    business_id?: string;
  }

  const adAccounts: AdAccountEntry[] = [];
  const seenIds = new Set<string>();

  // Personal ad accounts via /me/adaccounts
  try {
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?` +
      `fields=id,name,account_id,account_status,currency,business` +
      `&access_token=${accessToken}&limit=100`
    );
    const meData = await meRes.json();
    console.log(`[Meta] Personal ad accounts: ${meData.data?.length ?? 0}`);
    if (Array.isArray(meData.data)) {
      for (const acc of meData.data) {
        const normalizedId = acc.account_id || acc.id?.replace("act_", "");
        if (normalizedId && !seenIds.has(normalizedId)) {
          seenIds.add(normalizedId);
          adAccounts.push({
            account_id: `act_${normalizedId}`,
            name: acc.name || `Meta Ads ${normalizedId}`,
            business_id: acc.business?.id,
          });
        }
      }
    }
  } catch (e) {
    console.warn("Could not fetch personal ad accounts:", e);
  }

  // Business Manager ad accounts
  try {
    const bizRes = await fetch(
      `https://graph.facebook.com/v21.0/me/businesses?fields=id,name&access_token=${accessToken}&limit=50`
    );
    const bizData = await bizRes.json();
    console.log(`[Meta] Business managers: ${bizData.data?.length ?? 0}`);
    if (Array.isArray(bizData.data)) {
      for (const biz of bizData.data) {
        try {
          const bmAccRes = await fetch(
            `https://graph.facebook.com/v21.0/${biz.id}/owned_ad_accounts?` +
            `fields=id,name,account_id,account_status&access_token=${accessToken}&limit=100`
          );
          const bmAccData = await bmAccRes.json();
          if (Array.isArray(bmAccData.data)) {
            for (const acc of bmAccData.data) {
              const normalizedId = acc.account_id || acc.id?.replace("act_", "");
              if (normalizedId && !seenIds.has(normalizedId)) {
                seenIds.add(normalizedId);
                adAccounts.push({
                  account_id: `act_${normalizedId}`,
                  name: `${acc.name || normalizedId} (${biz.name})`,
                  business_id: biz.id,
                });
              }
            }
          }
        } catch (bmErr) {
          console.warn(`Could not fetch BM ${biz.id} accounts:`, bmErr);
        }
      }
    }
  } catch (e) {
    console.warn("Could not fetch businesses:", e);
  }

  console.log(`Total ad accounts found: ${adAccounts.length}`);

  if (adAccounts.length === 0) {
    return errRedirect("no_ad_account");
  }

  // 5. Single account → save directly; multiple → redirect to selection page
  if (adAccounts.length === 1) {
    const acc = adAccounts[0];
    const { error: dbError } = await supabase
      .from("ads_connections")
      .upsert(
        {
          org_id: orgId,
          provider: "meta",
          ad_account_id: acc.account_id,
          ad_account_name: acc.name,
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          business_id: acc.business_id ?? null,
          status: "active",
          connected_by: userId,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "org_id,provider,ad_account_id" }
      );

    if (dbError) {
      console.error("DB upsert error:", dbError);
      return errRedirect("save_failed");
    }

    return new Response(null, {
      status: 302,
      headers: { Location: `${successBase}${ANUNCIOS_PATH}?connected=true` },
    });
  }

  // Multiple accounts — save token temporarily and redirect to account picker
  // Store a pending connection entry with no specific account
  const pendingAccountId = "__pending__";
  const { error: pendingError } = await supabase
    .from("ads_connections")
    .upsert(
      {
        org_id: orgId,
        provider: "meta",
        ad_account_id: pendingAccountId,
        ad_account_name: "Aguardando seleção...",
        access_token: accessToken,
        token_expires_at: tokenExpiresAt,
        status: "pending_selection",
        connected_by: userId,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "org_id,provider,ad_account_id" }
    );

  if (pendingError) {
    console.error("DB pending upsert error:", pendingError);
    return errRedirect("save_failed");
  }

  // Encode accounts list as query param for the frontend picker
  const accountsParam = encodeURIComponent(JSON.stringify(adAccounts));
  const pickerUrl =
    `${successBase}${ANUNCIOS_PATH}` +
    `?ads_pick_account=${encodeURIComponent(orgId)}` +
    `&ads_accounts=${accountsParam}` +
    `&provider=meta`;

  return new Response(null, {
    status: 302,
    headers: { Location: pickerUrl },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY FLOW — saves to ad_platform_connections (backward compat)
// ═══════════════════════════════════════════════════════════════════════════════
async function handleLegacyFlow(
  _req: Request,
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  _serviceKey: string,
  code: string,
  stateRaw: string
): Promise<Response> {
  let state: { platform: string; organization_id: string; origin: string };
  try {
    state = JSON.parse(atob(stateRaw));
  } catch {
    return new Response("Invalid state", { status: 400 });
  }

  const { platform, organization_id, origin } = state;
  const redirectUri = `${supabaseUrl}/functions/v1/ads-oauth-callback`;

  const appRedirectBase = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : DEFAULT_REDIRECT;

  let accessToken: string;
  let refreshToken: string | null = null;
  let expiresAt: string | null = null;
  let accountId: string | null = null;
  let accountName: string | null = null;

  if (platform === "google_ads") {
    const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_error=credentials_not_configured` },
      });
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", tokenData);
      return new Response(null, {
        status: 302,
        headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_error=token_exchange_failed` },
      });
    }

    accessToken = tokenData.access_token;
    refreshToken = tokenData.refresh_token || null;
    if (tokenData.expires_in) {
      expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    }

    const devToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
    if (devToken) {
      try {
        const customersRes = await fetch(
          "https://googleads.googleapis.com/v16/customers:listAccessibleCustomers",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "developer-token": devToken,
            },
          }
        );
        const contentType = customersRes.headers.get("content-type") || "";
        const bodyText = await customersRes.text();
        if (customersRes.ok && contentType.includes("application/json")) {
          const customersData = JSON.parse(bodyText);
          if (customersData.resourceNames?.length > 0) {
            accountId = customersData.resourceNames[0].replace("customers/", "");
            accountName = `Google Ads ${accountId}`;
          }
        } else {
          console.error("Google Ads listAccessibleCustomers failed:", customersRes.status, bodyText.substring(0, 500));
        }
      } catch (e) {
        console.warn("Could not fetch Google Ads customers:", e);
      }
    }

    if (!accountId) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_error=no_ad_account` },
      });
    }

    const { error: dbError } = await supabase
      .from("ad_platform_connections")
      .upsert(
        {
          organization_id,
          platform,
          account_id: accountId,
          account_name: accountName,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: expiresAt,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,platform" }
      );

    if (dbError) {
      console.error("DB upsert error:", dbError);
      return new Response(null, {
        status: 302,
        headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_error=save_failed` },
      });
    }

    return new Response(null, {
      status: 302,
      headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_connected=${platform}` },
    });
  } else if (platform === "meta_ads") {
    const appId = Deno.env.get("META_APP_ID");
    const appSecret = Deno.env.get("META_APP_SECRET");
    if (!appId || !appSecret) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_error=credentials_not_configured` },
      });
    }

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}` +
      `&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Meta token exchange failed:", tokenData);
      return new Response(null, {
        status: 302,
        headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_error=token_exchange_failed` },
      });
    }

    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&fb_exchange_token=${tokenData.access_token}`
    );
    const longData = await longRes.json();
    accessToken = longData.access_token || tokenData.access_token;
    if (longData.expires_in) {
      expiresAt = new Date(Date.now() + longData.expires_in * 1000).toISOString();
    }

    const adAccounts: { account_id: string; name: string }[] = [];
    const seenIds = new Set<string>();

    try {
      const meRes = await fetch(
        `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id,account_status&access_token=${accessToken}&limit=100`
      );
      const meData = await meRes.json();
      if (Array.isArray(meData.data)) {
        for (const acc of meData.data) {
          if (!seenIds.has(acc.account_id)) {
            seenIds.add(acc.account_id);
            adAccounts.push({ account_id: acc.account_id, name: acc.name || `Meta Ads ${acc.account_id}` });
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch personal ad accounts:", e);
    }

    try {
      const bizRes = await fetch(
        `https://graph.facebook.com/v19.0/me/businesses?fields=id,name&access_token=${accessToken}&limit=50`
      );
      const bizData = await bizRes.json();
      if (Array.isArray(bizData.data)) {
        for (const biz of bizData.data) {
          try {
            const bmAccRes = await fetch(
              `https://graph.facebook.com/v19.0/${biz.id}/owned_ad_accounts?fields=name,account_id,account_status&access_token=${accessToken}&limit=100`
            );
            const bmAccData = await bmAccRes.json();
            if (Array.isArray(bmAccData.data)) {
              for (const acc of bmAccData.data) {
                if (!seenIds.has(acc.account_id)) {
                  seenIds.add(acc.account_id);
                  adAccounts.push({ account_id: acc.account_id, name: `${acc.name || acc.account_id} (${biz.name})` });
                }
              }
            }
          } catch (bmErr) {
            console.warn(`Could not fetch BM ${biz.id} accounts:`, bmErr);
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch businesses:", e);
    }

    if (adAccounts.length === 0) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_error=no_ad_account` },
      });
    }

    if (adAccounts.length === 1) {
      const { error: dbError } = await supabase
        .from("ad_platform_connections")
        .upsert(
          {
            organization_id,
            platform: "meta_ads",
            account_id: adAccounts[0].account_id,
            account_name: adAccounts[0].name,
            access_token: accessToken,
            refresh_token: null,
            token_expires_at: expiresAt,
            status: "active",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,platform" }
        );

      if (dbError) {
        console.error("DB upsert error:", dbError);
        return new Response(null, {
          status: 302,
          headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_error=save_failed` },
        });
      }

      return new Response(null, {
        status: 302,
        headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_connected=meta_ads` },
      });
    }

    // Multiple accounts — pending picker flow
    const { data: pendingConn, error: pendingError } = await supabase
      .from("ad_platform_connections")
      .upsert(
        {
          organization_id,
          platform: "meta_ads",
          account_id: "__pending__",
          account_name: "Selecionando conta...",
          access_token: accessToken,
          refresh_token: null,
          token_expires_at: expiresAt,
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,platform" }
      )
      .select("id")
      .single();

    if (pendingError) {
      console.error("DB pending upsert error:", pendingError);
      return new Response(null, {
        status: 302,
        headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_error=save_failed` },
      });
    }

    const accountsParam = encodeURIComponent(JSON.stringify(adAccounts));
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${appRedirectBase}${LEGACY_PATH}?ads_pick_account=${pendingConn.id}&ads_accounts=${accountsParam}`,
      },
    });
  } else {
    return new Response(null, {
      status: 302,
      headers: { Location: `${appRedirectBase}${LEGACY_PATH}?ads_error=invalid_platform` },
    });
  }
}
