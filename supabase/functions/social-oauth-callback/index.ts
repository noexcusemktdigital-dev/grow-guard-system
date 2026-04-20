// @ts-nocheck
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
  const errorBase = `${siteUrl}/cliente/redes-sociais`;

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

    const redirectUri = `${supabaseUrl}/functions/v1/social-oauth-callback`;

    // ================================================================
    // META (Facebook / Instagram)
    // ================================================================
    if (platform === "meta") {
      const clientId = (Deno.env.get("META_APP_ID") || Deno.env.get("META_CLIENT_ID"))?.trim();
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
      let userId = "";
      let userName = "Meta Account";
      try {
        const meRes = await fetch(
          `https://graph.facebook.com/v25.0/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
        );
        const meData = await meRes.json();
        console.log("Meta /me response:", JSON.stringify(meData));
        if (meData.id) userId = meData.id;
        if (meData.name) userName = meData.name;
      } catch (e) {
        console.warn("Meta /me fetch failed:", e);
      }

      if (!userId) {
        try {
          const dbgRes = await fetch(
            `https://graph.facebook.com/v25.0/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(`${clientId}|${clientSecret}`)}`,
          );
          const dbgData = await dbgRes.json();
          console.log("Meta debug_token response:", JSON.stringify(dbgData));
          if (dbgData?.data?.user_id) userId = String(dbgData.data.user_id);
        } catch (e) {
          console.warn("Meta debug_token fetch failed:", e);
        }
      }

      if (!userId) {
        console.error("social-oauth-callback: could not get Meta account ID");
        return new Response(null, {
          status: 302,
          headers: { Location: `${errorBase}?error=account_info_failed` },
        });
      }

      // Step 4: Buscar Pages do usuário (com page_access_token e instagram_business_account)
      const scopes = [
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_insights",
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "pages_manage_ads",
        "pages_manage_metadata",
        "leads_retrieval",
        "business_management",
        "ads_read",
      ];

      let pages: Array<{
        id: string;
        name: string;
        access_token: string;
        picture_url?: string;
        instagram_business_account?: { id: string };
      }> = [];

      try {
        const pagesRes = await fetch(
          `https://graph.facebook.com/v25.0/me/accounts?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
        );
        const pagesData = await pagesRes.json();
        console.log("Meta /me/accounts response:", JSON.stringify(pagesData));

        let pageSeeds = Array.isArray(pagesData?.data) ? pagesData.data : [];

        if (pageSeeds.length === 0) {
          const assignedRes = await fetch(
            `https://graph.facebook.com/v25.0/me/assigned_pages?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
          );
          const assignedData = await assignedRes.json();
          console.log("Meta /me/assigned_pages response:", JSON.stringify(assignedData));
          pageSeeds = Array.isArray(assignedData?.data) ? assignedData.data : [];
        }

        const pageDetails = await Promise.all(
          pageSeeds.map(async (seed: any) => {
            try {
              const pageRes = await fetch(
                `https://graph.facebook.com/v25.0/${seed.id}?fields=id,name,access_token,picture{url},instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(accessToken)}`,
              );
              const pageData = await pageRes.json();
              console.log("Meta page detail response:", JSON.stringify(pageData));
              if (!pageData?.id) return null;
              return {
                id: pageData.id,
                name: pageData.name ?? seed.name,
                access_token: pageData.access_token ?? accessToken,
                picture_url: pageData.picture?.data?.url,
                instagram_business_account: pageData.instagram_business_account,
              };
            } catch (pageErr) {
              console.warn("Meta page detail fetch failed:", pageErr);
              return null;
            }
          }),
        );

        pages = pageDetails.filter(Boolean) as typeof pages;
      } catch (e) {
        console.warn("Meta pages fetch failed:", e);
      }

      // Se não tem nenhuma Page, salva apenas a conexão de usuário (fallback)
      if (pages.length === 0) {
        const { error: dbError } = await supabase.from("social_accounts").upsert(
          {
            organization_id: orgId,
            platform: "facebook",
            account_id: userId,
            account_name: userName,
            account_username: null,
            access_token: accessToken,
            refresh_token: null,
            token_expires_at: expiresAt,
            scopes,
            status: "active",
            metadata: { source: "oauth", long_lived: true, user_token: accessToken },
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,platform,account_id" },
        );
        if (dbError) {
          console.error("social_accounts upsert error (meta user fallback):", dbError);
          return new Response(null, {
            status: 302,
            headers: { Location: `${errorBase}?error=save_failed` },
          });
        }
        const redirectTo = (payload as any).redirect_to as string | null | undefined;
        const fallbackLocation =
          redirectTo === "crm-leads"
            ? `${siteUrl}/cliente/crm/integracoes/meta-lead-ads?connected=true&warning=no_pages`
            : `${siteUrl}/cliente/redes-sociais?connected=true&platform=facebook&warning=no_pages`;
        return new Response(null, {
          status: 302,
          headers: { Location: fallbackLocation },
        });
      }

      // Salva uma conexão Facebook (Page) e, se houver, uma conexão Instagram para cada Page
      let igConnected = false;
      for (const page of pages) {
        // pageAccessToken = token de página (usado p/ publicar / ler IG).
        // accessToken     = USER token long-lived (60d) — único capaz de chamar /me/accounts.
        const pageAccessToken: string = page.access_token || accessToken;

        const pageMetadata: Record<string, any> = {
          source: "oauth",
          long_lived: true,
          // page tokens não expiram quando derivados de long-lived user token
          page_access_token: pageAccessToken,
          page_id: page.id,
          page_name: page.name,
          picture: page.picture_url ?? null,
          user_id: userId,
          user_token: accessToken,
        };

        const { error: fbErr } = await supabase.from("social_accounts").upsert(
          {
            organization_id: orgId,
            platform: "facebook",
            account_id: page.id,
            account_name: page.name,
            account_username: null,
            // IMPORTANTE: salvamos o USER token long-lived na coluna principal
            // para que /me/accounts continue funcionando após o callback.
            access_token: accessToken,
            refresh_token: null,
            token_expires_at: expiresAt,
            scopes,
            status: "active",
            metadata: pageMetadata,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,platform,account_id" },
        );
        if (fbErr) console.error("social_accounts upsert error (fb page):", fbErr);

        // Se a Page tem Instagram Business vinculado, salva também a conexão instagram
        if (page.instagram_business_account?.id) {
          const igId = page.instagram_business_account.id;
          let igName: string | null = null;
          let igUsername: string | null = null;
          let igPicture: string | null = null;
          try {
            const igRes = await fetch(
              `https://graph.facebook.com/v25.0/${igId}?fields=name,username,profile_picture_url&access_token=${encodeURIComponent(pageAccessToken)}`,
            );
            const igData = await igRes.json();
            console.log("IG account info:", JSON.stringify(igData));
            igName = igData?.name ?? null;
            igUsername = igData?.username ?? null;
            igPicture = igData?.profile_picture_url ?? null;
          } catch (e) {
            console.warn("IG info fetch failed:", e);
          }

          const { error: igErr } = await supabase.from("social_accounts").upsert(
            {
              organization_id: orgId,
              platform: "instagram",
              account_id: igId,
              account_name: igName ?? page.name,
              account_username: igUsername,
              // Para publicar no IG é necessário o page access token.
              access_token: pageAccessToken,
              refresh_token: null,
              token_expires_at: null,
              scopes,
              status: "active",
              metadata: {
                source: "oauth",
                long_lived: true,
                page_access_token: pageAccessToken,
                page_id: page.id,
                page_name: page.name,
                ig_user_id: igId,
                picture: igPicture,
                profile_picture_url: igPicture,
                user_id: userId,
                user_token: accessToken,
              },
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "organization_id,platform,account_id" },
          );
          if (igErr) console.error("social_accounts upsert error (ig):", igErr);
          else igConnected = true;
        }
      }

      const redirectTo = (payload as any).redirect_to as string | null | undefined;
      const successPlatform = igConnected ? "instagram" : "facebook";
      const successLocation =
        redirectTo === "crm-leads"
          ? `${siteUrl}/cliente/crm/integracoes/meta-lead-ads?connected=true`
          : `${siteUrl}/cliente/redes-sociais?connected=true&platform=${successPlatform}`;
      return new Response(null, {
        status: 302,
        headers: { Location: successLocation },
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
          Location: `${siteUrl}/cliente/redes-sociais?connected=true&platform=linkedin`,
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
        Location: `${siteUrl}/cliente/redes-sociais?error=unexpected_error`,
      },
    });
  }
});
