// @ts-nocheck
// Lista as Páginas do Facebook do usuário conectado e/ou os formulários de uma página.
// Requer JWT do usuário (a função busca a conexão ads ativa da org).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list_pages";
    const orgId = url.searchParams.get("org_id");
    const pageId = url.searchParams.get("page_id");

    if (!orgId) {
      return new Response(JSON.stringify({ error: "org_id required" }), { status: 400, headers });
    }

    // Busca token: tenta ads_connections primeiro, depois social_accounts
    let accessToken: string | null = null;
    const { data: adsConn } = await supabase
      .from("ads_connections")
      .select("access_token")
      .eq("org_id", orgId)
      .eq("provider", "meta")
      .eq("status", "active")
      .order("connected_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (adsConn?.access_token) {
      accessToken = adsConn.access_token;
    } else {
      const { data: socialConn } = await supabase
        .from("social_accounts")
        .select("access_token")
        .eq("organization_id", orgId)
        .eq("platform", "facebook")
        .eq("status", "active")
        .order("last_synced_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      accessToken = (socialConn as any)?.access_token ?? null;
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Conecte o Facebook em Redes Sociais ou Meta Ads primeiro." }),
        { status: 400, headers },
      );
    }

    if (action === "list_pages") {
      // Lista páginas que o usuário administra
      const r = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,tasks&limit=100&access_token=${accessToken}`,
      );
      const j = await r.json();
      if (j.error) {
        return new Response(JSON.stringify({ error: j.error.message }), { status: 400, headers });
      }
      const pages = (j.data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
        can_manage: (p.tasks ?? []).includes("MANAGE") || (p.tasks ?? []).includes("ADVERTISE"),
      }));
      return new Response(JSON.stringify({ pages }), { status: 200, headers });
    }

    if (action === "list_forms") {
      if (!pageId) {
        return new Response(JSON.stringify({ error: "page_id required" }), { status: 400, headers });
      }
      // Pegamos o page access token via /me/accounts (mais seguro que confiar no front)
      const accountsRes = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,access_token&limit=200&access_token=${accessToken}`,
      );
      const accountsJson = await accountsRes.json();
      const page = (accountsJson.data ?? []).find((p: any) => p.id === pageId);
      if (!page?.access_token) {
        return new Response(JSON.stringify({ error: "Página não acessível" }), { status: 403, headers });
      }
      const r = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/leadgen_forms?fields=id,name,status,leads_count,created_time&limit=100&access_token=${page.access_token}`,
      );
      const j = await r.json();
      if (j.error) {
        return new Response(JSON.stringify({ error: j.error.message }), { status: 400, headers });
      }
      return new Response(JSON.stringify({ forms: j.data ?? [] }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
  } catch (e) {
    console.error("[meta-leadgen-pages]", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers });
  }
});
