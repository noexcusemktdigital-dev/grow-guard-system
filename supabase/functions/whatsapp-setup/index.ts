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
      return new Response(JSON.stringify({ error: "User has no organization" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { instanceId, instanceToken, clientToken, action } = await req.json();

    // Action: disconnect
    if (action === "disconnect") {
      await adminClient
        .from("whatsapp_instances")
        .delete()
        .eq("organization_id", orgId);

      return new Response(JSON.stringify({ success: true, status: "disconnected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: check status
    if (action === "check-status") {
      const { data: instance } = await adminClient
        .from("whatsapp_instances")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();

      if (!instance) {
        return new Response(JSON.stringify({ status: "not_configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check Z-API connection status
      try {
        const statusRes = await fetch(
          `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/status`,
          { headers: { "Client-Token": instance.client_token } }
        );
        const statusData = await statusRes.json();
        const connected = statusData.connected === true;
        const phoneNumber = statusData.phoneConnected || instance.phone_number || null;

        await adminClient
          .from("whatsapp_instances")
          .update({
            status: connected ? "connected" : "disconnected",
            phone_number: phoneNumber,
          })
          .eq("id", instance.id);

        return new Response(JSON.stringify({
          status: connected ? "connected" : "disconnected",
          phone: statusData.phoneConnected || null,
          details: statusData,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ status: instance.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Action: connect (default) — save credentials + configure webhooks
    if (!instanceId || !instanceToken || !clientToken) {
      return new Response(JSON.stringify({ error: "instanceId, instanceToken, and clientToken are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook/${orgId}`;

    // Configure webhook on Z-API
    try {
      // Set received message webhook
      await fetch(
        `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/update-webhook-received`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Client-Token": clientToken },
          body: JSON.stringify({ value: webhookUrl }),
        }
      );

      // Set status webhook
      await fetch(
        `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/update-webhook-status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Client-Token": clientToken },
          body: JSON.stringify({ value: webhookUrl }),
        }
      );
    } catch (err) {
      console.error("Failed to configure Z-API webhooks:", err);
    }

    // Check connection status
    let connStatus = "disconnected";
    let phoneNumber = null;
    try {
      const statusRes = await fetch(
        `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/status`,
        { headers: { "Client-Token": clientToken } }
      );
      const statusData = await statusRes.json();
      if (statusData.connected) {
        connStatus = "connected";
        phoneNumber = statusData.phoneConnected || null;
      }
    } catch {
      // keep disconnected
    }

    // Upsert instance
    const { data: existing } = await adminClient
      .from("whatsapp_instances")
      .select("id")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (existing) {
      await adminClient
        .from("whatsapp_instances")
        .update({
          instance_id: instanceId,
          token: instanceToken,
          client_token: clientToken,
          status: connStatus,
          phone_number: phoneNumber,
          webhook_url: webhookUrl,
        })
        .eq("id", existing.id);
    } else {
      await adminClient
        .from("whatsapp_instances")
        .insert({
          organization_id: orgId,
          instance_id: instanceId,
          token: instanceToken,
          client_token: clientToken,
          status: connStatus,
          phone_number: phoneNumber,
          webhook_url: webhookUrl,
        });
    }

    return new Response(
      JSON.stringify({ success: true, status: connStatus, phone: phoneNumber, webhookUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
