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

    const { contactPhone, contactId, message, type = "text", mediaUrl, quotedMessageId, action } = await req.json();

    // Action: mark messages as read on WhatsApp
    if (action === "read") {
      if (!contactPhone && !contactId) {
        return new Response(JSON.stringify({ error: "contactPhone or contactId required for read action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Resolve phone
      let readPhone = contactPhone;
      if (contactId && !readPhone) {
        const { data: ct } = await adminClient.from("whatsapp_contacts").select("phone").eq("id", contactId).single();
        if (ct) readPhone = ct.phone;
      }

      if (!readPhone) {
        return new Response(JSON.stringify({ error: "Could not resolve phone" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get connected instance
      let readInstance: any = null;
      if (contactId) {
        const { data: ct } = await adminClient.from("whatsapp_contacts").select("instance_id").eq("id", contactId).maybeSingle();
        if (ct?.instance_id) {
          const { data: inst } = await adminClient.from("whatsapp_instances").select("*").eq("id", ct.instance_id).eq("status", "connected").maybeSingle();
          if (inst) readInstance = inst;
        }
      }
      if (!readInstance) {
        const { data: insts } = await adminClient.from("whatsapp_instances").select("*").eq("organization_id", orgId).eq("status", "connected").order("created_at", { ascending: true }).limit(1);
        readInstance = insts && insts.length > 0 ? insts[0] : null;
      }

      if (!readInstance) {
        return new Response(JSON.stringify({ error: "No connected instance" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cleanReadPhone = readPhone.replace(/[\s\-\+\(\)]/g, "");
      const zapiReadBase = `https://api.z-api.io/instances/${readInstance.instance_id}/token/${readInstance.token}`;

      const readRes = await fetch(`${zapiReadBase}/read-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Client-Token": readInstance.client_token },
        body: JSON.stringify({ phone: cleanReadPhone }),
      });

      const readData = await readRes.json().catch(() => ({}));

      return new Response(JSON.stringify({ success: true, zapi: readData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((!message && !mediaUrl) || (!contactPhone && !contactId)) {
      return new Response(JSON.stringify({ error: "message or mediaUrl, and contactPhone or contactId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Z-API instance
    let instance: any = null;

    if (contactId) {
      const { data: contact } = await adminClient
        .from("whatsapp_contacts")
        .select("instance_id")
        .eq("id", contactId)
        .maybeSingle();
      if (contact?.instance_id) {
        const { data: inst } = await adminClient
          .from("whatsapp_instances")
          .select("*")
          .eq("id", inst?.id || contact.instance_id)
          .maybeSingle();
        // Fix: query by the correct instance_id from contact
        if (!inst) {
          const { data: inst2 } = await adminClient
            .from("whatsapp_instances")
            .select("*")
            .eq("id", contact.instance_id)
            .maybeSingle();
          if (inst2 && inst2.status === "connected") instance = inst2;
        } else if (inst && inst.status === "connected") {
          instance = inst;
        }
      }
    }

    if (!instance) {
      const { data: instances } = await adminClient
        .from("whatsapp_instances")
        .select("*")
        .eq("organization_id", orgId)
        .eq("status", "connected")
        .order("created_at", { ascending: true })
        .limit(1);
      instance = instances && instances.length > 0 ? instances[0] : null;
    }

    if (!instance || instance.status !== "connected") {
      return new Response(JSON.stringify({ error: "No connected WhatsApp instance" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve contact
    let phone = contactPhone;
    let resolvedContactId = contactId;

    if (contactId && !contactPhone) {
      const { data: contact } = await adminClient
        .from("whatsapp_contacts")
        .select("phone")
        .eq("id", contactId)
        .single();
      if (contact) phone = contact.phone;
    }

    // Upsert contact if needed
    if (!resolvedContactId && phone) {
      const { data: existing } = await adminClient
        .from("whatsapp_contacts")
        .select("id")
        .eq("organization_id", orgId)
        .eq("phone", phone)
        .maybeSingle();

      if (existing) {
        resolvedContactId = existing.id;
      } else {
        const { data: newContact } = await adminClient
          .from("whatsapp_contacts")
          .insert({ organization_id: orgId, phone, last_message_at: new Date().toISOString(), instance_id: instance.id })
          .select("id")
          .single();
        if (newContact) resolvedContactId = newContact.id;
      }
    }

    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, "");
    const zapiBase = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
    const zapiHeaders = {
      "Content-Type": "application/json",
      "Client-Token": instance.client_token,
    };

    let zapiUrl: string;
    let zapiBody: Record<string, unknown>;
    let resolvedType = type;

    if (mediaUrl && (type === "audio" || mediaUrl.match(/\.(webm|ogg|mp3|m4a|mp4)(\?|$)/i))) {
      // Send audio via Z-API
      zapiUrl = `${zapiBase}/send-audio`;
      zapiBody = { phone: cleanPhone, audio: mediaUrl };
      resolvedType = "audio";
    } else if (mediaUrl) {
      // Send image/document via Z-API
      zapiUrl = `${zapiBase}/send-image`;
      zapiBody = { phone: cleanPhone, image: mediaUrl, caption: message || "" };
      resolvedType = type || "image";
    } else {
      // Send text
      zapiUrl = `${zapiBase}/send-text`;
      zapiBody = { phone: cleanPhone, message };
    }

    // Add quoted message if present
    if (quotedMessageId) {
      zapiBody.messageId = quotedMessageId;
    }

    const zapiRes = await fetch(zapiUrl, {
      method: "POST",
      headers: zapiHeaders,
      body: JSON.stringify(zapiBody),
    });

    const zapiData = await zapiRes.json();
    const messageStatus = zapiRes.ok ? "sent" : "failed";

    // Build metadata
    const msgMetadata: Record<string, unknown> = { ...(zapiData || {}) };
    if (quotedMessageId) {
      msgMetadata.quotedMessageId = quotedMessageId;
    }

    // Save message
    const { data: savedMsg } = await adminClient
      .from("whatsapp_messages")
      .insert({
        organization_id: orgId,
        contact_id: resolvedContactId,
        message_id_zapi: zapiData?.messageId || null,
        direction: "outbound",
        type: resolvedType,
        content: message || null,
        media_url: mediaUrl || null,
        status: messageStatus,
        metadata: msgMetadata,
      })
      .select()
      .single();

    // Update contact
    if (resolvedContactId) {
      const updateData: Record<string, unknown> = { last_message_at: new Date().toISOString() };
      const preview = message ? message.substring(0, 100) : (resolvedType === "audio" ? "🎤 Áudio" : "📎 Mídia");
      updateData.last_message_preview = preview;
      await adminClient
        .from("whatsapp_contacts")
        .update(updateData)
        .eq("id", resolvedContactId);
    }

    if (!zapiRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send via Z-API", details: zapiData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, message: savedMsg, zapi: zapiData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
