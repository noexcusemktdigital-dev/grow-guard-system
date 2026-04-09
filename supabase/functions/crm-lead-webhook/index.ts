// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    // SEC-FIX SEC-NOE-003: HMAC-SHA256 signature validation — replaces plain Bearer string comparison.
    // Callers must send: x-webhook-signature: sha256=<HMAC-SHA256(body, CRM_WEBHOOK_SECRET)>
    // or x-hub-signature-256 (GitHub-compatible header). Simple Bearer tokens are rejected.
    const secret = Deno.env.get("CRM_WEBHOOK_SECRET");
    if (!secret) {
      console.error("CRM_WEBHOOK_SECRET not configured — rejecting all requests");
      return new Response(JSON.stringify({ error: "Not configured" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    const sig = req.headers.get("x-webhook-signature") ?? req.headers.get("x-hub-signature-256") ?? "";

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
    const expected = "sha256=" + Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (sig !== expected) {
      console.warn("[crm-lead-webhook] Invalid or missing HMAC signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const orgId = pathParts[pathParts.length - 1];

    if (!orgId || orgId === "crm-lead-webhook") {
      return new Response(JSON.stringify({ error: "Organization ID required in URL path" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = JSON.parse(rawBody);
    const { name, email, phone, company, source, value, tags, custom_fields } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "Field 'name' is required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check org exists
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .maybeSingle();

    if (!org) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Check for duplicate by phone or email
    let existingLead = null;
    if (phone) {
      const { data } = await supabase
        .from("crm_leads")
        .select("id, tags")
        .eq("organization_id", orgId)
        .eq("phone", phone)
        .maybeSingle();
      existingLead = data;
    }
    if (!existingLead && email) {
      const { data } = await supabase
        .from("crm_leads")
        .select("id, tags")
        .eq("organization_id", orgId)
        .eq("email", email)
        .maybeSingle();
      existingLead = data;
    }

    if (existingLead) {
      // Update existing lead tags and log activity
      const mergedTags = Array.from(new Set([...(existingLead.tags || []), ...(tags || [])]));
      await supabase
        .from("crm_leads")
        .update({ tags: mergedTags, custom_fields: custom_fields || undefined })
        .eq("id", existingLead.id);

      await supabase.from("crm_activities").insert({
        lead_id: existingLead.id,
        organization_id: orgId,
        type: "note",
        title: "Lead atualizado via webhook",
        description: `Fonte: ${source || "webhook"}`,
      });

      return new Response(
        JSON.stringify({ success: true, lead_id: existingLead.id, action: "updated" }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Get default funnel first stage
    const { data: defaultFunnel } = await supabase
      .from("crm_funnels")
      .select("stages")
      .eq("organization_id", orgId)
      .eq("is_default", true)
      .maybeSingle();

    let firstStage = "novo";
    if (defaultFunnel?.stages && Array.isArray(defaultFunnel.stages) && defaultFunnel.stages.length > 0) {
      firstStage = (defaultFunnel.stages as { key: string }[])[0].key || "novo";
    }

    // Check roulette
    let assignedTo: string | null = null;
    const { data: settings } = await supabase
      .from("crm_settings")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (settings?.lead_roulette_enabled) {
      const members = (settings.roulette_members as string[]) || [];
      if (members.length > 0) {
        const { data: lastLead } = await supabase
          .from("crm_leads")
          .select("assigned_to")
          .eq("organization_id", orgId)
          .not("assigned_to", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const lastAssigned = lastLead?.assigned_to;
        const lastIndex = lastAssigned ? members.indexOf(lastAssigned) : -1;
        assignedTo = members[(lastIndex + 1) % members.length];
      }
    }

    // Create new lead
    const { data: newLead, error: insertError } = await supabase
      .from("crm_leads")
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        source: source || "Webhook",
        value: value || 0,
        tags: tags || [],
        custom_fields: custom_fields || {},
        stage: firstStage,
        organization_id: orgId,
        assigned_to: assignedTo,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, lead_id: newLead.id, action: "created" }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
