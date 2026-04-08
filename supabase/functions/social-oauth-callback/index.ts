import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// ============================================================
// HMAC-SHA256 state verification
// ============================================================

/** Re-signs the payload portion and compares with the provided signature. */
async function verifyState(
  stateToken: string,
  secret: string,
): Promise<{ valid: boolean; payload: Record<string, unknown> | null }> {
  try {
    const dotIdx = stateToken.lastIndexOf(".");
    if (dotIdx === -1) return { valid: false, payload: null };

    const payloadB64 = stateToken.slice(0, dotIdx);
    const sigB64 = stateToken.slice(dotIdx + 1);

    // Decode payload
    // base64url → base64 → JSON
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;

    // Re-sign payload JSON (must match exactly what was signed in oauth-init)
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    // The data that was signed is JSON.stringify(payload)
    const data = enc.encode(JSON.stringify(payload));

    // Decode provided signature
    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, data);
    return { valid, payload: valid ? payload : null };
  } catch (err) {
    console.error("verifyState error:", err);
    return { valid: false, payload: null };
  }
}

// ============================================================
// Platform detection helpers
// ============================================================

function detectPlatformFromPayload(payload: Record<string, unknown>): "meta" | "linkedin" | null {
  const p = payload.platform as string | undefined;
  if (p === "meta") return "meta";
  if (p === "linkedin") return "linkedin";
  return null;
}

