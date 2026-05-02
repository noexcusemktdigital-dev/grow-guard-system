// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "../_shared/asaas-fetch.ts";
import { fetchPixQrCode } from "../_shared/asaas-customer.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { assertOrgMember, authErrorResponse } from '../_shared/auth.ts';

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";
const SYSTEM_FEE = 250;

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'asaas-charge-franchisee');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    log.info("Request received");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Auth via getUser
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[asaas-charge-franchisee] No auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[asaas-charge-franchisee] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { organization_id, month, billing_type } = await req.json();

    if (!organization_id || !month) {
      return new Response(JSON.stringify({ error: "organization_id and month are required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // BOLA/IDOR guard: ensure caller belongs to the target org
    await assertOrgMember(adminClient, user.id, organization_id);

    const billingType = billing_type || "BOLETO";

    // Get all franchisees for this organization
    const { data: franchisees, error: franchError } = await adminClient
      .from("finance_franchisees")
      .select("id, name, franchisee_org_id, royalty_percentage, marketing_fee")
      .eq("organization_id", organization_id);

    if (franchError) throw franchError;
    if (!franchisees || franchisees.length === 0) {
      return new Response(JSON.stringify({ error: "No franchisees found" }), {
        status: 404,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const results: Record<string, unknown>[] = [];
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthStr);

    // Due date: 10th of the next month
    const dueMonth = monthNum === 12 ? 1 : monthNum + 1;
    const dueYear = monthNum === 12 ? year + 1 : year;
    const dueDate = `${dueYear}-${String(dueMonth).padStart(2, "0")}-10`;

    for (const franchisee of franchisees) {
      const franchiseeOrgId = franchisee.franchisee_org_id;
      if (!franchiseeOrgId) {
        results.push({ franchisee: franchisee.name, status: "skipped", reason: "No linked organization" });
        continue;
      }

      // Check if charge already exists for this month
      const { data: existingCharge } = await adminClient
        .from("franchisee_charges")
        .select("id")
        .eq("organization_id", organization_id)
        .eq("franchisee_org_id", franchiseeOrgId)
        .eq("month", month)
        .maybeSingle();

      if (existingCharge) {
        results.push({ franchisee: franchisee.name, status: "skipped", reason: "Already charged this month" });
        continue;
      }

      // Get franchisee org to check asaas_customer_id
      const { data: franchiseeOrg } = await adminClient
        .from("organizations")
        .select("id, name, asaas_customer_id")
        .eq("id", franchiseeOrgId)
        .single();

      if (!franchiseeOrg?.asaas_customer_id) {
        results.push({ franchisee: franchisee.name, status: "skipped", reason: "No Asaas customer linked" });
        continue;
      }

      // Calculate revenue for the month from finance_revenues
      const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
      const endDate = `${dueYear}-${String(dueMonth).padStart(2, "0")}-01`;

      const { data: revenues } = await adminClient
        .from("finance_revenues")
        .select("amount")
        .eq("organization_id", franchiseeOrgId)
        .gte("date", startDate)
        .lt("date", endDate);

      const totalRevenue = (revenues || []).reduce((sum: number, r: { amount: number }) => sum + (Number(r.amount) || 0), 0);
      const royaltyPct = Number(franchisee.royalty_percentage) || 1;
      const royaltyAmount = Math.round(totalRevenue * (royaltyPct / 100) * 100) / 100;
      const totalAmount = royaltyAmount + SYSTEM_FEE;

      if (totalAmount <= 0) {
        results.push({ franchisee: franchisee.name, status: "skipped", reason: "Zero amount" });
        continue;
      }

      // Create charge in Asaas
      const monthLabel = `${String(monthNum).padStart(2, "0")}/${year}`;
      const chargeRes = await asaasFetch(`${ASAAS_BASE}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: asaasApiKey,
          "User-Agent": "NOE-Platform",
        },
        body: JSON.stringify({
          customer: franchiseeOrg.asaas_customer_id,
          billingType,
          value: totalAmount,
          dueDate,
          description: `Royalties + Sistema — Ref. ${monthLabel} — ${franchiseeOrg.name}`,
          externalReference: `franchisee_charge|${organization_id}|${franchiseeOrgId}|${month}`,
        }),
      });

      const chargeData = await chargeRes.json();
      if (!chargeRes.ok) {
        console.error(`Asaas charge failed for ${franchisee.name}:`, chargeData);
        results.push({ franchisee: franchisee.name, status: "error", reason: chargeData });
        continue;
      }

      // Fetch PIX QR code if billing type is PIX
      let pixQrCode: string | null = null;
      let pixCopyPaste: string | null = null;

      if (billingType === "PIX") {
        const pixData = await fetchPixQrCode(asaasApiKey, chargeData.id);
        pixQrCode = pixData.encodedImage;
        pixCopyPaste = pixData.payload;
      }

      // Insert charge record
      await adminClient.from("franchisee_charges").insert({
        organization_id,
        franchisee_org_id: franchiseeOrgId,
        month,
        royalty_amount: royaltyAmount,
        system_fee: SYSTEM_FEE,
        total_amount: totalAmount,
        asaas_payment_id: chargeData.id,
        status: "pending",
      });

      results.push({
        franchisee: franchisee.name,
        status: "created",
        asaas_payment_id: chargeData.id,
        royalty: royaltyAmount,
        system_fee: SYSTEM_FEE,
        total: totalAmount,
        pix_qr_code: pixQrCode,
        pix_copy_paste: pixCopyPaste,
      });

      console.log(`Charge created for ${franchisee.name}: R$${totalAmount} (Asaas: ${chargeData.id})`);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    log.error("asaas-charge-franchisee error", { error: String(err) });
    return authErrorResponse(err, getCorsHeaders(req));
  }
});
