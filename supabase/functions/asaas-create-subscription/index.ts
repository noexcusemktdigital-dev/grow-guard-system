import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getOrCreateAsaasCustomer } from "../_shared/asaas-customer.ts";
import { asaasFetch } from "../_shared/asaas-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

const SALES_PRICES: Record<string, number> = {
  starter: 197,
  professional: 497,
  enterprise: 997,
};

const MARKETING_PRICES: Record<string, number> = {
  starter: 147,
  professional: 397,
  enterprise: 797,
};

const SALES_CREDITS: Record<string, number> = {
  starter: 3000,
  professional: 15000,
  enterprise: 40000,
};

const MARKETING_CREDITS: Record<string, number> = {
  starter: 2000,
  professional: 10000,
  enterprise: 30000,
};

const COMBO_DISCOUNT = 0.15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organization_id, sales_plan, marketing_plan, billing_type } = await req.json();

    if (!organization_id || !billing_type) {
      return new Response(JSON.stringify({ error: "organization_id and billing_type are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sales_plan && !marketing_plan) {
      return new Response(JSON.stringify({ error: "At least one of sales_plan or marketing_plan is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate price
    const salesPrice = sales_plan ? (SALES_PRICES[sales_plan] ?? 0) : 0;
    const marketingPrice = marketing_plan ? (MARKETING_PRICES[marketing_plan] ?? 0) : 0;

    if ((sales_plan && !SALES_PRICES[sales_plan]) || (marketing_plan && !MARKETING_PRICES[marketing_plan])) {
      return new Response(JSON.stringify({ error: "Invalid plan tier" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isCombo = !!sales_plan && !!marketing_plan;
    const rawPrice = salesPrice + marketingPrice;
    let planPrice = isCombo ? Math.round(rawPrice * (1 - COMBO_DISCOUNT)) : rawPrice;

    const validBillingTypes = ["CREDIT_CARD", "BOLETO", "PIX"];
    if (!validBillingTypes.includes(billing_type)) {
      return new Response(JSON.stringify({ error: "Invalid billing_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .select("id, name, cnpj, email, phone, parent_org_id")
      .eq("id", organization_id)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    let finalPrice = planPrice;
    if (discountPercent > 0) {
      finalPrice = Math.round(planPrice * (1 - discountPercent / 100) * 100) / 100;
      console.log(`Discount applied: ${discountPercent}% → R$ ${planPrice} → R$ ${finalPrice}`);
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

    const moduleLabels: string[] = [];
    if (sales_plan) moduleLabels.push(`Vendas ${sales_plan}`);
    if (marketing_plan) moduleLabels.push(`Mkt ${marketing_plan}`);
    const moduleLabel = moduleLabels.join(" + ");

    // Determine modules value for legacy compat
    const modulesValue = isCombo ? "combo" : (sales_plan ? "comercial" : "marketing");

    // Build split config if client is linked to a franchisee
    const splitConfig: any[] = [];
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

    const subscriptionBody: any = {
      customer: asaasCustomerId,
      billingType: billing_type,
      value: finalPrice,
      cycle: "MONTHLY",
      nextDueDate,
      description: `${moduleLabel}${isCombo ? " (Combo)" : ""} — NOE`,
      externalReference: `${org.id}|sub|${sales_plan || "none"}|${marketing_plan || "none"}|${modulesValue}`,
    };

    if (splitConfig.length > 0) {
      subscriptionBody.split = splitConfig;
    }

    const subscriptionRes = await asaasFetch(`${ASAAS_BASE}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
      body: JSON.stringify(subscriptionBody),
    });

    const subscriptionData = await subscriptionRes.json();
    if (!subscriptionRes.ok) {
      console.error("Asaas subscription creation failed:", subscriptionData);
      return new Response(JSON.stringify({ error: "Failed to create Asaas subscription", details: subscriptionData }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await adminClient
      .from("subscriptions")
      .update({
        plan: sales_plan || marketing_plan || "starter",
        status: "active",
        modules: modulesValue,
        sales_plan: sales_plan || null,
        marketing_plan: marketing_plan || null,
        asaas_subscription_id: subscriptionData.id,
        asaas_billing_type: billing_type,
        expires_at: expiresAt.toISOString(),
        discount_percent: discountPercent,
        referral_org_id: referralOrgId,
      })
      .eq("organization_id", org.id);

    // Calculate total credits
    const totalCredits = (sales_plan ? (SALES_CREDITS[sales_plan] || 0) : 0) + (marketing_plan ? (MARKETING_CREDITS[marketing_plan] || 0) : 0);

    const { data: wallet } = await adminClient
      .from("credit_wallets")
      .select("id, balance")
      .eq("organization_id", org.id)
      .maybeSingle();

    if (wallet && totalCredits > 0) {
      const newBalance = wallet.balance + totalCredits;
      await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);
      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "purchase",
        amount: totalCredits,
        balance_after: newBalance,
        description: `Ativação ${moduleLabel} — ${totalCredits} créditos`,
      });
    }

    console.log(`Subscription created for org ${org.id}: sales=${sales_plan}, marketing=${marketing_plan}, price=${finalPrice}, discount=${discountPercent}%, asaas_sub=${subscriptionData.id}`);

    return new Response(JSON.stringify({
      success: true,
      asaas_subscription_id: subscriptionData.id,
      asaas_customer_id: asaasCustomerId,
      payment_link: subscriptionData.paymentLink || null,
      discount_applied: discountPercent,
      final_price: finalPrice,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("asaas-create-subscription error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
