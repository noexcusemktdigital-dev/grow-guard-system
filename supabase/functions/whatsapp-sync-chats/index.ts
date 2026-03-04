import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseLastMessageTime(raw: any): string {
  if (!raw) return new Date().toISOString();
  const num = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
  if (isNaN(num) || num <= 0) return new Date().toISOString();
  const ms = num > 9999999999 ? num : num * 1000;
  const d = new Date(ms);
  if (d.getFullYear() < 2020 || d.getFullYear() > 2030) return new Date().toISOString();
  return d.toISOString();
}

async function fetchProfilePicture(zapiBase: string, zapiHeaders: Record<string, string>, phone: string): Promise<string | null> {
  try {
    const res = await fetch(`${zapiBase}/profile-picture?phone=${phone}`, { headers: zapiHeaders });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.link || data?.imgUrl || data?.profilePictureUrl || null;
  } catch {
    return null;
  }
}

async function fetchLastMessage(
  zapiBase: string,
  zapiHeaders: Record<string, string>,
  phone: string,
  orgId: string,
  contactId: string,
  adminClient: any
): Promise<boolean> {
  try {
    // Try chat-messages endpoint first (1 message)
    const res = await fetch(`${zapiBase}/chat-messages/${phone}?amount=1`, { headers: zapiHeaders });
    if (!res.ok) {
      const text = await res.text();
      // If multi-device error, try alternative endpoint
      if (text.includes("multi device") || text.includes("multidevice")) {
        return await fetchLastMessageAlt(zapiBase, zapiHeaders, phone, orgId, contactId, adminClient);
      }
      return false;
    }
    const data = await res.json();
    const msgs = Array.isArray(data) ? data : (data?.messages || []);
    if (msgs.length === 0) return false;

    const msg = msgs[0];
    const messageIdZapi = msg.messageId || msg.id?.id || msg.id || null;
    if (!messageIdZapi) return false;

    // Check if already exists
    const { data: existing } = await adminClient
      .from("whatsapp_messages")
      .select("id")
      .eq("organization_id", orgId)
      .eq("message_id_zapi", messageIdZapi)
      .maybeSingle();
    if (existing) return false;

    const isFromMe = msg.fromMe === true;
    const content = msg.text?.message || msg.text || msg.body || msg.caption || null;
    const msgType = msg.image ? "image"
      : (msg.audio || msg.ptt) ? "audio"
      : msg.video ? "video"
      : msg.document ? "document"
      : msg.sticker ? "sticker"
      : "text";
    const mediaUrl = msg.image?.imageUrl || msg.image?.url
      || msg.audio?.audioUrl || msg.ptt?.audioUrl || msg.ptt?.pttUrl
      || msg.video?.videoUrl
      || msg.document?.documentUrl
      || null;

    let createdAt: string;
    if (msg.momment || msg.timestamp || msg.messageTimestamp) {
      const ts = msg.momment || msg.timestamp || msg.messageTimestamp;
      const tsNum = typeof ts === "number" ? (ts > 1e12 ? ts : ts * 1000) : parseInt(ts) * 1000;
      createdAt = new Date(tsNum).toISOString();
    } else {
      createdAt = new Date().toISOString();
    }

    await adminClient.from("whatsapp_messages").insert({
      organization_id: orgId,
      contact_id: contactId,
      message_id_zapi: messageIdZapi,
      direction: isFromMe ? "outbound" : "inbound",
      type: msgType,
      content,
      media_url: mediaUrl,
      status: isFromMe ? "sent" : "received",
      metadata: msg,
      created_at: createdAt,
    });
    return true;
  } catch (err) {
    console.error(`[sync] fetchLastMessage error for ${phone}:`, err);
    return false;
  }
}

