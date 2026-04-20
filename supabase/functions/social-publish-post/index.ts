// social-publish-post — publica imediatamente OU agenda post via fila própria
// Body: { social_account_id, caption, image_url, scheduled_for? (ISO) }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

const GRAPH = "https://graph.facebook.com/v21.0";

async function publishFacebook(pageId: string, token: string, caption: string, imageUrl?: string) {
  if (imageUrl) {
    const r = await fetch(`${GRAPH}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl, caption, access_token: token }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message ?? `FB photo ${r.status}`);
    return j.post_id ?? j.id;
  }
  const r = await fetch(`${GRAPH}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: caption, access_token: token }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message ?? `FB feed ${r.status}`);
  return j.id;
}

async function publishInstagram(igUserId: string, token: string, caption: string, imageUrl: string) {
  // 1) Create container
  const r1 = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  });
  const j1 = await r1.json();
  if (!r1.ok) throw new Error(j1?.error?.message ?? `IG container ${r1.status}`);

  // 2) Publish container
  const r2 = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: j1.id, access_token: token }),
  });
  const j2 = await r2.json();
  if (!r2.ok) throw new Error(j2?.error?.message ?? `IG publish ${r2.status}`);
  return j2.id;
}

export async function publishToPlatform(account: any, caption: string, imageUrl?: string): Promise<string> {
  const meta = (account.metadata ?? {}) as Record<string, any>;
  const token: string | undefined = meta.access_token ?? meta.page_access_token;
  if (!token) throw new Error("Token de acesso ausente");

  if (account.platform === "facebook") {
    return await publishFacebook(account.account_id, token, caption, imageUrl);
  }
  if (account.platform === "instagram") {
    if (!imageUrl) throw new Error("Instagram exige uma imagem");
    return await publishInstagram(account.account_id, token, caption, imageUrl);
  }
  throw new Error(`Plataforma não suportada: ${account.platform}`);
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supaUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await userClient.auth.getClaims(token);
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }
    const userId = claims.claims.sub;

    const body = await req.json().catch(() => ({}));
    const { social_account_id, caption, image_url, scheduled_for } = body as {
      social_account_id?: string;
      caption?: string;
      image_url?: string;
      scheduled_for?: string;
    };

    if (!social_account_id || !caption) {
      return new Response(JSON.stringify({ error: "social_account_id e caption são obrigatórios" }), {
        status: 400,
        headers: cors,
      });
    }

    const admin = createClient(supaUrl, service);
    const { data: account } = await admin.from("social_accounts").select("*").eq("id", social_account_id).maybeSingle();
    if (!account) return new Response(JSON.stringify({ error: "Conta não encontrada" }), { status: 404, headers: cors });

    const { data: isMember } = await admin.rpc("is_member_of_org", {
      _user_id: userId,
      _org_id: account.organization_id,
    });
    if (!isMember) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors });

    // Agendar para futuro?
    if (scheduled_for) {
      const when = new Date(scheduled_for);
      if (when.getTime() > Date.now() + 60_000) {
        const { data: row, error } = await admin
          .from("social_scheduled_posts")
          .insert({
            organization_id: account.organization_id,
            social_account_id,
            platform: account.platform,
            caption,
            image_url: image_url ?? null,
            scheduled_for: when.toISOString(),
            status: "scheduled",
            created_by: userId,
          })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ scheduled: true, post: row }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    // Publicar agora
    const platformPostId = await publishToPlatform(account, caption, image_url);

    // Registrar histórico (em scheduled_posts com status=published)
    await admin.from("social_scheduled_posts").insert({
      organization_id: account.organization_id,
      social_account_id,
      platform: account.platform,
      caption,
      image_url: image_url ?? null,
      scheduled_for: new Date().toISOString(),
      status: "published",
      platform_post_id: platformPostId,
      published_at: new Date().toISOString(),
      created_by: userId,
    });

    return new Response(JSON.stringify({ published: true, platform_post_id: platformPostId }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[social-publish-post] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
