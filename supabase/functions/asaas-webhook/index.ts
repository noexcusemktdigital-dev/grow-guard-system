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

    // 1. Validate token BEFORE parsing body (security fix)
    if (asaasToken) {
      const headerToken = req.headers.get("asaas-access-token");
      if (headerToken !== asaasToken) {
        // Consume body to prevent leak
        await req.text();
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const event = body.event;
    const payment = body.payment;

    console.log("Asaas webhook received:", event, payment?.id);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const handledEvents = [
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED",
      "PAYMENT_OVERDUE",
      "PAYMENT_REFUNDED",
      "PAYMENT_DELETED",
      "PAYMENT_CHARGEBACK_REQUESTED",
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

    // Parse externalReference for structured routing
    const externalRef = (payment.externalReference || "") as string;
    const refParts = externalRef.split("|");

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

    const paymentValue = payment.value || 0;

    // ── PAYMENT_CHARGEBACK_REQUESTED ──
    if (event === "PAYMENT_CHARGEBACK_REQUESTED") {
      // Notify all org members
      const { data: members } = await adminClient
        .from("organization_memberships")
        .select("user_id")
        .eq("organization_id", org.id);

      if (members && members.length > 0) {
        const notifications = members.map((m: any) => ({
          organization_id: org.id,
          user_id: m.user_id,
          title: "⚠️ Chargeback solicitado",
          message: `Um chargeback de R$ ${paymentValue.toFixed(2)} foi solicitado. Verifique imediatamente.`,
          type: "warning",
        }));
        await adminClient.from("client_notifications").insert(notifications);
      }

      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "alert",
        amount: 0,
        balance_after: 0,
        description: `Chargeback solicitado — R$ ${paymentValue.toFixed(2)}`,
        metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, event },
      });

      console.log(`Chargeback notification sent for org ${org.id}: R$${paymentValue}`);
      return new Response(JSON.stringify({ success: true, event, notified: members?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PAYMENT_CONFIRMED / PAYMENT_RECEIVED ──
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {

      // Route by externalReference prefix
      // system_fee|{orgId}|{month}
      if (externalRef.startsWith("system_fee|")) {
        if (payment.id) {
          await adminClient
            .from("franchisee_system_payments")
            .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("asaas_payment_id", payment.id);
          console.log(`System fee payment ${payment.id} marked as paid`);
        }
        return jsonOk({ success: true, event, type: "system_fee" });
      }

      // client_payment|{orgId}|{contractId}|{month}
      if (externalRef.startsWith("client_payment|")) {
        const cpOrgId = refParts[1];
        const cpContractId = refParts[2];
        const cpMonth = refParts[3];
        if (cpOrgId && cpContractId && cpMonth) {
          await adminClient
            .from("client_payments")
            .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("organization_id", cpOrgId)
            .eq("contract_id", cpContractId)
            .eq("month", cpMonth);

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
          return jsonOk({ success: true, event, type: "client_payment" });
        }
      }

      // franchisee_charge|{orgId}|{franchiseeOrgId}|{month}
      if (externalRef.startsWith("franchisee_charge|")) {
        if (payment.id) {
          const { data: franchiseeCharge } = await adminClient
            .from("franchisee_charges")
            .select("id, organization_id, franchisee_org_id, month, total_amount")
            .eq("asaas_payment_id", payment.id)
            .maybeSingle();

          if (franchiseeCharge) {
            await adminClient
              .from("franchisee_charges")
              .update({ status: "paid", paid_at: new Date().toISOString() })
              .eq("id", franchiseeCharge.id);

            await adminClient.from("finance_revenues").insert({
              organization_id: franchiseeCharge.organization_id,
              description: `Repasse franqueado — Ref. ${franchiseeCharge.month}`,
              amount: franchiseeCharge.total_amount,
              date: new Date().toISOString().split("T")[0],
              category: "repasse",
              status: "received",
              payment_method: "asaas",
            });

            console.log(`Franchisee charge ${franchiseeCharge.id} marked as paid`);
            return jsonOk({ success: true, event, type: "franchisee_charge", charge_id: franchiseeCharge.id });
          }
        }
      }

      // {orgId}|sub|{planId}|{modules} → subscription renewal
      if (refParts.length >= 3 && refParts[1] === "sub") {
        const planSlug = refParts[2];
        const modules = refParts[3] || "comercial";
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
            console.log(`Subscription renewed for org ${org.id}: plan=${planSlug}, credits=${planCredits}`);
          }
          return jsonOk({ success: true, event, type: "subscription_renewal", plan: planSlug, credits: planCredits });
        }
      }

      // {orgId}|credits|{packId} → credit pack purchase (NEW: parse by packId)
      if (refParts.length >= 3 && refParts[1] === "credits") {
        const packId = refParts[2];
        const packCreditsMap: Record<string, number> = {
          "pack-5000": 5000,
          "pack-20000": 20000,
          "pack-50000": 50000,
        };
        const creditsToAdd = packCreditsMap[packId];
        if (creditsToAdd) {
          const wallet = await getOrCreateWallet(adminClient, org.id);
          if (wallet) {
            const newBalance = wallet.balance + creditsToAdd;
            await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);
            await adminClient.from("credit_transactions").insert({
              organization_id: org.id,
              type: "purchase",
              amount: creditsToAdd,
              balance_after: newBalance,
              description: `Pacote ${creditsToAdd.toLocaleString()} créditos`,
              metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, pack_id: packId, event },
            });
            console.log(`Credits pack ${packId} added for org ${org.id}: +${creditsToAdd}, balance=${newBalance}`);
          }
          return jsonOk({ success: true, event, type: "credit_pack", credits_added: creditsToAdd });
        }
      }

      // {orgId}|extra_user| → extra user charge (no credits, just confirmation)
      if (refParts.length >= 2 && refParts[1] === "extra_user") {
        console.log(`Extra user charge confirmed for org ${org.id}`);
        return jsonOk({ success: true, event, type: "extra_user" });
      }

      // Fallback: legacy payments without structured externalReference
      // Use value-based mapping as last resort
      const creditsAmount = valueToCreditAmount(paymentValue);
      if (creditsAmount <= 0) {
        return jsonOk({ ok: true, credits: 0 });
      }

      const wallet = await getOrCreateWallet(adminClient, org.id);
      if (!wallet) {
        return new Response(JSON.stringify({ error: "Failed to get/create wallet" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newBalance = wallet.balance + creditsAmount;
      await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);
      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "purchase",
        amount: creditsAmount,
        balance_after: newBalance,
        description: `Pagamento Asaas (legado) — R$ ${paymentValue.toFixed(2)}`,
        metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, payment_value: paymentValue, event, legacy: true },
      });

      console.log(`[Legacy] Credited ${creditsAmount} to org ${org.id}. Balance: ${newBalance}`);
      return jsonOk({ success: true, event, credits_added: creditsAmount, new_balance: newBalance, legacy: true });
    }

    // ── PAYMENT_REFUNDED ──
    if (event === "PAYMENT_REFUNDED") {
      // Try to reverse credit pack by externalReference
      let creditsToRemove = 0;
      if (refParts.length >= 3 && refParts[1] === "credits") {
        const packCreditsMap: Record<string, number> = { "pack-5000": 5000, "pack-20000": 20000, "pack-50000": 50000 };
        creditsToRemove = packCreditsMap[refParts[2]] || valueToCreditAmount(paymentValue);
      } else {
        creditsToRemove = valueToCreditAmount(paymentValue);
      }

      const wallet = await getOrCreateWallet(adminClient, org.id);
      if (wallet) {
        const newBalance = Math.max(0, wallet.balance - creditsToRemove);
        await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);
        await adminClient.from("credit_transactions").insert({
          organization_id: org.id,
          type: "refund",
          amount: -creditsToRemove,
          balance_after: newBalance,
          description: `Estorno Asaas — R$ ${paymentValue.toFixed(2)}`,
          metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, event },
        });
        console.log(`Refunded ${creditsToRemove} from org ${org.id}. Balance: ${newBalance}`);
        return jsonOk({ success: true, event, credits_removed: creditsToRemove, new_balance: newBalance });
      }
      return jsonOk({ success: true, event });
    }

    // ── PAYMENT_OVERDUE ──
    if (event === "PAYMENT_OVERDUE") {
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

      // Update system fee if applicable
      if (externalRef.startsWith("system_fee|") && payment.id) {
        await adminClient
          .from("franchisee_system_payments")
          .update({ status: "overdue", updated_at: new Date().toISOString() })
          .eq("asaas_payment_id", payment.id);
      }

      console.log(`Overdue notification sent for org ${org.id}`);
      return jsonOk({ success: true, event, notified: members?.length || 0 });
    }

    // ── PAYMENT_DELETED ──
    if (event === "PAYMENT_DELETED") {
      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "info",
        amount: 0,
        balance_after: 0,
        description: `Cobrança cancelada Asaas — R$ ${paymentValue.toFixed(2)}`,
        metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, event },
      });
      console.log(`Payment deleted logged for org ${org.id}`);
      return jsonOk({ success: true, event });
    }

    return jsonOk({ ok: true });
  } catch (err: any) {
    console.error("asaas-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function jsonOk(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Legacy fallback: map value to credits when externalReference is missing
function valueToCreditAmount(value: number): number {
  if (value >= 997) return 50000;
  if (value >= 497) return 20000;
  if (value >= 197) return 5000;
  if (value >= 299) return 50000;
  if (value >= 149) return 20000;
  if (value >= 49) return 5000;
  return Math.round(value * 100);
}

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
