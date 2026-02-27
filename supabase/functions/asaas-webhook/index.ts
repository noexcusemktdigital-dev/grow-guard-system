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

    const handledEvents = [
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED",
      "PAYMENT_OVERDUE",
      "PAYMENT_REFUNDED",
      "PAYMENT_DELETED",
    ];

    if (!handledEvents.includes(event)) {
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
      console.warn("No org found for asaas customer:", payment.customer);
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "Organization not found for customer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert payment value to credits using plan-based mapping
    // Plans: Starter R$197-297 = 5000cr, Growth R$497-697 = 20000cr, Scale R$997-1397 = 50000cr
    // Packs: R$49 = 5000cr, R$149 = 20000cr, R$299 = 50000cr
    const paymentValue = payment.value || 0;
    
    function valueToCreditAmount(value: number): number {
      // Subscription plan mapping
      if (value >= 997) return 50000;
      if (value >= 497) return 20000;
      if (value >= 197) return 5000;
      // Credit pack mapping
      if (value >= 299) return 50000;
      if (value >= 149) return 20000;
      if (value >= 49) return 5000;
      return Math.round(value * 100); // fallback: 100 credits per R$1
    }

    const creditsAmount = valueToCreditAmount(paymentValue);

    // ── PAYMENT_CONFIRMED / PAYMENT_RECEIVED ──
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      // Check if this is a system fee payment
      const externalRef = payment.externalReference;
      if (externalRef && typeof externalRef === "string" && externalRef.startsWith("system_fee|")) {
        const asaasPaymentId = payment.id;
        if (asaasPaymentId) {
          await adminClient
            .from("franchisee_system_payments")
            .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("asaas_payment_id", asaasPaymentId);
          console.log(`System fee payment ${asaasPaymentId} marked as paid`);
        }
        return new Response(JSON.stringify({ success: true, event, type: "system_fee" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if this is a client payment
      if (externalRef && typeof externalRef === "string" && externalRef.startsWith("client_payment|")) {
        const parts = externalRef.split("|");
        const cpOrgId = parts[1];
        const cpContractId = parts[2];
        const cpMonth = parts[3];
        if (cpOrgId && cpContractId && cpMonth) {
          await adminClient
            .from("client_payments")
            .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("organization_id", cpOrgId)
            .eq("contract_id", cpContractId)
            .eq("month", cpMonth);

          // Register as revenue for the franchisee
          const cpPayment = await adminClient
            .from("client_payments")
            .select("amount, franchisee_share")
            .eq("organization_id", cpOrgId)
            .eq("contract_id", cpContractId)
            .eq("month", cpMonth)
            .maybeSingle();

          if (cpPayment?.data) {
            await adminClient.from("finance_revenues").insert({
              organization_id: cpOrgId,
              description: `Pagamento cliente — Ref. ${cpMonth}`,
              amount: cpPayment.data.franchisee_share,
              date: new Date().toISOString().split("T")[0],
              category: "cliente",
              status: "received",
              payment_method: "asaas",
            });
          }

          console.log(`Client payment confirmed: org=${cpOrgId}, contract=${cpContractId}, month=${cpMonth}`);
          return new Response(JSON.stringify({ success: true, event, type: "client_payment" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Check if this is a franchisee charge
      const asaasPaymentId = payment.id;
      if (asaasPaymentId) {
        const { data: franchiseeCharge } = await adminClient
          .from("franchisee_charges")
          .select("id, organization_id, franchisee_org_id, month, total_amount")
          .eq("asaas_payment_id", asaasPaymentId)
          .maybeSingle();

        if (franchiseeCharge) {
          // Update charge status to paid
          await adminClient
            .from("franchisee_charges")
            .update({ status: "paid", paid_at: new Date().toISOString() })
            .eq("id", franchiseeCharge.id);

          // Register as revenue for the franchisor
          await adminClient.from("finance_revenues").insert({
            organization_id: franchiseeCharge.organization_id,
            description: `Repasse franqueado — Ref. ${franchiseeCharge.month}`,
            amount: franchiseeCharge.total_amount,
            date: new Date().toISOString().split("T")[0],
            category: "repasse",
            status: "received",
            payment_method: "asaas",
          });

          console.log(`Franchisee charge ${franchiseeCharge.id} marked as paid. Revenue registered.`);
          return new Response(JSON.stringify({ success: true, event, type: "franchisee_charge", charge_id: franchiseeCharge.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Check if this is a subscription payment — update subscription status
      // Format: "orgId|sub|planId|modules"
      if (externalRef && typeof externalRef === "string") {
        const parts = externalRef.split("|");
        if (parts.length >= 3 && parts[1] === "sub") {
          const planSlug = parts[2]; // starter, growth, scale
          const modules = parts[3] || "comercial";
          const planCreditsMap: Record<string, number> = { starter: 5000, growth: 20000, scale: 50000 };

          const newExpires = new Date();
          newExpires.setDate(newExpires.getDate() + 30);

          await adminClient
            .from("subscriptions")
            .update({
              plan: planSlug,
              modules,
              status: "active",
              expires_at: newExpires.toISOString(),
            })
            .eq("organization_id", org.id);

          // Override credit amount with plan-specific value
          const planCredits = planCreditsMap[planSlug];
          if (planCredits) {
            const wallet = await getOrCreateWallet(adminClient, org.id);
            if (wallet) {
              const newBalance = wallet.balance + planCredits;
              await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);
              await adminClient.from("credit_transactions").insert({
                organization_id: org.id,
                type: "purchase",
                amount: planCredits,
                balance_after: newBalance,
                description: `Renovação plano ${planSlug} — ${planCredits.toLocaleString()} créditos`,
                metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, plan: planSlug, modules, event },
              });
              console.log(`Subscription renewed for org ${org.id}: plan=${planSlug}, credits=${planCredits}, balance=${newBalance}`);
            }
            return new Response(JSON.stringify({ success: true, event, type: "subscription_renewal", plan: planSlug, credits: planCredits }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      // Standard credit wallet flow
      if (creditsAmount <= 0) {
        return new Response(JSON.stringify({ ok: true, credits: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const wallet = await getOrCreateWallet(adminClient, org.id);
      if (!wallet) {
        return new Response(JSON.stringify({ error: "Failed to get/create wallet" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newBalance = wallet.balance + creditsAmount;
      await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);

      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "purchase",
        amount: creditsAmount,
        balance_after: newBalance,
        description: `Pagamento Asaas — R$ ${paymentValue.toFixed(2)}`,
        metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, asaas_customer_id: payment.customer, payment_value: paymentValue, event },
      });

      console.log(`Credited ${creditsAmount} to org ${org.id} (${org.name}). New balance: ${newBalance}`);
      return new Response(JSON.stringify({ success: true, event, credits_added: creditsAmount, new_balance: newBalance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PAYMENT_REFUNDED ──
    if (event === "PAYMENT_REFUNDED") {
      const wallet = await getOrCreateWallet(adminClient, org.id);
      if (!wallet) {
        return new Response(JSON.stringify({ error: "Failed to get/create wallet" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newBalance = Math.max(0, wallet.balance - creditsAmount);
      await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);

      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "refund",
        amount: -creditsAmount,
        balance_after: newBalance,
        description: `Estorno Asaas — R$ ${paymentValue.toFixed(2)}`,
        metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, asaas_customer_id: payment.customer, payment_value: paymentValue, event },
      });

      console.log(`Refunded ${creditsAmount} from org ${org.id} (${org.name}). New balance: ${newBalance}`);
      return new Response(JSON.stringify({ success: true, event, credits_removed: creditsAmount, new_balance: newBalance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PAYMENT_OVERDUE ──
    if (event === "PAYMENT_OVERDUE") {
      // Get all members of the org to notify
      const { data: members } = await adminClient
        .from("organization_memberships")
        .select("user_id")
        .eq("organization_id", org.id);

      if (members && members.length > 0) {
        const notifications = members.map((m: any) => ({
          organization_id: org.id,
          user_id: m.user_id,
          title: "Pagamento em atraso",
          message: `A cobrança de R$ ${paymentValue.toFixed(2)} está vencida. Regularize para manter seus créditos.`,
          type: "warning",
        }));
        await adminClient.from("client_notifications").insert(notifications);
      }

      // Log informational transaction (no balance change)
      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "alert",
        amount: 0,
        balance_after: 0,
        description: `Cobrança vencida Asaas — R$ ${paymentValue.toFixed(2)}`,
        metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, asaas_customer_id: payment.customer, payment_value: paymentValue, event },
      });

      console.log(`Overdue notification sent for org ${org.id} (${org.name})`);
      return new Response(JSON.stringify({ success: true, event, notified: members?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PAYMENT_DELETED ──
    if (event === "PAYMENT_DELETED") {
      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "info",
        amount: 0,
        balance_after: 0,
        description: `Cobrança cancelada Asaas — R$ ${paymentValue.toFixed(2)}`,
        metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, asaas_customer_id: payment.customer, payment_value: paymentValue, event },
      });

      console.log(`Payment deleted logged for org ${org.id} (${org.name})`);
      return new Response(JSON.stringify({ success: true, event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
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

async function getOrCreateWallet(adminClient: any, orgId: string) {
  let { data: wallet } = await adminClient
    .from("credit_wallets")
    .select("id, balance")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!wallet) {
    const { data: newWallet } = await adminClient
      .from("credit_wallets")
      .insert({ organization_id: orgId, balance: 0 })
      .select()
      .single();
    wallet = newWallet;
  }

  return wallet;
}
