// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkCronSecret } from "../_shared/cron-auth.ts";
import { logJobFailure } from "../_shared/job-failures.ts";

// ============================================================
// social-token-refresh
// Cron job: proactively refresh social tokens expiring within 7 days.
// Called by pg_cron — no JWT, verify_jwt = false.
//
// Behavior per platform:
//   - facebook / instagram (Meta): long-lived tokens (60 days) —
//     extend by calling fb_exchange_token
//   - linkedin: tokens cannot be refreshed via API —
//     mark status = 'expired' so the UI prompts re-auth
// ============================================================

interface SocialAccount {
  id: string;
  organization_id: string;
  platform: string;
  account_id: string;
  access_token: string;
  token_expires_at: string | null;
  status: string;
}

interface RefreshSummary {
  refreshed: number;
  expired: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const authError = checkCronSecret(req);
  if (authError) return authError;

  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  // Fail-closed: require all env vars
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const metaClientId = Deno.env.get("META_CLIENT_ID");
  const metaClientSecret = Deno.env.get("META_CLIENT_SECRET");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("social-token-refresh: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(
      JSON.stringify({ error: "Server misconfigured" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const summary: RefreshSummary = { refreshed: 0, expired: 0, errors: [] };

  try {
    // Find all active accounts expiring within 7 days
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: accounts, error: fetchError } = await supabase
      .from("social_accounts")
      .select("id, organization_id, platform, account_id, access_token, token_expires_at, status")
      .eq("status", "active")
      .lt("token_expires_at", sevenDaysFromNow);

    if (fetchError) {
      console.error("social-token-refresh: failed to fetch accounts:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch accounts", detail: fetchError.message }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    if (!accounts || accounts.length === 0) {
      console.log("social-token-refresh: no accounts require refresh");
      return new Response(JSON.stringify(summary), {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    console.log(`social-token-refresh: processing ${accounts.length} account(s)`);

    for (const account of accounts as SocialAccount[]) {
      const { id, platform, access_token } = account;

      // ---- Meta (facebook / instagram) — extend long-lived token ----
      if (platform === "facebook" || platform === "instagram") {
        if (!metaClientId || !metaClientSecret) {
          const msg = `Account ${id} (${platform}): META credentials not configured, skipping`;
          console.warn(msg);
          summary.errors.push(msg);
          continue;
        }

        try {
          const res = await fetch(
            `https://graph.facebook.com/v25.0/oauth/access_token?` +
              new URLSearchParams({
                grant_type: "fb_exchange_token",
                client_id: metaClientId,
                client_secret: metaClientSecret,
                fb_exchange_token: access_token,
              }),
          );
          const data = await res.json();

          if (!res.ok || !data.access_token) {
            const msg = `Account ${id} (${platform}): token extension failed — ${JSON.stringify(data)}`;
            console.error(msg);
            summary.errors.push(msg);
            continue;
          }

          const newExpiresAt = data.expires_in
            ? new Date(Date.now() + data.expires_in * 1000).toISOString()
            : null;

          const { error: updateError } = await supabase
            .from("social_accounts")
            .update({
              access_token: data.access_token,
              token_expires_at: newExpiresAt,
              status: "active",
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          if (updateError) {
            const msg = `Account ${id} (${platform}): DB update failed — ${updateError.message}`;
            console.error(msg);
            summary.errors.push(msg);
          } else {
            console.log(`Account ${id} (${platform}): token refreshed, expires ${newExpiresAt}`);
            summary.refreshed++;
          }
        } catch (err) {
          const msg = `Account ${id} (${platform}): unexpected error — ${String(err)}`;
          console.error(msg);
          summary.errors.push(msg);
        }
        continue;
      }

      // ---- LinkedIn — cannot refresh, mark as expired ----
      if (platform === "linkedin") {
        try {
          const { error: updateError } = await supabase
            .from("social_accounts")
            .update({
              status: "expired",
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          if (updateError) {
            const msg = `Account ${id} (linkedin): DB update failed — ${updateError.message}`;
            console.error(msg);
            summary.errors.push(msg);
          } else {
            console.log(`Account ${id} (linkedin): marked as expired (LinkedIn tokens cannot be refreshed)`);
            summary.expired++;
          }
        } catch (err) {
          const msg = `Account ${id} (linkedin): unexpected error — ${String(err)}`;
          console.error(msg);
          summary.errors.push(msg);
        }
        continue;
      }

      // Unknown platform — log and skip
      const msg = `Account ${id}: unhandled platform '${platform}', skipping`;
      console.warn(msg);
      summary.errors.push(msg);
    }

    console.log(
      `social-token-refresh done: refreshed=${summary.refreshed} expired=${summary.expired} errors=${summary.errors.length}`,
    );

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    await logJobFailure({ jobName: 'social-token-refresh', jobKind: 'cron' }, err);
    console.error("social-token-refresh unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", detail: String(err) }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
