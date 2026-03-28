import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    // Validate caller
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !user) throw new Error("Não autorizado");

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
      _user_id: user.id,
      _org_id: unit.organization_id,
    });
    if (!isMember) throw new Error("Sem permissão para excluir esta unidade");

    const unitOrgId = unit.unit_org_id;

    // Cascade delete related data
    if (unitOrgId) {
      // Delete onboarding checklist items
      await admin.from("onboarding_checklist").delete().eq("organization_id", unitOrgId);
      // Delete onboarding unit record
      await admin.from("onboarding_units").delete().eq("organization_id", unitOrgId);
      // Delete franchisee system payments
      await admin.from("franchisee_system_payments").delete().eq("unit_org_id", unitOrgId);
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
        const userIds = members.map((m) => m.user_id);
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