async function fetchLastMessageAlt(
  zapiBase: string,
  zapiHeaders: Record<string, string>,
  phone: string,
  orgId: string,
  contactId: string,
  adminClient: any
): Promise<boolean> {
  try {
    const res = await fetch(`${zapiBase}/get-messages-phone/${phone}?amount=1`, { headers: zapiHeaders });
    if (!res.ok) return false;
    const data = await res.json();
    const msgs = Array.isArray(data) ? data : (data?.messages || []);
    if (msgs.length === 0) return false;

    const msg = msgs[0];
    const messageIdZapi = msg.messageId || msg.id?.id || msg.id || null;
    if (!messageIdZapi) return false;

    const { data: existing } = await adminClient
      .from("whatsapp_messages")
      .select("id")
      .eq("organization_id", orgId)
      .eq("message_id_zapi", messageIdZapi)
      .maybeSingle();
    if (existing) return false;

    const isFromMe = msg.fromMe === true;
    const content = msg.text?.message || msg.text || msg.body || msg.caption || null;

    let createdAt: string;
    if (msg.momment || msg.timestamp || msg.messageTimestamp) {
      const ts = msg.momment || msg.timestamp || msg.messageTimestamp;
      const tsNum = typeof ts === "number" ? (ts > 1e12 ? ts : ts * 1000) : parseInt(ts) * 1000;
      createdAt = new Date(tsNum).toISOString();
    } else {
      createdAt = new Date().toISOString();
    }

    await adminClient.from("whatsapp_messages").insert({
      organization_id: orgId,
      contact_id: contactId,
      message_id_zapi: messageIdZapi,
      direction: isFromMe ? "outbound" : "inbound",
      type: "text",
      content,
      status: isFromMe ? "sent" : "received",
      metadata: msg,
      created_at: createdAt,
    });
    return true;
  } catch {
    return false;
  }
}

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

    const body = await req.json().catch(() => ({}));
    const { instanceId, phone: filterPhone } = body;

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
    const zapiHeaders: Record<string, string> = { "Client-Token": instance.client_token };

    // Fetch all chats from Z-API (paginated)
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
      if (page > 20) break;
    }

    console.log(`[sync] Fetched ${allChats.length} chats from Z-API`);

    // Filter out groups, broadcasts, status
    let individualChats = allChats.filter((chat: any) => {
      if (chat.isGroup) return false;
      const phone = chat.phone || "";
      if (!phone) return false;
      if (phone.includes("broadcast")) return false;
      if (phone === "status") return false;
      if (/^\d+-\d{10,}$/.test(phone)) return false;
      if (phone.endsWith("-group")) return false;
      return true;
    });

    // Optional: filter by specific phone
    if (filterPhone) {
      individualChats = individualChats.filter((c: any) => c.phone === filterPhone);
    }

    console.log(`[sync] ${individualChats.length} individual chats after filtering`);

    let contactsCreated = 0;
    let contactsUpdated = 0;
    let photosUpdated = 0;
    let messagesImported = 0;

    // Upsert contacts
    for (const chat of individualChats) {
      const phone = chat.phone;
      const name = chat.name || null;
      // Use profileThumbnail as fallback for photo
      const photoUrl = chat.imgUrl || chat.profileThumbnail || null;
      const unreadCount = parseInt(chat.unread) || 0;
      const lastMsgTime = parseLastMessageTime(chat.lastMessageTime);

      const { data: existing } = await adminClient
        .from("whatsapp_contacts")
        .select("id")
        .eq("organization_id", orgId)
        .eq("phone", phone)
        .maybeSingle();

      if (existing) {
        const updates: any = {
          instance_id: instance.id,
          attending_mode: "human",
          last_message_at: lastMsgTime,
          unread_count: unreadCount,
        };
        if (name) updates.name = name;
        if (photoUrl) updates.photo_url = photoUrl;

        await adminClient
          .from("whatsapp_contacts")
          .update(updates)
          .eq("id", existing.id);
        contactsUpdated++;
      } else {
        await adminClient
          .from("whatsapp_contacts")
          .insert({
            organization_id: orgId,
            phone,
            name,
            last_message_at: lastMsgTime,
            unread_count: unreadCount,
            instance_id: instance.id,
            attending_mode: "human",
            photo_url: photoUrl,
          });
        contactsCreated++;
      }
    }

    // Phase 2: Fetch profile pictures for the 50 most recent contacts
    const recentChats = individualChats.slice(0, 50);
    console.log(`[sync] Fetching profile pictures for ${recentChats.length} recent contacts`);

    for (const chat of recentChats) {
      const phone = chat.phone;
      const picUrl = await fetchProfilePicture(zapiBase, zapiHeaders, phone);
      if (picUrl) {
        await adminClient
          .from("whatsapp_contacts")
          .update({ photo_url: picUrl })
          .eq("organization_id", orgId)
          .eq("phone", phone);
        photosUpdated++;
      }
      // Small delay to avoid rate-limiting
      await new Promise(r => setTimeout(r, 100));
    }

    // Phase 3: Fetch last message for the 50 most recent contacts (as preview)
    console.log(`[sync] Fetching last message for ${recentChats.length} recent contacts`);

    for (const chat of recentChats) {
      const phone = chat.phone;
      // Get the contact ID
      const { data: contactRow } = await adminClient
        .from("whatsapp_contacts")
        .select("id")
        .eq("organization_id", orgId)
        .eq("phone", phone)
        .maybeSingle();

      if (!contactRow) continue;

      // Check if contact already has messages
      const { data: existingMsg } = await adminClient
        .from("whatsapp_messages")
        .select("id")
        .eq("organization_id", orgId)
        .eq("contact_id", contactRow.id)
        .limit(1)
        .maybeSingle();

      if (existingMsg) continue; // Already has messages, skip

      const imported = await fetchLastMessage(zapiBase, zapiHeaders, phone, orgId, contactRow.id, adminClient);
      if (imported) messagesImported++;

      // Small delay to avoid rate-limiting
      await new Promise(r => setTimeout(r, 150));
    }

    console.log(`[sync] Done: ${contactsCreated} created, ${contactsUpdated} updated, ${photosUpdated} photos, ${messagesImported} messages`);

    return new Response(
      JSON.stringify({
        success: true,
        contacts_created: contactsCreated,
        contacts_updated: contactsUpdated,
        photos_updated: photosUpdated,
        messages_imported: messagesImported,
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
