// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

serve(async (req) => {
  const ctx = newRequestContext(req, 'ads-disconnect');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { connection_id } = await req.json();
    if (!connection_id) {
      return new Response(JSON.stringify({ error: "Missing connection_id" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Get connection to revoke tokens
    const { data: connection } = await supabase
      .from("ad_platform_connections")
      .select("*")
      .eq("id", connection_id)
      .single();

    if (connection) {
      // Revoke Google token
      if (connection.platform === "google_ads" && connection.access_token) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.access_token}`, {
            method: "POST",
          });
        } catch (e) {
          console.warn("Google token revocation failed (non-critical):", e);
        }
      }
    }

    // Update status to disconnected
    const { error } = await supabase
      .from("ad_platform_connections")
      .update({
        status: "disconnected",
        access_token: "revoked",
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection_id);

    if (error) {
      return new Response(JSON.stringify({ error: "Failed to disconnect" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("ads-disconnect error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
