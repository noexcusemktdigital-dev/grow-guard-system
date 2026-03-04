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
    const { instanceId } = body;

    // Find the instance
    let instance: any = null;
    if (instanceId) {
      const { data } = await adminClient
        .from("whatsapp_instances")
        .select("*")
        .eq("organization_id", orgId)
        .eq("instance_id", instanceId)
        .maybeSingle();
      instance = data;
    } else {
      const { data } = await adminClient
        .from("whatsapp_instances")
        .select("*")
        .eq("organization_id", orgId)
        .eq("status", "connected")
        .limit(1)
        .maybeSingle();
      instance = data;
    }

    if (!instance) {
      return new Response(JSON.stringify({ error: "No connected WhatsApp instance found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zapiBase = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
    const zapiHeaders = { "Client-Token": instance.client_token };

    // 1. Fetch all chats from Z-API (paginated)
    let allChats: any[] = [];
    let page = 1;
    const pageSize = 50;

    while (true) {
      const chatsRes = await fetch(`${zapiBase}/chats?page=${page}&pageSize=${pageSize}`, {
        headers: zapiHeaders,
      });

      if (!chatsRes.ok) {
        const errText = await chatsRes.text();
        console.error(`Z-API /chats error (page ${page}):`, errText);
        break;
      }

      const chatsData = await chatsRes.json();
      const chats = Array.isArray(chatsData) ? chatsData : [];

      if (chats.length === 0) break;

      allChats = allChats.concat(chats);
      if (chats.length < pageSize) break;
      page++;

      // Safety limit
      if (page > 20) break;
    }

    console.log(`[sync] Fetched ${allChats.length} chats from Z-API`);

    // 2. Filter out groups, broadcasts, status
    const individualChats = allChats.filter((chat: any) => {
      if (chat.isGroup) return false;
      const phone = chat.phone || "";
      if (!phone) return false;
      if (phone.includes("broadcast")) return false;
      if (phone === "status") return false;
      if (/^\d+-\d{10,}$/.test(phone)) return false;
      if (phone.endsWith("-group")) return false;
      return true;
    });

    console.log(`[sync] ${individualChats.length} individual chats after filtering`);

    let contactsSynced = 0;
    let messagesSynced = 0;

    // 3. Process each chat
    for (const chat of individualChats) {
      const phone = chat.phone;
      const name = chat.name || null;

      // Upsert contact
      const { data: existingContact } = await adminClient
        .from("whatsapp_contacts")
        .select("id")
        .eq("organization_id", orgId)
        .eq("phone", phone)
        .maybeSingle();

      let contactId: string;

      if (existingContact) {
        contactId = existingContact.id;
        // Update name if we have a better one
        if (name) {
          await adminClient
            .from("whatsapp_contacts")
            .update({ name, instance_id: instance.id })
            .eq("id", contactId);
        }
      } else {
        const lastMsgTime = chat.lastMessageTime
          ? new Date(parseInt(chat.lastMessageTime) * 1000).toISOString()
          : new Date().toISOString();

        const { data: newContact } = await adminClient
          .from("whatsapp_contacts")
          .insert({
            organization_id: orgId,
            phone,
            name,
            last_message_at: lastMsgTime,
            unread_count: parseInt(chat.unread) || 0,
            instance_id: instance.id,
            attending_mode: "ai",
            photo_url: chat.imgUrl || null,
          })
          .select("id")
          .single();

        if (!newContact) continue;
        contactId = newContact.id;
        contactsSynced++;
      }

      // 4. Fetch last 20 messages for this chat
      try {
        const msgsRes = await fetch(`${zapiBase}/chat-messages/${phone}?amount=20`, {
          headers: zapiHeaders,
        });

        if (!msgsRes.ok) {
          console.error(`[sync] Failed to fetch messages for ${phone}:`, await msgsRes.text());
          continue;
        }

        const msgsData = await msgsRes.json();
        const messages = Array.isArray(msgsData) ? msgsData : [];

        for (const msg of messages) {
          const messageIdZapi = msg.messageId;
          if (!messageIdZapi) continue;

          // Determine content and type
          const isFromMe = msg.fromMe === true;
          const messageText = msg.text?.message || msg.text || msg.caption || null;
          const messageType = msg.image ? "image"
            : (msg.audio || msg.ptt) ? "audio"
            : msg.video ? "video"
            : msg.document ? "document"
            : msg.sticker ? "sticker"
            : "text";
          const mediaUrl = msg.image?.imageUrl
            || msg.audio?.audioUrl
            || msg.ptt?.audioUrl || msg.ptt?.pttUrl
            || msg.video?.videoUrl
            || msg.document?.documentUrl
            || null;

          const direction = isFromMe ? "outbound" : "inbound";
          const msgTimestamp = msg.momment
            ? new Date(msg.momment * 1000).toISOString()
            : new Date().toISOString();

          // Insert with ON CONFLICT DO NOTHING via upsert trick
          const { error } = await adminClient.from("whatsapp_messages").insert({
            organization_id: orgId,
            contact_id: contactId,
            message_id_zapi: messageIdZapi,
            direction,
            type: messageType,
            content: messageText,
            media_url: mediaUrl,
            status: isFromMe ? "sent" : "received",
            created_at: msgTimestamp,
            metadata: msg,
          });

          if (!error) {
            messagesSynced++;
          }
          // Duplicate key errors are expected - skip silently
        }

        // Update last_message_at from actual messages
        if (messages.length > 0) {
          const latestMsg = messages[0]; // Z-API returns newest first
          if (latestMsg.momment) {
            const latestTime = new Date(latestMsg.momment * 1000).toISOString();
            await adminClient
              .from("whatsapp_contacts")
              .update({ last_message_at: latestTime })
              .eq("id", contactId);
          }
        }
      } catch (err) {
        console.error(`[sync] Error fetching messages for ${phone}:`, err);
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log(`[sync] Done: ${contactsSynced} new contacts, ${messagesSynced} new messages`);

    return new Response(
      JSON.stringify({
        success: true,
        contacts_synced: contactsSynced,
        messages_synced: messagesSynced,
        total_chats_found: individualChats.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[sync] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
