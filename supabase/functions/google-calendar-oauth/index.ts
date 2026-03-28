import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

function jsonRes(body: unknown, status = 200) {
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
    const { action, code, redirect_uri, client_id, client_secret } = await req.json();

    // ── Save credentials (step before OAuth) ──
    if (action === "save_credentials") {
      if (!client_id || !client_secret) {
        return jsonRes({ error: "Client ID e Client Secret são obrigatórios" }, 400);
      }

      const userId = await getAuthUser(req, SUPABASE_URL);
      if (!userId) return jsonRes({ error: "Unauthorized" }, 401);

      const serviceClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: orgId } = await serviceClient.rpc("get_user_org_id", { _user_id: userId });
      if (!orgId) return jsonRes({ error: "Organização não encontrada" }, 400);

      // Upsert row with credentials only (no tokens yet)
      const { error: upsertErr } = await serviceClient
        .from("google_calendar_tokens")
        .upsert(
          {
            organization_id: orgId,
            user_id: userId,
            client_id,
            client_secret,
            access_token: "",
            refresh_token: "",
            expires_at: new Date().toISOString(),
            google_calendar_id: "primary",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (upsertErr) {
        // Fallback: try delete + insert
        await serviceClient.from("google_calendar_tokens").delete().eq("user_id", userId);
        await serviceClient.from("google_calendar_tokens").insert({
          organization_id: orgId,
          user_id: userId,
          client_id,
          client_secret,
          access_token: "",
          refresh_token: "",
          expires_at: new Date().toISOString(),
          google_calendar_id: "primary",
        });
      }

      return jsonRes({ success: true });
    }

    // ── Generate OAuth URL (reads client_id from DB) ──
    if (action === "get_auth_url") {
      const userId = await getAuthUser(req, SUPABASE_URL);
      if (!userId) return jsonRes({ error: "Unauthorized" }, 401);

      const serviceClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: tokenRow } = await serviceClient
        .from("google_calendar_tokens")
        .select("client_id")
        .eq("user_id", userId)
        .single();

      if (!tokenRow?.client_id) {
        return jsonRes({ error: "Credenciais do Google não configuradas. Salve seu Client ID primeiro." }, 400);
      }

      const callbackUri = redirect_uri || `${SUPABASE_URL}/functions/v1/google-calendar-oauth`;
      const params = new URLSearchParams({
        client_id: tokenRow.client_id,
        redirect_uri: callbackUri,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/calendar",
        access_type: "offline",
        prompt: "consent",
      });

      return jsonRes({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    }

    // ── Exchange code for tokens (reads creds from DB) ──
    if (action === "exchange_code") {
      const userId = await getAuthUser(req, SUPABASE_URL);
      if (!userId) return jsonRes({ error: "Unauthorized" }, 401);

      const serviceClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: tokenRow } = await serviceClient
        .from("google_calendar_tokens")
        .select("id, client_id, client_secret, organization_id")
        .eq("user_id", userId)
        .single();

      if (!tokenRow?.client_id || !tokenRow?.client_secret) {
        return jsonRes({ error: "Credenciais do Google não encontradas" }, 400);
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: tokenRow.client_id,
          client_secret: tokenRow.client_secret,
          redirect_uri: redirect_uri || `${SUPABASE_URL}/functions/v1/google-calendar-oauth`,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Google token exchange error:", errText);
        return jsonRes({ error: "Falha ao trocar código por token" }, 400);
      }

      const tokenData = await tokenRes.json();
      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      await serviceClient.from("google_calendar_tokens").update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || "",
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }).eq("id", tokenRow.id);

      return jsonRes({ success: true });
    }

    // ── Disconnect ──
    if (action === "disconnect") {
      const userId = await getAuthUser(req, SUPABASE_URL);
      if (!userId) return jsonRes({ error: "Unauthorized" }, 401);

      const serviceClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await serviceClient.from("google_calendar_tokens").delete().eq("user_id", userId);

      return jsonRes({ success: true });
    }

    return jsonRes({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error("google-calendar-oauth error:", e);
    return jsonRes({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
