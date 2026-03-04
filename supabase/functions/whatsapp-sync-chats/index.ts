import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseLastMessageTime(raw: any, debugIndex?: number): string | null {
  if (!raw) return null;

  if (debugIndex !== undefined && debugIndex < 5) {
    console.log(`[sync] Contact #${debugIndex} lastMessageTime raw:`, JSON.stringify(raw), typeof raw);
  }

  // Handle object with _seconds (Firestore-style)
  if (typeof raw === "object" && raw !== null) {
    const secs = raw._seconds || raw.seconds;
    if (secs) {
      const d = new Date(Number(secs) * 1000);
      if (d.getFullYear() >= 2020 && d.getFullYear() <= 2030) return d.toISOString();
    }
    return null;
  }

  // Handle number directly
  if (typeof raw === "number" && raw > 0) {
    const ms = raw > 9999999999 ? raw : raw * 1000;
    const d = new Date(ms);
    if (d.getFullYear() >= 2020 && d.getFullYear() <= 2030) return d.toISOString();
  }

  // Handle string
  if (typeof raw === "string") {
    // Try as numeric string FIRST (most common from Z-API)
    const num = Number(raw);
    if (!isNaN(num) && num > 0) {
      const ms = num > 9999999999 ? num : num * 1000;
      const d = new Date(ms);
      if (d.getFullYear() >= 2020 && d.getFullYear() <= 2030) return d.toISOString();
    }
    // Try ISO parse
    const isoDate = new Date(raw);
    if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() >= 2020 && isoDate.getFullYear() <= 2030) {
      return isoDate.toISOString();
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
    const userId = user.id;

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

    // Log raw data from first 3 chats for debugging
    for (let i = 0; i < Math.min(3, allChats.length); i++) {
      const c = allChats[i];
      console.log(`[sync] Chat #${i} raw keys:`, Object.keys(c).join(", "));
    }

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

    // Get existing contacts in ONE query (avoid N+1)
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

    // Process in batches of 50 using individual upserts but NO separate SELECT per contact
    const BATCH_SIZE = 100;
    for (let batchStart = 0; batchStart < individualChats.length; batchStart += BATCH_SIZE) {
      const batch = individualChats.slice(batchStart, batchStart + BATCH_SIZE);

      const inserts: any[] = [];
      const updates: { id: string; data: any }[] = [];

      for (let i = 0; i < batch.length; i++) {
        const chat = batch[i];
        const globalIdx = batchStart + i;
        const phone = chat.phone;
        const name = chat.name || null;
        const photoUrl = chat.imgUrl || chat.profileThumbnail || null;
        const unreadCount = parseInt(chat.unread) || 0;

        const rawTime = chat.lastMessageTime || chat.lastMessageTimestamp || chat.timestamp || chat.t;
        const lastMsgTime = parseLastMessageTime(rawTime, globalIdx);

        const existing = existingMap.get(phone);

        if (existing) {
          // Update — DO NOT overwrite attending_mode
          const upd: any = {
            instance_id: instance.id,
            unread_count: unreadCount,
          };
          if (lastMsgTime) upd.last_message_at = lastMsgTime;
          if (name) upd.name = name;
          if (photoUrl) upd.photo_url = photoUrl;

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
          });
          existingMap.set(phone, { id: "pending", attending_mode: "human" });
          contactsCreated++;
        }
      }

      // Batch insert new contacts
      if (inserts.length > 0) {
        const { error: insertError } = await adminClient
          .from("whatsapp_contacts")
          .insert(inserts);
        if (insertError) console.error("[sync] Batch insert error:", insertError.message);
      }

      // Batch updates (Supabase doesn't support batch UPDATE, but we can do them quickly)
      for (const upd of updates) {
        await adminClient
          .from("whatsapp_contacts")
          .update(upd.data)
          .eq("id", upd.id);
      }
    }

    console.log(`[sync] Done: ${contactsCreated} created, ${contactsUpdated} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        contacts_created: contactsCreated,
        contacts_updated: contactsUpdated,
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
