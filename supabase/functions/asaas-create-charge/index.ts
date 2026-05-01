// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getOrCreateAsaasCustomer, fetchPixQrCode } from "../_shared/asaas-customer.ts";
import { asaasFetch } from "../_shared/asaas-fetch.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { withIdempotency } from "../_shared/idempotency.ts";

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const respond = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

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
      return respond(401, { error: "Unauthorized" });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[asaas-create-charge] Auth failed:", authError?.message);
      return respond(401, { error: "Unauthorized" });
    }

    const rawBody = await req.text();
    const parsed = JSON.parse(rawBody || "{}");
    const { organization_id, charge_type, billing_type, pack_id } = parsed;

    if (!organization_id || !charge_type || !billing_type) {
      return respond(400, { error: "organization_id, charge_type and billing_type required" });
    }

    const reqForIdem = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: rawBody,
    });

    const result = await withIdempotency(
      reqForIdem,
      "asaas-create-charge",
      { orgId: organization_id, userId: user.id },
      async () => {
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
          if (!pack) return { status: 400, body: { error: "Invalid pack_id" } };
          amount = pack.price;
          creditAmount = pack.credits;
          description = `Pacote ${pack.credits.toLocaleString()} créditos — NOE`;
        } else if (charge_type === "extra_user") {
          amount = 29;
          description = "Usuário adicional — NOE";
        } else {
          return { status: 400, body: { error: "Invalid charge_type" } };
        }

        // Get org info
        const { data: org, error: orgError } = await adminClient
          .from("organizations")
          .select("id, name, cnpj, email, phone")
          .eq("id", organization_id)
          .single();

        if (orgError || !org) {
          return { status: 404, body: { error: "Organization not found" } };
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
          return { status: 500, body: { error: "Failed to create charge", details: paymentData } };
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

        return {
          status: 200,
          body: {
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
          },
        };
      },
    );

    return respond(result.status, result.body);
  } catch (err: unknown) {
    console.error("asaas-create-charge error:", err);
    return respond(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
