// @ts-nocheck
/**
 * ads-oauth-start
 * Inicia o fluxo OAuth da Meta Ads para o usuário autenticado.
 * Gera um state seguro, salva em ads_oauth_states e redireciona para o Facebook.
 *
 * verify_jwt=false — JWT validado manualmente para suportar redirecionamento de browser.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from "../_shared/correlation.ts";

const META_SCOPES = [
  "ads_read",
  "leads_retrieval",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_ads",
  "pages_manage_metadata",
].join(",");

serve(async (req: Request) => {
  const ctx = newRequestContext(req, 'ads-oauth-start');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const metaAppId = Deno.env.get("META_APP_ID")!;

  // Validate JWT manually (verify_jwt=false to allow browser redirect)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized — missing Bearer token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || serviceKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized — invalid token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get org_id from query param or resolve from user's membership
  const url = new URL(req.url);
  let orgId = url.searchParams.get("org_id");

  if (!orgId) {
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("joined_at", { ascending: true })
      .limit(1)
      .single();

    orgId = membership?.organization_id ?? null;
  }

  if (!orgId) {
    return new Response(
      JSON.stringify({ error: "User has no active organization" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Generate cryptographically secure state
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const statePayload = `${orgId}:${randomHex}`;
  const state = btoa(statePayload);

  // Save state to ads_oauth_states (expires in 10 minutes)
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const { error: stateError } = await supabaseAdmin
    .from("ads_oauth_states")
    .insert({
      state,
      org_id: orgId,
      user_id: user.id,
    });

  if (stateError) {
    console.error("Failed to save OAuth state:", stateError);
    return new Response(
      JSON.stringify({ error: "Failed to initialize OAuth flow" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const redirectUri = `${supabaseUrl}/functions/v1/ads-oauth-callback`;

  const metaAuthUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  metaAuthUrl.searchParams.set("client_id", metaAppId);
  metaAuthUrl.searchParams.set("redirect_uri", redirectUri);
  metaAuthUrl.searchParams.set("scope", META_SCOPES);
  metaAuthUrl.searchParams.set("state", state);
  metaAuthUrl.searchParams.set("response_type", "code");

  // If called from browser (GET), redirect directly
  if (req.method === "GET") {
    return new Response(null, {
      status: 302,
      headers: { Location: metaAuthUrl.toString() },
    });
  }

  // If called from frontend JS (POST), return the URL as JSON
  return new Response(
    JSON.stringify({ url: metaAuthUrl.toString(), state }),
    {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    }
  );
});
