import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { organization_id, contract_id, billing_type } = await req.json();

    if (!organization_id || !contract_id) {
      return new Response(JSON.stringify({ error: "organization_id and contract_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If pending, return existing data
    if (existing && existing.status === "pending" && existing.asaas_payment_id) {
      let pixData = null;
      if (billingType === "PIX") {
        const pixRes = await fetch(`${ASAAS_BASE}/payments/${existing.asaas_payment_id}/pixQrCode`, {
          headers: { access_token: asaasApiKey },
        });
        if (pixRes.ok) pixData = await pixRes.json();
      }
      return new Response(JSON.stringify({
        success: true, reused: true,
        payment_id: existing.asaas_payment_id,
        invoice_url: existing.invoice_url,
        pix_qr_code: pixData?.encodedImage || null,
        pix_copy_paste: pixData?.payload || null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get contract details
    const { data: contract } = await adminClient
      .from("contracts")
      .select("id, title, signer_name, signer_email, client_document, monthly_value")
      .eq("id", contract_id)
      .single();

    if (!contract) {
      return new Response(JSON.stringify({ error: "Contract not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amount = Number(contract.monthly_value || 0);
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: "Contract has no monthly value" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create or find Asaas customer for the client
    const clientName = contract.signer_name || "Cliente";
    const clientDoc = contract.client_document || "00000000000";
    const clientEmail = contract.signer_email || undefined;

    const customerRes = await fetch(`${ASAAS_BASE}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: asaasApiKey },
      body: JSON.stringify({
        name: clientName,
        cpfCnpj: clientDoc,
        email: clientEmail,
        externalReference: `client_of_${organization_id}`,
      }),
    });
    const customerData = await customerRes.json();
    // If customer already exists, Asaas returns the existing one
    const customerId = customerData.id || customerData.errors?.[0]?.description?.match(/cus_\w+/)?.[0];

    if (!customerId) {
      // Try to find existing customer by document
      const searchRes = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${clientDoc}`, {
        headers: { access_token: asaasApiKey },
      });
      const searchData = await searchRes.json();
      const foundCustomer = searchData?.data?.[0]?.id;
      if (!foundCustomer) {
        return new Response(JSON.stringify({ error: "Failed to create/find Asaas customer", details: customerData }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const finalCustomerId = customerId || customerData.id;

    // Due date: 5 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    // Create charge
    const chargeRes = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: asaasApiKey },
      body: JSON.stringify({
        customer: finalCustomerId,
        billingType,
        value: amount,
        dueDate: dueDateStr,
        description: `Mensalidade ${contract.title} — ${month}`,
        externalReference: `client_payment|${organization_id}|${contract_id}|${month}`,
      }),
    });

    const chargeData = await chargeRes.json();
    if (!chargeRes.ok) {
      console.error("Asaas charge failed:", chargeData);
      return new Response(JSON.stringify({ error: "Failed to create charge", details: chargeData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get PIX QR code if applicable
    let pixData = null;
    if (billingType === "PIX") {
      const pixRes = await fetch(`${ASAAS_BASE}/payments/${chargeData.id}/pixQrCode`, {
        headers: { access_token: asaasApiKey },
      });
      if (pixRes.ok) pixData = await pixRes.json();
    }

    const franchiseeShare = amount * 0.2;

    // Upsert payment record
    if (existing) {
      await adminClient.from("client_payments").update({
        asaas_payment_id: chargeData.id,
        asaas_customer_id: finalCustomerId,
        invoice_url: chargeData.invoiceUrl || null,
        billing_type: billingType,
        status: "pending",
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await adminClient.from("client_payments").insert({
        organization_id,
        contract_id,
        month,
        amount,
        franchisee_share: franchiseeShare,
        billing_type: billingType,
        asaas_payment_id: chargeData.id,
        asaas_customer_id: finalCustomerId,
        invoice_url: chargeData.invoiceUrl || null,
        status: "pending",
      });
    }

    console.log(`Client charge created for contract ${contract_id}: ${chargeData.id}`);

    return new Response(JSON.stringify({
      success: true,
      payment_id: chargeData.id,
      invoice_url: chargeData.invoiceUrl || null,
      pix_qr_code: pixData?.encodedImage || null,
      pix_copy_paste: pixData?.payload || null,
      month,
      amount,
      franchisee_share: franchiseeShare,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("asaas-charge-client error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
