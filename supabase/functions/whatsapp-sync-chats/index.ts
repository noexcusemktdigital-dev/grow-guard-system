import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseLastMessageTime(raw: any): string | null {
  if (raw == null || typeof raw === "boolean") return null;

  // Object with _seconds / seconds (Firestore-style)
  if (typeof raw === "object" && raw !== null) {
    const secs = raw._seconds || raw.seconds;
    if (secs) {
      const d = new Date(Number(secs) * 1000);
      if (d.getFullYear() >= 2019 && d.getFullYear() <= 2030) return d.toISOString();
    }
    return null;
  }

  // Number directly
  if (typeof raw === "number" && raw > 0) {
    const ms = raw > 9999999999 ? raw : raw * 1000;
    const d = new Date(ms);
    if (d.getFullYear() >= 2019 && d.getFullYear() <= 2030) return d.toISOString();
  }

  // String
  if (typeof raw === "string") {
    // Numeric string
    const num = Number(raw);
    if (!isNaN(num) && num > 0) {
      const ms = num > 9999999999 ? num : num * 1000;
      const d = new Date(ms);
      if (d.getFullYear() >= 2019 && d.getFullYear() <= 2030) return d.toISOString();
    }
    // BR format DD/MM/YYYY HH:mm or DD/MM/YYYY
    const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (brMatch) {
      const [, dd, mm, yyyy, hh, mi, ss] = brMatch;
      const d = new Date(`${yyyy}-${mm}-${dd}T${hh || "00"}:${mi || "00"}:${ss || "00"}`);
      if (!isNaN(d.getTime()) && d.getFullYear() >= 2019 && d.getFullYear() <= 2030) return d.toISOString();
    }
    // ISO parse
    const isoDate = new Date(raw);
    if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() >= 2019 && isoDate.getFullYear() <= 2030) {
      return isoDate.toISOString();
    }
  }

  return null;
}

function extractTimestamp(chat: any): string | null {
  // Chain of fallback fields
  const candidates = [
    chat.lastMessageTime,
    chat.lastMessageTimestamp,
    chat.timestamp,
    chat.t,
    chat.lastInteraction,
    chat.lastActivity,
  ];

  for (const c of candidates) {
    const parsed = parseLastMessageTime(c);
    if (parsed) return parsed;
  }

  // Nested lastMessage object
  if (chat.lastMessage && typeof chat.lastMessage === "object") {
    const nested = [
      chat.lastMessage.timestamp,
      chat.lastMessage.t,
      chat.lastMessage.time,
      chat.lastMessage.messageTimestamp,
    ];
    for (const c of nested) {
      const parsed = parseLastMessageTime(c);
      if (parsed) return parsed;
    }
  }

  return null;
}

function extractLastMessagePreview(chat: any): string | null {
  if (chat.lastMessageText && typeof chat.lastMessageText === "string") return chat.lastMessageText.slice(0, 200);
  if (chat.lastMessage) {
    if (typeof chat.lastMessage === "string") return chat.lastMessage.slice(0, 200);
    if (typeof chat.lastMessage === "object") {
      const body = chat.lastMessage.body || chat.lastMessage.content || chat.lastMessage.text;
      if (body && typeof body === "string") return body.slice(0, 200);
    }
  }
  return null;
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
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: orgId } = await adminClient.rpc("get_user_org_id", { _user_id: user.id });
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
        console.error(`Z-API /chats error (page ${page}):`, await chatsRes.text());
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

    if (filterPhone) {
      individualChats = individualChats.filter((c: any) => c.phone === filterPhone);
    }

    console.log(`[sync] ${individualChats.length} individual chats after filtering`);

    // DEBUG: Log full objects of first 5 individual chats
    for (let i = 0; i < Math.min(5, individualChats.length); i++) {
      const c = individualChats[i];
      console.log(`[sync] DEBUG Chat #${i} FULL:`, JSON.stringify(c).slice(0, 2000));
      console.log(`[sync] DEBUG Chat #${i} timestamp fields:`, JSON.stringify({
        lastMessageTime: c.lastMessageTime,
        lastMessageTimestamp: c.lastMessageTimestamp,
        timestamp: c.timestamp,
        t: c.t,
        lastInteraction: c.lastInteraction,
        lastActivity: c.lastActivity,
        lastMessage: c.lastMessage,
      }));
    }

    // Get existing contacts in ONE query
    const { data: existingContacts } = await adminClient
      .from("whatsapp_contacts")
      .select("id, phone, attending_mode")
      .eq("organization_id", orgId);

    const existingMap = new Map<string, { id: string; attending_mode: string | null }>();
    (existingContacts || []).forEach((c: any) => {
      existingMap.set(c.phone, { id: c.id, attending_mode: c.attending_mode });
    });

    let contactsCreated = 0;
    let contactsUpdated = 0;
    let timestampsFound = 0;

    const BATCH_SIZE = 100;
    for (let batchStart = 0; batchStart < individualChats.length; batchStart += BATCH_SIZE) {
      const batch = individualChats.slice(batchStart, batchStart + BATCH_SIZE);
      const inserts: any[] = [];
      const updates: { id: string; data: any }[] = [];

      for (let i = 0; i < batch.length; i++) {
        const chat = batch[i];
        const phone = chat.phone;
        const name = chat.name || null;
        const photoUrl = chat.imgUrl || chat.profileThumbnail || null;
        const unreadCount = parseInt(chat.unreadCount ?? chat.unreadMessages ?? chat.unread ?? chat.unreadQtd ?? "0") || 0;

        const lastMsgTime = extractTimestamp(chat);
        if (lastMsgTime) timestampsFound++;

        const preview = extractLastMessagePreview(chat);
        const existing = existingMap.get(phone);

        if (existing) {
          const upd: any = {
            instance_id: instance.id,
            unread_count: unreadCount,
          };
          if (lastMsgTime) upd.last_message_at = lastMsgTime;
          if (name) upd.name = name;
          if (photoUrl) upd.photo_url = photoUrl;
          if (preview) upd.last_message_preview = preview;
          updates.push({ id: existing.id, data: upd });
          contactsUpdated++;
        } else {
          inserts.push({
            organization_id: orgId,
            phone,
            name,
            last_message_at: lastMsgTime || new Date().toISOString(),
            unread_count: unreadCount,
            instance_id: instance.id,
            attending_mode: "human",
            photo_url: photoUrl,
            last_message_preview: preview,
          });
          existingMap.set(phone, { id: "pending", attending_mode: "human" });
          contactsCreated++;
        }
      }

      if (inserts.length > 0) {
        const { error: insertError } = await adminClient.from("whatsapp_contacts").insert(inserts);
        if (insertError) console.error("[sync] Batch insert error:", insertError.message);
      }

      for (const upd of updates) {
        await adminClient.from("whatsapp_contacts").update(upd.data).eq("id", upd.id);
      }
    }

    console.log(`[sync] Done: ${contactsCreated} created, ${contactsUpdated} updated, ${timestampsFound}/${individualChats.length} timestamps found`);

    return new Response(
      JSON.stringify({
        success: true,
        contacts_created: contactsCreated,
        contacts_updated: contactsUpdated,
        total_chats_found: individualChats.length,
        timestamps_found: timestampsFound,
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
