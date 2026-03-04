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
    // Authenticate user
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

    // User client for auth
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

    // Admin client for DB operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get user's org
    const { data: orgId } = await adminClient.rpc("get_user_org_id", { _user_id: userId });
    if (!orgId) {
      return new Response(JSON.stringify({ error: "User has no organization" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contactPhone, contactId, message, type = "text" } = await req.json();

    if (!message || (!contactPhone && !contactId)) {
      return new Response(JSON.stringify({ error: "message and contactPhone or contactId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Z-API instance — try contact's instance first, fallback to first connected
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
          .eq("id", contact.instance_id)
          .maybeSingle();
        if (inst && inst.status === "connected") instance = inst;
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

    if (!instance) {
      return new Response(JSON.stringify({ error: "No WhatsApp instance configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (instance.status !== "connected") {
      return new Response(JSON.stringify({ error: "WhatsApp instance not connected" }), {
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
          .insert({ organization_id: orgId, phone, last_message_at: new Date().toISOString() })
          .select("id")
          .single();
        if (newContact) resolvedContactId = newContact.id;
      }
    }

    // Format phone for Z-API (remove +, spaces, dashes)
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, "");

    // Send via Z-API
    const zapiUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/send-text`;
    const zapiRes = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": instance.client_token,
      },
      body: JSON.stringify({ phone: cleanPhone, message }),
    });

    const zapiData = await zapiRes.json();

    const messageStatus = zapiRes.ok ? "sent" : "failed";

    // Save message
    const { data: savedMsg, error: msgErr } = await adminClient
      .from("whatsapp_messages")
      .insert({
        organization_id: orgId,
        contact_id: resolvedContactId,
        message_id_zapi: zapiData?.messageId || null,
        direction: "outbound",
        type,
        content: message,
        status: messageStatus,
        metadata: zapiData || {},
      })
      .select()
      .single();

    // Update contact last_message_at
    if (resolvedContactId) {
      await adminClient
        .from("whatsapp_contacts")
        .update({ last_message_at: new Date().toISOString() })
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
