// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from "../_shared/correlation.ts";

// Helper: HMAC-SHA256 sign + base64url encode
async function signState(payload: object, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const data = enc.encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  // Encode as: base64url(payload).signature
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `${payloadB64}.${b64}`;
}

serve(async (req) => {
  const ctx = newRequestContext(req, 'social-oauth-meta');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    const redirectTo = url.searchParams.get("redirect_to");

    if (!orgId) {
      return new Response(JSON.stringify({ error: "Missing required parameter: org_id" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // App Meta unificado: usa META_APP_ID como fonte única (META_CLIENT_ID mantido como fallback retrocompat)
    const rawClientId = Deno.env.get("META_APP_ID") || Deno.env.get("META_CLIENT_ID");
    const clientId = rawClientId?.trim();
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://grow-guard-system.lovable.app";
    const stateSecret = Deno.env.get("OAUTH_STATE_SECRET");

    if (!clientId) {
      console.error("social-oauth-meta: META_CLIENT_ID/META_APP_ID not set");
      return new Response(JSON.stringify({ error: "OAuth not configured" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    if (!/^\d{10,20}$/.test(clientId)) {
      console.error("social-oauth-meta: META_CLIENT_ID is not a valid numeric Meta App ID. Got length:", clientId.length);
      return new Response(JSON.stringify({
        error: "Invalid Meta App ID",
        hint: "META_CLIENT_ID deve ser o App ID numérico do Meta (ex: 1234567890123456), não o App Secret nem outro valor.",
      }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    if (!stateSecret) {
      console.error("social-oauth-meta: OAUTH_STATE_SECRET not set");
      return new Response(JSON.stringify({ error: "OAuth not configured" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Build signed state
    const statePayload = {
      org_id: orgId,
      platform: "meta",
      redirect_to: redirectTo ?? null,
      ts: Date.now(),
      nonce: crypto.randomUUID(),
    };
    const state = await signState(statePayload, stateSecret);

    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/social-oauth-callback`;
    const baseScopes = [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
    ];
    // Lead Ads scopes só são solicitados quando o usuário inicia o fluxo a partir de CRM > Integrações > Meta Lead Ads.
    const leadAdsScopes = ["leads_retrieval", "pages_manage_ads", "pages_manage_metadata"];
    const scopes = (redirectTo === "crm-leads"
      ? [...baseScopes, ...leadAdsScopes]
      : baseScopes
    ).join(",");

    const authUrl = new URL("https://www.facebook.com/v25.0/dialog/oauth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("auth_type", "rerequest");
    authUrl.searchParams.set("display", "popup");

    return new Response(null, {
      status: 302,
      headers: { Location: authUrl.toString() },
    });
  } catch (err) {
    console.error("social-oauth-meta error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
