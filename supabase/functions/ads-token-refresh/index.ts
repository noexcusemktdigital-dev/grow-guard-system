// @ts-nocheck
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
/**
 * ads-token-refresh
 * Cron job que renova tokens Meta Ads próximos de expirar.
 *
 * Busca ads_connections com token expirando em < 7 dias e tenta renovar.
 * Se falhar: marca status='expired' e envia alerta WhatsApp via Evolution API.
 *
 * verify_jwt=false — protegido por CRON_SECRET no header Authorization.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { maskPhone } from "../_shared/redact.ts";
import { logJobFailure } from "../_shared/job-failures.ts";

const EVO_URL = "https://evo.grupolamadre.com.br";
const EVO_INSTANCE = "noe-teste";
const EVO_KEY = "izitech_evo_key_2026";
const ALERT_MSG =
  "⚠️ Sua conexão com o Meta Ads expirou. Reconecte em: https://sistema.noexcusedigital.com.br/franqueado/anuncios";

interface AdsConnection {
  id: string;
  org_id: string;
  provider: string;
  ad_account_id: string;
  ad_account_name: string | null;
  access_token: string;
  token_expires_at: string | null;
  connected_by: string | null;
}

interface RefreshResult {
  id: string;
  status: "renewed" | "expired" | "skipped";
  reason?: string;
}

serve(async (req: Request) => {
  const ctx = newRequestContext(req, 'ads-token-refresh');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  // ── Auth: CRON_SECRET ──────────────────────────────────────────────────────
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization") ?? "";
  const providedSecret = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!cronSecret || providedSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const metaAppId = Deno.env.get("META_APP_ID")!;
  const metaAppSecret = Deno.env.get("META_APP_SECRET")!;

  const supabase = createClient(supabaseUrl, serviceKey);

  // 1. Find active connections expiring within 7 days
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: connections, error: fetchError } = await supabase
    .from("ads_connections")
    .select("id, org_id, provider, ad_account_id, ad_account_name, access_token, token_expires_at, connected_by")
    .eq("status", "active")
    .not("token_expires_at", "is", null)
    .lt("token_expires_at", sevenDaysFromNow)
    .order("token_expires_at", { ascending: true })
    .limit(50);

  if (fetchError) {
    console.error("Failed to fetch expiring connections:", fetchError);
    return new Response(
      JSON.stringify({ error: "Failed to fetch connections", detail: fetchError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!connections || connections.length === 0) {
    return new Response(
      JSON.stringify({ message: "No connections expiring within 7 days", processed: 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log(`Processing ${connections.length} expiring connections`);

  const results: RefreshResult[] = [];

  for (const conn of connections as AdsConnection[]) {
    if (conn.provider !== "meta") {
      results.push({ id: conn.id, status: "skipped", reason: "provider_not_meta" });
      continue;
    }

    try {
      // 2. Attempt Meta long-lived token exchange
      // Long-lived tokens can be renewed by exchanging them for a new long-lived token
      const refreshRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${metaAppId}` +
        `&client_secret=${metaAppSecret}` +
        `&fb_exchange_token=${conn.access_token}`
      );
      const refreshData = await refreshRes.json();

      if (refreshRes.ok && refreshData.access_token) {
        // Renewal successful — update token and expiry
        const newExpiresAt = refreshData.expires_in
          ? new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
          : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days fallback

        const { error: updateError } = await supabase
          .from("ads_connections")
          .update({
            access_token: refreshData.access_token,
            token_expires_at: newExpiresAt,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", conn.id);

        if (updateError) {
          console.error(`Failed to update token for conn ${conn.id}:`, updateError);
          results.push({ id: conn.id, status: "expired", reason: "db_update_failed" });
        } else {
          console.log(`Renewed token for conn ${conn.id}, expires ${newExpiresAt}`);
          results.push({ id: conn.id, status: "renewed" });
        }
      } else {
        // Renewal failed — mark as expired and send WhatsApp alert
        console.error(`Token refresh failed for conn ${conn.id}:`, refreshData);

        const { error: expireError } = await supabase
          .from("ads_connections")
          .update({
            status: "expired",
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", conn.id);

        if (expireError) {
          console.error(`Failed to mark conn ${conn.id} as expired:`, expireError);
        }

        // Send WhatsApp alert to connected_by user
        await sendWhatsAppAlert(supabase, conn);

        results.push({ id: conn.id, status: "expired", reason: "refresh_api_failed" });
      }
    } catch (err: unknown) {
      console.error(`Unexpected error processing conn ${conn.id}:`, err);
      await logJobFailure({ jobName: 'ads-token-refresh', jobKind: 'cron', payload: { conn_id: conn.id, org_id: conn.org_id } }, err);

      // Mark as expired on unexpected error
      await supabase
        .from("ads_connections")
        .update({ status: "expired" })
        .eq("id", conn.id);

      await sendWhatsAppAlert(supabase, conn);
      results.push({ id: conn.id, status: "expired", reason: "unexpected_error" });
    }
  }

  // Also cleanup expired OAuth states
  await supabase.rpc("cleanup_ads_oauth_states").catch((e: unknown) =>
    console.warn("Cleanup states failed (non-critical):", e)
  );

  const summary = {
    processed: results.length,
    renewed: results.filter((r) => r.status === "renewed").length,
    expired: results.filter((r) => r.status === "expired").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    results,
  };

  console.log("ads-token-refresh summary:", JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// ── WhatsApp alert via Evolution API ─────────────────────────────────────────

async function sendWhatsAppAlert(
  supabase: ReturnType<typeof createClient>,
  conn: AdsConnection
): Promise<void> {
  if (!conn.connected_by) {
    console.warn(`No connected_by for conn ${conn.id} — skipping WhatsApp alert`);
    return;
  }

  try {
    // Fetch user phone from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("phone, full_name")
      .eq("id", conn.connected_by)
      .single();

    if (profileError || !profile?.phone) {
      console.warn(
        `No phone for user ${conn.connected_by} — skipping WhatsApp alert:`,
        profileError?.message
      );
      return;
    }

    // Normalize phone: remove non-digits, ensure country code
    const rawPhone = profile.phone.replace(/\D/g, "");
    const phone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;

    const alertText = ALERT_MSG;

    const evoRes = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVO_KEY,
      },
      body: JSON.stringify({
        number: phone,
        text: alertText,
      }),
    });

    if (!evoRes.ok) {
      const errBody = await evoRes.text();
      console.error(
        `WhatsApp alert failed for user ${conn.connected_by} (${maskPhone(phone)}):`,
        evoRes.status,
        errBody
      );
    } else {
      console.log(`WhatsApp alert sent to ${maskPhone(phone)} for conn ${conn.id}`);
    }
  } catch (e: unknown) {
    console.error(`WhatsApp alert error for conn ${conn.id}:`, e);
  }
}
