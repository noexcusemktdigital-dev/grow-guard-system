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
    const { instanceId, instanceToken, clientToken, action, label, provider = "zapi", baseUrl, apiKey, instanceName } = body;

    const isEvolution = provider === "evolution";

    // ─── Action: disconnect ───
    if (action === "disconnect") {
      if (instanceId) {
        await adminClient.from("whatsapp_instances").delete().eq("instance_id", instanceId).eq("organization_id", orgId);
      } else {
        await adminClient.from("whatsapp_instances").delete().eq("organization_id", orgId);
      }
      return new Response(JSON.stringify({ success: true, status: "disconnected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Action: check-status ───
    if (action === "check-status") {
      let instances: any[] = [];
      if (instanceId) {
        const { data } = await adminClient.from("whatsapp_instances").select("*").eq("organization_id", orgId).eq("instance_id", instanceId).maybeSingle();
        if (data) instances = [data];
      } else {
        const { data } = await adminClient.from("whatsapp_instances").select("*").eq("organization_id", orgId);
        instances = data || [];
      }

      if (instances.length === 0) {
        return new Response(JSON.stringify({ status: "not_configured", results: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: any[] = [];

      for (const inst of instances) {
        try {
          let connected = false;
          let phoneNumber = inst.phone_number || null;

          if (inst.provider === "evolution") {
            // Evolution API status check
            console.log("[check-status] Evolution calling", `${inst.base_url}/instance/connectionState/${inst.instance_id}`);
            const stateRes = await fetch(`${inst.base_url}/instance/connectionState/${inst.instance_id}`, {
              headers: { apikey: inst.client_token },
            });
            const stateData = await stateRes.json();
            console.log("[check-status] Evolution connectionState for", inst.instance_id, ":", JSON.stringify(stateData));
            connected = stateData?.instance?.state === "open" || stateData?.state === "open" || stateData?.status === "CONNECTED";

            // Fallback: if 404 (instance not found), try listing all instances
            if (!connected && (stateRes.status === 404 || stateData?.error || stateData?.message?.includes("does not exist"))) {
              console.log("[check-status] Evolution instance not found, trying fetchInstances fallback");
              try {
                const listRes = await fetch(`${inst.base_url}/instance/fetchInstances`, {
                  headers: { apikey: inst.client_token },
                });
                if (listRes.ok) {
                  const allInstances = await listRes.json();
                  console.log("[check-status] Evolution all instances:", JSON.stringify(allInstances?.map?.((i: any) => i.instance?.instanceName || i.instanceName) || allInstances));
                  // Find by case-insensitive name match
                  const match = (Array.isArray(allInstances) ? allInstances : []).find((i: any) => {
                    const name = i.instance?.instanceName || i.instanceName || "";
                    return name.toLowerCase() === inst.instance_id.toLowerCase();
                  });
                  if (match) {
                    const matchState = match.instance?.state || match.state || "";
                    connected = matchState === "open" || matchState === "CONNECTED";
                    console.log("[check-status] Evolution fallback matched:", match.instance?.instanceName || match.instanceName, "state:", matchState, "connected:", connected);
                  } else {
                    console.log("[check-status] Evolution fallback: no match found for", inst.instance_id);
                  }
                }
              } catch (fallbackErr) {
                console.error("[check-status] Evolution fetchInstances fallback error:", fallbackErr);
              }
            }
          } else {
            // Z-API status check
            const statusRes = await fetch(
              `https://api.z-api.io/instances/${inst.instance_id}/token/${inst.token}/status`,
              { headers: { "Client-Token": inst.client_token } }
            );
            const statusData = await statusRes.json();
            console.log("[check-status] Z-API /status for", inst.instance_id, ":", JSON.stringify(statusData));
            connected = statusData.connected === true;

            if (connected) {
              try {
                const deviceRes = await fetch(
                  `https://api.z-api.io/instances/${inst.instance_id}/token/${inst.token}/device`,
                  { headers: { "Client-Token": inst.client_token } }
                );
                const deviceData = await deviceRes.json();
                if (deviceData.phone) phoneNumber = deviceData.phone;
              } catch {}
              if (!phoneNumber) {
                try {
                  const phoneRes = await fetch(
                    `https://api.z-api.io/instances/${inst.instance_id}/token/${inst.token}/phone`,
                    { headers: { "Client-Token": inst.client_token } }
                  );
                  const phoneData = await phoneRes.json();
                  if (phoneData.phone) phoneNumber = phoneData.phone;
                } catch {}
              }
            }
          }

          await adminClient.from("whatsapp_instances").update({
            status: connected ? "connected" : "disconnected",
            phone_number: phoneNumber,
          }).eq("id", inst.id);

          results.push({
            id: inst.id,
            instance_id: inst.instance_id,
            status: connected ? "connected" : "disconnected",
            phone: phoneNumber,
            label: inst.label,
            provider: inst.provider,
          });
        } catch (err) {
          console.error("[check-status] Error checking instance", inst.instance_id, "provider", inst.provider, ":", err);
          results.push({
            id: inst.id,
            instance_id: inst.instance_id,
            status: inst.status,
            phone: inst.phone_number,
            label: inst.label,
            provider: inst.provider,
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

    // ─── Action: connect (default) ───
    if (isEvolution) {
      // Evolution API connect
      if (!baseUrl || !apiKey || !instanceName) {
        return new Response(JSON.stringify({ error: "baseUrl, apiKey, and instanceName are required for Evolution" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
      const webhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook/${orgId}`;

      // Step 1: Create instance on Evolution API (ignore if already exists)
      try {
        console.log("[connect] Evolution creating instance:", instanceName);
        const createRes = await fetch(`${cleanBaseUrl}/instance/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: apiKey },
          body: JSON.stringify({ instanceName, token: apiKey, qrcode: true }),
        });
        const createData = await createRes.json();
        console.log("[connect] Evolution create response:", createRes.status, JSON.stringify(createData));
        if (!createRes.ok && createRes.status !== 403 && createRes.status !== 409) {
          console.warn("[connect] Evolution create non-fatal error:", createRes.status);
        }
      } catch (err) {
        console.error("[connect] Failed to create Evolution instance:", err);
      }

      // Step 2: Configure webhook on Evolution API
      try {
        await fetch(`${cleanBaseUrl}/webhook/set/${instanceName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: apiKey },
          body: JSON.stringify({
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: false,
            events: [
              "MESSAGES_UPSERT",
              "MESSAGES_UPDATE",
              "CONNECTION_UPDATE",
              "QRCODE_UPDATED",
            ],
          }),
        });
      } catch (err) {
        console.error("Failed to configure Evolution webhooks:", err);
      }

      // Check connection state (with fetchInstances fallback)
      let connStatus = "disconnected";
      try {
        console.log("[connect] Evolution checking state at", `${cleanBaseUrl}/instance/connectionState/${instanceName}`);
        const stateRes = await fetch(`${cleanBaseUrl}/instance/connectionState/${instanceName}`, {
          headers: { apikey: apiKey },
        });
        const stateData = await stateRes.json();
        console.log("[connect] Evolution connectionState:", JSON.stringify(stateData));
        if (stateData?.instance?.state === "open" || stateData?.state === "open" || stateData?.status === "CONNECTED") {
          connStatus = "connected";
        }

        // Fallback: if instance not found, try listing all instances
        if (connStatus === "disconnected" && (stateRes.status === 404 || stateData?.response?.message?.[0]?.includes("does not exist"))) {
          console.log("[connect] Evolution instance not found, trying fetchInstances fallback");
          try {
            const listRes = await fetch(`${cleanBaseUrl}/instance/fetchInstances`, {
              headers: { apikey: apiKey },
            });
            if (listRes.ok) {
              const allInstances = await listRes.json();
              const names = (Array.isArray(allInstances) ? allInstances : []).map((i: any) => i.instance?.instanceName || i.instanceName || "?");
              console.log("[connect] Evolution available instances:", JSON.stringify(names));
              const match = (Array.isArray(allInstances) ? allInstances : []).find((i: any) => {
                const name = i.instance?.instanceName || i.instanceName || "";
                return name.toLowerCase() === instanceName.toLowerCase();
              });
              if (match) {
                const matchState = match.instance?.state || match.state || "";
                connStatus = (matchState === "open" || matchState === "CONNECTED") ? "connected" : "disconnected";
                console.log("[connect] Evolution fallback matched:", match.instance?.instanceName || match.instanceName, "state:", matchState, "connected:", connStatus);
              } else {
                console.log("[connect] Evolution fallback: no match for", instanceName, "— available:", JSON.stringify(names));
              }
            } else {
              const listBody = await listRes.text();
              console.error("[connect] Evolution fetchInstances failed:", listRes.status, listBody);
            }
          } catch (fallbackErr) {
            console.error("[connect] Evolution fetchInstances error:", fallbackErr);
          }
        }
      } catch (err) {
        console.error("[connect] Evolution connectionState error:", err);
      }

      // Upsert instance
      const { data: existing } = await adminClient
        .from("whatsapp_instances")
        .select("id")
        .eq("organization_id", orgId)
        .eq("instance_id", instanceName)
        .eq("provider", "evolution")
        .maybeSingle();

      const instanceData = {
        token: apiKey,
        client_token: apiKey,
        status: connStatus,
        phone_number: null,
        webhook_url: webhookUrl,
        label: label || instanceName,
        provider: "evolution",
        base_url: cleanBaseUrl,
      };

      if (existing) {
        await adminClient.from("whatsapp_instances").update(instanceData).eq("id", existing.id);
      } else {
        await adminClient.from("whatsapp_instances").insert({
          ...instanceData,
          organization_id: orgId,
          instance_id: instanceName,
        });
      }

      return new Response(
        JSON.stringify({ success: true, status: connStatus, phone: null, webhookUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Z-API connect (original logic) ───
    if (!instanceId || !instanceToken || !clientToken) {
      return new Response(JSON.stringify({ error: "instanceId, instanceToken, and clientToken are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook/${orgId}`;

    // Configure webhooks on Z-API
    try {
      const webhookEndpoints = [
        "update-webhook-received-delivery",
        "update-webhook-status",
        "update-webhook-send",
        "update-webhook-chat-presence",
        "update-webhook-disconnected",
        "update-webhook-connected",
      ];
      await Promise.all(
        webhookEndpoints.map((ep) =>
          fetch(
            `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/${ep}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json", "Client-Token": clientToken },
              body: JSON.stringify({ value: webhookUrl }),
            }
          )
        )
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
          if (deviceData.phone) phoneNumber = deviceData.phone;
        } catch {}
      }
    } catch {}

    // Upsert by instance_id
    const { data: existing } = await adminClient
      .from("whatsapp_instances")
      .select("id")
      .eq("organization_id", orgId)
      .eq("instance_id", instanceId)
      .maybeSingle();

    const instanceData = {
      token: instanceToken,
      client_token: clientToken,
      status: connStatus,
      phone_number: phoneNumber,
      webhook_url: webhookUrl,
      label: label || null,
      provider: "zapi",
      base_url: null,
    };

    if (existing) {
      await adminClient.from("whatsapp_instances").update(instanceData).eq("id", existing.id);
    } else {
      await adminClient.from("whatsapp_instances").insert({
        ...instanceData,
        organization_id: orgId,
        instance_id: instanceId,
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
