// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'receive-candidate');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  // Simple token validation
  const webhookToken = req.headers.get("x-webhook-token");
  const expectedToken = Deno.env.get("CANDIDATE_WEBHOOK_TOKEN");
  if (expectedToken && webhookToken !== expectedToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.email || !body.organization_id) {
      return new Response(
        JSON.stringify({ error: "name, email, and organization_id are required" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("franchise_candidates")
      .insert({
        organization_id: body.organization_id,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        birth_date: body.birth_date || null,
        marital_status: body.marital_status || null,
        cep: body.cep || null,
        city: body.city || null,
        address: body.address || null,
        cpf: body.cpf || null,
        rg: body.rg || null,
        company_name: body.company_name || null,
        cnpj: body.cnpj || null,
        company_address: body.company_address || null,
        doc_url: body.doc_url || null,
        lgpd_consent: body.lgpd_consent ?? false,
        lgpd_consent_date: body.lgpd_consent_date || null,
        source_lead_id: body.source_lead_id || null,
        notes: body.notes || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 201,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("receive-candidate error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
