// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "../_shared/asaas-fetch.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'asaas-manage-payment');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const hdr = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = (Deno.env.get("ASAAS_API_KEY") || "").trim();
    const baseUrl = (Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3").replace(/\/$/, "");

    if (!apiKey) return new Response(JSON.stringify({ error: "ASAAS_API_KEY not configured" }), { headers: hdr });

    // Auth via getClaims
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: hdr });
    }

    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: hdr });
    }

    const { action, payment_id, value, dueDate, description } = await req.json();

    if (!payment_id) return new Response(JSON.stringify({ error: "payment_id is required" }), { headers: hdr });

    const headers = { access_token: apiKey, "Content-Type": "application/json" };

    if (action === "cancel") {
      const res = await asaasFetch(`${baseUrl}/payments/${payment_id}`, { method: "DELETE", headers });
      const data = await res.json();
      if (!res.ok) {
        console.error("[asaas-manage-payment] Cancel error:", JSON.stringify(data));
        return new Response(JSON.stringify({ error: data.errors?.[0]?.description || "Erro ao cancelar cobrança" }), { headers: hdr });
      }
      return new Response(JSON.stringify({ success: true, deleted: true }), { headers: hdr });
    }

    if (action === "update") {
      const body: Record<string, unknown> = {};
      if (value !== undefined) body.value = value;
      if (dueDate) body.dueDate = dueDate;
      if (description !== undefined) body.description = description;

      const res = await asaasFetch(`${baseUrl}/payments/${payment_id}`, { method: "PUT", headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        console.error("[asaas-manage-payment] Update error:", JSON.stringify(data));
        return new Response(JSON.stringify({ error: data.errors?.[0]?.description || "Erro ao editar cobrança" }), { headers: hdr });
      }
      return new Response(JSON.stringify({ success: true, payment: data }), { headers: hdr });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'cancel' or 'update'." }), { headers: hdr });
  } catch (err: unknown) {
    console.error("[asaas-manage-payment] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { headers: hdr });
  }
});
