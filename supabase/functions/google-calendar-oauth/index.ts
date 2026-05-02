// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

function jsonRes(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

async function getAuthUser(req: Request, supabaseUrl: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

// SEC: Allowlist of valid origins to prevent open-redirect via attacker-controlled state
const ALLOWED_ORIGINS = [
  "https://sistema.noexcusedigital.com.br",
  "https://app.noexcuse.com.br",
  "https://grow-guard-system.lovable.app",
];

function sanitizeOrigin(origin: string): string {
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // Fall back to production URL for any unrecognized origin (incl. localhost dev URLs)
  return "https://sistema.noexcusedigital.com.br";
}

serve(async (req) => {
  const ctx = newRequestContext(req, 'google-calendar-oauth');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const FIXED_REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-calendar-oauth`;

  // ── GET handler: Google OAuth callback ──
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const stateRaw = url.searchParams.get("state");
      const errorParam = url.searchParams.get("error");

      if (errorParam) {
        const fallback = "https://sistema.noexcusedigital.com.br/cliente/agenda";
        return Response.redirect(`${fallback}?google_error=${encodeURIComponent(errorParam)}`, 302);
      }

      if (!code || !stateRaw) {
        return new Response("Missing code or state", { status: 400 });
      }

      // Decode state: { userId, origin, path, portal }
      let state: { userId: string; origin: string; path?: string; portal?: string };
      try {
        state = JSON.parse(atob(stateRaw));
      } catch {
        return new Response("Invalid state parameter", { status: 400 });
      }

      // SEC: Sanitize origin to prevent open-redirect via stale dev state tokens
      state.origin = sanitizeOrigin(state.origin);

      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return Response.redirect(`${state.origin}${state.path || "/cliente/agenda"}?google_error=missing_credentials`, 302);
      }

      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: FIXED_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Google token exchange error:", errText);
        return Response.redirect(`${state.origin}${state.path || "/cliente/agenda"}?google_error=token_exchange_failed`, 302);
      }

      const tokenData = await tokenRes.json();
      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      const serviceClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

      // Get org_id for the user
      const portalCtx = state.portal || "saas";
      const { data: orgId } = await serviceClient.rpc("get_user_org_id", { _user_id: state.userId, _portal: portalCtx });

      if (!orgId) {
        return Response.redirect(`${state.origin}${state.path || "/cliente/agenda"}?google_error=org_not_found`, 302);
      }

      // Upsert token record
      const { error: upsertErr } = await serviceClient
        .from("google_calendar_tokens")
        .upsert(
          {
            organization_id: orgId,
            user_id: state.userId,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || "",
            expires_at: expiresAt,
            google_calendar_id: "primary",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (upsertErr) {
        await serviceClient.from("google_calendar_tokens").delete().eq("user_id", state.userId);
        await serviceClient.from("google_calendar_tokens").insert({
          organization_id: orgId,
          user_id: state.userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || "",
          expires_at: expiresAt,
          google_calendar_id: "primary",
        });
      }

      // Redirect back to frontend
      const redirectPath = state.path || "/cliente/agenda";
      return Response.redirect(`${state.origin}${redirectPath}?google_connected=true`, 302);
    } catch (e) {
      console.error("google-calendar-oauth GET error:", e);
      return new Response("Internal error", { status: 500 });
    }
  }

  // ── POST handlers ──
  try {
    const { action, portal } = await req.json();

    // ── Generate OAuth URL ──
    if (action === "get_auth_url") {
      if (!GOOGLE_CLIENT_ID) {
        return jsonRes(req, { error: "Credenciais do Google Calendar não configuradas na plataforma." }, 500);
      }

      const userId = await getAuthUser(req, SUPABASE_URL);
      if (!userId) return jsonRes(req, { error: "Unauthorized" }, 401);

      // Get origin and path from request headers
      const rawOrigin = req.headers.get("Origin") || req.headers.get("Referer")?.replace(/\/[^/]*$/, "") || "";
      const referer = req.headers.get("Referer") || "";
      // SEC: Only allow production origins — strip any localhost/dev origin so the
      // OAuth callback always redirects to the real app (fixes BUG-004 / BUG-005)
      const origin = sanitizeOrigin(rawOrigin);
      let path = "/cliente/agenda";
      try {
        const refUrl = new URL(referer);
        // Only keep path if origin was valid; otherwise keep default
        if (rawOrigin === origin) path = refUrl.pathname;
      } catch { /* keep default */ }

      // Encode state with userId + origin + path
      const statePayload = btoa(JSON.stringify({ userId, origin, path, portal: portal || "saas" }));

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: FIXED_REDIRECT_URI,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/calendar",
        access_type: "offline",
        prompt: "consent",
        state: statePayload,
      });

      return jsonRes(req, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    }

    // ── Disconnect ──
    if (action === "disconnect") {
      const userId = await getAuthUser(req, SUPABASE_URL);
      if (!userId) return jsonRes(req, { error: "Unauthorized" }, 401);

      const serviceClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await serviceClient.from("google_calendar_tokens").delete().eq("user_id", userId);

      return jsonRes(req, { success: true });
    }

    return jsonRes(req, { error: "Ação inválida" }, 400);
  } catch (e) {
    console.error("google-calendar-oauth error:", e);
    return jsonRes(req, { error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
