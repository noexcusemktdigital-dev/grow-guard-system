import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const stateRaw = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        const redirectUrl = `https://grow-guard-system.lovable.app/cliente/trafego-pago?ads_error=${encodeURIComponent(error)}`;
        return new Response(null, { status: 302, headers: { Location: redirectUrl } });
      }

      if (!code || !stateRaw) {
        return new Response("Missing code or state", { status: 400 });
      }

      let state: { platform: string; organization_id: string; origin: string };
      try {
        state = JSON.parse(atob(stateRaw));
      } catch {
        return new Response("Invalid state", { status: 400 });
      }

      const { platform, organization_id, origin } = state;
      const redirectUri = `${supabaseUrl}/functions/v1/ads-oauth-callback`;
      const appRedirectBase = origin || "https://grow-guard-system.lovable.app";

      let accessToken: string;
      let refreshToken: string | null = null;
      let expiresAt: string | null = null;
      let accountId: string | null = null;
      let accountName: string | null = null;

      if (platform === "google_ads") {
        const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
        const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
        if (!clientId || !clientSecret) {
          const errUrl = `${appRedirectBase}/cliente/trafego-pago?ads_error=credentials_not_configured`;
          return new Response(null, { status: 302, headers: { Location: errUrl } });
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
          const errUrl = `${appRedirectBase}/cliente/trafego-pago?ads_error=token_exchange_failed`;
          return new Response(null, { status: 302, headers: { Location: errUrl } });
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
              { headers: { Authorization: `Bearer ${accessToken}`, "developer-token": devToken } }
            );
            const contentType = customersRes.headers.get("content-type") || "";
            const bodyText = await customersRes.text();
            console.log("Google Ads listAccessibleCustomers status:", customersRes.status, "content-type:", contentType);

            if (!customersRes.ok || !contentType.includes("application/json")) {
              console.error("Google Ads listAccessibleCustomers failed. Status:", customersRes.status, "Body:", bodyText.substring(0, 500));
            } else {
              const customersData = JSON.parse(bodyText);
              if (customersData.resourceNames?.length > 0) {
                accountId = customersData.resourceNames[0].replace("customers/", "");
                accountName = `Google Ads ${accountId}`;
              }
            }
          } catch (e) {
            console.warn("Could not fetch Google Ads customers:", e);
          }
        }

        if (!accountId) {
          console.error("No Google Ads account_id found — blocking connection save");
          const errUrl = `${appRedirectBase}/cliente/trafego-pago?ads_error=no_ad_account`;
          return new Response(null, { status: 302, headers: { Location: errUrl } });
        }

        // Save Google connection directly
        const { error: dbError } = await supabase
          .from("ad_platform_connections")
          .upsert({
            organization_id,
            platform,
            account_id: accountId,
            account_name: accountName,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expires_at: expiresAt,
            status: "active",
            updated_at: new Date().toISOString(),
          }, { onConflict: "organization_id,platform" });

        if (dbError) {
          console.error("DB upsert error:", dbError);
          const errUrl = `${appRedirectBase}/cliente/trafego-pago?ads_error=save_failed`;
          return new Response(null, { status: 302, headers: { Location: errUrl } });
        }

        const successUrl = `${appRedirectBase}/cliente/trafego-pago?ads_connected=${platform}`;
        return new Response(null, { status: 302, headers: { Location: successUrl } });

      } else if (platform === "meta_ads") {
        const appId = Deno.env.get("META_APP_ID");
        const appSecret = Deno.env.get("META_APP_SECRET");
        if (!appId || !appSecret) {
          const errUrl = `${appRedirectBase}/cliente/trafego-pago?ads_error=credentials_not_configured`;
          return new Response(null, { status: 302, headers: { Location: errUrl } });
        }

        const tokenRes = await fetch(
          `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
        );
        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || !tokenData.access_token) {
          console.error("Meta token exchange failed:", tokenData);
          const errUrl = `${appRedirectBase}/cliente/trafego-pago?ads_error=token_exchange_failed`;
          return new Response(null, { status: 302, headers: { Location: errUrl } });
        }

        // Exchange for long-lived token
        const longRes = await fetch(
          `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
        );
        const longData = await longRes.json();
        accessToken = longData.access_token || tokenData.access_token;
        if (longData.expires_in) {
          expiresAt = new Date(Date.now() + longData.expires_in * 1000).toISOString();
        }

        // Fetch all ad accounts
        let adAccounts: { account_id: string; name: string }[] = [];
        try {
          const meRes = await fetch(
            `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id,account_status&access_token=${accessToken}&limit=100`
          );
          const meData = await meRes.json();
          console.log("Meta ad accounts response:", JSON.stringify(meData).substring(0, 1000));
          
          if (meData.data?.length > 0) {
            adAccounts = meData.data.map((acc: any) => ({
              account_id: acc.account_id,
              name: acc.name || `Meta Ads ${acc.account_id}`,
            }));
          }
        } catch (e) {
          console.warn("Could not fetch Meta ad accounts:", e);
        }

        if (adAccounts.length === 0) {
          const errUrl = `${appRedirectBase}/cliente/trafego-pago?ads_error=no_ad_account`;
          return new Response(null, { status: 302, headers: { Location: errUrl } });
        }

        if (adAccounts.length === 1) {
          // Single account — save directly
          const { error: dbError } = await supabase
            .from("ad_platform_connections")
            .upsert({
              organization_id,
              platform: "meta_ads",
              account_id: adAccounts[0].account_id,
              account_name: adAccounts[0].name,
              access_token: accessToken,
              refresh_token: null,
              token_expires_at: expiresAt,
              status: "active",
              updated_at: new Date().toISOString(),
            }, { onConflict: "organization_id,platform" });

          if (dbError) {
            console.error("DB upsert error:", dbError);
            const errUrl = `${appRedirectBase}/cliente/trafego-pago?ads_error=save_failed`;
            return new Response(null, { status: 302, headers: { Location: errUrl } });
          }

          const successUrl = `${appRedirectBase}/cliente/trafego-pago?ads_connected=meta_ads`;
          return new Response(null, { status: 302, headers: { Location: successUrl } });
        }

        // Multiple accounts — save token temporarily and redirect to picker
        // Store token in a temporary pending connection
        const { data: pendingConn, error: pendingError } = await supabase
          .from("ad_platform_connections")
          .upsert({
            organization_id,
            platform: "meta_ads",
            account_id: "__pending__",
            account_name: "Selecionando conta...",
            access_token: accessToken,
            refresh_token: null,
            token_expires_at: expiresAt,
            status: "pending",
            updated_at: new Date().toISOString(),
          }, { onConflict: "organization_id,platform" })
          .select("id")
          .single();

        if (pendingError) {
          console.error("DB pending upsert error:", pendingError);
          const errUrl = `${appRedirectBase}/cliente/trafego-pago?ads_error=save_failed`;
          return new Response(null, { status: 302, headers: { Location: errUrl } });
        }

        // Encode accounts list as query param
        const accountsParam = encodeURIComponent(JSON.stringify(adAccounts));
        const pickerUrl = `${appRedirectBase}/cliente/trafego-pago?ads_pick_account=${pendingConn.id}&ads_accounts=${accountsParam}`;
        return new Response(null, { status: 302, headers: { Location: pickerUrl } });

      } else {
        const errUrl = `${appRedirectBase}/cliente/trafego-pago?ads_error=invalid_platform`;
        return new Response(null, { status: 302, headers: { Location: errUrl } });
      }

    } catch (err) {
      console.error("ads-oauth-callback GET error:", err);
      return new Response(null, {
        status: 302,
        headers: { Location: "https://grow-guard-system.lovable.app/cliente/trafego-pago?ads_error=unknown" },
      });
    }
  }

  // POST handler kept for backward compat
  return new Response(JSON.stringify({ error: "Use GET callback" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
