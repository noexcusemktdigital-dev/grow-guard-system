import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, client-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate client-token
    const clientToken = req.headers.get("client-token") || req.headers.get("Client-Token");

    const { data: instance } = await adminClient
      .from("whatsapp_instances")
      .select("*")
      .eq("organization_id", orgId)
      .single();

    if (!instance) {
      return new Response(JSON.stringify({ error: "Instance not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate client token if provided
    if (clientToken && clientToken !== instance.client_token) {
      return new Response(JSON.stringify({ error: "Invalid client token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    console.log("Webhook payload:", JSON.stringify(body).slice(0, 500));

    // Z-API webhook payload for received messages
    // Common fields: phone, senderName, messageId, text, type
    const isStatus = body.status !== undefined && !body.text && !body.image && !body.audio && !body.ptt && !body.video && !body.document && !body.sticker;

    if (isStatus) {
      // Status update (delivered, read, etc.)
      if (body.messageId) {
        await adminClient
          .from("whatsapp_messages")
          .update({ status: body.status })
          .eq("message_id_zapi", body.messageId)
          .eq("organization_id", orgId);
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect group/broadcast from raw chatId BEFORE cleaning
    const rawChatId = body.chatId || "";
    const isGroup = rawChatId.includes("@g.us");
    const isBroadcast = rawChatId.includes("@broadcast");

    // Incoming message
    const phone = body.phone || rawChatId.replace("@c.us", "").replace("@g.us", "");
    if (!phone) {
      return new Response(JSON.stringify({ ok: true, skipped: "no phone" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip groups, broadcast lists, and group-like phone formats
    if (isGroup || isBroadcast || /^\d+-\d{10,}$/.test(phone)) {
      return new Response(JSON.stringify({ ok: true, skipped: "group_or_broadcast" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Upsert contact
    const { data: existingContact } = await adminClient
      .from("whatsapp_contacts")
      .select("id, unread_count")
      .eq("organization_id", orgId)
      .eq("phone", phone)
      .maybeSingle();

    let contactId: string;

    if (existingContact) {
      contactId = existingContact.id;
      await adminClient
        .from("whatsapp_contacts")
        .update({
          name: senderName || undefined,
          last_message_at: new Date().toISOString(),
          unread_count: (existingContact.unread_count || 0) + 1,
        })
        .eq("id", contactId);
    } else {
      const { data: newContact } = await adminClient
        .from("whatsapp_contacts")
        .insert({
          organization_id: orgId,
          phone,
          name: senderName,
          last_message_at: new Date().toISOString(),
          unread_count: 1,
        })
        .select("id")
        .single();
      contactId = newContact!.id;
    }

    // Insert message
    await adminClient.from("whatsapp_messages").insert({
      organization_id: orgId,
      contact_id: contactId,
      message_id_zapi: body.messageId || null,
      direction: "inbound",
      type: messageType,
      content: messageText,
      media_url: mediaUrl,
      status: "received",
      metadata: body,
    });

    // Trigger AI agent reply if contact is in AI mode and message has text
    if (messageText) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const aiReplyUrl = `${supabaseUrl}/functions/v1/ai-agent-reply`;
        
        // Fire and forget — don't block webhook response
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
            contact_phone: phone,
          }),
        }).catch((e) => console.error("AI reply trigger error:", e));
      } catch (e) {
        console.error("AI reply trigger setup error:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
