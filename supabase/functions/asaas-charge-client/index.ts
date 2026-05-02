// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getOrCreateAsaasCustomer, fetchPixQrCode, buildSplitConfig } from "../_shared/asaas-customer.ts";
import { asaasFetch } from "../_shared/asaas-fetch.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { redact } from "../_shared/redact.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { assertOrgMember, AuthError, authErrorResponse } from '../_shared/auth.ts';

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'asaas-charge-client');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    log.info("Request received");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Auth via getUser
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[asaas-charge-client] No auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[asaas-charge-client] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { organization_id, contract_id, billing_type } = await req.json();

    if (!organization_id || !contract_id) {
      return new Response(JSON.stringify({ error: "organization_id and contract_id are required" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // BOLA/IDOR guard: ensure caller belongs to the target org
    await assertOrgMember(adminClient, user.id, organization_id);

    const billingType = billing_type || "PIX";
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Check if already exists for this month/contract
    const { data: existing } = await adminClient
      .from("client_payments")
      .select("id, status, invoice_url, asaas_payment_id")
      .eq("organization_id", organization_id)
      .eq("contract_id", contract_id)
      .eq("month", month)
      .maybeSingle();

    if (existing && existing.status === "paid") {
      return new Response(JSON.stringify({ error: "already_paid", message: "Já pago neste mês" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // If pending, return existing data
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

    // Get contract details
    const { data: contract } = await adminClient
      .from("contracts")
      .select("id, title, signer_name, signer_email, client_document, monthly_value, surplus_value, surplus_issuer, unit_org_id")
      .eq("id", contract_id)
      .single();

    if (!contract) {
      return new Response(JSON.stringify({ error: "Contract not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const baseValue = Number(contract.monthly_value || 0);
    const surplusValue = Number(contract.surplus_value || 0);
    const amount = baseValue + surplusValue;
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: "Contract has no monthly value" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Validate client document before creating Asaas customer
    const clientDoc = contract.client_document?.replace(/\D/g, "");
    if (!clientDoc || clientDoc.length < 11) {
      return new Response(JSON.stringify({
        error: "CPF/CNPJ do cliente é obrigatório. Atualize o contrato com o documento antes de gerar cobrança.",
      }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    // Use unit_org_id or a contract-based reference to avoid mixing client customers with org customers
    const clientExternalRef = `client_of_contract_${contract_id}`;
    const clientName = contract.signer_name || "Cliente";
    const clientEmail = contract.signer_email || undefined;

    // Search for existing client customer by externalReference
    let clientCustomerId: string | null = null;
    const searchRes = await asaasFetch(
      `${ASAAS_BASE}/customers?externalReference=${encodeURIComponent(clientExternalRef)}`,
      { headers: { access_token: asaasApiKey, "User-Agent": "NOE-Platform" } }
    );
    const searchData = await searchRes.json();
    if (searchData?.data?.length > 0) {
      clientCustomerId = searchData.data[0].id;
    }

    if (!clientCustomerId) {
      // Create client customer
      const createRes = await asaasFetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
        body: JSON.stringify({
          name: clientName,
          cpfCnpj: clientDoc,
          email: clientEmail,
          externalReference: clientExternalRef,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        console.error("Asaas client customer creation failed:", createData);
        return new Response(JSON.stringify({ error: "Failed to create Asaas client customer", details: createData }), {
          status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      clientCustomerId = createData.id;
    }

    // Due date: 5 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    // Build split config if this org is a franqueado (weighted base vs surplus)
    const splitConfig = await buildSplitConfig(adminClient, organization_id, baseValue, surplusValue);

    // Create charge
    const chargePayload: Record<string, unknown> = {
      customer: clientCustomerId,
      billingType,
      value: amount,
      dueDate: dueDateStr,
      description: `Mensalidade ${contract.title} — ${month}`,
      externalReference: `client_payment|${organization_id}|${contract_id}|${month}`,
    };

    if (splitConfig) {
      chargePayload.split = splitConfig;
      console.log(`Split configured: ${JSON.stringify(redact(splitConfig))}`);
    }

    const chargeRes = await asaasFetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
      body: JSON.stringify(chargePayload),
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

    // Calculate shares: base 80/20 franqueadora/franqueado, surplus 20/80
    const franqueadoraFromBase = baseValue * 0.80;
    const franqueadoraFromSurplus = surplusValue * 0.20;
    const franqueadoraShare = franqueadoraFromBase + franqueadoraFromSurplus;
    const franchiseeShare = amount - franqueadoraShare;

    // Upsert payment record
    if (existing) {
      await adminClient.from("client_payments").update({
        asaas_payment_id: chargeData.id,
        asaas_customer_id: clientCustomerId,
        invoice_url: chargeData.invoiceUrl || null,
        billing_type: billingType,
        amount,
        surplus_amount: surplusValue,
        franqueadora_share: franqueadoraShare,
        franchisee_share: franchiseeShare,
        status: "pending",
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await adminClient.from("client_payments").insert({
        organization_id,
        contract_id,
        month,
        amount,
        surplus_amount: surplusValue,
        franqueadora_share: franqueadoraShare,
        franchisee_share: franchiseeShare,
        billing_type: billingType,
        asaas_payment_id: chargeData.id,
        asaas_customer_id: clientCustomerId,
        invoice_url: chargeData.invoiceUrl || null,
        status: "pending",
      });
    }

    console.log(`Client charge created for contract ${contract_id}: ${chargeData.id}`);

    return new Response(JSON.stringify({
      success: true,
      payment_id: chargeData.id,
      invoice_url: chargeData.invoiceUrl || null,
      pix_qr_code: pixData.encodedImage,
      pix_copy_paste: pixData.payload,
      month,
      amount,
      surplus_amount: surplusValue,
      franqueadora_share: franqueadoraShare,
      franchisee_share: franchiseeShare,
    }), { headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" } });
  } catch (err: unknown) {
    log.error("asaas-charge-client error", { error: String(err) });
    return authErrorResponse(err, getCorsHeaders(req));
  }
});
