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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { platform, code, redirect_uri, organization_id } = await req.json();

    if (!platform || !code || !organization_id) {
      return new Response(JSON.stringify({ error: "Missing platform, code, or organization_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken: string;
    let refreshToken: string | null = null;
    let expiresAt: string | null = null;
    let accountId: string | null = null;
    let accountName: string | null = null;

    if (platform === "google_ads") {
      const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
      if (!clientId || !clientSecret) {
        return new Response(JSON.stringify({ error: "Google Ads credentials not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirect_uri || `${supabaseUrl}/functions/v1/ads-oauth-callback`,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        console.error("Google token exchange failed:", tokenData);
        return new Response(JSON.stringify({ error: "Failed to exchange Google code", details: tokenData }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token || null;
      if (tokenData.expires_in) {
        expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
      }

      // Get accessible customer IDs
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
          const customersData = await customersRes.json();
          if (customersData.resourceNames?.length > 0) {
            accountId = customersData.resourceNames[0].replace("customers/", "");
            accountName = `Google Ads ${accountId}`;
          }
        } catch (e) {
          console.warn("Could not fetch Google Ads customers:", e);
        }
      }
    } else if (platform === "meta_ads") {
      const appId = Deno.env.get("META_APP_ID");
      const appSecret = Deno.env.get("META_APP_SECRET");
      if (!appId || !appSecret) {
        return new Response(JSON.stringify({ error: "Meta Ads credentials not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Exchange code for token
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${appSecret}&code=${code}`
      );
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error("Meta token exchange failed:", tokenData);
        return new Response(JSON.stringify({ error: "Failed to exchange Meta code", details: tokenData }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get long-lived token
      const longRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
      );
      const longData = await longRes.json();
      accessToken = longData.access_token || tokenData.access_token;
      if (longData.expires_in) {
        expiresAt = new Date(Date.now() + longData.expires_in * 1000).toISOString();
      }

      // Get ad accounts
      try {
        const meRes = await fetch(
          `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id&access_token=${accessToken}`
        );
        const meData = await meRes.json();
        if (meData.data?.length > 0) {
          accountId = meData.data[0].account_id;
          accountName = meData.data[0].name || `Meta Ads ${accountId}`;
        }
      } catch (e) {
        console.warn("Could not fetch Meta ad accounts:", e);
      }
    } else {
      return new Response(JSON.stringify({ error: "Invalid platform" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert connection
    const { data, error } = await supabase
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
      }, { onConflict: "organization_id,platform" })
      .select()
      .single();

    if (error) {
      console.error("DB upsert error:", error);
      return new Response(JSON.stringify({ error: "Failed to save connection" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, connection: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ads-oauth-callback error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
