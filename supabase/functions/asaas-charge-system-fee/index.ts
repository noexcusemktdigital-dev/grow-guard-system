// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getOrCreateAsaasCustomer, fetchPixQrCode } from "../_shared/asaas-customer.ts";
import { asaasFetch } from "../_shared/asaas-fetch.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { assertOrgMember, authErrorResponse } from '../_shared/auth.ts';

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";
const SYSTEM_FEE = 250;

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'asaas-charge-system-fee');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    console.log("[asaas-charge-system-fee] Request received:", req.method);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Auth via getUser
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[asaas-charge-system-fee] No auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[asaas-charge-system-fee] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { organization_id, billing_type } = await req.json();

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id is required" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // BOLA/IDOR guard: ensure caller belongs to the target org
    await assertOrgMember(adminClient, user.id, organization_id);

    const billingType = billing_type || "BOLETO";
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Check if already paid/pending for this month
    const { data: existing } = await adminClient
      .from("franchisee_system_payments")
      .select("id, status, invoice_url, asaas_payment_id")
      .eq("organization_id", organization_id)
      .eq("month", month)
      .maybeSingle();

    if (existing && existing.status === "paid") {
      return new Response(JSON.stringify({ error: "already_paid", message: "Sistema já pago neste mês" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // If pending charge exists, return its data
    if (existing && existing.status === "pending" && existing.asaas_payment_id) {
      let pixData = { encodedImage: null as string | null, payload: null as string | null };
      if (billingType === "PIX") {
        pixData = await fetchPixQrCode(asaasApiKey, existing.asaas_payment_id);
      }

      return new Response(JSON.stringify({
        success: true, reused: true,
        payment_id: existing.asaas_payment_id,
        invoice_url: existing.invoice_url,
        pix_qr_code: pixData.encodedImage,
        pix_copy_paste: pixData.payload,
      }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    // Get org info
    const { data: org } = await adminClient
      .from("organizations")
      .select("id, name, cnpj, email, phone")
      .eq("id", organization_id)
      .single();

    if (!org) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Get or create Asaas customer (deduplicated, validates cpfCnpj)
    const customerId = await getOrCreateAsaasCustomer(adminClient, asaasApiKey, {
      orgId: org.id,
      name: org.name,
      cpfCnpj: org.cnpj,
      email: org.email,
      phone: org.phone,
    });

    // Due date: 5 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    // Create charge
    const chargeRes = await asaasFetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
      body: JSON.stringify({
        customer: customerId,
        billingType,
        value: SYSTEM_FEE,
        dueDate: dueDateStr,
        description: `Mensalidade Sistema NOE — ${month}`,
        externalReference: `system_fee|${organization_id}|${month}`,
      }),
    });

    const chargeData = await chargeRes.json();
    if (!chargeRes.ok) {
      console.error("Asaas charge failed:", chargeData);
      return new Response(JSON.stringify({ error: "Failed to create charge", details: chargeData }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Get PIX QR code with retry
    let pixData = { encodedImage: null as string | null, payload: null as string | null };
    if (billingType === "PIX") {
      pixData = await fetchPixQrCode(asaasApiKey, chargeData.id);
    }

    // Upsert payment record
    if (existing) {
      await adminClient.from("franchisee_system_payments").update({
        asaas_payment_id: chargeData.id,
        invoice_url: chargeData.invoiceUrl || null,
        billing_type: billingType,
        status: "pending",
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await adminClient.from("franchisee_system_payments").insert({
        organization_id,
        month,
        amount: SYSTEM_FEE,
        billing_type: billingType,
        asaas_payment_id: chargeData.id,
        invoice_url: chargeData.invoiceUrl || null,
        status: "pending",
      });
    }

    console.log(`System fee charge created for org ${organization_id}: ${chargeData.id}`);

    return new Response(JSON.stringify({
      success: true,
      payment_id: chargeData.id,
      invoice_url: chargeData.invoiceUrl || null,
      pix_qr_code: pixData.encodedImage,
      pix_copy_paste: pixData.payload,
      month,
      amount: SYSTEM_FEE,
    }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  } catch (err: unknown) {
    console.error("asaas-charge-system-fee error:", err);
    return authErrorResponse(err, getCorsHeaders(req));
  }
});
