import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { connection_id } = await req.json();
    if (!connection_id) {
      return new Response(JSON.stringify({ error: "Missing connection_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ads-disconnect error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
