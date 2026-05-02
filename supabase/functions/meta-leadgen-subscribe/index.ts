// @ts-nocheck
// Assina/cancela uma página do Facebook ao webhook leadgen do app Meta.
// Salva o page_access_token na tabela meta_leadgen_subscribed_pages.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from "../_shared/correlation.ts";
import { redact } from "../_shared/redact.ts";

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'meta-leadgen-subscribe');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers });
  }

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
    }

    const body = await req.json();
    const { org_id, page_id, action } = body;
    if (!org_id || !page_id || !action) {
      return new Response(JSON.stringify({ error: "org_id, page_id, action required" }), {
        status: 400,
        headers,
      });
    }

    // Verifica que o usuário pertence à org
    const { data: isMember } = await supabase
      .from("organization_memberships")
      .select("user_id")
      .eq("organization_id", org_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Not a member" }), { status: 403, headers });
    }

    // Busca USER token: tenta ads_connections, depois social_accounts (user_token nos metadados)
    let accessToken: string | null = null;
    const { data: adsConn } = await supabase
      .from("ads_connections")
      .select("access_token")
      .eq("org_id", org_id)
      .eq("provider", "meta")
      .eq("status", "active")
      .order("connected_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (adsConn?.access_token) {
      accessToken = adsConn.access_token;
    } else {
      const { data: socialConns } = await supabase
        .from("social_accounts")
        .select("access_token, metadata")
        .eq("organization_id", org_id)
        .eq("platform", "facebook")
        .eq("status", "active")
        .order("last_synced_at", { ascending: false });

      const withUserToken = (socialConns ?? []).find(
        (r: any) => typeof r?.metadata?.user_token === "string" && r.metadata.user_token.length > 0,
      );

      if (withUserToken) {
        accessToken = (withUserToken as any).metadata.user_token;
      } else {
        const first = (socialConns ?? [])[0];
        const meta = (first as any)?.metadata ?? {};
        accessToken = meta.user_token || (first as any)?.access_token || null;
      }
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          error:
            "Sem permissão da Meta. Reconecte em CRM > Integrações > Meta Lead Ads autorizando os escopos leads_retrieval, pages_manage_ads e pages_manage_metadata.",
        }),
        { status: 400, headers },
      );
    }

    // Buscar page access token via /me/accounts usando o user token
    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&limit=100&access_token=${accessToken}`,
    );
    const accountsJson = await accountsRes.json();
    console.log("[meta-leadgen-subscribe] /me/accounts:", JSON.stringify(redact(accountsJson)));

    const pageEntry = (accountsJson.data ?? []).find((p: any) => p.id === page_id);

    if (!pageEntry?.access_token) {
      return new Response(
        JSON.stringify({
          error:
            "Página não encontrada ou sem permissão da Meta. Reconecte em CRM > Integrações > Meta Lead Ads autorizando os escopos leads_retrieval, pages_manage_ads e pages_manage_metadata, e confirme que você é administrador da página.",
        }),
        { status: 403, headers },
      );
    }

    const pageAccessToken: string = pageEntry.access_token;
    const pageName: string = pageEntry.name ?? "Página do Facebook";

    if (action === "subscribe") {
      // Subscribe page to leadgen field
      const subRes = await fetch(
        `https://graph.facebook.com/v21.0/${page_id}/subscribed_apps?subscribed_fields=leadgen&access_token=${pageAccessToken}`,
        { method: "POST" },
      );
      const subJson = await subRes.json();
      if (subJson.error) {
        return new Response(JSON.stringify({ error: subJson.error.message }), { status: 400, headers });
      }

      await supabase.from("meta_leadgen_subscribed_pages").upsert(
        {
          organization_id: org_id,
          page_id,
          page_name: pageName,
          page_access_token: pageAccessToken,
          active: true,
          subscribed_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,page_id" },
      );

      return new Response(JSON.stringify({ ok: true, subscribed: true }), { status: 200, headers });
    }

    if (action === "unsubscribe") {
      await fetch(
        `https://graph.facebook.com/v21.0/${page_id}/subscribed_apps?access_token=${pageAccessToken}`,
        { method: "DELETE" },
      );
      await supabase
        .from("meta_leadgen_subscribed_pages")
        .update({ active: false })
        .eq("organization_id", org_id)
        .eq("page_id", page_id);
      return new Response(JSON.stringify({ ok: true, subscribed: false }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
  } catch (e) {
    console.error("[meta-leadgen-subscribe]", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers });
  }
});
