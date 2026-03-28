import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getOrCreateAsaasCustomer } from "../_shared/asaas-customer.ts";
import { asaasFetch } from "../_shared/asaas-fetch.ts";
import { getCorsHeaders } from '../_shared/cors.ts';

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

const PACK_PRICES: Record<string, { credits: number; price: number }> = {
  "pack-5000": { credits: 5000, price: 49 },
  "pack-20000": { credits: 20000, price: 149 },
  "pack-50000": { credits: 50000, price: 299 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { organization_id, pack_id, billing_type } = await req.json();

    if (!organization_id || !pack_id || !billing_type) {
      return new Response(JSON.stringify({ error: "organization_id, pack_id and billing_type are required" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const pack = PACK_PRICES[pack_id];
    if (!pack) {
      return new Response(JSON.stringify({ error: "Invalid pack_id" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const validBillingTypes = ["CREDIT_CARD", "BOLETO", "PIX"];
    if (!validBillingTypes.includes(billing_type)) {
      return new Response(JSON.stringify({ error: "Invalid billing_type" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .select("id, name, cnpj, email, phone, parent_org_id")
      .eq("id", organization_id)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const asaasCustomerId = await getOrCreateAsaasCustomer(adminClient, asaasApiKey, {
      orgId: org.id,
      name: org.name,
      cpfCnpj: org.cnpj,
      email: org.email,
      phone: org.phone,
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    // Build split if linked to franchisee
    const splitConfig: any[] = [];
    if (org.parent_org_id) {
      const { data: parentOrg } = await adminClient
        .from("organizations")
        .select("saas_commission_percent, asaas_wallet_id")
        .eq("id", org.parent_org_id)
        .maybeSingle();

      if (parentOrg?.asaas_wallet_id) {
        const commissionPercent = parentOrg.saas_commission_percent || 20;
        const commissionValue = Math.round(pack.price * commissionPercent / 100 * 100) / 100;
        if (commissionValue > 0) {
          splitConfig.push({
            walletId: parentOrg.asaas_wallet_id,
            fixedValue: commissionValue,
          });
        }
      }
    }

    const chargeBody: any = {
      customer: asaasCustomerId,
      billingType: billing_type,
      value: pack.price,
      dueDate: dueDate.toISOString().split("T")[0],
      description: `Pacote ${pack.credits.toLocaleString()} créditos — NOE`,
      externalReference: `${org.id}|credits|${pack_id}`,
    };

    if (splitConfig.length > 0) {
      chargeBody.split = splitConfig;
    }

    const chargeRes = await asaasFetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
      body: JSON.stringify(chargeBody),
    });

    const chargeData = await chargeRes.json();
    if (!chargeRes.ok) {
      console.error("Asaas credit charge failed:", chargeData);
      return new Response(JSON.stringify({ error: "Failed to create charge", details: chargeData }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Get PIX data if billing_type is PIX
    let pixData: any = null;
    if (billing_type === "PIX" && chargeData.id) {
      try {
        const pixRes = await asaasFetch(`${ASAAS_BASE}/payments/${chargeData.id}/pixQrCode`, {
          method: "GET",
          headers: { access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
        });
        if (pixRes.ok) pixData = await pixRes.json();
      } catch (e) {
        console.warn("Failed to get PIX QR code:", e);
      }
    }

    console.log(`Credit pack charge created: org=${org.id}, pack=${pack_id}, payment=${chargeData.id}`);

    return new Response(JSON.stringify({
      success: true,
      asaas_payment_id: chargeData.id,
      invoice_url: chargeData.invoiceUrl || null,
      bank_slip_url: chargeData.bankSlipUrl || null,
      value: pack.price,
      pix_qr_code: pixData?.encodedImage ? `data:image/png;base64,${pixData.encodedImage}` : null,
      pix_qr_code_base64: pixData?.encodedImage || null,
      pix_copy_paste: pixData?.payload || null,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("asaas-buy-credits error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
