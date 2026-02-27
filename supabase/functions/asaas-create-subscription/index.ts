import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "../_shared/asaas-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

const PLAN_PRICES: Record<string, { base: number; combo: number }> = {
  starter: { base: 197, combo: 297 },
  growth: { base: 497, combo: 697 },
  scale: { base: 997, combo: 1397 },
};

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

    const { organization_id, plan_id, billing_type, modules } = await req.json();

    if (!organization_id || !plan_id || !billing_type) {
      return new Response(JSON.stringify({ error: "organization_id, plan_id and billing_type are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planPricing = PLAN_PRICES[plan_id];
    if (!planPricing) {
      return new Response(JSON.stringify({ error: "Invalid plan_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const moduleChoice = modules === "combo" ? "combo" : (modules || "comercial");
    const planPrice = moduleChoice === "combo" ? planPricing.combo : planPricing.base;

    const validBillingTypes = ["CREDIT_CARD", "BOLETO", "PIX"];
    if (!validBillingTypes.includes(billing_type)) {
      return new Response(JSON.stringify({ error: "Invalid billing_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .select("id, name, cnpj, email, phone, asaas_customer_id")
      .eq("id", organization_id)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let asaasCustomerId = org.asaas_customer_id;

    if (!asaasCustomerId) {
      const customerRes = await asaasFetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: asaasApiKey },
        body: JSON.stringify({
          name: org.name,
          email: org.email || undefined,
          phone: org.phone || undefined,
          cpfCnpj: org.cnpj || undefined,
          externalReference: org.id,
        }),
      });

      const customerData = await customerRes.json();
      if (!customerRes.ok) {
        console.error("Asaas customer creation failed:", customerData);
        return new Response(JSON.stringify({ error: "Failed to create Asaas customer", details: customerData }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      asaasCustomerId = customerData.id;
      await adminClient
        .from("organizations")
        .update({ asaas_customer_id: asaasCustomerId })
        .eq("id", org.id);
    }

    const today = new Date();
    const nextDueDate = today.toISOString().split("T")[0];
    const moduleLabel = moduleChoice === "combo" ? "Combo" : moduleChoice === "marketing" ? "Marketing" : "Comercial";

    const subscriptionRes = await asaasFetch(`${ASAAS_BASE}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: asaasApiKey },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: billing_type,
        value: planPrice,
        cycle: "MONTHLY",
        nextDueDate,
        description: `Plano ${plan_id.charAt(0).toUpperCase() + plan_id.slice(1)} ${moduleLabel} — NOE`,
        externalReference: `${org.id}|sub|${plan_id}|${moduleChoice}`,
      }),
    });

    const subscriptionData = await subscriptionRes.json();
    if (!subscriptionRes.ok) {
      console.error("Asaas subscription creation failed:", subscriptionData);
      return new Response(JSON.stringify({ error: "Failed to create Asaas subscription", details: subscriptionData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await adminClient
      .from("subscriptions")
      .update({
        plan: plan_id,
        status: "active",
        modules: moduleChoice,
        asaas_subscription_id: subscriptionData.id,
        asaas_billing_type: billing_type,
        expires_at: expiresAt.toISOString(),
      })
      .eq("organization_id", org.id);

    const planCredits: Record<string, number> = { starter: 5000, growth: 20000, scale: 50000 };
    const credits = planCredits[plan_id] || 500;

    const { data: wallet } = await adminClient
      .from("credit_wallets")
      .select("id, balance")
      .eq("organization_id", org.id)
      .maybeSingle();

    if (wallet) {
      const newBalance = wallet.balance + credits;
      await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);
      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "purchase",
        amount: credits,
        balance_after: newBalance,
        description: `Ativação plano ${plan_id} ${moduleLabel} — ${credits} créditos`,
      });
    }

    console.log(`Subscription created for org ${org.id}: plan=${plan_id}, modules=${moduleChoice}, asaas_sub=${subscriptionData.id}`);

    return new Response(JSON.stringify({
      success: true,
      asaas_subscription_id: subscriptionData.id,
      asaas_customer_id: asaasCustomerId,
      payment_link: subscriptionData.paymentLink || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("asaas-create-subscription error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
