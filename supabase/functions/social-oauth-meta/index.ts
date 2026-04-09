// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
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

    if (!orgId) {
      return new Response(JSON.stringify({ error: "Missing required parameter: org_id" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Fail-closed: require all secrets
    const clientId = Deno.env.get("META_CLIENT_ID");
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://grow-guard-system.lovable.app";
    const stateSecret = Deno.env.get("OAUTH_STATE_SECRET");

    if (!clientId) {
      console.error("social-oauth-meta: META_CLIENT_ID not set");
      return new Response(JSON.stringify({ error: "OAuth not configured" }), {
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
      ts: Date.now(),
      nonce: crypto.randomUUID(),
    };
    const state = await signState(statePayload, stateSecret);

    const redirectUri = `${siteUrl}/functions/v1/social-oauth-callback`;
    const scopes = [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "ads_read",
    ].join(",");

    const authUrl = new URL("https://www.facebook.com/v25.0/dialog/oauth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");

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
