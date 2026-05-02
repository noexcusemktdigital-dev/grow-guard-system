// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { redact } from '../_shared/redact.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'whatsapp-webhook');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Extract org_id from URL path: /whatsapp-webhook/{org_id}
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const orgId = pathParts[pathParts.length - 1];

    if (!orgId || orgId === "whatsapp-webhook") {
      return new Response(JSON.stringify({ error: "org_id required in path" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // SEC-NOE-002: Mandatory client-token validation — fail-closed
    const clientToken = req.headers.get("client-token") || req.headers.get("Client-Token");
    if (!clientToken) {
      return new Response(JSON.stringify({ error: "Unauthorized — client-token required" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Fetch ALL instances for this org (supports multiple)
    const { data: instances } = await adminClient
      .from("whatsapp_instances")
      .select("*")
      .eq("organization_id", orgId);

    if (!instances || instances.length === 0) {
      return new Response(JSON.stringify({ error: "No instances found" }), {
        status: 404,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Match instance by client_token — mandatory, no fallback
    const instance = instances.find((i: { client_token: string }) => i.client_token === clientToken);
    if (!instance) {
      return new Response(JSON.stringify({ error: "Invalid client token" }), {
        status: 403,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("Webhook payload:", JSON.stringify(redact(body)).slice(0, 500));

    // Typing indicator detection — broadcast via Realtime, don't save
    const chatState = body.chatstate || body.type;
    if (chatState === "typing" || chatState === "composing" || chatState === "recording") {
      const typingPhone = body.phone || (body.chatId || "").replace("@c.us", "");
      if (typingPhone) {
        const channel = adminClient.channel(`whatsapp-typing-${orgId}`);
        await channel.send({
          type: "broadcast",
          event: "typing",
          payload: { phone: typingPhone, isTyping: true },
        });
        adminClient.removeChannel(channel);
      }
      return new Response(JSON.stringify({ ok: true, typing: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (chatState === "paused" || chatState === "available") {
      const typingPhone = body.phone || (body.chatId || "").replace("@c.us", "");
      if (typingPhone) {
        const channel = adminClient.channel(`whatsapp-typing-${orgId}`);
        await channel.send({
          type: "broadcast",
          event: "typing",
          payload: { phone: typingPhone, isTyping: false },
        });
        adminClient.removeChannel(channel);
      }
      return new Response(JSON.stringify({ ok: true, typing: false }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Detect if message was sent by us (from phone or platform)
    const isFromMe = body.fromMe === true;

    // Status update detection
    const isStatus = body.status !== undefined && !body.text && !body.image && !body.audio && !body.ptt && !body.video && !body.document && !body.sticker;

    if (isStatus) {
      if (body.messageId) {
        await adminClient
          .from("whatsapp_messages")
          .update({ status: body.status })
          .eq("message_id_zapi", body.messageId)
          .eq("organization_id", orgId);
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Detect group/broadcast
    const rawChatId = body.chatId || "";
    const isGroup = rawChatId.includes("@g.us");
    const isBroadcast = rawChatId.includes("@broadcast");

    // Extract phone - normalize groups to -group format (Z-API native from /chats)
    let phone = body.phone || rawChatId.replace("@c.us", "");
    if (isGroup) {
      // Webhook sends @g.us but /chats uses -group — standardize to -group
      phone = rawChatId.replace("@g.us", "") + "-group";
    }
    
    if (!phone) {
      return new Response(JSON.stringify({ ok: true, skipped: "no phone" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Filter out broadcasts and status updates ONLY (keep groups and individuals)
    if (
      isBroadcast ||
      phone === "status" ||
      phone.includes("broadcast") ||
      rawChatId.includes("status@broadcast")
    ) {
      return new Response(JSON.stringify({ ok: true, skipped: "broadcast_or_status" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    
    // Classify contact type
    const contactType = isGroup ? "group" : "individual";

    const senderName = body.senderName || body.pushName || null;
    const messageText = body.text?.message || body.text || body.caption || null;
    const messageType = body.image ? "image"
      : (body.audio || body.ptt) ? "audio"
      : body.video ? "video"
      : body.document ? "document"
      : body.sticker ? "sticker"
      : "text";
    const mediaUrl = body.image?.imageUrl
      || body.audio?.audioUrl
      || body.ptt?.audioUrl || body.ptt?.pttUrl
      || body.video?.videoUrl
      || body.document?.documentUrl
      || null;

    // Upsert contact — now scoped to instance_id
    const { data: existingContact } = await adminClient
      .from("whatsapp_contacts")
      .select("id, unread_count, photo_url")
      .eq("organization_id", orgId)
      .eq("phone", phone)
      .maybeSingle();

    let contactId: string;

    // Build preview text for contact list
    const previewText = messageText
      ? messageText.substring(0, 100)
      : messageType === "audio" ? "🎤 Áudio"
      : messageType === "image" ? "📷 Imagem"
      : messageType === "video" ? "🎬 Vídeo"
      : messageType === "document" ? "📄 Documento"
      : messageType === "sticker" ? "🏷️ Sticker"
      : "📎 Mídia";

    if (existingContact) {
      contactId = existingContact.id;
      const updateData: Record<string, unknown> = {
        name: senderName || undefined,
        last_message_at: new Date().toISOString(),
        last_message_preview: (isFromMe ? "Você: " : "") + previewText,
        instance_id: instance.id,
      };
      // Only increment unread for inbound messages
      if (!isFromMe) {
        updateData.unread_count = (existingContact.unread_count || 0) + 1;
      }
      await adminClient
        .from("whatsapp_contacts")
        .update(updateData)
        .eq("id", contactId);
    } else {
      const { data: newContact } = await adminClient
        .from("whatsapp_contacts")
        .insert({
          organization_id: orgId,
          phone,
          name: senderName || (contactType === "group" ? phone : null),
          last_message_at: new Date().toISOString(),
          last_message_preview: (isFromMe ? "Você: " : "") + previewText,
          unread_count: isFromMe ? 0 : 1,
          instance_id: instance.id,
          attending_mode: contactType === "group" ? "human" : "ai",
          contact_type: contactType,
        })
        .select("id")
        .single();
      contactId = newContact!.id;
    }

    // Fetch profile picture if missing
    const needsPhoto = !existingContact || !existingContact.photo_url;
    if (needsPhoto) {
      try {
        const picUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/profile-picture?phone=${phone}`;
        const picRes = await fetch(picUrl, {
          headers: { "Client-Token": instance.client_token },
        });
        if (picRes.ok) {
          const picData = await picRes.json();
          const photoUrl = picData.link || picData.url || null;
          if (photoUrl) {
            await adminClient
              .from("whatsapp_contacts")
              .update({ photo_url: photoUrl })
              .eq("id", contactId);
          }
        }
      } catch (e) {
        console.error("Failed to fetch profile picture:", e);
      }
    }

    // Auto-link CRM lead if contact has no crm_lead_id
    if (!isFromMe && (!existingContact || !("crm_lead_id" in existingContact && existingContact.crm_lead_id))) {
      try {
        const { data: matchedLead } = await adminClient
          .from("crm_leads")
          .select("id")
          .eq("organization_id", orgId)
          .eq("phone", phone)
          .is("lost_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (matchedLead) {
          await adminClient
            .from("whatsapp_contacts")
            .update({ crm_lead_id: matchedLead.id })
            .eq("id", contactId);
        }
      } catch (e) {
        console.error("CRM auto-link error:", e);
      }
    }

    // Insert message with correct direction
    const direction = isFromMe ? "outbound" : "inbound";
    const msgStatus = isFromMe ? "sent" : "received";

    await adminClient.from("whatsapp_messages").insert({
      organization_id: orgId,
      contact_id: contactId,
      message_id_zapi: body.messageId || null,
      direction,
      type: messageType,
      content: messageText,
      media_url: mediaUrl,
      status: msgStatus,
      metadata: body,
    });

    // Trigger AI agent reply only for inbound messages
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

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
