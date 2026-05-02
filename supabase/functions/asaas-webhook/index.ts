// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Estes dois sao definidos depois e usados por jsonOk para marcar processed_at.
  let _eventIdForProcessed: string | null = null;
  let _adminClientForProcessed: any = null;
  // jsonOk must be inside handler so req is in scope
  const jsonOk = (data: Record<string, unknown>) => {
    if (_eventIdForProcessed && _adminClientForProcessed) {
      // fire-and-forget
      _adminClientForProcessed
        .from("webhook_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("provider", "asaas")
        .eq("external_event_id", _eventIdForProcessed)
        .then(() => {}, (e: any) => console.warn("[asaas-webhook] failed to mark processed_at:", e));
    }
    return new Response(JSON.stringify(data), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");

    // 1. Token obrigatório — rejeita se não configurado (SEC-NOE-004)
    if (!asaasToken) {
      console.error("ASAAS_WEBHOOK_TOKEN not configured — rejecting all requests");
      await req.text();
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // 2. Validate token BEFORE parsing body
    const headerToken = req.headers.get("asaas-access-token");
    if (headerToken !== asaasToken) {
      await req.text();
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const rawBodyText = await req.text();
    const body = JSON.parse(rawBodyText || "{}");
    const event = body.event;
    const payment = body.payment;

    console.log("Asaas webhook received:", event, payment?.id);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    _adminClientForProcessed = adminClient;

    // Idempotência inbound: dedupe por external_event_id (id do evento Asaas).
    // Asaas envia body.id como ID único do evento; fallback: combinar event+payment.id.
    const externalEventId = body.id || (payment?.id ? `${event}:${payment.id}` : null);
    if (externalEventId) {
      _eventIdForProcessed = String(externalEventId);
      try {
        const payloadHash = await (async () => {
          const data = new TextEncoder().encode(rawBodyText);
          const buf = await crypto.subtle.digest("SHA-256", data);
          return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
        })();
        const { error: dupError } = await adminClient.from("webhook_events").insert({
          provider: "asaas",
          external_event_id: String(externalEventId),
          payload_hash: payloadHash,
        });
        if (dupError && (dupError.code === "23505" || /duplicate/i.test(dupError.message || ""))) {
          console.log(`[asaas-webhook] duplicate event ignored: ${externalEventId}`);
          return jsonOk({ ok: true, note: "already_processed", event_id: externalEventId });
        }
      } catch (e) {
        console.warn("[asaas-webhook] dedup check failed (continuing):", e);
      }
    }

    const handledEvents = [
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED",
      "PAYMENT_OVERDUE",
      "PAYMENT_UPDATED",
      "PAYMENT_REFUNDED",
      "PAYMENT_REFUND_IN_PROGRESS",
      "PAYMENT_DELETED",
      "PAYMENT_CHARGEBACK_REQUESTED",
      "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
      "PAYMENT_SPLIT_DIVERGENCE_BLOCK",
      "PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED",
    ];

    if (!handledEvents.includes(event)) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (!payment?.customer) {
      return new Response(JSON.stringify({ error: "Missing customer in payment" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const paymentValue = payment.value || 0;

    // ── PAYMENT_CHARGEBACK_REQUESTED ──
    if (event === "PAYMENT_CHARGEBACK_REQUESTED") {
      // 1. Notify all org members (existing)
      await notifyOrgMembers(adminClient, org.id, {
        title: "⚠️ Chargeback solicitado",
        message: `Um chargeback de R$ ${paymentValue.toFixed(2)} foi solicitado. Verifique imediatamente.`,
        type: "warning",
      });

      // 2. Reverse credits (NEW)
      let creditsToRemove = 0;
      if (refParts.length >= 3 && refParts[1] === "credits") {
        const packCreditsMap: Record<string, number> = { "pack-5000": 5000, "pack-20000": 20000, "pack-50000": 50000 };
        creditsToRemove = packCreditsMap[refParts[2]] || valueToCreditAmount(paymentValue);
      } else if (refParts.length >= 3 && refParts[1] === "sub") {
        const SC: Record<string, number> = { starter: 3000, professional: 15000, enterprise: 40000 };
        const MC: Record<string, number> = { starter: 2000, professional: 10000, enterprise: 30000 };
        const sp = refParts[2] || "none";
        const mp = refParts.length >= 4 ? refParts[3] : "none";
        creditsToRemove = (sp !== "none" ? (SC[sp] || 0) : 0) + (mp !== "none" ? (MC[mp] || 0) : 0);
        if (creditsToRemove === 0) creditsToRemove = valueToCreditAmount(paymentValue);
      } else {
        creditsToRemove = valueToCreditAmount(paymentValue);
      }

      const wallet = await getOrCreateWallet(adminClient, org.id);
      let newBalance = 0;
      if (wallet && creditsToRemove > 0) {
        newBalance = Math.max(0, wallet.balance - creditsToRemove);
        await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);
      }

      await updatePaymentStatus(adminClient, externalRef, refParts, payment.id, "chargeback");

      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "chargeback",
        amount: -creditsToRemove,
        balance_after: newBalance,
        description: `Chargeback — R$ ${paymentValue.toFixed(2)} (−${creditsToRemove} créditos)`,
        metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, event },
      });

      console.log(`Chargeback processed for org ${org.id}: -${creditsToRemove} credits, balance=${newBalance}`);
      return jsonOk({ success: true, event, credits_removed: creditsToRemove, new_balance: newBalance });
    }

    // ── PAYMENT_CONFIRMED / PAYMENT_RECEIVED ──
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      // Desbloquear workspace se estava bloqueado por inadimplência
      try {
        const { data: orgRow } = await adminClient
          .from("organizations")
          .select("payment_blocked")
          .eq("id", org.id)
          .maybeSingle();

        if ((orgRow as any)?.payment_blocked) {
          await adminClient
            .from("organizations")
            .update({ payment_blocked: false, payment_blocked_at: null, payment_blocked_reason: null })
            .eq("id", org.id);

          await notifyOrgMembers(adminClient, org.id, {
            title: "✅ Acesso restaurado!",
            message: "Seu pagamento foi confirmado e o acesso à plataforma foi restaurado.",
            type: "success",
          });
          console.log(`Workspace unblocked for org ${org.id}`);
        }
      } catch (e) {
        console.error("Failed to unblock workspace", e);
      }

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

            // Notificar o franqueado da confirmação do pagamento
            try {
              await adminClient.from("client_notifications").insert({
                organization_id: franchiseeCharge.franchisee_org_id,
                title: "Mensalidade do sistema confirmada",
                message: `Pagamento de R$ ${Number(franchiseeCharge.total_amount).toFixed(2)} confirmado para o mês ${franchiseeCharge.month}.`,
                type: "payment",
                action_url: "/franqueado/financeiro",
              });
            } catch (notifErr) {
              console.error("Failed to notify franchisee:", notifErr);
            }

            console.log(`Franchisee charge ${franchiseeCharge.id} marked as paid`);
            return jsonOk({ success: true, event, type: "franchisee_charge", charge_id: franchiseeCharge.id });
          }
        }
      }

      // {orgId}|sub|{plan} → unified subscription renewal
      // Also supports legacy: {orgId}|sub|{salesPlan}|{marketingPlan}|{modules}
      if (refParts.length >= 3 && refParts[1] === "sub") {
        // Unified: refParts[2] is the plan id (starter/pro/enterprise/whatsapp)
        // Legacy: refParts[2] is salesPlan, refParts[3] is marketingPlan
        const PLAN_CREDITS: Record<string, number> = { starter: 500, pro: 1000, enterprise: 1500 };
        
        let planSlug: string;
        let totalCredits: number;

        if (refParts.length >= 4 && refParts[3] !== undefined) {
          // Legacy format: {orgId}|sub|{salesPlan}|{marketingPlan}|{modules}
          const salesPlan = refParts[2] || "none";
          const marketingPlan = refParts[3] || "none";
          planSlug = salesPlan !== "none" ? salesPlan : marketingPlan;
          const LEGACY_SC: Record<string, number> = { starter: 3000, professional: 15000, enterprise: 40000 };
          const LEGACY_MC: Record<string, number> = { starter: 2000, professional: 10000, enterprise: 30000 };
          totalCredits = (salesPlan !== "none" ? (LEGACY_SC[salesPlan] || 0) : 0) + (marketingPlan !== "none" ? (LEGACY_MC[marketingPlan] || 0) : 0);
        } else {
          planSlug = refParts[2];
          totalCredits = PLAN_CREDITS[planSlug] || 500;
        }

        // ── WhatsApp plan: update whatsapp_instances, skip subscriptions/credits ──
        if (planSlug === "whatsapp") {
          await adminClient
            .from("whatsapp_instances")
            .update({ billing_status: "active" })
            .eq("organization_id", org.id)
            .eq("billing_status", "pending");

          console.log(`WhatsApp billing confirmed for org ${org.id}`);
          return jsonOk({ success: true, event, type: "whatsapp_billing" });
        }

        const newExpires = new Date();
        newExpires.setDate(newExpires.getDate() + 30);

        await adminClient
          .from("subscriptions")
          .update({
            plan: planSlug,
            status: "active",
            expires_at: newExpires.toISOString(),
          })
          .eq("organization_id", org.id);

        // Register SaaS commission if client is linked to a franchisee
        const { data: clientOrg } = await adminClient
          .from("organizations")
          .select("parent_org_id")
          .eq("id", org.id)
          .maybeSingle();

        if (clientOrg?.parent_org_id) {
          const { data: franchiseeOrg } = await adminClient
            .from("organizations")
            .select("saas_commission_percent")
            .eq("id", clientOrg.parent_org_id)
            .maybeSingle();

          const commissionPercent = franchiseeOrg?.saas_commission_percent || 20;
          const commissionValue = Math.round(paymentValue * commissionPercent / 100 * 100) / 100;
          const currentMonth = new Date().toISOString().slice(0, 7);

          await adminClient.from("saas_commissions").insert({
            franchisee_org_id: clientOrg.parent_org_id,
            client_org_id: org.id,
            asaas_payment_id: payment.id,
            payment_value: paymentValue,
            commission_percent: commissionPercent,
            commission_value: commissionValue,
            month: currentMonth,
            status: "pending",
          });

          await adminClient.from("finance_revenues").insert({
            organization_id: clientOrg.parent_org_id,
            description: `Comissão SaaS — ${org.name} — ${currentMonth}`,
            amount: commissionValue,
            date: new Date().toISOString().split("T")[0],
            category: "saas_commission",
            status: "received",
            payment_method: "asaas",
          });

          console.log(`SaaS commission registered: franchisee=${clientOrg.parent_org_id}, client=${org.id}, value=R$${commissionValue}`);
        }

        if (totalCredits > 0) {
          const wallet = await getOrCreateWallet(adminClient, org.id);
          if (wallet) {
            const newBalance = wallet.balance + totalCredits;
            await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);
            await adminClient.from("credit_transactions").insert({
              organization_id: org.id,
              type: "purchase",
              amount: totalCredits,
              balance_after: newBalance,
              description: `Renovação plano ${planSlug} — ${totalCredits} créditos`,
              metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, plan: planSlug, event },
            });
            console.log(`Subscription renewed for org ${org.id}: plan=${planSlug}, credits=${totalCredits}`);
          }
        }

        // Detectar primeiro pagamento — checa se só existe 1 purchase em credit_transactions
        try {
          const { count: purchaseCount } = await adminClient
            .from("credit_transactions")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", org.id)
            .eq("type", "purchase");

          const isFirstPayment = (purchaseCount ?? 0) === 1;
          console.log(`First-payment check org=${org.id}: purchaseCount=${purchaseCount}, isFirst=${isFirstPayment}`);

          if (isFirstPayment) {
            // Email de boas-vindas / primeiro pagamento (idempotente — dedup_key inclui evento+org)
            try {
              await fetch(`${supabaseUrl}/functions/v1/send-campaign-email`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${serviceRoleKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  trigger_event: "first_payment",
                  organization_id: org.id,
                  metadata: { plan: planSlug, value: paymentValue, credits: totalCredits },
                }),
              });
            } catch (e) {
              console.error("first_payment campaign trigger failed:", e);
            }

            // Notificação interna no sistema
            try {
              await adminClient.from("client_notifications").insert({
                organization_id: org.id,
                title: "Pagamento confirmado! ✅",
                message: `Seu plano ${planSlug} foi ativado com ${totalCredits} créditos.`,
                type: "payment",
                action_url: "/cliente/configuracoes",
              });
            } catch (e) {
              console.error("first_payment notification insert failed:", e);
            }
          }
        } catch (e) {
          console.error("first_payment detection failed:", e);
        }

        return jsonOk({ success: true, event, type: "subscription_renewal", plan: planSlug, credits: totalCredits });
      }

      // {orgId}|credits|{packId} → credit pack purchase
      if (refParts.length >= 3 && refParts[1] === "credits") {
        const packId = refParts[2];
        const packCreditsMap: Record<string, number> = {
          // New unified packs
          "pack-200": 200,
          "pack-500": 500,
          "pack-1000": 1000,
          // Legacy packs
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

      // {orgId}|extra_user| → extra user charge
      if (refParts.length >= 2 && refParts[1] === "extra_user") {
        console.log(`Extra user charge confirmed for org ${org.id}`);
        return jsonOk({ success: true, event, type: "extra_user" });
      }

      // Fallback: legacy payments without structured externalReference
      const creditsAmount = valueToCreditAmount(paymentValue);
      if (creditsAmount <= 0) {
        return jsonOk({ ok: true, credits: 0 });
      }

      const wallet = await getOrCreateWallet(adminClient, org.id);
      if (!wallet) {
        return new Response(JSON.stringify({ error: "Failed to get/create wallet" }), {
          status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
      // 1. Determine credits to reverse
      let creditsToRemove = 0;
      if (refParts.length >= 3 && refParts[1] === "credits") {
        const packCreditsMap: Record<string, number> = { "pack-5000": 5000, "pack-20000": 20000, "pack-50000": 50000 };
        creditsToRemove = packCreditsMap[refParts[2]] || valueToCreditAmount(paymentValue);
      } else if (refParts.length >= 3 && refParts[1] === "sub") {
        const SC: Record<string, number> = { starter: 3000, professional: 15000, enterprise: 40000 };
        const MC: Record<string, number> = { starter: 2000, professional: 10000, enterprise: 30000 };
        const sp = refParts[2] || "none";
        const mp = refParts.length >= 4 ? refParts[3] : "none";
        creditsToRemove = (sp !== "none" ? (SC[sp] || 0) : 0) + (mp !== "none" ? (MC[mp] || 0) : 0);
        if (creditsToRemove === 0) creditsToRemove = valueToCreditAmount(paymentValue);
      } else {
        creditsToRemove = valueToCreditAmount(paymentValue);
      }

      // 2. Reverse credits from wallet
      let newBalance = 0;
      const wallet = await getOrCreateWallet(adminClient, org.id);
      if (wallet) {
        newBalance = Math.max(0, wallet.balance - creditsToRemove);
        await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);
        await adminClient.from("credit_transactions").insert({
          organization_id: org.id,
          type: "refund",
          amount: -creditsToRemove,
          balance_after: newBalance,
          description: `Estorno Asaas — R$ ${paymentValue.toFixed(2)} (−${creditsToRemove} créditos)`,
          metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, event },
        });
        console.log(`Refunded ${creditsToRemove} from org ${org.id}. Balance: ${newBalance}`);
      }

      // 3. Notify all org members (NEW)
      await notifyOrgMembers(adminClient, org.id, {
        title: "💸 Estorno processado",
        message: `Um estorno de R$ ${paymentValue.toFixed(2)} foi confirmado. ${creditsToRemove > 0 ? `${creditsToRemove} créditos foram removidos.` : ""}`,
        type: "warning",
      });

      // 4. Update payment status to "refunded" (NEW)
      await updatePaymentStatus(adminClient, externalRef, refParts, payment.id, "refunded");

      // 5. For client_payment: insert negative finance_revenue (NEW)
      if (externalRef.startsWith("client_payment|")) {
        const cpOrgId = refParts[1];
        const cpContractId = refParts[2];
        const cpMonth = refParts[3];
        if (cpOrgId && cpMonth) {
          const cpPayment = await adminClient
            .from("client_payments")
            .select("franchisee_share")
            .eq("organization_id", cpOrgId)
            .eq("contract_id", cpContractId)
            .eq("month", cpMonth)
            .maybeSingle();

          if (cpPayment?.data) {
            await adminClient.from("finance_revenues").insert({
              organization_id: cpOrgId,
              description: `Estorno pagamento cliente — Ref. ${cpMonth}`,
              amount: -(cpPayment.data.franchisee_share || paymentValue),
              date: new Date().toISOString().split("T")[0],
              category: "cliente",
              status: "refunded",
              payment_method: "asaas",
            });
          }
        }
      }

      return jsonOk({ success: true, event, credits_removed: creditsToRemove, new_balance: newBalance });
    }

    // ── PAYMENT_REFUND_IN_PROGRESS (NEW) ──
    if (event === "PAYMENT_REFUND_IN_PROGRESS") {
      await notifyOrgMembers(adminClient, org.id, {
        title: "🔄 Estorno em andamento",
        message: `O estorno de R$ ${paymentValue.toFixed(2)} está sendo processado pelo Asaas.`,
        type: "info",
      });

      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "info",
        amount: 0,
        balance_after: 0,
        description: `Estorno em processamento — R$ ${paymentValue.toFixed(2)}`,
        metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, event },
      });

      console.log(`Refund in progress notified for org ${org.id}`);
      return jsonOk({ success: true, event });
    }

    // ── PAYMENT_OVERDUE ──
    if (event === "PAYMENT_OVERDUE") {
      await notifyOrgMembers(adminClient, org.id, {
        title: "⚠️ Pagamento em atraso",
        message: `Sua mensalidade de R$ ${paymentValue.toFixed(2)} está vencida. Regularize para manter o acesso à plataforma.`,
        type: "warning",
      });

      // Bloquear workspace após 2 dias de atraso
      const dueDateRaw = payment.dueDate ? new Date(payment.dueDate) : new Date();
      const diffDays = Math.floor((Date.now() - dueDateRaw.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 2) {
        await adminClient
          .from("organizations")
          .update({
            payment_blocked: true,
            payment_blocked_at: new Date().toISOString(),
            payment_blocked_reason: "overdue_2_days",
          })
          .eq("id", org.id);

        // Buscar e-mail do admin para enviar aviso de bloqueio
        try {
          const { data: members } = await adminClient.rpc("get_org_members_with_email", { _org_id: org.id });
          const target = (members || []).find((m: any) => m.role === "cliente_admin") || (members || [])[0];
          if (target?.email) {
            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-billing-reminder`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "blocked",
                org_id: org.id,
                amount: paymentValue,
                user_email: target.email,
                user_name: target.full_name || "",
              }),
            });
          }
        } catch (e) {
          console.error("Failed to send blocked email", e);
        }

        console.log(`Workspace blocked for org ${org.id} — ${diffDays} days overdue`);
      }

      // Update system fee if applicable
      if (externalRef.startsWith("system_fee|") && payment.id) {
        await adminClient
          .from("franchisee_system_payments")
          .update({ status: "overdue", updated_at: new Date().toISOString() })
          .eq("asaas_payment_id", payment.id);
      }

      console.log(`Overdue notification sent for org ${org.id}`);
      return jsonOk({ success: true, event });
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

    // ── PAYMENT_SPLIT_DIVERGENCE_BLOCK ──
    if (event === "PAYMENT_SPLIT_DIVERGENCE_BLOCK") {
      await notifyOrgMembers(adminClient, org.id, {
        title: "⚠️ Split bloqueado",
        message: `O split de pagamento R$ ${paymentValue.toFixed(2)} foi bloqueado por divergência. Verifique as configurações de conta.`,
        type: "warning",
      });
      console.log(`Split divergence block notified for org ${org.id}`);
      return jsonOk({ success: true, event });
    }

    // ── PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED ──
    if (event === "PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED") {
      await notifyOrgMembers(adminClient, org.id, {
        title: "✅ Split desbloqueado",
        message: `O bloqueio de split de R$ ${paymentValue.toFixed(2)} foi resolvido.`,
        type: "info",
      });
      console.log(`Split divergence resolved for org ${org.id}`);
      return jsonOk({ success: true, event });
    }

    // ── PAYMENT_UPDATED ──
    if (event === "PAYMENT_UPDATED") {
      const asaasStatus = payment.status;
      // Map Asaas status to local status
      const statusMap: Record<string, string> = {
        PENDING: "pending",
        RECEIVED: "paid",
        CONFIRMED: "paid",
        OVERDUE: "overdue",
        REFUNDED: "refunded",
        RECEIVED_IN_CASH: "paid",
        REFUND_REQUESTED: "refund_requested",
        REFUND_IN_PROGRESS: "refund_in_progress",
        CHARGEBACK_REQUESTED: "chargeback",
        CHARGEBACK_DISPUTE: "chargeback",
        AWAITING_CHARGEBACK_REVERSAL: "chargeback",
        DUNNING_REQUESTED: "overdue",
        DUNNING_RECEIVED: "paid",
        AWAITING_RISK_ANALYSIS: "pending",
      };

      const mappedStatus = statusMap[asaasStatus];
      if (mappedStatus) {
        await updatePaymentStatus(adminClient, externalRef, refParts, payment.id, mappedStatus);
        console.log(`Payment ${payment.id} updated: ${asaasStatus} → ${mappedStatus}`);
      } else {
        console.log(`Payment ${payment.id} updated with unmapped status: ${asaasStatus}`);
      }

      return jsonOk({ success: true, event, asaas_status: asaasStatus, mapped_status: mappedStatus || "unmapped" });
    }

    // ── PAYMENT_CREDIT_CARD_CAPTURE_REFUSED ──
    if (event === "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED") {
      await notifyOrgMembers(adminClient, org.id, {
        title: "❌ Cobrança recusada",
        message: `A cobrança de R$ ${paymentValue.toFixed(2)} no cartão de crédito foi recusada. Atualize o método de pagamento.`,
        type: "warning",
      });

      await updatePaymentStatus(adminClient, externalRef, refParts, payment.id, "refused");

      await adminClient.from("credit_transactions").insert({
        organization_id: org.id,
        type: "info",
        amount: 0,
        balance_after: 0,
        description: `Cartão recusado — R$ ${paymentValue.toFixed(2)}`,
        metadata: { source: "asaas_webhook", asaas_payment_id: payment.id, event },
      });

      console.log(`Credit card capture refused for org ${org.id}, payment ${payment.id}`);
      return jsonOk({ success: true, event });
    }

    return jsonOk({ ok: true });
  } catch (err: unknown) {
    console.error("asaas-webhook error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

// ── Helper functions ──

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

// deno-lint-ignore no-explicit-any
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

/** Notify all members of an organization */
// deno-lint-ignore no-explicit-any
async function notifyOrgMembers(
  adminClient: any,
  orgId: string,
  notification: { title: string; message: string; type: string }
) {
  const { data: members } = await adminClient
    .from("organization_memberships")
    .select("user_id")
    .eq("organization_id", orgId);

  if (members && members.length > 0) {
    const notifications = members.map((m: { user_id: string }) => ({
      organization_id: orgId,
      user_id: m.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
    }));
    await adminClient.from("client_notifications").insert(notifications);
  }
  return members?.length || 0;
}

/** Update payment status based on externalReference routing */
// deno-lint-ignore no-explicit-any
async function updatePaymentStatus(
  adminClient: any,
  externalRef: string,
  refParts: string[],
  asaasPaymentId: string,
  newStatus: string
) {
  if (externalRef.startsWith("system_fee|") && asaasPaymentId) {
    await adminClient
      .from("franchisee_system_payments")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("asaas_payment_id", asaasPaymentId);
  } else if (externalRef.startsWith("client_payment|")) {
    const cpOrgId = refParts[1];
    const cpContractId = refParts[2];
    const cpMonth = refParts[3];
    if (cpOrgId && cpContractId && cpMonth) {
      await adminClient
        .from("client_payments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("organization_id", cpOrgId)
        .eq("contract_id", cpContractId)
        .eq("month", cpMonth);
    }
  } else if (externalRef.startsWith("franchisee_charge|") && asaasPaymentId) {
    await adminClient
      .from("franchisee_charges")
      .update({ status: newStatus })
      .eq("asaas_payment_id", asaasPaymentId);
  }
}
