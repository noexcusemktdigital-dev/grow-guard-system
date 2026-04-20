// @ts-nocheck
// Assina/cancela uma página do Facebook ao webhook leadgen do app Meta.
// Salva o page_access_token na tabela meta_leadgen_subscribed_pages.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
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

    const { data: socialConns } = await supabase
      .from("social_accounts")
      .select("account_id, account_name, access_token, metadata")
      .eq("organization_id", org_id)
      .eq("platform", "facebook")
      .eq("status", "active")
      .order("last_synced_at", { ascending: false });

    const pageRows = (socialConns ?? []).filter((row: any) => row?.account_id && row?.access_token);
    const userTokenRow = (socialConns ?? []).find(
      (row: any) => typeof row?.metadata?.user_token === "string" && row.metadata.user_token.length > 0,
    );

    // Busca token: tenta social_accounts.user_token primeiro, depois ads_connections
    let accessToken: string | null = userTokenRow?.metadata?.user_token ?? null;

    if (!accessToken) {
      const { data: adsConn } = await supabase
        .from("ads_connections")
        .select("access_token")
        .eq("org_id", org_id)
        .eq("provider", "meta")
        .eq("status", "active")
        .order("connected_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      accessToken = adsConn?.access_token ?? null;
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Conecte o Facebook em Redes Sociais ou Meta Ads primeiro." }),
        { status: 400, headers },
      );
    }

    const pageRow = pageRows.find((row: any) => row.account_id === page_id);
    let page: { id: string; name: string; access_token: string } | null = pageRow
      ? {
          id: pageRow.account_id,
          name: pageRow.account_name ?? pageRow.metadata?.page_name ?? "Página do Facebook",
          access_token: pageRow.metadata?.page_access_token ?? "",
        }
      : null;

    // Sempre derivar o PAGE access token via Graph usando o USER token.
    // O access_token salvo em social_accounts pode ser o user token (não funciona em /subscribed_apps).
    if (accessToken) {
      const pageRes = await fetch(
        `https://graph.facebook.com/v21.0/${page_id}?fields=id,name,access_token&access_token=${accessToken}`,
      );
      const pageJson = await pageRes.json();
      console.log("[meta-leadgen-subscribe] page lookup:", JSON.stringify(pageJson));
      if (pageJson?.access_token) {
        page = {
          id: pageJson.id,
          name: pageJson.name ?? page?.name ?? "Página do Facebook",
          access_token: pageJson.access_token,
        };
      }
    }

    if (!page?.access_token) {
      return new Response(JSON.stringify({ error: "Página não acessível pelo usuário" }), {
        status: 403,
        headers,
      });
    }

    if (action === "subscribe") {
      // Subscribe page to leadgen field
      const subRes = await fetch(
        `https://graph.facebook.com/v21.0/${page_id}/subscribed_apps?subscribed_fields=leadgen&access_token=${page.access_token}`,
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
          page_name: page.name,
          page_access_token: page.access_token,
          active: true,
          subscribed_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,page_id" },
      );

      return new Response(JSON.stringify({ ok: true, subscribed: true }), { status: 200, headers });
    }

    if (action === "unsubscribe") {
      await fetch(
        `https://graph.facebook.com/v21.0/${page_id}/subscribed_apps?access_token=${page.access_token}`,
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
