// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

// Simple in-memory rate limiter (per isolate lifetime)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'website-chat');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  // Rate limit by IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
      status: 429,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { action, api_key, session_id, content, visitor_name, visitor_email, page_url } = body;

    if (!api_key) {
      return new Response(JSON.stringify({ error: "api_key required" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    // Validate api_key → get org
    const { data: org, error: orgErr } = await adminClient
      .from("organizations")
      .select("id")
      .eq("api_key", api_key)
      .single();

    if (orgErr || !org) {
      return new Response(JSON.stringify({ error: "Invalid api_key" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const orgId = org.id;

    // Sanitize content length
    const sanitizedContent = typeof content === "string" ? content.slice(0, 2000) : content;

    // ACTION: start — create session + whatsapp_contact
    if (action === "start") {
      const contactName = visitor_name ? String(visitor_name).slice(0, 200) : "Visitante do site";
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
          visitor_name: visitor_name ? String(visitor_name).slice(0, 200) : null,
          visitor_email: visitor_email ? String(visitor_email).slice(0, 200) : null,
          visitor_metadata: { page_url: page_url || null, user_agent: req.headers.get("user-agent") },
          whatsapp_contact_id: contact.id,
        })
        .select("id")
        .single();

      if (sessErr) throw sessErr;

      return new Response(JSON.stringify({ session_id: session.id, contact_id: contact.id }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ACTION: send — visitor sends a message
    if (action === "send") {
      if (!session_id || !sanitizedContent) {
        return new Response(JSON.stringify({ error: "session_id and content required" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
      }

      const { data: session } = await adminClient
        .from("website_chat_sessions")
        .select("whatsapp_contact_id, organization_id")
        .eq("id", session_id)
        .single();

      if (!session) {
        return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
      }

      await adminClient.from("website_chat_messages").insert({
        session_id,
        organization_id: orgId,
        direction: "inbound",
        content: sanitizedContent,
      });

      await adminClient.from("whatsapp_messages").insert({
        contact_id: session.whatsapp_contact_id,
        organization_id: orgId,
        direction: "inbound",
        content: sanitizedContent,
        type: "text",
        status: "received",
      });

      // Increment unread_count
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ACTION: poll — get new messages for a session
    if (action === "poll") {
      if (!session_id) {
        return new Response(JSON.stringify({ error: "session_id required" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
