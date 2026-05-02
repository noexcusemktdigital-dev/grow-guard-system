// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getOrCreateAsaasCustomer } from "../_shared/asaas-customer.ts";
import { asaasFetch } from "../_shared/asaas-fetch.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { withIdempotency } from "../_shared/idempotency.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

const PACK_PRICES: Record<string, { credits: number; price: number }> = {
  "pack-5000": { credits: 5000, price: 49 },
  "pack-20000": { credits: 20000, price: 149 },
  "pack-50000": { credits: 50000, price: 299 },
};

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'asaas-buy-credits');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, cors) });
  }

  const respond = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: withCorrelationHeader(ctx, { ...cors, "Content-Type": "application/json" }),
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return respond(401, { error: "Unauthorized" });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return respond(401, { error: "Unauthorized" });
    }

    // Parse body once and clone request for idempotency
    const rawBody = await req.text();
    const parsed = JSON.parse(rawBody || "{}");
    const { organization_id, pack_id, billing_type } = parsed;

    if (!organization_id || !pack_id || !billing_type) {
      return respond(400, { error: "organization_id, pack_id and billing_type are required" });
    }
    const pack = PACK_PRICES[pack_id];
    if (!pack) return respond(400, { error: "Invalid pack_id" });

    const validBillingTypes = ["CREDIT_CARD", "BOLETO", "PIX"];
    if (!validBillingTypes.includes(billing_type)) {
      return respond(400, { error: "Invalid billing_type" });
    }

    // Reconstruct a request whose body is the parsed JSON, so withIdempotency can hash it.
    const reqForIdem = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: rawBody,
    });

    const result = await withIdempotency(
      reqForIdem,
      "asaas-buy-credits",
      { orgId: organization_id, userId: user.id },
      async () => {
        const { data: org, error: orgError } = await adminClient
          .from("organizations")
          .select("id, name, cnpj, email, phone, parent_org_id")
          .eq("id", organization_id)
          .single();

        if (orgError || !org) {
          return { status: 404, body: { error: "Organization not found" } };
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
        const splitConfig: { walletId: string; fixedValue: number }[] = [];
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

        const chargeBody: Record<string, unknown> = {
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
          return { status: 500, body: { error: "Failed to create charge", details: chargeData } };
        }

        // Get PIX data if billing_type is PIX
        let pixData: Record<string, unknown> | null = null;
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

        return {
          status: 200,
          body: {
            success: true,
            asaas_payment_id: chargeData.id,
            invoice_url: chargeData.invoiceUrl || null,
            bank_slip_url: chargeData.bankSlipUrl || null,
            value: pack.price,
            pix_qr_code: pixData?.encodedImage ? `data:image/png;base64,${pixData.encodedImage}` : null,
            pix_qr_code_base64: pixData?.encodedImage || null,
            pix_copy_paste: pixData?.payload || null,
          },
        };
      },
    );

    return respond(result.status, result.body);
  } catch (err: unknown) {
    log.error('unhandled_error', { error: String(err) });
    return respond(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
