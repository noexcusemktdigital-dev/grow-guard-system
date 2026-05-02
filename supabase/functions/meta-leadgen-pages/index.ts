// @ts-nocheck
// Lista as Páginas do Facebook do usuário conectado e/ou os formulários de uma página.
// Requer JWT do usuário (a função busca a conexão ads ativa da org).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from "../_shared/correlation.ts";
import { redact } from "../_shared/redact.ts";

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'meta-leadgen-pages');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  const headers = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json",
  };

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers,
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list_pages";
    const orgId = url.searchParams.get("org_id");
    const pageId = url.searchParams.get("page_id");

    if (!orgId) {
      return new Response(JSON.stringify({ error: "org_id required" }), {
        status: 400,
        headers,
      });
    }

    const { data: socialConns } = await supabase
      .from("social_accounts")
      .select("account_id, account_name, access_token, metadata")
      .eq("organization_id", orgId)
      .eq("platform", "facebook")
      .eq("status", "active")
      .order("last_synced_at", { ascending: false });

    const pageRows = (socialConns ?? []).filter((row: any) =>
      row?.account_id && row?.access_token
    );
    const userTokenRow = (socialConns ?? []).find(
      (row: any) =>
        typeof row?.metadata?.user_token === "string" &&
        row.metadata.user_token.length > 0,
    );

    // Busca token: tenta social_accounts.user_token primeiro, depois ads_connections
    let accessToken: string | null = userTokenRow?.metadata?.user_token ?? null;

    if (!accessToken) {
      const { data: adsConn } = await supabase
        .from("ads_connections")
        .select("access_token")
        .eq("org_id", orgId)
        .eq("provider", "meta")
        .eq("status", "active")
        .order("connected_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      accessToken = adsConn?.access_token ?? null;
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

    if (action === "list_pages") {
      if (accessToken) {
        const r = await fetch(
          `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,tasks&limit=100&access_token=${accessToken}`,
        );
        const j = await r.json();
        if (!j.error) {
          const pages = (j.data ?? []).map((p: any) => ({
            id: p.id,
            name: p.name,
            access_token: p.access_token,
            can_manage: (p.tasks ?? []).includes("MANAGE") ||
              (p.tasks ?? []).includes("ADVERTISE"),
          }));
          return new Response(JSON.stringify({ pages }), {
            status: 200,
            headers,
          });
        }
      }

      const pages = pageRows.map((row: any) => ({
        id: row.account_id,
        name: row.account_name ?? row.metadata?.page_name ??
          "Página do Facebook",
        access_token: row.access_token,
        can_manage: true,
      }));
      return new Response(JSON.stringify({ pages }), { status: 200, headers });
    }

    if (action === "list_forms") {
      if (!pageId) {
        return new Response(JSON.stringify({ error: "page_id required" }), {
          status: 400,
          headers,
        });
      }

      const pageRow = pageRows.find((row: any) => row.account_id === pageId);
      let pageAccessToken: string | null =
        pageRow?.metadata?.page_access_token ?? null;
      let pageName: string | null = pageRow?.account_name ??
        pageRow?.metadata?.page_name ?? null;

      const accountsRes = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&limit=100&access_token=${accessToken}`,
      );
      const accountsJson = await accountsRes.json();
      const pageEntry = (accountsJson.data ?? []).find((p: any) =>
        p.id === pageId
      );

      if (pageEntry?.access_token) {
        pageAccessToken = pageEntry.access_token;
        pageName = pageEntry.name ?? pageName;
      }

      if (!pageAccessToken) {
        return new Response(
          JSON.stringify({
            error:
              "Página não encontrada ou sem permissão da Meta. Reconecte em CRM > Integrações > Meta Lead Ads autorizando os escopos leads_retrieval, pages_manage_ads e pages_manage_metadata, e confirme que você é administrador da página.",
            page_name: pageName,
          }),
          { status: 403, headers },
        );
      }

      // Tenta com page access token primeiro
      let r = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/leadgen_forms?fields=id,name,status,leads_count,created_time&limit=100&access_token=${pageAccessToken}`,
      );
      let j = await r.json();
      console.log("[meta-leadgen-pages] leadgen_forms (page token):", JSON.stringify(redact(j)));

      // Fallback: tenta com user token se page token falhar por permissão
      if (j.error) {
        console.log("[meta-leadgen-pages] retry with user token");
        r = await fetch(
          `https://graph.facebook.com/v21.0/${pageId}/leadgen_forms?fields=id,name,status,leads_count,created_time&limit=100&access_token=${accessToken}`,
        );
        j = await r.json();
        console.log("[meta-leadgen-pages] leadgen_forms (user token):", JSON.stringify(redact(j)));
      }

      if (j.error) {
        const msg = j.error.message ?? "";
        const isPermErr = msg.includes("pages_manage_ads") ||
          msg.includes("permission") ||
          j.error.code === 200 ||
          j.error.code === 190;
        return new Response(
          JSON.stringify({
            error: isPermErr
              ? "Token sem permissões necessárias. Vá em Redes Sociais, DESCONECTE o Facebook e reconecte autorizando TODAS as permissões solicitadas (incluindo gerenciar anúncios das páginas)."
              : msg,
            page_name: pageName,
            fb_code: j.error.code,
          }),
          { status: 400, headers },
        );
      }
      return new Response(
        JSON.stringify({ forms: j.data ?? [], page_name: pageName }),
        { status: 200, headers },
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers,
    });
  } catch (e) {
    console.error("[meta-leadgen-pages]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers,
    });
  }
});
