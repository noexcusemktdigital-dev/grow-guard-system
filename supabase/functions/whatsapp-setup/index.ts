// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { maskPhone, redact } from '../_shared/redact.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'whatsapp-setup');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const evolutionWebhookSecret = Deno.env.get("EVOLUTION_WEBHOOK_SECRET") || "";

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized", detail: claimsError?.message }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: orgId } = await adminClient.rpc("get_user_org_id", { _user_id: userId, _portal: "saas" });
    if (!orgId) {
      return new Response(JSON.stringify({ error: "User has no organization" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      instanceId,
      instanceToken,
      clientToken,
      action,
      label,
      provider = "zapi",
      baseUrl,
      apiKey,
      instanceName,
      // ── WhatsApp Cloud (Meta) ──
      wabaId,
      phoneNumberId,
      businessAccountId,
      verifiedName,
      displayName,
      accessToken,
      cloudMetadata,
    } = body;

    const isEvolution = provider === "evolution";
    const isCloud = provider === "whatsapp_cloud";

    // ─── WhatsApp Cloud API (Meta) branch ───
    if (isCloud) {
      const projectUrl = supabaseUrl;
      const webhookUrl = `${projectUrl}/functions/v1/whatsapp-cloud-webhook`;

      // disconnect
      if (action === "disconnect") {
        if (instanceId || phoneNumberId) {
          await adminClient
            .from("whatsapp_instances")
            .delete()
            .eq("organization_id", orgId)
            .eq("provider", "whatsapp_cloud")
            .or(`instance_id.eq.${instanceId || phoneNumberId},phone_number_id.eq.${phoneNumberId || instanceId}`);
        } else {
          await adminClient
            .from("whatsapp_instances")
            .delete()
            .eq("organization_id", orgId)
            .eq("provider", "whatsapp_cloud");
        }
        return new Response(JSON.stringify({ success: true, status: "disconnected" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      // check-status — just returns the current row
      if (action === "check-status") {
        const { data: insts } = await adminClient
          .from("whatsapp_instances")
          .select("*")
          .eq("organization_id", orgId)
          .eq("provider", "whatsapp_cloud");
        return new Response(
          JSON.stringify({
            status: insts?.[0]?.status || "not_configured",
            results: (insts || []).map((i: Record<string, unknown>) => ({
              id: i.id,
              instance_id: i.instance_id,
              status: i.status,
              phone: i.phone_number,
              provider: i.provider,
              waba_id: i.waba_id,
              phone_number_id: i.phone_number_id,
              business_account_id: i.business_account_id,
              verified_name: i.verified_name,
            })),
          }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
        );
      }

      // default: connect / upsert
      if (!phoneNumberId) {
        return new Response(
          JSON.stringify({ error: "phoneNumberId is required for WhatsApp Cloud (Meta)" }),
          { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
        );
      }

      // Optional: validate token by hitting Graph API if access token provided
      let detectedDisplayPhone: string | null = null;
      let verifiedNameApi: string | null = null;
      const effectiveToken = accessToken || Deno.env.get("WHATSAPP_CLOUD_ACCESS_TOKEN") || "";
      let verificationStatus: "verified" | "pending" | "unknown" = "unknown";

      if (effectiveToken) {
        try {
          const ghRes = await fetch(
            `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name,code_verification_status,quality_rating`,
            { headers: { Authorization: `Bearer ${effectiveToken}` } },
          );
          const ghData = await ghRes.json();
          console.log("[whatsapp-cloud connect] phone number info:", ghRes.status, JSON.stringify(redact(ghData)));
          if (ghRes.ok) {
            detectedDisplayPhone = ghData?.display_phone_number || null;
            verifiedNameApi = ghData?.verified_name || null;
            verificationStatus = ghData?.code_verification_status === "VERIFIED" ? "verified" : "pending";
          }
        } catch (err) {
          console.error("[whatsapp-cloud connect] Graph API check failed:", err);
        }
      }

      const cloudData = {
        provider: "whatsapp_cloud",
        instance_id: phoneNumberId,
        phone_number_id: phoneNumberId,
        waba_id: wabaId || null,
        business_account_id: businessAccountId || wabaId || null,
        verified_name: verifiedName || verifiedNameApi || displayName || null,
        phone_number: detectedDisplayPhone,
        webhook_url: webhookUrl,
        status: "connected",
        label: label || verifiedName || displayName || phoneNumberId,
        cloud_metadata: {
          ...(cloudMetadata || {}),
          verification_status: verificationStatus,
          last_synced_at: new Date().toISOString(),
        },
        access_token_encrypted: accessToken || null, // TODO: encrypt server-side; storing per-org token
        token: "cloud", // unused — required NOT NULL? keep placeholder
        client_token: "cloud",
        base_url: "https://graph.facebook.com/v20.0",
      };

      const { data: existing } = await adminClient
        .from("whatsapp_instances")
        .select("id")
        .eq("organization_id", orgId)
        .eq("provider", "whatsapp_cloud")
        .eq("phone_number_id", phoneNumberId)
        .maybeSingle();

      if (existing) {
        await adminClient.from("whatsapp_instances").update(cloudData).eq("id", existing.id);
      } else {
        await adminClient.from("whatsapp_instances").insert({
          ...cloudData,
          organization_id: orgId,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "connected",
          provider: "whatsapp_cloud",
          phone: detectedDisplayPhone,
          phone_number_id: phoneNumberId,
          waba_id: wabaId,
          verified_name: verifiedName || verifiedNameApi,
          verification_status: verificationStatus,
          webhookUrl,
        }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // ─── Action: get-qr (Evolution only) ───
    if (action === "get-qr") {
      const { data: inst } = await adminClient
        .from("whatsapp_instances")
        .select("*")
        .eq("organization_id", orgId)
        .eq("instance_id", instanceName || instanceId)
        .eq("provider", "evolution")
        .maybeSingle();

      if (!inst) {
        return new Response(JSON.stringify({ error: "Evolution instance not found in database" }), {
          status: 404,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const cleanBase = (inst.base_url || baseUrl || "").replace(/\/+$/, "");
      const key = apiKey || inst.client_token;
      const encodedName = encodeURIComponent(inst.instance_id);

      // First check if already connected
      let instanceExists = true;
      try {
        const stateRes = await fetch(`${cleanBase}/instance/connectionState/${encodedName}`, {
          headers: { apikey: key },
        });
        const stateData = await stateRes.json();
        console.log("[get-qr] connectionState:", JSON.stringify(redact(stateData)));

        // Check if instance doesn't exist on server
        if (stateRes.status === 404 || stateData?.response?.message?.[0]?.includes("does not exist")) {
          instanceExists = false;
          console.log("[get-qr] Instance does not exist on server, will recreate");
        } else {
          const isOpen = stateData?.instance?.state === "open" || stateData?.state === "open" || stateData?.status === "CONNECTED";
          if (isOpen) {
            await adminClient.from("whatsapp_instances").update({ status: "connected" }).eq("id", inst.id);
            return new Response(JSON.stringify({ status: "connected", message: "Instance is already connected" }), {
              headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
            });
          }
        }
      } catch (err) {
        console.error("[get-qr] connectionState check error:", err);
      }

      // If instance doesn't exist, recreate it
      if (!instanceExists) {
        try {
          const webhookUrlEv = `${supabaseUrl}/functions/v1/evolution-webhook/${orgId}`;
          console.log("[get-qr] Recreating instance:", inst.instance_id);
          const createRes = await fetch(`${cleanBase}/instance/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: key },
            body: JSON.stringify({
              instanceName: inst.instance_id,
              integration: "WHATSAPP-BAILEYS",
              qrcode: true,
              webhook: {
                url: webhookUrlEv,
                byEvents: true,
                base64: true,
                events: ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT", "MESSAGES_UPDATE"],
                headers: evolutionWebhookSecret ? { "x-evolution-secret": evolutionWebhookSecret } : undefined,
              },
            }),
          });
          const createData = await createRes.json();
          console.log("[get-qr] Recreate response:", createRes.status, JSON.stringify(redact(createData)));

          // The create response often includes the QR code directly
          const qrFromCreate = createData?.qrcode?.base64 || createData?.base64 || null;
          const pairingFromCreate = createData?.qrcode?.pairingCode || createData?.pairingCode || null;
          if (qrFromCreate) {
            return new Response(JSON.stringify({ status: "qr_ready", qr_code: qrFromCreate, pairing_code: pairingFromCreate }), {
              headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
            });
          }
        } catch (err) {
          console.error("[get-qr] Recreate error:", err);
        }
      }

      // Call instance/connect to get QR code
      try {
        console.log("[get-qr] Fetching QR from", `${cleanBase}/instance/connect/${encodedName}`);
        const qrRes = await fetch(`${cleanBase}/instance/connect/${encodedName}`, {
          headers: { apikey: key },
        });
        const qrData = await qrRes.json();
        console.log("[get-qr] QR response status:", qrRes.status, "keys:", Object.keys(qrData || {}));

        // Evolution API returns: { base64: "data:image/png;base64,..." } or { qrcode: { base64: "..." } }
        const qrBase64 = qrData?.base64 || qrData?.qrcode?.base64 || qrData?.code || null;
        const pairingCode = qrData?.pairingCode || null;

        if (qrBase64) {
          return new Response(JSON.stringify({ status: "qr_ready", qr_code: qrBase64, pairing_code: pairingCode }), {
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({ status: "no_qr", detail: qrData }), {
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        }
      } catch (err) {
        console.error("[get-qr] Error fetching QR:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch QR code", detail: String(err) }), {
          status: 502,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    // ─── Action: disconnect ───
    if (action === "disconnect") {
      if (instanceId) {
        await adminClient.from("whatsapp_instances").delete().eq("instance_id", instanceId).eq("organization_id", orgId);
      } else {
        await adminClient.from("whatsapp_instances").delete().eq("organization_id", orgId);
      }
      return new Response(JSON.stringify({ success: true, status: "disconnected" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ─── Action: check-status ───
    if (action === "check-status") {
      let instances: Record<string, unknown>[] = [];
      if (instanceId) {
        const { data } = await adminClient.from("whatsapp_instances").select("*").eq("organization_id", orgId).eq("instance_id", instanceId).maybeSingle();
        if (data) instances = [data];
      } else {
        const { data } = await adminClient.from("whatsapp_instances").select("*").eq("organization_id", orgId);
        instances = data || [];
      }

      if (instances.length === 0) {
        return new Response(JSON.stringify({ status: "not_configured", results: [] }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const results: Record<string, unknown>[] = [];

      for (const inst of instances) {
        try {
          let connected = false;
          let phoneNumber = inst.phone_number || null;
          let webhookSynced: boolean | null = null;
          let configuredWebhookUrl: string | null = null;

          if (inst.provider === "evolution") {
            // Evolution API status check
            console.log("[check-status] Evolution calling", `${inst.base_url}/instance/connectionState/${inst.instance_id}`);
            const stateRes = await fetch(`${inst.base_url}/instance/connectionState/${encodeURIComponent(inst.instance_id)}`, {
              headers: { apikey: inst.client_token },
            });
            const stateData = await stateRes.json();
            console.log("[check-status] Evolution connectionState for", inst.instance_id, ":", JSON.stringify(redact(stateData)));
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
                  console.log("[check-status] Evolution all instances:", JSON.stringify(allInstances?.map?.((i: { instance?: { instanceName?: string }; instanceName?: string }) => i.instance?.instanceName || i.instanceName) || allInstances));
                  // Find by case-insensitive name match
                  const match = (Array.isArray(allInstances) ? allInstances : []).find((i: { instance?: { instanceName?: string; state?: string }; instanceName?: string; state?: string }) => {
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

            // Fetch phone number if connected and not already known
            if (connected && !phoneNumber) {
              try {
                const phoneRes = await fetch(`${inst.base_url}/instance/fetchInstances?instanceName=${encodeURIComponent(inst.instance_id)}`, {
                  headers: { apikey: inst.client_token },
                  signal: AbortSignal.timeout(10000),
                });
                if (phoneRes.ok) {
                  const phoneData = await phoneRes.json();
                  const instData = Array.isArray(phoneData) ? phoneData[0] : phoneData;
                  const ownerJid = instData?.instance?.owner || instData?.owner || instData?.ownerJid || "";
                  const phone = ownerJid.replace(/@.*$/, "");
                  if (phone && /^\d{8,}$/.test(phone)) {
                    phoneNumber = phone;
                    console.log("[check-status] Evolution phone detected:", maskPhone(phoneNumber));
                  }
                }
              } catch (err) {
                console.error("[check-status] Evolution phone fetch error:", err);
              }
            }

            // Read-only webhook check (no self-heal — instance may belong to another project)
            if (connected) {
              const expectedWebhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook/${orgId}`;
              webhookSynced = false;

              try {
                const findRes = await fetch(`${inst.base_url}/webhook/find/${encodeURIComponent(inst.instance_id)}`, {
                  headers: { apikey: inst.client_token },
                });
                const rawFindBody = await findRes.text();
                let findData: Record<string, unknown> | string = rawFindBody;
                try {
                  findData = rawFindBody ? JSON.parse(rawFindBody) : null;
                } catch {
                  // Mantém rawFindBody como string se JSON inválido
                }

                configuredWebhookUrl = findData?.url || findData?.webhook?.url || null;
                webhookSynced = configuredWebhookUrl === expectedWebhookUrl;

                if (!webhookSynced) {
                  console.log("[check-status] Evolution webhook points elsewhere (read-only, not overriding)", {
                    instance: inst.instance_id,
                    configuredWebhookUrl,
                    expectedWebhookUrl,
                  });
                }
              } catch (webhookErr) {
                console.error("[check-status] Evolution webhook read error:", webhookErr);
              }
            }
          } else {
            // Z-API status check
            const statusRes = await fetch(
              `https://api.z-api.io/instances/${inst.instance_id}/token/${inst.token}/status`,
              { headers: { "Client-Token": inst.client_token } }
            );
            const statusData = await statusRes.json();
            console.log("[check-status] Z-API /status for", inst.instance_id, ":", JSON.stringify(redact(statusData)));
            connected = statusData.connected === true;

            if (connected) {
              try {
                const deviceRes = await fetch(
                  `https://api.z-api.io/instances/${inst.instance_id}/token/${inst.token}/device`,
                  { headers: { "Client-Token": inst.client_token } }
                );
                const deviceData = await deviceRes.json();
                if (deviceData.phone) phoneNumber = deviceData.phone;
              } catch {
                // /device opcional — segue para fallback /phone
              }
              if (!phoneNumber) {
                try {
                  const phoneRes = await fetch(
                    `https://api.z-api.io/instances/${inst.instance_id}/token/${inst.token}/phone`,
                    { headers: { "Client-Token": inst.client_token } }
                  );
                  const phoneData = await phoneRes.json();
                  if (phoneData.phone) phoneNumber = phoneData.phone;
                } catch {
                  // Sem telefone disponível — manter null
                }
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
            webhook_synced: webhookSynced,
            configured_webhook_url: configuredWebhookUrl,
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ─── Action: reconfigure-webhook (Evolution only) ───
    if (action === "reconfigure-webhook") {
      const { data: inst } = await adminClient
        .from("whatsapp_instances")
        .select("*")
        .eq("organization_id", orgId)
        .eq("instance_id", instanceName || instanceId)
        .eq("provider", "evolution")
        .maybeSingle();

      if (!inst) {
        return new Response(JSON.stringify({ error: "Evolution instance not found in database" }), {
          status: 404,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const cleanBase = (inst.base_url || baseUrl || "").replace(/\/+$/, "");
      const key = apiKey || inst.client_token;
      const webhookUrlEv = `${supabaseUrl}/functions/v1/evolution-webhook/${orgId}`;

      // Set webhook (Evolution versions vary in accepted payload shape)
      const events = ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT", "MESSAGES_UPDATE"];
      const payloadAttempts = [
        {
          webhook: {
            enabled: true,
            url: webhookUrlEv,
            byEvents: true,
            base64: true,
            events,
            headers: evolutionWebhookSecret ? { "x-evolution-secret": evolutionWebhookSecret } : undefined,
          },
        },
        {
          url: webhookUrlEv,
          webhook_by_events: true,
          webhook_base64: true,
          events,
        },
      ];

      let setOk = false;
      let lastSetStatus = 0;
      let lastSetBody: Record<string, unknown> | string | null = null;

      for (const payload of payloadAttempts) {
        try {
          const setRes = await fetch(`${cleanBase}/webhook/set/${encodeURIComponent(inst.instance_id)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: key },
            body: JSON.stringify(payload),
          });

          lastSetStatus = setRes.status;
          const rawSetBody = await setRes.text();
          try {
            lastSetBody = rawSetBody ? JSON.parse(rawSetBody) : null;
          } catch {
            lastSetBody = rawSetBody;
          }

          console.log("[reconfigure-webhook] set response:", setRes.status, JSON.stringify(redact(lastSetBody)));
          if (setRes.ok) {
            setOk = true;
            break;
          }
        } catch (err) {
          lastSetBody = String(err);
          console.error("[reconfigure-webhook] set attempt error:", err);
        }
      }

      if (!setOk) {
        return new Response(JSON.stringify({
          error: "Failed to set webhook on Evolution server",
          status: lastSetStatus,
          detail: lastSetBody,
        }), {
          status: 502,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      // Verify by finding current webhook config
      let currentWebhook: Record<string, unknown> | null = null;
      try {
        const findRes = await fetch(`${cleanBase}/webhook/find/${encodeURIComponent(inst.instance_id)}`, {
          headers: { apikey: key },
        });
        currentWebhook = await findRes.json();
        console.log("[reconfigure-webhook] current webhook:", JSON.stringify(redact(currentWebhook)));
      } catch (err) {
        console.error("[reconfigure-webhook] find error:", err);
      }

      // Update DB
      await adminClient.from("whatsapp_instances").update({ webhook_url: webhookUrlEv }).eq("id", inst.id);

      return new Response(JSON.stringify({
        success: true,
        webhookUrl: webhookUrlEv,
        currentWebhook,
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ─── Action: check-webhook (Evolution only) ───
    if (action === "check-webhook") {
      const { data: inst } = await adminClient
        .from("whatsapp_instances")
        .select("*")
        .eq("organization_id", orgId)
        .eq("instance_id", instanceName || instanceId)
        .eq("provider", "evolution")
        .maybeSingle();

      if (!inst) {
        return new Response(JSON.stringify({ error: "Evolution instance not found" }), {
          status: 404,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const cleanBase = (inst.base_url || baseUrl || "").replace(/\/+$/, "");
      const key = apiKey || inst.client_token;
      const expectedUrl = `${supabaseUrl}/functions/v1/evolution-webhook/${orgId}`;

      let currentWebhook: Record<string, unknown> | null = null;
      try {
        const findRes = await fetch(`${cleanBase}/webhook/find/${encodeURIComponent(inst.instance_id)}`, {
          headers: { apikey: key },
        });
        currentWebhook = await findRes.json();
      } catch (err) {
        console.error("[check-webhook] find error:", err);
      }

      const configuredUrl = currentWebhook?.url || currentWebhook?.webhook?.url || null;
      const isCorrect = configuredUrl === expectedUrl;

      return new Response(JSON.stringify({
        expectedUrl,
        configuredUrl,
        isCorrect,
        currentWebhook,
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ─── Action: connect (default) ───
    if (isEvolution) {
      // Evolution API connect
      if (!instanceName) {
        return new Response(JSON.stringify({ error: "instanceName is required for Evolution" }), {
          status: 400,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const cleanBaseUrl = (baseUrl || Deno.env.get("EVOLUTION_API_URL") || "https://evo.grupolamadre.com.br").replace(/\/+$/, "");
      const effectiveApiKey = apiKey || Deno.env.get("EVOLUTION_API_KEY") || "";
      const webhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook/${orgId}`;

      // Step 1: Create instance on Evolution API (ignore if already exists)
      try {
        console.log("[connect] Evolution creating instance:", instanceName);
        const webhookUrlEv = `${supabaseUrl}/functions/v1/evolution-webhook/${orgId}`;
        const createRes = await fetch(`${cleanBaseUrl}/instance/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: effectiveApiKey },
          body: JSON.stringify({
            instanceName,
            integration: "WHATSAPP-BAILEYS",
            qrcode: true,
            webhook: {
              url: webhookUrlEv,
              byEvents: true,
              base64: true,
              events: ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT", "MESSAGES_UPDATE"],
            },
          }),
        });
        const createData = await createRes.json();
        console.log("[connect] Evolution create response:", createRes.status, JSON.stringify(redact(createData)));
        if (!createRes.ok && createRes.status !== 403 && createRes.status !== 409) {
          console.warn("[connect] Evolution create non-fatal error:", createRes.status);
        }
      } catch (err) {
        console.error("[connect] Failed to create Evolution instance:", err);
      }

      // Step 2: Configure webhook on Evolution API
      try {
        const webhookUrlSet = `${supabaseUrl}/functions/v1/evolution-webhook/${orgId}`;
        const events = ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT", "MESSAGES_UPDATE"];
        const payloadAttempts = [
          {
            webhook: {
              enabled: true,
              url: webhookUrlSet,
              byEvents: true,
              base64: true,
              events,
              headers: evolutionWebhookSecret ? { "x-evolution-secret": evolutionWebhookSecret } : undefined,
            },
          },
          {
            url: webhookUrlSet,
            webhook_by_events: true,
            webhook_base64: true,
            events,
            headers: evolutionWebhookSecret ? { "x-evolution-secret": evolutionWebhookSecret } : undefined,
          },
        ];

        for (const payload of payloadAttempts) {
          const setRes = await fetch(`${cleanBaseUrl}/webhook/set/${encodeURIComponent(instanceName)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: effectiveApiKey },
            body: JSON.stringify(payload),
          });

          const rawSetBody = await setRes.text();
          let parsedSetBody: Record<string, unknown> | string = rawSetBody;
          try {
            parsedSetBody = rawSetBody ? JSON.parse(rawSetBody) : null;
          } catch {
            // Mantém rawSetBody bruto se não for JSON
          }

          console.log("[connect] Evolution webhook set response:", setRes.status, JSON.stringify(redact(parsedSetBody)));
          if (setRes.ok) break;
        }
      } catch (err) {
        console.error("Failed to configure Evolution webhooks:", err);
      }

      // Check connection state (with fetchInstances fallback)
      let connStatus = "disconnected";
      try {
        console.log("[connect] Evolution checking state at", `${cleanBaseUrl}/instance/connectionState/${instanceName}`);
        const stateRes = await fetch(`${cleanBaseUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`, {
          headers: { apikey: effectiveApiKey },
        });
        const stateData = await stateRes.json();
        console.log("[connect] Evolution connectionState:", JSON.stringify(redact(stateData)));
        if (stateData?.instance?.state === "open" || stateData?.state === "open" || stateData?.status === "CONNECTED") {
          connStatus = "connected";
        }

        // Fallback: if instance not found, try listing all instances
        if (connStatus === "disconnected" && (stateRes.status === 404 || stateData?.response?.message?.[0]?.includes("does not exist"))) {
          console.log("[connect] Evolution instance not found, trying fetchInstances fallback");
          try {
            const listRes = await fetch(`${cleanBaseUrl}/instance/fetchInstances`, {
              headers: { apikey: effectiveApiKey },
            });
            if (listRes.ok) {
              const allInstances = await listRes.json();
              const names = (Array.isArray(allInstances) ? allInstances : []).map((i: { instance?: { instanceName?: string }; instanceName?: string }) => i.instance?.instanceName || i.instanceName || "?");
              console.log("[connect] Evolution available instances:", JSON.stringify(names));
              const match = (Array.isArray(allInstances) ? allInstances : []).find((i: { instance?: { instanceName?: string; state?: string }; instanceName?: string; state?: string }) => {
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

      // Step 3: Always (re)configure webhook to ensure it points to this Supabase project
      try {
        console.log("[connect] Evolution auto-reconfiguring webhook to", webhookUrl);
        const reconfigEvents = ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT", "MESSAGES_UPDATE"];
        const reconfigPayloads = [
          {
            webhook: {
              enabled: true,
              url: webhookUrl,
              byEvents: true,
              base64: true,
              events: reconfigEvents,
              headers: evolutionWebhookSecret ? { "x-evolution-secret": evolutionWebhookSecret } : undefined,
            },
          },
          {
            url: webhookUrl,
            webhook_by_events: true,
            webhook_base64: true,
            events: reconfigEvents,
          },
        ];

        for (const payload of reconfigPayloads) {
          const reconfigRes = await fetch(`${cleanBaseUrl}/webhook/set/${encodeURIComponent(instanceName)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: effectiveApiKey },
            body: JSON.stringify(payload),
          });
          console.log("[connect] Evolution webhook reconfig response:", reconfigRes.status);
          if (reconfigRes.ok) break;
        }
      } catch (err) {
        console.error("[connect] Evolution webhook reconfig error (non-fatal):", err);
      }

      // Fetch phone number from Evolution API if connected
      let phoneNumber: string | null = null;
      if (connStatus === "connected") {
        try {
          const listRes = await fetch(`${cleanBaseUrl}/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`, {
            headers: { apikey: effectiveApiKey },
            signal: AbortSignal.timeout(10000),
          });
          if (listRes.ok) {
            const listData = await listRes.json();
            const instData = Array.isArray(listData) ? listData[0] : listData;
            const ownerJid = instData?.instance?.owner || instData?.owner || instData?.ownerJid || "";
            const phone = ownerJid.replace(/@.*$/, "");
            if (phone && /^\d{8,}$/.test(phone)) {
              phoneNumber = phone;
              console.log("[connect] Evolution phone detected:", maskPhone(phoneNumber));
            }
          }
        } catch (err) {
          console.error("[connect] Evolution phone fetch error (non-fatal):", err);
        }
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
        token: effectiveApiKey,
        client_token: effectiveApiKey,
        status: connStatus,
        phone_number: phoneNumber,
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
        JSON.stringify({ success: true, status: connStatus, phone: phoneNumber, webhookUrl }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ─── Z-API connect (original logic) ───
    if (!instanceId || !instanceToken || !clientToken) {
      return new Response(JSON.stringify({ error: "instanceId, instanceToken, and clientToken are required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        } catch {
          // /device opcional — telefone permanece null
        }
      }
    } catch {
      // Falha na obtenção opcional do telefone — segue upsert
    }

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
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
