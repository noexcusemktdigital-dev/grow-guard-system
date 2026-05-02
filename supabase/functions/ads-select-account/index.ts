// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

serve(async (req) => {
  const ctx = newRequestContext(req, 'ads-select-account');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate the calling user (SEC-001: prevents cross-org IDOR)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Use service role for subsequent DB operations
    const supabase = createClient(supabaseUrl, serviceKey);

    const { connection_id, account_id, account_name } = await req.json();

    if (!connection_id || !account_id) {
      return new Response(JSON.stringify({ error: "Missing connection_id or account_id" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Verify the connection exists and fetch its organization_id
    const { data: conn, error: connError } = await supabase
      .from("ad_platform_connections")
      .select("id, status, platform, organization_id")
      .eq("id", connection_id)
      .single();

    if (connError || !conn) {
      return new Response(JSON.stringify({ error: "Connection not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Verify calling user belongs to the connection's organization (IDOR protection)
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", conn.organization_id)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (conn.status !== "pending") {
      return new Response(JSON.stringify({ error: "Connection is not pending selection" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Update with chosen account
    const { error: updateError } = await supabase
      .from("ad_platform_connections")
      .update({
        account_id,
        account_name: account_name || `Meta Ads ${account_id}`,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection_id);

    if (updateError) {
      console.error("Failed to update connection:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save account selection" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ads-select-account error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
