import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

    const { action, code, redirect_uri, portal } = await req.json();

    // ── Generate OAuth URL (uses platform credentials) ──
    if (action === "get_auth_url") {
      if (!GOOGLE_CLIENT_ID) {
        return jsonRes(req, { error: "Credenciais do Google Calendar não configuradas na plataforma." }, 500);
      }

      const userId = await getAuthUser(req, SUPABASE_URL);
      if (!userId) return jsonRes(req, { error: "Unauthorized" }, 401);

      const callbackUri = redirect_uri || `${SUPABASE_URL}/functions/v1/google-calendar-oauth`;
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: callbackUri,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/calendar",
        access_type: "offline",
        prompt: "consent",
      });

      return jsonRes(req, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    }

    // ── Exchange code for tokens (uses platform credentials) ──
    if (action === "exchange_code") {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return jsonRes(req, { error: "Credenciais do Google Calendar não configuradas na plataforma." }, 500);
      }

      const userId = await getAuthUser(req, SUPABASE_URL);
      if (!userId) return jsonRes(req, { error: "Unauthorized" }, 401);

      const serviceClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      
      // Get org_id for the user
      const portalCtx = portal || "saas";
      const { data: orgId } = await serviceClient.rpc("get_user_org_id", { _user_id: userId, _portal: portalCtx });
      if (!orgId) return jsonRes(req, { error: "Organização não encontrada" }, 400);

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirect_uri || `${SUPABASE_URL}/functions/v1/google-calendar-oauth`,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Google token exchange error:", errText);
        return jsonRes(req, { error: "Falha ao trocar código por token" }, 400);
      }

      const tokenData = await tokenRes.json();
      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      // Upsert token record (no client_id/client_secret stored)
      const { error: upsertErr } = await serviceClient
        .from("google_calendar_tokens")
        .upsert(
          {
            organization_id: orgId,
            user_id: userId,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || "",
            expires_at: expiresAt,
            google_calendar_id: "primary",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (upsertErr) {
        // Fallback: delete and insert
        await serviceClient.from("google_calendar_tokens").delete().eq("user_id", userId);
        await serviceClient.from("google_calendar_tokens").insert({
          organization_id: orgId,
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || "",
          expires_at: expiresAt,
          google_calendar_id: "primary",
        });
      }

      return jsonRes(req, { success: true });
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
