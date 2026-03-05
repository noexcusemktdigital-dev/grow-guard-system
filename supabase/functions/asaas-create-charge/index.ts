import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getOrCreateAsaasCustomer, fetchPixQrCode } from "../_shared/asaas-customer.ts";
import { asaasFetch } from "../_shared/asaas-fetch.ts";

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
    console.log("[asaas-create-charge] Request received:", req.method);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Auth via getUser
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[asaas-create-charge] No auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[asaas-create-charge] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organization_id, charge_type, billing_type, pack_id } = await req.json();

    if (!organization_id || !charge_type || !billing_type) {
      return new Response(JSON.stringify({ error: "organization_id, charge_type and billing_type required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine amount and description
    let amount = 0;
    let description = "";
    let creditAmount = 0;

    if (charge_type === "credits") {
      const packs: Record<string, { credits: number; price: number }> = {
        "pack-5000": { credits: 5000, price: 49 },
        "pack-20000": { credits: 20000, price: 149 },
        "pack-50000": { credits: 50000, price: 299 },
      };
      const pack = packs[pack_id];
      if (!pack) {
        return new Response(JSON.stringify({ error: "Invalid pack_id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      amount = pack.price;
      creditAmount = pack.credits;
      description = `Pacote ${pack.credits.toLocaleString()} créditos — NOE`;
    } else if (charge_type === "extra_user") {
      amount = 29;
      description = "Usuário adicional — NOE";
    } else {
      return new Response(JSON.stringify({ error: "Invalid charge_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get org info
    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .select("id, name, cnpj, email, phone")
      .eq("id", organization_id)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create Asaas customer (deduplicated)
    const asaasCustomerId = await getOrCreateAsaasCustomer(adminClient, asaasApiKey, {
      orgId: org.id,
      name: org.name,
      cpfCnpj: org.cnpj,
      email: org.email,
      phone: org.phone,
    });

    const today = new Date().toISOString().split("T")[0];

    // Create payment in Asaas
    const paymentRes = await asaasFetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: billing_type,
        value: amount,
        dueDate: today,
        description,
        externalReference: `${org.id}|${charge_type}|${pack_id || ""}`,
      }),
    });

    const paymentData = await paymentRes.json();
    if (!paymentRes.ok) {
      console.error("Asaas charge creation failed:", paymentData);
      return new Response(JSON.stringify({ error: "Failed to create charge", details: paymentData }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Charge created for org ${org.id}: type=${charge_type}, amount=${amount}`);

    // For PIX, fetch QR code with retry
    let pixQrCodeBase64 = null;
    let pixCopyPaste = null;
    if (billing_type === "PIX" && paymentData.id) {
      const pix = await fetchPixQrCode(asaasApiKey, paymentData.id);
      pixQrCodeBase64 = pix.encodedImage;
      pixCopyPaste = pix.payload;
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentData.id,
        invoice_url: paymentData.invoiceUrl,
        bank_slip_url: paymentData.bankSlipUrl,
        pix_qr_code: paymentData.pixQrCodeUrl,
        pix_qr_code_base64: pixQrCodeBase64,
        pix_copy_paste: pixCopyPaste,
        value: amount,
        credit_amount: creditAmount,
        billing_type,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("asaas-create-charge error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
