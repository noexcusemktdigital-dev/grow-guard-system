import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseLastMessageTime(raw: any, debugIndex?: number): string {
  if (!raw) return new Date().toISOString();

  // Log raw value for first 5 contacts for debugging
  if (debugIndex !== undefined && debugIndex < 5) {
    console.log(`[sync] Contact #${debugIndex} lastMessageTime raw:`, JSON.stringify(raw), typeof raw);
  }

  // Handle object with _seconds (Firestore-style)
  if (typeof raw === "object" && raw !== null) {
    if (raw._seconds) return new Date(raw._seconds * 1000).toISOString();
    if (raw.seconds) return new Date(raw.seconds * 1000).toISOString();
    // Try valueOf
    return new Date().toISOString();
  }

  // Handle string ISO format directly
  if (typeof raw === "string") {
    // Try ISO parse first
    const isoDate = new Date(raw);
    if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() >= 2020 && isoDate.getFullYear() <= 2030) {
      return isoDate.toISOString();
    }
    // Try as numeric string
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      const ms = num > 9999999999 ? num : num * 1000;
      const d = new Date(ms);
      if (d.getFullYear() >= 2020 && d.getFullYear() <= 2030) return d.toISOString();
    }
  }

  // Handle number directly
  if (typeof raw === "number" && raw > 0) {
    const ms = raw > 9999999999 ? raw : raw * 1000;
    const d = new Date(ms);
    if (d.getFullYear() >= 2020 && d.getFullYear() <= 2030) return d.toISOString();
  }

  return new Date().toISOString();
}

function extractPreview(chat: any): string | null {
  // Z-API may return lastMessage as an object or string
  const lm = chat.lastMessage || chat.lastMessageText || chat.lastMsg;
  if (!lm) return null;
  if (typeof lm === "string") return lm.length > 100 ? lm.slice(0, 97) + "..." : lm;
  // Object format
  const text = lm.text?.message || lm.text || lm.body || lm.caption || null;
  if (!text) {
    // Media types
    if (lm.image) return "📷 Imagem";
    if (lm.audio || lm.ptt) return "🎵 Áudio";
    if (lm.video) return "🎬 Vídeo";
    if (lm.document) return "📄 Documento";
    if (lm.sticker) return "🏷️ Figurinha";
    return null;
  }
  return text.length > 100 ? text.slice(0, 97) + "..." : text;
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

    // Log raw data from first 3 chats for debugging timestamp format
    for (let i = 0; i < Math.min(3, allChats.length); i++) {
      const c = allChats[i];
      console.log(`[sync] Chat #${i} raw keys:`, Object.keys(c).join(", "));
      console.log(`[sync] Chat #${i} lastMessageTime:`, JSON.stringify(c.lastMessageTime), `| lastMessageTimestamp:`, JSON.stringify(c.lastMessageTimestamp), `| timestamp:`, JSON.stringify(c.timestamp));
      console.log(`[sync] Chat #${i} lastMessage:`, JSON.stringify(c.lastMessage)?.slice(0, 200));
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

    // Optional: filter by specific phone
    if (filterPhone) {
      individualChats = individualChats.filter((c: any) => c.phone === filterPhone);
    }

    console.log(`[sync] ${individualChats.length} individual chats after filtering`);

    let contactsCreated = 0;
    let contactsUpdated = 0;

    // Batch upsert contacts (process in batches of 50 for efficiency)
    const BATCH_SIZE = 50;
    for (let batchStart = 0; batchStart < individualChats.length; batchStart += BATCH_SIZE) {
      const batch = individualChats.slice(batchStart, batchStart + BATCH_SIZE);
      
      for (let i = 0; i < batch.length; i++) {
        const chat = batch[i];
        const globalIdx = batchStart + i;
        const phone = chat.phone;
        const name = chat.name || null;
        const photoUrl = chat.imgUrl || chat.profileThumbnail || null;
        const unreadCount = parseInt(chat.unread) || 0;
        
        // Try multiple timestamp fields
        const rawTime = chat.lastMessageTime || chat.lastMessageTimestamp || chat.timestamp || chat.t;
        const lastMsgTime = parseLastMessageTime(rawTime, globalIdx);
        const preview = extractPreview(chat);

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
          if (preview) updates.last_message_preview = preview;

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
              last_message_preview: preview,
            });
          contactsCreated++;
        }
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
