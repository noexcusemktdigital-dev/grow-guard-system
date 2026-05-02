// social-process-scheduled — worker chamado por cron a cada minuto
// Pega posts agendados vencidos, marca como publishing, publica via Graph API
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from "../_shared/correlation.ts";
import { publishToPlatform } from "../_shared/socialPublish.ts";

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'social-process-scheduled');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supaUrl, service);

  const nowIso = new Date().toISOString();

  // Buscar posts vencidos
  const { data: due, error } = await admin
    .from("social_scheduled_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", nowIso)
    .lt("attempts", 3)
    .limit(20);

  if (error) {
    console.error("[worker] fetch error", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });
  }

  let success = 0;
  let failed = 0;

  for (const post of due ?? []) {
    // Lock
    await admin
      .from("social_scheduled_posts")
      .update({ status: "publishing", attempts: (post.attempts ?? 0) + 1 })
      .eq("id", post.id);

    try {
      const { data: account } = await admin
        .from("social_accounts")
        .select("*")
        .eq("id", post.social_account_id)
        .maybeSingle();
      if (!account) throw new Error("Conta social removida");

      const platformPostId = await publishToPlatform(account, post.caption ?? "", post.image_url ?? undefined);

      await admin
        .from("social_scheduled_posts")
        .update({
          status: "published",
          platform_post_id: platformPostId,
          published_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", post.id);
      success++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[worker] publish failed", post.id, msg);
      const willRetry = (post.attempts ?? 0) + 1 < 3;
      await admin
        .from("social_scheduled_posts")
        .update({
          status: willRetry ? "scheduled" : "failed",
          error_message: msg,
        })
        .eq("id", post.id);
      failed++;
    }
  }

  return new Response(JSON.stringify({ processed: due?.length ?? 0, success, failed }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
