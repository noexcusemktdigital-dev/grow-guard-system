// @ts-nocheck
// ══════════════════════════════════════════════════════════
// NOE: IZITECH Provision Proxy
// ══════════════════════════════════════════════════════════
// Proxies requests to IZITECH Connect's provision-instance API.
// Creates WhatsApp instances with webhooks auto-pointing to NOE.
// ══════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

const IZITECH_URL = "https://mdmhsqcfmpyufohxjsrv.supabase.co/functions/v1/provision-instance";

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'izitech-provision');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Verify user auth ──
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser(token);
    if (authErr || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    // ── Get user's org ──
    const { data: member } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!member?.organization_id) {
      return json({ error: "No organization found" }, 404);
    }

    const orgId = member.organization_id;
    const body = await req.json();
    const { action, instance_name } = body;

    if (!action) return json({ error: "Missing action" }, 400);
    if (!instance_name && !["list", "cleanup"].includes(action)) {
      return json({ error: "Missing instance_name" }, 400);
    }

    const sanitizedName = instance_name
      ? String(instance_name).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      : "";

    // ── Build webhook URL for NOE (this system) ──
    const noeWebhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook/${orgId}`;

    // ── Call IZITECH provision API ──
    const izitechKey = Deno.env.get("IZITECH_CROSS_API_KEY") || "";
    const evolutionWebhookSecret = Deno.env.get("EVOLUTION_WEBHOOK_SECRET") || "";
    if (!izitechKey) return json({ error: "IZITECH integration not configured" }, 500);

    const izitechRes = await fetch(IZITECH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": izitechKey },
      body: JSON.stringify({
        action,
        instance_name: instance_name || undefined,
        customer_webhook_url: noeWebhookUrl,
        webhook_headers: evolutionWebhookSecret ? { "x-evolution-secret": evolutionWebhookSecret } : undefined,
      }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await izitechRes.json().catch(() => ({ error: "Invalid response from IZITECH" }));

    // ── Sync local DB (errors here must NOT fail the response) ──
    try {
      if (action === "create" && data.success && data.instance) {
        await supabase.from("whatsapp_instances").upsert({
          organization_id: orgId, instance_id: sanitizedName,
          label: instance_name, provider: "evolution", status: "pending",
          webhook_url: noeWebhookUrl, base_url: "https://evo.grupolamadre.com.br",
          token: "managed-by-izitech", client_token: "managed-by-izitech",
        }, { onConflict: "organization_id,instance_id", ignoreDuplicates: false });
      }

      if (["qr", "status", "reconnect"].includes(action) && data.status === "connected") {
        await supabase.from("whatsapp_instances").update({
          status: "connected", phone_number: data.phone_number || null,
        }).eq("organization_id", orgId).eq("instance_id", sanitizedName);
      }

      if (action === "disconnect" && data.success) {
        await supabase.from("whatsapp_instances").update({
          status: "disconnected", phone_number: null,
        }).eq("organization_id", orgId).eq("instance_id", sanitizedName);
      }

      if (action === "reconnect" && data.success) {
        await supabase.from("whatsapp_instances").update({
          status: "pending",
        }).eq("organization_id", orgId).eq("instance_id", sanitizedName);
      }

      if (action === "delete" && data.success) {
        await supabase.from("whatsapp_instances").delete()
          .eq("organization_id", orgId).eq("instance_id", sanitizedName);
      }

      if (action === "restart" && data.success) {
        await supabase.from("whatsapp_instances").update({
          status: "pending",
        }).eq("organization_id", orgId).eq("instance_id", sanitizedName);
      }
    } catch (dbErr: unknown) {
      // Log DB sync failure but don't fail the response — IZITECH already processed the action
      console.error("[izitech-provision] DB sync error (non-fatal):", dbErr instanceof Error ? dbErr.message : String(dbErr));
    }

    return json(data, izitechRes.status);
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("[izitech-provision] Error:", errMsg);
    return json({ error: errMsg || "Internal error" }, 500);
  }
});
