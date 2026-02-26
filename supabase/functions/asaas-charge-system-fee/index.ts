import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api-sandbox.asaas.com/v3";
const SYSTEM_FEE = 250;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
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

    const { organization_id, billing_type } = await req.json();

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If pending charge exists, return its data
    if (existing && existing.status === "pending" && existing.asaas_payment_id) {
      // Fetch PIX data if needed
      let pixData = null;
      if (billingType === "PIX") {
        const pixRes = await fetch(`${ASAAS_BASE}/payments/${existing.asaas_payment_id}/pixQrCode`, {
          headers: { access_token: asaasApiKey },
        });
        if (pixRes.ok) pixData = await pixRes.json();
      }

      return new Response(JSON.stringify({
        success: true,
        reused: true,
        payment_id: existing.asaas_payment_id,
        invoice_url: existing.invoice_url,
        pix_qr_code: pixData?.encodedImage || null,
        pix_copy_paste: pixData?.payload || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get org for Asaas customer
    const { data: org } = await adminClient
      .from("organizations")
      .select("id, name, asaas_customer_id, document, email")
      .eq("id", organization_id)
      .single();

    if (!org) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-provision Asaas customer if needed
    let customerId = org.asaas_customer_id;
    if (!customerId) {
      const customerRes = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: asaasApiKey },
        body: JSON.stringify({
          name: org.name,
          cpfCnpj: org.document || "00000000000",
          email: org.email || undefined,
        }),
      });
      const customerData = await customerRes.json();
      if (!customerRes.ok) {
        return new Response(JSON.stringify({ error: "Failed to create Asaas customer", details: customerData }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      customerId = customerData.id;
      await adminClient.from("organizations").update({ asaas_customer_id: customerId }).eq("id", organization_id);
    }

    // Due date: 5 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    // Create charge
    const chargeRes = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: asaasApiKey },
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
      pix_qr_code: pixData?.encodedImage || null,
      pix_copy_paste: pixData?.payload || null,
      month,
      amount: SYSTEM_FEE,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("asaas-charge-system-fee error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
