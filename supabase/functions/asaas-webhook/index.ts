import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const event = body.event;
    const payment = body.payment;

    console.log("Asaas webhook received:", event, payment?.id);

    // Optional: validate webhook token
    if (asaasToken) {
      const headerToken = req.headers.get("asaas-access-token") || req.headers.get("x-asaas-token");
      if (headerToken !== asaasToken) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Only process confirmed payments
    if (event !== "PAYMENT_CONFIRMED" && event !== "PAYMENT_RECEIVED") {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payment?.customer) {
      return new Response(JSON.stringify({ error: "Missing customer in payment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find organization by asaas_customer_id
    const { data: org } = await adminClient
      .from("organizations")
      .select("id, name")
      .eq("asaas_customer_id", payment.customer)
      .maybeSingle();

    if (!org) {
      console.error("No org found for asaas customer:", payment.customer);
      return new Response(JSON.stringify({ error: "Organization not found for customer" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine credits from payment value (configurable — here 1 real = 100 credits)
    const creditsPerReal = 100;
    const paymentValue = payment.value || 0;
    const creditsToAdd = Math.round(paymentValue * creditsPerReal);

    if (creditsToAdd <= 0) {
      return new Response(JSON.stringify({ ok: true, credits: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create wallet
    let { data: wallet } = await adminClient
      .from("credit_wallets")
      .select("id, balance")
      .eq("organization_id", org.id)
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet } = await adminClient
        .from("credit_wallets")
        .insert({ organization_id: org.id, balance: 0 })
        .select()
        .single();
      wallet = newWallet;
    }

    if (!wallet) {
      return new Response(JSON.stringify({ error: "Failed to get/create wallet" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newBalance = wallet.balance + creditsToAdd;

    await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);

    await adminClient.from("credit_transactions").insert({
      organization_id: org.id,
      type: "purchase",
      amount: creditsToAdd,
      balance_after: newBalance,
      description: `Pagamento Asaas — R$ ${paymentValue.toFixed(2)}`,
      metadata: {
        source: "asaas_webhook",
        asaas_payment_id: payment.id,
        asaas_customer_id: payment.customer,
        payment_value: paymentValue,
        event,
      },
    });

    console.log(`Credited ${creditsToAdd} to org ${org.id} (${org.name}). New balance: ${newBalance}`);

    return new Response(JSON.stringify({ success: true, credits_added: creditsToAdd, new_balance: newBalance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("asaas-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
