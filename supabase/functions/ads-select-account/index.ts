import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { connection_id, account_id, account_name } = await req.json();

    if (!connection_id || !account_id) {
      return new Response(JSON.stringify({ error: "Missing connection_id or account_id" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Verify the connection exists and is pending
    const { data: conn, error: connError } = await supabase
      .from("ad_platform_connections")
      .select("id, status, platform")
      .eq("id", connection_id)
      .single();

    if (connError || !conn) {
      return new Response(JSON.stringify({ error: "Connection not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
