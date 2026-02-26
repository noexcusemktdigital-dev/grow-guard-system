import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { action, api_key, session_id, content, visitor_name, visitor_email, page_url } = body;

    if (!api_key) {
      return new Response(JSON.stringify({ error: "api_key required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate api_key → get org
    const { data: org, error: orgErr } = await adminClient
      .from("organizations")
      .select("id")
      .eq("api_key", api_key)
      .single();

    if (orgErr || !org) {
      return new Response(JSON.stringify({ error: "Invalid api_key" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const orgId = org.id;

    // ACTION: start — create session + whatsapp_contact
    if (action === "start") {
      // Create whatsapp_contact with contact_type=website
      const contactName = visitor_name || "Visitante do site";
      const { data: contact, error: contactErr } = await adminClient
        .from("whatsapp_contacts")
        .insert({
          organization_id: orgId,
          phone: `web_${Date.now()}`,
          name: contactName,
          contact_type: "website",
          unread_count: 0,
        })
        .select("id")
        .single();

      if (contactErr) throw contactErr;

      const { data: session, error: sessErr } = await adminClient
        .from("website_chat_sessions")
        .insert({
          organization_id: orgId,
          visitor_name: visitor_name || null,
          visitor_email: visitor_email || null,
          visitor_metadata: { page_url: page_url || null, user_agent: req.headers.get("user-agent") },
          whatsapp_contact_id: contact.id,
        })
        .select("id")
        .single();

      if (sessErr) throw sessErr;

      return new Response(JSON.stringify({ session_id: session.id, contact_id: contact.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: send — visitor sends a message
    if (action === "send") {
      if (!session_id || !content) {
        return new Response(JSON.stringify({ error: "session_id and content required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Get session to find contact
      const { data: session } = await adminClient
        .from("website_chat_sessions")
        .select("whatsapp_contact_id, organization_id")
        .eq("id", session_id)
        .single();

      if (!session) {
        return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Insert into website_chat_messages
      await adminClient.from("website_chat_messages").insert({
        session_id,
        organization_id: orgId,
        direction: "inbound",
        content,
      });

      // Also insert into whatsapp_messages so it shows in the conversation
      await adminClient.from("whatsapp_messages").insert({
        contact_id: session.whatsapp_contact_id,
        organization_id: orgId,
        direction: "inbound",
        content,
        type: "text",
        status: "received",
      });

      // Update contact unread count and last_message_at
      await adminClient
        .from("whatsapp_contacts")
        .update({ unread_count: adminClient.rpc ? 1 : 1, last_message_at: new Date().toISOString() })
        .eq("id", session.whatsapp_contact_id);

      // Actually increment unread_count properly
      const { data: currentContact } = await adminClient
        .from("whatsapp_contacts")
        .select("unread_count")
        .eq("id", session.whatsapp_contact_id)
        .single();

      if (currentContact) {
        await adminClient
          .from("whatsapp_contacts")
          .update({ unread_count: (currentContact.unread_count || 0) + 1, last_message_at: new Date().toISOString() })
          .eq("id", session.whatsapp_contact_id);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: poll — get new messages for a session
    if (action === "poll") {
      if (!session_id) {
        return new Response(JSON.stringify({ error: "session_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const since = body.since || new Date(0).toISOString();

      const { data: messages } = await adminClient
        .from("website_chat_messages")
        .select("id, direction, content, created_at")
        .eq("session_id", session_id)
        .gt("created_at", since)
        .order("created_at", { ascending: true })
        .limit(50);

      return new Response(JSON.stringify({ messages: messages || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
