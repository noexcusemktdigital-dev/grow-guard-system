// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getOrCreateAsaasCustomer, fetchPixQrCode } from "../_shared/asaas-customer.ts";
import { asaasFetch } from "../_shared/asaas-fetch.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { assertOrgMember, AuthError } from '../_shared/auth.ts';
import { parseOrThrow, validationErrorResponse, SubscriptionSchemas } from '../_shared/schemas.ts';

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

const PLAN_PRICES: Record<string, number> = {
  starter: 349,
  pro: 739,
  enterprise: 1429,
  whatsapp: 45,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    console.log("[asaas-create-subscription] Request received:", req.method);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

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

    const rawBody = await req.json();
    const body = parseOrThrow(SubscriptionSchemas.Create, rawBody);
    // Support both unified (plan) and legacy (sales_plan + marketing_plan)
    const plan = body.plan || body.sales_plan || body.marketing_plan;
    const billing_type = body.billing_type;
    const organization_id = body.organization_id;
    const coupon_code = body.coupon_code || null;

    // SEC-002: Validate org membership before financial mutation (anti-IDOR/BOLA)
    try {
      await assertOrgMember(adminClient, user.id, organization_id);
    } catch (err) {
      if (err instanceof AuthError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    if (!plan) {
      return new Response(JSON.stringify({ error: "plan is required" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const planPrice = PLAN_PRICES[plan];
    if (!planPrice) {
      return new Response(JSON.stringify({ error: "Invalid plan tier" }), {
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

    // Check for referral discount
    let discountPercent = 0;
    let referralOrgId: string | null = null;

    const { data: existingSub } = await adminClient
      .from("subscriptions")
      .select("discount_percent, referral_org_id")
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (existingSub?.discount_percent && existingSub.discount_percent > 0) {
      discountPercent = existingSub.discount_percent;
      referralOrgId = existingSub.referral_org_id;
    } else if (org.parent_org_id) {
      const { data: parentDiscount } = await adminClient
        .from("referral_discounts")
        .select("discount_percent, is_active")
        .eq("organization_id", org.parent_org_id)
        .eq("is_active", true)
        .maybeSingle();

      if (parentDiscount) {
        discountPercent = parentDiscount.discount_percent || 5;
        referralOrgId = org.parent_org_id;
      }
    }

    // Apply coupon discount if provided
    let couponDiscountPercent = 0;
    if (coupon_code) {
      const { data: coupon, error: couponErr } = await adminClient
        .from("discount_coupons")
        .select("*")
        .eq("code", coupon_code.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (couponErr) throw couponErr;

      if (coupon) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) >= new Date();
        const hasUses = coupon.max_uses === null || coupon.uses_count < coupon.max_uses;

        if (notExpired && hasUses) {
          couponDiscountPercent = coupon.discount_percent || 0;
          // Increment uses
          await adminClient
            .from("discount_coupons")
            .update({ uses_count: coupon.uses_count + 1 })
            .eq("id", coupon.id);
          console.log(`Coupon ${coupon.code} applied: ${couponDiscountPercent}%`);
        }
      }
    }

    let finalPrice = planPrice;
    // Apply referral discount first
    if (discountPercent > 0) {
      finalPrice = Math.round(planPrice * (1 - discountPercent / 100) * 100) / 100;
      console.log(`Referral discount: ${discountPercent}% → R$ ${planPrice} → R$ ${finalPrice}`);
    }
    // Then apply coupon discount on top
    if (couponDiscountPercent > 0) {
      const beforeCoupon = finalPrice;
      finalPrice = Math.round(finalPrice * (1 - couponDiscountPercent / 100) * 100) / 100;
      console.log(`Coupon discount: ${couponDiscountPercent}% → R$ ${beforeCoupon} → R$ ${finalPrice}`);
    }

    // Get or create Asaas customer
    const asaasCustomerId = await getOrCreateAsaasCustomer(adminClient, asaasApiKey, {
      orgId: org.id,
      name: org.name,
      cpfCnpj: org.cnpj,
      email: org.email,
      phone: org.phone,
    });

    const today = new Date();
    const nextDueDate = today.toISOString().split("T")[0];

    // Build split config if client is linked to a franchisee
    const splitConfig: { walletId: string; fixedValue: number }[] = [];
    if (referralOrgId) {
      const { data: franchiseeOrg } = await adminClient
        .from("organizations")
        .select("saas_commission_percent, asaas_wallet_id")
        .eq("id", referralOrgId)
        .maybeSingle();

      if (franchiseeOrg?.asaas_wallet_id) {
        const commissionPercent = franchiseeOrg.saas_commission_percent || 20;
        const commissionValue = Math.round(finalPrice * commissionPercent / 100 * 100) / 100;
        if (commissionValue > 0) {
          splitConfig.push({
            walletId: franchiseeOrg.asaas_wallet_id,
            fixedValue: commissionValue,
          });
          console.log(`Split: ${commissionPercent}% (R$ ${commissionValue}) to wallet ${franchiseeOrg.asaas_wallet_id}`);
        }
      }
    }

    // externalReference padrão: "{orgId}|sub|{planSlug}"
    // Esse formato é reconhecido pelo asaas-webhook (refParts[1] === "sub")
    const externalReference = `${org.id}|sub|${plan}`;

    // Validação defensiva: orgId precisa ser UUID e plan precisa ser conhecido
    const validPlans = ["starter", "pro", "enterprise", "whatsapp", "trial"];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(org.id)) {
      console.error("[asaas-create-subscription] Invalid org.id (not UUID):", org.id);
    }
    if (!validPlans.includes(plan)) {
      console.warn("[asaas-create-subscription] Unknown plan slug:", plan, "— webhook may not recognize it");
    }

    const subscriptionBody: Record<string, unknown> = {
      customer: asaasCustomerId,
      billingType: billing_type,
      value: finalPrice,
      cycle: "MONTHLY",
      nextDueDate,
      description: `Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)} — NOE`,
      externalReference,
    };

    if (splitConfig.length > 0) {
      subscriptionBody.split = splitConfig;
    }

    console.log("[asaas-create-subscription] Creating subscription:", {
      org_id: org.id,
      plan,
      externalReference,
      value: finalPrice,
      billing_type,
      next_due_date: nextDueDate,
      split_count: splitConfig.length,
      customer: asaasCustomerId,
    });

    const subscriptionRes = await asaasFetch(`${ASAAS_BASE}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
      body: JSON.stringify(subscriptionBody),
    });

    const subscriptionData = await subscriptionRes.json();
    if (!subscriptionRes.ok) {
      console.error("Asaas subscription creation failed:", subscriptionData);
      return new Response(JSON.stringify({ error: "Failed to create Asaas subscription", details: subscriptionData }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    if (plan === "whatsapp") {
      // WhatsApp plan: update whatsapp_instances instead of subscriptions
      // Find the most recent instance for this org
      const { data: latestInstance } = await adminClient
        .from("whatsapp_instances")
        .select("id")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestInstance) {
        await adminClient
          .from("whatsapp_instances")
          .update({
            asaas_subscription_id: subscriptionData.id,
            billing_status: "pending",
          })
          .eq("id", latestInstance.id);
      }
    } else {
      await adminClient
        .from("subscriptions")
        .update({
          plan,
          status: "pending_payment",
          modules: null,
          sales_plan: null,
          marketing_plan: null,
          asaas_subscription_id: subscriptionData.id,
          asaas_billing_type: billing_type,
          expires_at: expiresAt.toISOString(),
          discount_percent: discountPercent,
          referral_org_id: referralOrgId,
        })
        .eq("organization_id", org.id);
    }

    // Credits will be added by asaas-webhook on PAYMENT_CONFIRMED

    // Fetch first payment from the subscription to return payment details
    let invoiceUrl: string | null = null;
    let bankSlipUrl: string | null = null;
    let pixQrCodeBase64: string | null = null;
    let pixCopyPaste: string | null = null;
    let firstPaymentId: string | null = null;

    try {
      const paymentsRes = await asaasFetch(`${ASAAS_BASE}/subscriptions/${subscriptionData.id}/payments`, {
        method: "GET",
        headers: { access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
      });
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        const firstPayment = paymentsData.data?.[0];
        if (firstPayment) {
          firstPaymentId = firstPayment.id;
          invoiceUrl = firstPayment.invoiceUrl || null;
          bankSlipUrl = firstPayment.bankSlipUrl || null;
          console.log(`First payment found: ${firstPayment.id}, status=${firstPayment.status}, invoiceUrl=${!!invoiceUrl}, bankSlipUrl=${!!bankSlipUrl}`);

          // For PIX, fetch QR code
          if (billing_type === "PIX" && firstPayment.id) {
            const pix = await fetchPixQrCode(asaasApiKey, firstPayment.id);
            pixQrCodeBase64 = pix.encodedImage;
            pixCopyPaste = pix.payload;
          }
        }
      }
    } catch (payErr: unknown) {
      console.warn("Failed to fetch first payment details:", payErr instanceof Error ? payErr.message : String(payErr));
    }

    console.log(`Subscription created for org ${org.id}: plan=${plan}, price=${finalPrice}, discount=${discountPercent}%, asaas_sub=${subscriptionData.id}`);

    return new Response(JSON.stringify({
      success: true,
      asaas_subscription_id: subscriptionData.id,
      asaas_customer_id: asaasCustomerId,
      payment_link: subscriptionData.paymentLink || null,
      discount_applied: discountPercent,
      final_price: finalPrice,
      invoice_url: invoiceUrl,
      bank_slip_url: bankSlipUrl,
      pix_qr_code_base64: pixQrCodeBase64,
      pix_copy_paste: pixCopyPaste,
      value: finalPrice,
      billing_type,
      payment_id: firstPaymentId,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const valRes = validationErrorResponse(err, getCorsHeaders(req));
    if (valRes) return valRes;
    console.error("asaas-create-subscription error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
