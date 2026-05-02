// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
// INT-004: Circuit breaker for WhatsApp provider failover (Evolution ↔ Z-API)
import { recordSuccess, recordFailure, isOpen } from '../_shared/whatsappCircuitBreaker.ts';
import { parseOrThrow, validationErrorResponse, WhatsAppSchemas } from '../_shared/schemas.ts';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
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

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", detail: userError?.message }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: orgId } = await adminClient.rpc("get_user_org_id", { _user_id: userId, _portal: "saas" });
    if (!orgId) {
      return new Response(JSON.stringify({ error: "User has no organization" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.json();
    const body = parseOrThrow(WhatsAppSchemas.Send, rawBody);
    const {
      contactPhone,
      contactId,
      message,
      mediaUrl,
      quotedMessageId,
      action,
      // Cloud API extras
      templateName,
      templateLanguage,
      templateComponents,
    } = body;
    const type = (body as any).type ?? "text";

    // ─── Helper: resolve instance from contact or org ───
    async function resolveInstance(cId?: string): Promise<Record<string, unknown> | null> {
      let inst: Record<string, unknown> | null = null;
      if (cId) {
        const { data: contact } = await adminClient.from("whatsapp_contacts").select("instance_id").eq("id", cId).maybeSingle();
        if (contact?.instance_id) {
          const { data: i } = await adminClient.from("whatsapp_instances").select("*").eq("id", contact.instance_id).eq("status", "connected").maybeSingle();
          if (i) inst = i;
        }
      }
      if (!inst) {
        const { data: insts } = await adminClient.from("whatsapp_instances").select("*").eq("organization_id", orgId).eq("status", "connected").order("created_at", { ascending: true }).limit(1);
        inst = insts && insts.length > 0 ? insts[0] : null;
      }
      return inst;
    }

    // ─── Action: mark as read ───
    if (action === "read") {
      if (!contactPhone && !contactId) {
        return new Response(JSON.stringify({ error: "contactPhone or contactId required for read action" }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      let readPhone = contactPhone;
      if (contactId && !readPhone) {
        const { data: ct } = await adminClient.from("whatsapp_contacts").select("phone").eq("id", contactId).single();
        if (ct) readPhone = ct.phone;
      }
      if (!readPhone) {
        return new Response(JSON.stringify({ error: "Could not resolve phone" }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const readInstance = await resolveInstance(contactId);
      if (!readInstance) {
        return new Response(JSON.stringify({ error: "No connected instance" }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const cleanReadPhone = readPhone.replace(/[\s\-+()]/g, "");

      if (readInstance.provider === "evolution") {
        // Evolution doesn't have a direct read-message endpoint commonly — skip gracefully
        return new Response(JSON.stringify({ success: true, zapi: { note: "read not supported on Evolution" } }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      // Z-API read
      const zapiReadBase = `https://api.z-api.io/instances/${readInstance.instance_id}/token/${readInstance.token}`;
      const readRes = await fetch(`${zapiReadBase}/read-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Client-Token": readInstance.client_token },
        body: JSON.stringify({ phone: cleanReadPhone }),
      });
      const readData = await readRes.json().catch(() => ({}));

      return new Response(JSON.stringify({ success: true, zapi: readData }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ─── Validate send params ───
    if ((!message && !mediaUrl) || (!contactPhone && !contactId)) {
      return new Response(JSON.stringify({ error: "message or mediaUrl, and contactPhone or contactId required" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Get instance
    const instance = await resolveInstance(contactId);
    if (!instance || instance.status !== "connected") {
      return new Response(JSON.stringify({ error: "No connected WhatsApp instance" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Resolve contact
    let phone = contactPhone;
    let resolvedContactId = contactId;

    if (contactId && !contactPhone) {
      const { data: contact } = await adminClient.from("whatsapp_contacts").select("phone").eq("id", contactId).single();
      if (contact) phone = contact.phone;
    }

    // Upsert contact if needed
    if (!resolvedContactId && phone) {
      const { data: existing } = await adminClient.from("whatsapp_contacts").select("id").eq("organization_id", orgId).eq("phone", phone).maybeSingle();
      if (existing) {
        resolvedContactId = existing.id;
      } else {
        const { data: newContact } = await adminClient.from("whatsapp_contacts").insert({
          organization_id: orgId, phone, last_message_at: new Date().toISOString(), instance_id: instance.id,
        }).select("id").single();
        if (newContact) resolvedContactId = newContact.id;
      }
    }

    // ─── INT-004: Circuit breaker guard ───
    // Warn (but do not block) if the selected instance's circuit is OPEN.
    // This allows the send to proceed while surfacing the degraded state in logs.
    // A full failover requires a second connected instance of the opposite provider
    // in the same org — the resolveInstance() helper already picks the first
    // connected one, so the circuit state here is informational + enables future
    // automatic failover when multi-instance orgs are supported.
    const providerType = (instance.provider === "evolution" ? "evolution" : instance.provider === "whatsapp_cloud" ? "whatsapp_cloud" : "z-api") as "evolution" | "z-api" | "whatsapp_cloud";
    if (providerType !== "whatsapp_cloud" && isOpen(providerType as "evolution" | "z-api", String(instance.instance_id))) {
      console.warn(`[CircuitBreaker] Instance ${instance.instance_id} (${providerType}) circuit is OPEN — proceeding with caution`);
    }

    // ─── Send via provider ───
    let apiRes: Response;
    let apiData: Record<string, unknown>;
    let resolvedType = type;

    if (instance.provider === "whatsapp_cloud") {
      // ─── WhatsApp Cloud API (Meta Graph) ───
      const phoneNumberId = String(instance.phone_number_id || instance.instance_id);
      const orgToken = (instance as any).access_token_encrypted as string | null;
      const cloudToken = orgToken || Deno.env.get("WHATSAPP_CLOUD_ACCESS_TOKEN") || "";
      if (!cloudToken) {
        return new Response(
          JSON.stringify({ error: "WhatsApp Cloud access token not configured" }),
          { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
        );
      }

      const cleanCloudPhone = phone.replace(/[\s\-+()]/g, "").replace(/@.*$/, "");

      let cloudBody: Record<string, unknown>;
      if (templateName) {
        cloudBody = {
          messaging_product: "whatsapp",
          to: cleanCloudPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLanguage || "pt_BR" },
            ...(templateComponents ? { components: templateComponents } : {}),
          },
        };
        resolvedType = "template";
      } else if (mediaUrl) {
        const isAudio = type === "audio" || mediaUrl.match(/\.(webm|ogg|mp3|m4a)(\?|$)/i);
        const isVideo = type === "video" || mediaUrl.match(/\.(mp4|mov)(\?|$)/i);
        const isDoc = type === "document";
        const mediaType = isAudio ? "audio" : isVideo ? "video" : isDoc ? "document" : "image";
        resolvedType = mediaType;
        cloudBody = {
          messaging_product: "whatsapp",
          to: cleanCloudPhone,
          type: mediaType,
          [mediaType]: {
            link: mediaUrl,
            ...(message && mediaType !== "audio" ? { caption: message } : {}),
          },
        };
      } else {
        cloudBody = {
          messaging_product: "whatsapp",
          to: cleanCloudPhone,
          type: "text",
          text: { body: message, preview_url: false },
        };
        resolvedType = "text";
      }

      apiRes = await fetch(
        `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cloudToken}`,
          },
          body: JSON.stringify(cloudBody),
        },
      );
      apiData = await apiRes.json().catch(() => ({}));
      // Normalize message id for downstream insert
      if (apiData?.messages?.[0]?.id) {
        (apiData as any).messageId = apiData.messages[0].id;
      }
    } else if (instance.provider === "evolution") {
      // Evolution API v1 send
      const baseUrl = (instance.base_url || "").replace(/\/+$/, "");
      const evHeaders = { "Content-Type": "application/json", apikey: instance.client_token };

      // Evolution v1 uses clean phone number (no @s.whatsapp.net)
      const isGroupPhone = phone.endsWith("-group");
      const cleanEvPhone = isGroupPhone
        ? phone.replace(/-group$/, "") + "@g.us"
        : phone.replace(/[\s\-+()]/g, "");

      if (mediaUrl) {
        resolvedType = type === "audio" || mediaUrl.match(/\.(webm|ogg|mp3|m4a|mp4)(\?|$)/i) ? "audio" : (type || "image");
        const mediaType = resolvedType === "audio" ? "audio" : resolvedType === "video" ? "video" : resolvedType === "document" ? "document" : "image";
        apiRes = await fetch(`${baseUrl}/message/sendMedia/${instance.instance_id}`, {
          method: "POST",
          headers: evHeaders,
          body: JSON.stringify({
            number: cleanEvPhone,
            mediatype: mediaType,
            media: mediaUrl,
            caption: message || "",
          }),
        });
      } else {
        apiRes = await fetch(`${baseUrl}/message/sendText/${instance.instance_id}`, {
          method: "POST",
          headers: evHeaders,
          body: JSON.stringify({
            number: cleanEvPhone,
            text: message,
          }),
        });
      }

      apiData = await apiRes.json();
    } else {
      // Z-API send (original logic)
      const isGroupPhone = phone.endsWith("-group");
      const cleanPhone = isGroupPhone
        ? phone.replace(/-group$/, "") + "@g.us"
        : phone.replace(/[\s\-+()]/g, "");
      const zapiBase = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
      const zapiHeaders = { "Content-Type": "application/json", "Client-Token": instance.client_token };

      let zapiUrl: string;
      let zapiBody: Record<string, unknown>;

      if (mediaUrl && (type === "audio" || mediaUrl.match(/\.(webm|ogg|mp3|m4a|mp4)(\?|$)/i))) {
        zapiUrl = `${zapiBase}/send-audio`;
        zapiBody = { phone: cleanPhone, audio: mediaUrl };
        resolvedType = "audio";
      } else if (mediaUrl) {
        zapiUrl = `${zapiBase}/send-image`;
        zapiBody = { phone: cleanPhone, image: mediaUrl, caption: message || "" };
        resolvedType = type || "image";
      } else {
        zapiUrl = `${zapiBase}/send-text`;
        zapiBody = { phone: cleanPhone, message };
      }

      if (quotedMessageId) {
        zapiBody.messageId = quotedMessageId;
      }

      apiRes = await fetch(zapiUrl, {
        method: "POST",
        headers: zapiHeaders,
        body: JSON.stringify(zapiBody),
      });

      apiData = await apiRes.json();
    }

    // ─── INT-004: Record circuit breaker outcome ───
    if (apiRes.ok) {
      if (providerType !== "whatsapp_cloud") recordSuccess(providerType as "evolution" | "z-api", String(instance.instance_id));
    } else {
      if (providerType !== "whatsapp_cloud") recordFailure(providerType as "evolution" | "z-api", String(instance.instance_id));
    }

    const messageStatus = apiRes.ok ? "sent" : "failed";

    // Build metadata
    const msgMetadata: Record<string, unknown> = { ...(apiData || {}) };
    if (quotedMessageId) msgMetadata.quotedMessageId = quotedMessageId;

    // Save message
    const { data: savedMsg } = await adminClient.from("whatsapp_messages").insert({
      organization_id: orgId,
      contact_id: resolvedContactId,
      message_id_zapi: apiData?.messageId || apiData?.key?.id || null,
      direction: "outbound",
      type: resolvedType,
      content: message || null,
      media_url: mediaUrl || null,
      status: messageStatus,
      metadata: msgMetadata,
    }).select().single();

    // Update contact
    if (resolvedContactId) {
      const preview = message ? message.substring(0, 100) : (resolvedType === "audio" ? "🎤 Áudio" : "📎 Mídia");
      await adminClient.from("whatsapp_contacts").update({
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
      }).eq("id", resolvedContactId);
    }

    if (!apiRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send message", details: apiData }),
        { status: 502, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, message: savedMsg, zapi: apiData }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    const valRes = validationErrorResponse(err, getCorsHeaders(req));
    if (valRes) return valRes;
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
