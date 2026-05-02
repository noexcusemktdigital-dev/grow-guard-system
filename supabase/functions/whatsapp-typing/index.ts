// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'whatsapp-typing');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: orgId } = await adminClient.rpc("get_user_org_id", { _user_id: userId, _portal: "saas" });
    if (!orgId) {
      return new Response(JSON.stringify({ error: "No organization" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { contactPhone } = await req.json();
    if (!contactPhone) {
      return new Response(JSON.stringify({ error: "contactPhone required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Get connected instance
    const { data: instance } = await adminClient
      .from("whatsapp_instances")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "connected")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!instance) {
      return new Response(JSON.stringify({ error: "No connected instance" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const cleanPhone = contactPhone.replace(/[\s+()-]/g, "");

    // Evolution API doesn't have a native typing endpoint — return success silently
    if (instance.provider === "evolution") {
      return new Response(JSON.stringify({ ok: true, provider: "evolution", note: "typing not supported" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const zapiBase = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;

    const res = await fetch(`${zapiBase}/typing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": instance.client_token,
      },
      body: JSON.stringify({ phone: cleanPhone }),
    });

    const data = await res.json().catch(() => ({}));

    return new Response(JSON.stringify({ ok: true, zapi: data }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
