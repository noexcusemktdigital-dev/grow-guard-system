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
      return new Response(JSON.stringify({ error: "No org" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { contactPhone, contactId, instanceId, amount = 50 } = body;

    if (!contactPhone) {
      return new Response(JSON.stringify({ error: "contactPhone required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find instance
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
      return new Response(JSON.stringify({ error: "No instance" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve contactId if not provided
    let resolvedContactId = contactId;
    if (!resolvedContactId) {
      const { data: c } = await adminClient
        .from("whatsapp_contacts")
        .select("id")
        .eq("organization_id", orgId)
        .eq("phone", contactPhone)
        .maybeSingle();
      resolvedContactId = c?.id;
    }

    if (!resolvedContactId) {
      return new Response(JSON.stringify({ error: "Contact not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zapiBase = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
    const zapiHeaders = { "Client-Token": instance.client_token };

    // Try loading messages from Z-API
    const messagesUrl = `${zapiBase}/chat-messages/${contactPhone}?amount=${amount}`;
    console.log(`[load-history] Fetching ${amount} messages for ${contactPhone}`);

    const res = await fetch(messagesUrl, { headers: zapiHeaders });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[load-history] Z-API error: ${res.status} ${errText}`);
      // Graceful fallback
      return new Response(JSON.stringify({ 
        fallback: true, 
        imported: 0, 
        error: errText,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messagesData = await res.json();
    const rawMessages = Array.isArray(messagesData) ? messagesData : (messagesData?.messages || []);

    console.log(`[load-history] Got ${rawMessages.length} messages from Z-API`);

    let imported = 0;
    let skipped = 0;

    for (const msg of rawMessages) {
      const messageIdZapi = msg.messageId || msg.id?.id || msg.id || null;
      if (!messageIdZapi) { skipped++; continue; }

      // Check if already exists
      const { data: existing } = await adminClient
        .from("whatsapp_messages")
        .select("id")
        .eq("organization_id", orgId)
        .eq("message_id_zapi", messageIdZapi)
        .maybeSingle();

      if (existing) { skipped++; continue; }

      const isFromMe = msg.fromMe === true;
      const direction = isFromMe ? "outbound" : "inbound";

      // Parse content
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

      // Parse timestamp
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
        contact_id: resolvedContactId,
        message_id_zapi: messageIdZapi,
        direction,
        type: msgType,
        content,
        media_url: mediaUrl,
        status: isFromMe ? "sent" : "received",
        metadata: msg,
        created_at: createdAt,
      });

      imported++;
    }

    console.log(`[load-history] Done: ${imported} imported, ${skipped} skipped`);

    return new Response(JSON.stringify({
      success: true,
      imported,
      skipped,
      total: rawMessages.length,
      fallback: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[load-history] Error:", err);
    return new Response(JSON.stringify({ error: err.message, fallback: true, imported: 0 }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
