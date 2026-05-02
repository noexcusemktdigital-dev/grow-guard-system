// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'delete-unit');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Não autorizado");
    }

    // Validate caller
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await callerClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) throw new Error("Não autorizado");
    const userId = claimsData.claims.sub as string;

    const { unit_id } = await req.json();
    if (!unit_id) throw new Error("unit_id é obrigatório");

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Get unit info
    const { data: unit, error: unitErr } = await admin
      .from("units")
      .select("id, unit_org_id, organization_id")
      .eq("id", unit_id)
      .single();
    if (unitErr || !unit) throw new Error("Unidade não encontrada");

    // Verify caller is member of the parent org
    const { data: isMember } = await admin.rpc("is_member_of_org", {
      _user_id: userId,
      _org_id: unit.organization_id,
    });
    if (!isMember) throw new Error("Sem permissão para excluir esta unidade");

    const unitOrgId = unit.unit_org_id;

    // Cascade delete related data
    if (unitOrgId) {
      // Delete onboarding checklist items linked to onboarding_units of this unit
      const { data: obUnits } = await admin
        .from("onboarding_units")
        .select("id")
        .eq("unit_org_id", unitOrgId);

      if (obUnits && obUnits.length > 0) {
        const obIds = obUnits.map((u: any) => u.id);
        await admin.from("onboarding_checklist").delete().in("onboarding_unit_id", obIds);
      }

      // Delete onboarding unit records
      await admin.from("onboarding_units").delete().eq("unit_org_id", unitOrgId);

      // Delete franchisee system payments (uses organization_id column)
      await admin.from("franchisee_system_payments").delete().eq("organization_id", unitOrgId);

      // Delete referral discounts
      await admin.from("referral_discounts").delete().eq("organization_id", unitOrgId);

      // Get members to clean up user_roles
      const { data: members } = await admin
        .from("organization_memberships")
        .select("user_id")
        .eq("organization_id", unitOrgId);

      // Delete memberships
      await admin.from("organization_memberships").delete().eq("organization_id", unitOrgId);

      // Delete user_roles for those members
      if (members && members.length > 0) {
        const userIds = members.map((m: any) => m.user_id);
        await admin.from("user_roles").delete().in("user_id", userIds);
      }

      // Delete calendar events for this unit
      await admin.from("calendar_events").delete().eq("unit_id", unit_id);
    }

    // Delete the unit row
    const { error: delUnitErr } = await admin.from("units").delete().eq("id", unit_id);
    if (delUnitErr) throw delUnitErr;

    // Delete the unit's organization
    if (unitOrgId) {
      await admin.from("organizations").delete().eq("id", unitOrgId);
    }

    console.log(`Unit ${unit_id} deleted successfully`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("delete-unit error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
