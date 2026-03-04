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

    // Resolve contactId
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
    const zapiHeaders: Record<string, string> = { "Client-Token": instance.client_token };

    // Try primary endpoint
    let rawMessages: any[] = [];
    let usedFallback = false;

    console.log(`[load-history] Trying chat-messages for ${contactPhone}`);
    const primaryRes = await fetch(`${zapiBase}/chat-messages/${contactPhone}?amount=${amount}`, {
      headers: zapiHeaders,
    });

    if (primaryRes.ok) {
      const data = await primaryRes.json();
      rawMessages = Array.isArray(data) ? data : (data?.messages || []);
      console.log(`[load-history] Primary: ${rawMessages.length} messages`);
    } else {
      console.log(`[load-history] Primary failed: ${primaryRes.status}`);

      // Try alternative endpoint
      const altRes = await fetch(`${zapiBase}/get-messages-phone/${contactPhone}?amount=${amount}`, {
        headers: zapiHeaders,
      });

      if (altRes.ok) {
        const altData = await altRes.json();
        rawMessages = Array.isArray(altData) ? altData : (altData?.messages || []);
        console.log(`[load-history] Alternative: ${rawMessages.length} messages`);
      } else {
        console.log(`[load-history] Both failed — fallback`);
        usedFallback = true;
      }
    }

    if (usedFallback || rawMessages.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        fallback: true,
        imported: 0,
        skipped: 0,
        total: 0,
        message: "Mensagens anteriores não disponíveis nesta conta multi-device.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing message IDs to avoid duplicates in one query
    const zapiIds = rawMessages
      .map(m => m.messageId || m.id?.id || m.id || null)
      .filter(Boolean);

    const { data: existingMsgs } = await adminClient
      .from("whatsapp_messages")
      .select("message_id_zapi")
      .eq("organization_id", orgId)
      .in("message_id_zapi", zapiIds);

    const existingSet = new Set((existingMsgs || []).map((m: any) => m.message_id_zapi));

    const toInsert: any[] = [];

    for (const msg of rawMessages) {
      const messageIdZapi = msg.messageId || msg.id?.id || msg.id || null;
      if (!messageIdZapi || existingSet.has(messageIdZapi)) continue;

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
      const ts = msg.momment || msg.timestamp || msg.messageTimestamp;
      if (ts) {
        const tsNum = typeof ts === "number" ? (ts > 1e12 ? ts : ts * 1000) : Number(ts) * 1000;
        const d = new Date(tsNum);
        createdAt = d.getFullYear() >= 2020 ? d.toISOString() : new Date().toISOString();
      } else {
        createdAt = new Date().toISOString();
      }

      toInsert.push({
        organization_id: orgId,
        contact_id: resolvedContactId,
        message_id_zapi: messageIdZapi,
        direction: isFromMe ? "outbound" : "inbound",
        type: msgType,
        content,
        media_url: mediaUrl,
        status: isFromMe ? "sent" : "received",
        metadata: msg,
        created_at: createdAt,
      });
    }

    // Batch insert
    let imported = 0;
    if (toInsert.length > 0) {
      const { error } = await adminClient.from("whatsapp_messages").insert(toInsert);
      if (error) {
        console.error("[load-history] Insert error:", error.message);
      } else {
        imported = toInsert.length;
      }
    }

    // Update preview on contact
    if (rawMessages.length > 0) {
      const lastMsg = rawMessages[0]; // Most recent
      let preview = lastMsg.text?.message || lastMsg.text || lastMsg.body || lastMsg.caption || null;
      if (!preview) {
        if (lastMsg.image) preview = "📷 Imagem";
        else if (lastMsg.audio || lastMsg.ptt) preview = "🎵 Áudio";
        else if (lastMsg.video) preview = "🎬 Vídeo";
        else if (lastMsg.document) preview = "📄 Documento";
      }
      if (preview) {
        if (preview.length > 100) preview = preview.slice(0, 97) + "...";
        await adminClient
          .from("whatsapp_contacts")
          .update({ last_message_preview: preview })
          .eq("id", resolvedContactId);
      }
    }

    console.log(`[load-history] Done: ${imported} imported, ${rawMessages.length - imported} skipped`);

    return new Response(JSON.stringify({
      success: true,
      imported,
      skipped: rawMessages.length - imported,
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