// ============================================================
// Main handler
// ============================================================

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

  // Resolve secrets early — fail-closed
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stateSecret = Deno.env.get("OAUTH_STATE_SECRET");
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://grow-guard-system.lovable.app";
  const errorBase = `${siteUrl}/cliente/contas-sociais`;

  if (!supabaseUrl || !serviceRoleKey || !stateSecret) {
    console.error("social-oauth-callback: missing required env vars");
    return new Response(null, {
      status: 302,
      headers: { Location: `${errorBase}?error=server_misconfigured` },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateRaw = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");
    const oauthErrorDesc = url.searchParams.get("error_description");

    // ---- Handle OAuth error from provider ----
    if (oauthError) {
      console.error("OAuth provider error:", oauthError, oauthErrorDesc);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${errorBase}?error=${encodeURIComponent(oauthError)}`,
        },
      });
    }

    if (!code || !stateRaw) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${errorBase}?error=missing_code_or_state` },
      });
    }

    // ---- Verify HMAC state ----
    const { valid, payload } = await verifyState(stateRaw, stateSecret);
    if (!valid || !payload) {
      console.error("social-oauth-callback: invalid state signature");
      return new Response(null, {
        status: 302,
        headers: { Location: `${errorBase}?error=invalid_state` },
      });
    }

    // ---- Anti-replay: timestamp must be < 10 minutes old ----
    const ts = payload.ts as number;
    if (!ts || Date.now() - ts > 10 * 60 * 1000) {
      console.error("social-oauth-callback: state expired");
      return new Response(null, {
        status: 302,
        headers: { Location: `${errorBase}?error=state_expired` },
      });
    }

    const orgId = payload.org_id as string;
    if (!orgId) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${errorBase}?error=missing_org_id` },
      });
    }

    // ---- Detect platform ----
    const platform = detectPlatformFromPayload(payload);
    if (!platform) {
      console.error("social-oauth-callback: unknown platform in state:", payload.platform);
      return new Response(null, {
        status: 302,
        headers: { Location: `${errorBase}?error=unknown_platform` },
      });
    }

    const redirectUri = `${siteUrl}/functions/v1/social-oauth-callback`;

    // ================================================================
    // META (Facebook / Instagram)
    // ================================================================
    if (platform === "meta") {
      const clientId = Deno.env.get("META_CLIENT_ID");
      const clientSecret = Deno.env.get("META_CLIENT_SECRET");

      if (!clientId || !clientSecret) {
        console.error("social-oauth-callback: META_CLIENT_ID or META_CLIENT_SECRET not set");
        return new Response(null, {
          status: 302,
          headers: { Location: `${errorBase}?error=provider_not_configured` },
        });
      }

      // Step 1: Exchange code for short-lived token
      const tokenRes = await fetch(
        `https://graph.facebook.com/v25.0/oauth/access_token?` +
          new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
          }),
      );
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error("Meta short token exchange failed:", tokenData);
        return new Response(null, {
          status: 302,
          headers: { Location: `${errorBase}?error=token_exchange_failed` },
        });
      }

      const shortToken: string = tokenData.access_token;

      // Step 2: Exchange for long-lived token (60-day)
      const longRes = await fetch(
        `https://graph.facebook.com/v25.0/oauth/access_token?` +
          new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: clientId,
            client_secret: clientSecret,
            fb_exchange_token: shortToken,
          }),
      );
      const longData = await longRes.json();
      const accessToken: string = longData.access_token ?? shortToken;
      const expiresAt: string | null = longData.expires_in
        ? new Date(Date.now() + longData.expires_in * 1000).toISOString()
        : null;

      // Step 3: Get user info
      let accountId = "";
      let accountName = "Meta Account";
      let accountUsername: string | null = null;

      try {
        const meRes = await fetch(
          `https://graph.facebook.com/v25.0/me?fields=id,name,username&access_token=${encodeURIComponent(accessToken)}`,
        );
        const meData = await meRes.json();
        if (meData.id) accountId = meData.id;
        if (meData.name) accountName = meData.name;
        if (meData.username) accountUsername = meData.username;
      } catch (e) {
        console.warn("Meta /me fetch failed:", e);
      }

      if (!accountId) {
        console.error("social-oauth-callback: could not get Meta account ID");
        return new Response(null, {
          status: 302,
          headers: { Location: `${errorBase}?error=account_info_failed` },
        });
      }

      // Step 4: Upsert into social_accounts
      const { error: dbError } = await supabase.from("social_accounts").upsert(
        {
          organization_id: orgId,
          platform: "facebook",
          account_id: accountId,
          account_name: accountName,
          account_username: accountUsername,
          access_token: accessToken,
          refresh_token: null,
          token_expires_at: expiresAt,
          scopes: [
            "instagram_basic",
            "instagram_content_publish",
            "instagram_manage_insights",
            "pages_show_list",
            "pages_read_engagement",
            "pages_manage_posts",
            "ads_read",
          ],
          status: "active",
          metadata: { source: "oauth", long_lived: true },
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,platform,account_id" },
      );

      if (dbError) {
        console.error("social_accounts upsert error (meta):", dbError);
        return new Response(null, {
          status: 302,
          headers: { Location: `${errorBase}?error=save_failed` },
        });
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: `${siteUrl}/cliente/contas-sociais?connected=true&platform=facebook`,
        },
      });
    }

    // ================================================================
    // LINKEDIN
    // ================================================================
    if (platform === "linkedin") {
      const clientId = Deno.env.get("LINKEDIN_CLIENT_ID");
      const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET");

      if (!clientId || !clientSecret) {
        console.error("social-oauth-callback: LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not set");
        return new Response(null, {
          status: 302,
          headers: { Location: `${errorBase}?error=provider_not_configured` },
        });
      }

      // Step 1: Exchange code for access token
      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error("LinkedIn token exchange failed:", tokenData);
        return new Response(null, {
          status: 302,
          headers: { Location: `${errorBase}?error=token_exchange_failed` },
        });
      }

      const accessToken: string = tokenData.access_token;
      const expiresAt: string | null = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      // Step 2: Get user info via OpenID Connect userinfo
      let accountId = "";
      let accountName = "LinkedIn Account";
      let accountUsername: string | null = null;

      try {
        const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Linkedin-Version": "202503",
          },
        });
        const userData = await userRes.json();
        // LinkedIn userinfo: sub = member URN, name = display name, email
        if (userData.sub) accountId = userData.sub;
        if (userData.name) accountName = userData.name;
        if (userData.email) accountUsername = userData.email;
      } catch (e) {
        console.warn("LinkedIn /userinfo fetch failed:", e);
      }

      if (!accountId) {
        console.error("social-oauth-callback: could not get LinkedIn account ID");
        return new Response(null, {
          status: 302,
          headers: { Location: `${errorBase}?error=account_info_failed` },
        });
      }

      // Step 3: Upsert into social_accounts
      const { error: dbError } = await supabase.from("social_accounts").upsert(
        {
          organization_id: orgId,
          platform: "linkedin",
          account_id: accountId,
          account_name: accountName,
          account_username: accountUsername,
          access_token: accessToken,
          refresh_token: tokenData.refresh_token ?? null,
          token_expires_at: expiresAt,
          scopes: [
            "r_liteprofile",
            "r_emailaddress",
            "w_member_social",
            "r_organization_social",
            "w_organization_social",
            "rw_ads",
          ],
          status: "active",
          metadata: { source: "oauth" },
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,platform,account_id" },
      );

      if (dbError) {
        console.error("social_accounts upsert error (linkedin):", dbError);
        return new Response(null, {
          status: 302,
          headers: { Location: `${errorBase}?error=save_failed` },
        });
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: `${siteUrl}/cliente/contas-sociais?connected=true&platform=linkedin`,
        },
      });
    }

    // Unreachable — all platforms handled above
    return new Response(null, {
      status: 302,
      headers: { Location: `${errorBase}?error=unknown_platform` },
    });
  } catch (err) {
    console.error("social-oauth-callback unexpected error:", err);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${siteUrl}/cliente/contas-sociais?error=unexpected_error`,
      },
    });
  }
});
