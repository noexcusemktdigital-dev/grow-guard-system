// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { parseOrThrow, validationErrorResponse, UUID, NonEmptyString } from "../_shared/schemas.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// provision-unit uses unit_name/parent_org_id — permissive, extra fields allowed
const ProvisionUnitBodySchema = z.object({
  unit_name: NonEmptyString.max(200),
  parent_org_id: UUID,
  city: z.string().max(200).optional(),
  state: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  manager_name: z.string().max(200).optional(),
  manager_email: z.string().email().optional(),
  royalty_percent: z.number().min(0).max(100).optional(),
  system_fee: z.number().nonnegative().optional(),
  saas_commission_percent: z.number().min(0).max(100).optional(),
});

function generateReferralCode(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'provision-unit');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate caller auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Auth failed:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;
    console.log("Authenticated user:", callerId);

    let parsedBody: z.infer<typeof ProvisionUnitBodySchema>;
    try {
      const raw = await req.json();
      parsedBody = parseOrThrow(ProvisionUnitBodySchema, raw);
    } catch (err) {
      const vr = validationErrorResponse(err, { ...getCorsHeaders(req), "Content-Type": "application/json" });
      if (vr) return vr;
      return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const {
      unit_name,
      city,
      state,
      address,
      phone,
      manager_name,
      manager_email,
      royalty_percent,
      system_fee,
      parent_org_id,
      saas_commission_percent,
    } = parsedBody;

    // Verify caller is member of the parent org
    const { data: isMember } = await adminClient.rpc("is_member_of_org", {
      _user_id: callerId,
      _org_id: parent_org_id,
    });
    if (!isMember) {
      console.error("User not member of org:", parent_org_id);
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    console.log("Permission verified for org:", parent_org_id);

    // Generate unique referral code
    let referralCode = generateReferralCode(unit_name);
    const { data: existingRef } = await adminClient
      .from("organizations")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (existingRef) {
      referralCode = referralCode + "-" + Math.random().toString(36).slice(2, 6);
    }

    // 1. Create organization of type franqueado
    const { data: newOrg, error: orgErr } = await adminClient
      .from("organizations")
      .insert({
        name: unit_name,
        type: "franqueado",
        parent_org_id: parent_org_id,
        referral_code: referralCode,
        saas_commission_percent: saas_commission_percent ?? 20,
      })
      .select()
      .single();
    if (orgErr) {
      console.error("Org creation failed:", orgErr);
      throw new Error("Erro ao criar organização: " + orgErr.message);
    }
    const orgId = newOrg.id;
    console.log("Org created:", orgId);

    // 1b. Create referral_discounts config (5% default)
    await adminClient.from("referral_discounts").insert({
      organization_id: orgId,
      discount_percent: 5,
      is_active: true,
      uses_count: 0,
    });

    // 2. Create the unit record linked to this org
    const { data: unitData, error: unitErr } = await adminClient
      .from("units")
      .insert({
        name: unit_name,
        city: city || null,
        state: state || null,
        address: address || null,
        phone: phone || null,
        manager_name: manager_name || null,
        email: manager_email || null,
        organization_id: parent_org_id,
        unit_org_id: orgId,
        status: "active",
      })
      .select()
      .single();
    if (unitErr) {
      console.error("Unit creation failed:", unitErr);
      throw new Error("Erro ao criar unidade: " + unitErr.message);
    }
    console.log("Unit created:", unitData.id);

    // 3. Create franchisee system payment config if system_fee provided
    if (system_fee && system_fee > 0) {
      await adminClient.from("franchisee_system_payments").insert({
        organization_id: orgId,
        month: new Date().toISOString().slice(0, 7),
        amount: system_fee,
        status: "pending",
      });
    }

    // 4. Create onboarding unit automatically
    const startDate = new Date().toISOString().slice(0, 10);
    const targetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data: onboardingUnit, error: obErr } = await adminClient
      .from("onboarding_units")
      .insert({
        name: unit_name,
        organization_id: parent_org_id,
        unit_org_id: orgId,
        start_date: startDate,
        target_date: targetDate,
        responsible: manager_name || null,
        status: "in_progress",
      })
      .select()
      .single();
    if (obErr) console.error("onboarding_units insert error:", obErr);

    // 5. Populate default onboarding checklist
    if (onboardingUnit) {
      const defaultChecklist = [
        { category: "Pré-Implantação", title: "Assinatura do contrato", sort_order: 1 },
        { category: "Pré-Implantação", title: "Pagamento da taxa", sort_order: 2 },
        { category: "Pré-Implantação", title: "Acesso ao sistema liberado", sort_order: 3 },
        { category: "Pré-Implantação", title: "Acesso Academy liberado", sort_order: 4 },
        { category: "Estruturação", title: "Configuração comercial", sort_order: 5 },
        { category: "Estruturação", title: "Definição de metas", sort_order: 6 },
        { category: "Estruturação", title: "Treinamento inicial", sort_order: 7 },
        { category: "Estruturação", title: "Apresentação dos produtos", sort_order: 8 },
        { category: "Primeiros Movimentos", title: "Primeiro lead gerado", sort_order: 9 },
        { category: "Primeiros Movimentos", title: "Primeira proposta enviada", sort_order: 10 },
        { category: "Primeiros Movimentos", title: "Primeiro contrato fechado", sort_order: 11 },
        { category: "Primeiros Movimentos", title: "Primeira campanha ativa", sort_order: 12 },
        { category: "Consolidação", title: "Pipeline organizado", sort_order: 13 },
        { category: "Consolidação", title: "Metas ativas", sort_order: 14 },
        { category: "Consolidação", title: "Primeira DRE analisada", sort_order: 15 },
        { category: "Consolidação", title: "Ajustes estratégicos", sort_order: 16 },
      ].map((item) => ({
        ...item,
        onboarding_unit_id: onboardingUnit.id,
        organization_id: parent_org_id,
        is_completed: false,
      }));

      const { error: clErr } = await adminClient.from("onboarding_checklist").insert(defaultChecklist);
      if (clErr) console.error("onboarding_checklist insert error:", clErr);
    }

    console.log(`Unit provisioned: ${unit_name} -> org ${orgId}, referral=${referralCode}`);

    return new Response(
      JSON.stringify({
        success: true,
        unit_id: unitData.id,
        organization_id: orgId,
        referral_code: referralCode,
      }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("provision-unit error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
