import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-evolution-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret if configured
    const expectedSecret = Deno.env.get("EVOLUTION_WEBHOOK_SECRET");
    if (expectedSecret) {
      const receivedSecret = req.headers.get("x-evolution-secret") || "";
      if (receivedSecret !== expectedSecret) {
        console.warn("Evolution webhook: invalid secret received");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    console.log("Evolution webhook payload:", JSON.stringify(body).slice(0, 500));

    // Extract org_id from URL path.
    // Supports both:
    // - /evolution-webhook/{org_id}
    // - /evolution-webhook/{org_id}/messages-upsert|messages-update
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const webhookIndex = pathParts.lastIndexOf("evolution-webhook");
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const orgCandidate =
      webhookIndex >= 0 && pathParts.length > webhookIndex + 1
        ? pathParts[webhookIndex + 1]
        : pathParts[pathParts.length - 1];

    let orgId = orgCandidate && uuidRegex.test(orgCandidate) ? orgCandidate : "";

    // Fallback: resolve org from instance name when org_id is not present in path
    if (!orgId) {
      const instanceName = body.instance || body.instanceName || "";
      if (!instanceName) {
        return new Response(JSON.stringify({ error: "org_id or instance name required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: found } = await adminClient
        .from("whatsapp_instances")
        .select("organization_id")
        .eq("instance_id", instanceName)
        .eq("provider", "evolution")
        .maybeSingle();
      if (!found) {
        return new Response(JSON.stringify({ error: `No instance found for name: ${instanceName}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      orgId = found.organization_id;
    }

    const rawEvent = String(body.event || "").trim();
    const event = rawEvent.toUpperCase().replace(/[.\s-]/g, "_");

    // Find Evolution instance for this org
    const { data: instances } = await adminClient
      .from("whatsapp_instances")
      .select("*")
      .eq("organization_id", orgId)
      .eq("provider", "evolution");

    if (!instances || instances.length === 0) {
      return new Response(JSON.stringify({ error: "No evolution instances found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Match instance by instance_id (instanceName in Evolution)
    const instanceName = body.instance || body.instanceName || "";
    let instance = instances.find((i: any) => i.instance_id === instanceName) || instances[0];

    // ─── CONNECTION_UPDATE ───
    if (event === "CONNECTION_UPDATE") {
      const state = body.data?.state || body.state || "";
      const connected = state === "open";
      await adminClient
        .from("whatsapp_instances")
        .update({ status: connected ? "connected" : "disconnected" })
        .eq("id", instance.id);

      return new Response(JSON.stringify({ ok: true, connection: state }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── MESSAGES_UPSERT ───
    if (event === "MESSAGES_UPSERT") {
      const rawMessages = body.data ?? body.messages ?? [];
      const messages = Array.isArray(rawMessages)
        ? rawMessages
        : rawMessages
          ? [rawMessages]
          : [];

      for (const msg of messages) {
        const key = msg.key || {};
        const isFromMe = key.fromMe === true;
        const remoteJid = key.remoteJid || "";

        // Skip status/broadcast
        if (remoteJid.includes("@broadcast") || remoteJid === "status@broadcast") continue;

        const isGroup = remoteJid.endsWith("@g.us");
        let phone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
        if (isGroup) {
          phone = remoteJid.replace("@g.us", "") + "-group";
        }

        if (!phone) continue;

        const contactType = isGroup ? "group" : "individual";
        const msgContent = msg.message || {};
        const messageText =
          msgContent.conversation ||
          msgContent.extendedTextMessage?.text ||
          msgContent.imageMessage?.caption ||
          msgContent.videoMessage?.caption ||
          null;

        let messageType = "text";
        let mediaUrl: string | null = null;
        let mediaExt = "bin";

        if (msgContent.imageMessage) {
          messageType = "image";
          mediaUrl = msgContent.imageMessage.url || null;
          mediaExt = "jpg";
        } else if (msgContent.audioMessage) {
          messageType = "audio";
          mediaUrl = msgContent.audioMessage.url || null;
          mediaExt = "ogg";
        } else if (msgContent.videoMessage) {
          messageType = "video";
          mediaUrl = msgContent.videoMessage.url || null;
          mediaExt = "mp4";
        } else if (msgContent.documentMessage) {
          messageType = "document";
          mediaUrl = msgContent.documentMessage.url || null;
          const docName = msgContent.documentMessage.fileName || "";
          mediaExt = docName.split(".").pop() || "pdf";
        } else if (msgContent.stickerMessage) {
          messageType = "sticker";
          mediaExt = "webp";
        }

        // Download media via Evolution API and upload to storage for permanent URLs
        if (messageType !== "text" && messageType !== "sticker" && key.id) {
          try {
            const baseUrl = (instance.base_url || "").replace(/\/+$/, "");
            const evApiKey = instance.client_token || instance.token || "";
            const b64Res = await fetch(
              `${baseUrl}/chat/getBase64FromMediaMessage/${instance.instance_id}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json", apikey: evApiKey },
                body: JSON.stringify({ message: { key: msg.key }, convertToMp4: messageType === "audio" }),
              }
            );
            if (b64Res.ok) {
              const b64Data = await b64Res.json();
              const base64String = b64Data.base64 || b64Data.data || "";
              const mimeType = b64Data.mimetype || b64Data.mediaType || `application/octet-stream`;
              if (base64String) {
                // Decode and upload to storage
                const binaryStr = atob(base64String.replace(/^data:[^;]+;base64,/, ""));
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
                const storagePath = `${orgId}/${Date.now()}_${key.id}.${mediaExt}`;
                const { error: upErr } = await adminClient.storage
                  .from("chat-media")
                  .upload(storagePath, bytes.buffer, { contentType: mimeType, upsert: true });
                if (!upErr) {
                  const { data: pubUrl } = adminClient.storage.from("chat-media").getPublicUrl(storagePath);
                  mediaUrl = pubUrl.publicUrl;
                } else {
                  console.error("Storage upload error:", JSON.stringify(upErr));
                }
              }
            } else {
              console.warn("Evolution getBase64 failed:", b64Res.status, await b64Res.text().catch(() => ""));
            }
          } catch (dlErr) {
            console.error("Media download error:", dlErr);
          }
        }

        const senderName = msg.pushName || null;

        // Build preview
        const previewText = messageText
          ? messageText.substring(0, 100)
          : messageType === "audio" ? "🎤 Áudio"
          : messageType === "image" ? "📷 Imagem"
          : messageType === "video" ? "🎬 Vídeo"
          : messageType === "document" ? "📄 Documento"
          : messageType === "sticker" ? "🏷️ Sticker"
          : "📎 Mídia";

        // Upsert contact
        const { data: existingContact, error: contactQueryErr } = await adminClient
          .from("whatsapp_contacts")
          .select("id, unread_count, photo_url")
          .eq("organization_id", orgId)
          .eq("phone", phone)
          .maybeSingle();

        if (contactQueryErr) {
          console.error("Contact query error:", contactQueryErr);
        }

        let contactId: string;

        if (existingContact) {
          contactId = existingContact.id;
          const updateData: any = {
            last_message_at: new Date().toISOString(),
            last_message_preview: (isFromMe ? "Você: " : "") + previewText,
            instance_id: instance.id,
          };
          // Only update name from inbound messages (pushName = contact's real name)
          if (!isFromMe && senderName) {
            updateData.name = senderName;
          }
          if (!isFromMe) {
            updateData.unread_count = (existingContact.unread_count || 0) + 1;
          }
          const { error: updateErr } = await adminClient.from("whatsapp_contacts").update(updateData).eq("id", contactId);
          if (updateErr) console.error("Contact update error:", JSON.stringify(updateErr));
        } else {
          // For new contacts from outbound, don't use sender's pushName
          const contactName = isFromMe ? null : (senderName || null);
          const { data: newContact, error: insertErr } = await adminClient
            .from("whatsapp_contacts")
            .insert({
              organization_id: orgId,
              phone,
              name: contactName || (contactType === "group" ? phone : null),
              last_message_at: new Date().toISOString(),
              last_message_preview: (isFromMe ? "Você: " : "") + previewText,
              unread_count: isFromMe ? 0 : 1,
              instance_id: instance.id,
              attending_mode: contactType === "group" ? "human" : "ai",
              contact_type: contactType,
            })
            .select("id")
            .single();
          if (insertErr) {
            console.error("Contact insert error:", JSON.stringify(insertErr));
            continue;
          }
          contactId = newContact!.id;
        }

        // Insert message — strip heavy binary fields from metadata to prevent insert failures
        const direction = isFromMe ? "outbound" : "inbound";
        const msgStatus = isFromMe ? "sent" : "received";

        // Sanitize metadata: keep only essential fields, drop binary blobs
        const safeMeta: Record<string, unknown> = {
          key: msg.key,
          pushName: msg.pushName,
          messageType: msg.messageType,
          messageTimestamp: msg.messageTimestamp,
          source: msg.source,
          instanceId: msg.instanceId,
        };

        const { error: msgInsertErr } = await adminClient.from("whatsapp_messages").insert({
          organization_id: orgId,
          contact_id: contactId,
          message_id_zapi: key.id || null,
          direction,
          type: messageType,
          content: messageText,
          media_url: mediaUrl,
          status: msgStatus,
          metadata: safeMeta,
        });
        if (msgInsertErr) console.error("Message insert error:", JSON.stringify(msgInsertErr));

        // Trigger AI agent reply for inbound
        if (!isFromMe && (messageText || mediaUrl)) {
          try {
            const aiReplyUrl = `${supabaseUrl}/functions/v1/ai-agent-reply`;
            fetch(aiReplyUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                organization_id: orgId,
                contact_id: contactId,
                message_text: messageText,
                message_type: messageType,
                media_url: mediaUrl,
                contact_phone: phone,
              }),
            }).catch((e) => console.error("AI reply trigger error:", e));
          } catch (e) {
            console.error("AI reply trigger setup error:", e);
          }
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── MESSAGES_UPDATE (status changes) ───
    if (event === "MESSAGES_UPDATE") {
      const rawUpdates = body.data ?? body.messages ?? [];
      const updates = Array.isArray(rawUpdates)
        ? rawUpdates
        : rawUpdates
          ? [rawUpdates]
          : [];

      for (const upd of updates) {
        const key = upd.key || {};
        const status = upd.update?.status;
        if (key.id && status !== undefined) {
          const statusMap: Record<string, string> = {
            "0": "error",
            "1": "pending",
            "2": "sent",
            "3": "delivered",
            "4": "read",
            "5": "played",
            SERVER_ACK: "sent",
            DELIVERY_ACK: "delivered",
            READ: "read",
            PLAYED: "played",
            ERROR: "error",
          };
          const normalizedStatusKey = String(status).toUpperCase();
          const mappedStatus =
            statusMap[normalizedStatusKey] ||
            statusMap[String(status)] ||
            String(status).toLowerCase();

          await adminClient
            .from("whatsapp_messages")
            .update({ status: mappedStatus })
            .eq("message_id_zapi", key.id)
            .eq("organization_id", orgId);
        }
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Unhandled event
    return new Response(JSON.stringify({ ok: true, event: event || "unknown" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Evolution webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
