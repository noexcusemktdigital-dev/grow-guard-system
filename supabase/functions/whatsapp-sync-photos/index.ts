import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: orgId } = await adminClient.rpc("get_user_org_id", { _user_id: userId });
    if (!orgId) {
      return new Response(JSON.stringify({ error: "No org" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 30;

    // Find connected instance
    const { data: instance } = await adminClient
      .from("whatsapp_instances")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "connected")
      .limit(1)
      .maybeSingle();

    if (!instance) {
      return new Response(JSON.stringify({ error: "No connected instance" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get contacts without photos, ordered by most recent
    const { data: contacts } = await adminClient
      .from("whatsapp_contacts")
      .select("id, phone")
      .eq("organization_id", orgId)
      .is("photo_url", null)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ success: true, updated: 0, message: "All contacts already have photos" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zapiBase = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
    const zapiHeaders: Record<string, string> = { "Client-Token": instance.client_token };

    let updated = 0;
    let failed = 0;

    for (const contact of contacts) {
      try {
        const res = await fetch(`${zapiBase}/profile-picture?phone=${contact.phone}`, {
          headers: zapiHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          const picUrl = data?.link || data?.imgUrl || data?.profilePictureUrl || null;
          if (picUrl) {
            await adminClient
              .from("whatsapp_contacts")
              .update({ photo_url: picUrl })
              .eq("id", contact.id);
            updated++;
          }
        }
      } catch {
        failed++;
      }
      // Rate limit: 200ms between requests
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`[sync-photos] Done: ${updated} updated, ${failed} failed out of ${contacts.length}`);

    return new Response(JSON.stringify({
      success: true,
      updated,
      failed,
      total: contacts.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[sync-photos] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
