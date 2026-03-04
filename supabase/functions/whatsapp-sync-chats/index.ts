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
  // If > 10 digits it's milliseconds, otherwise seconds
  const ms = num > 9999999999 ? num : num * 1000;
  const d = new Date(ms);
  // Sanity check: if date is before 2020 or after 2030, use now
  if (d.getFullYear() < 2020 || d.getFullYear() > 2030) return new Date().toISOString();
  return d.toISOString();
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
    const zapiHeaders = { "Client-Token": instance.client_token };

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

    // Batch upsert contacts from chat data
    for (const chat of individualChats) {
      const phone = chat.phone;
      const name = chat.name || null;
      const photoUrl = chat.imgUrl || null;
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
