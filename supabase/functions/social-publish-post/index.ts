// social-publish-post — publica imediatamente OU agenda post via fila própria
// Body: { social_account_id, caption, image_url, scheduled_for? (ISO) }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { publishToPlatform } from "../_shared/socialPublish.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { parseOrThrow, validationErrorResponse, UUID, NonEmptyString } from "../_shared/schemas.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// social-publish-post creates/publishes content — shape is account + caption
const SocialPublishPostSchema = z.object({
  social_account_id: UUID,
  caption: NonEmptyString.max(5000),
  image_url: z.string().url().optional(),
  scheduled_for: z.string().optional(),
});

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'social-publish-post');
  const log = makeLogger(ctx);
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
    const { data: userData, error: cErr } = await userClient.auth.getUser(token);
    if (cErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }
    const userId = userData.user.id;

    let parsedBody: { social_account_id: string; caption: string; image_url?: string; scheduled_for?: string };
    try {
      const raw = await req.json().catch(() => ({}));
      parsedBody = parseOrThrow(SocialPublishPostSchema, raw);
    } catch (err) {
      const vr = validationErrorResponse(err, cors);
      if (vr) return vr;
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: cors });
    }
    const { social_account_id, caption, image_url, scheduled_for } = parsedBody;

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
