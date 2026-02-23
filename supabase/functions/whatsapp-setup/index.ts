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

    const body = await req.json();
    const { instanceId, instanceToken, clientToken, action, label } = body;

    // Action: disconnect a specific instance
    if (action === "disconnect") {
      if (instanceId) {
        await adminClient
          .from("whatsapp_instances")
          .delete()
          .eq("instance_id", instanceId)
          .eq("organization_id", orgId);
      } else {
        // Legacy fallback: disconnect all
        await adminClient
          .from("whatsapp_instances")
          .delete()
          .eq("organization_id", orgId);
      }

      return new Response(JSON.stringify({ success: true, status: "disconnected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: check-status for a specific instance or all
    if (action === "check-status") {
      let instances: any[] = [];

      if (instanceId) {
        const { data } = await adminClient
          .from("whatsapp_instances")
          .select("*")
          .eq("organization_id", orgId)
          .eq("instance_id", instanceId)
          .maybeSingle();
        if (data) instances = [data];
      } else {
        const { data } = await adminClient
          .from("whatsapp_instances")
          .select("*")
          .eq("organization_id", orgId);
        instances = data || [];
      }

      if (instances.length === 0) {
        return new Response(JSON.stringify({ status: "not_configured", results: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: any[] = [];

      for (const instance of instances) {
        try {
          const statusRes = await fetch(
            `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/status`,
            { headers: { "Client-Token": instance.client_token } }
          );
          const statusData = await statusRes.json();
          const connected = statusData.connected === true;
          let phoneNumber = instance.phone_number || null;

          if (connected) {
            try {
              const deviceRes = await fetch(
                `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/device`,
                { headers: { "Client-Token": instance.client_token } }
              );
              const deviceData = await deviceRes.json();
              console.log("[check-status] /device response for", instance.instance_id, ":", JSON.stringify(deviceData));
              if (deviceData.phone) {
                phoneNumber = deviceData.phone;
              }
            } catch (err) {
              console.error("Failed to fetch device info:", err);
            }
          }

          await adminClient
            .from("whatsapp_instances")
            .update({
              status: connected ? "connected" : "disconnected",
              phone_number: phoneNumber,
            })
            .eq("id", instance.id);

          results.push({
            id: instance.id,
            instance_id: instance.instance_id,
            status: connected ? "connected" : "disconnected",
            phone: phoneNumber,
            label: instance.label,
          });
        } catch {
          results.push({
            id: instance.id,
            instance_id: instance.instance_id,
            status: instance.status,
            phone: instance.phone_number,
            label: instance.label,
          });
        }
      }

      return new Response(JSON.stringify({
        status: results[0]?.status || "unknown",
        phone: results[0]?.phone,
        results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      await fetch(
        `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/update-webhook-received`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Client-Token": clientToken },
          body: JSON.stringify({ value: webhookUrl }),
        }
      );

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
        try {
          const deviceRes = await fetch(
            `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/device`,
            { headers: { "Client-Token": clientToken } }
          );
          const deviceData = await deviceRes.json();
          console.log("[connect] /device response:", JSON.stringify(deviceData));
          if (deviceData.phone) {
            phoneNumber = deviceData.phone;
          }
        } catch {
          // device endpoint failed, continue without phone
        }
      }
    } catch {
      // keep disconnected
    }

    // Upsert by instance_id (not organization_id) to support multiple instances
    const { data: existing } = await adminClient
      .from("whatsapp_instances")
      .select("id")
      .eq("organization_id", orgId)
      .eq("instance_id", instanceId)
      .maybeSingle();

    if (existing) {
      await adminClient
        .from("whatsapp_instances")
        .update({
          token: instanceToken,
          client_token: clientToken,
          status: connStatus,
          phone_number: phoneNumber,
          webhook_url: webhookUrl,
          label: label || null,
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
          label: label || null,
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
