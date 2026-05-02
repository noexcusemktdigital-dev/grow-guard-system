// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { parseOrThrow, validationErrorResponse, MemberSchemas } from '../_shared/schemas.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'update-member');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const corsHeaders = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("[update-member] Request received, auth present:", !!authHeader);

    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[update-member] Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: "Sessão expirada. Faça login novamente." }), { status: 200, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate caller via anon client + getUser
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller }, error: authErr } = await userClient.auth.getUser();
    
    console.log("[update-member] Auth result:", caller ? `user=${caller.id}` : "no user", authErr ? `err=${authErr.message}` : "no error");

    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), { status: 200, headers: corsHeaders });
    }

    const rawBody = await req.json();
    const { user_id, organization_id, action = "update", role, full_name, job_title } = parseOrThrow(MemberSchemas.Update, rawBody);
    console.log("[update-member] Action:", action, "target_user:", user_id, "org:", organization_id, "caller:", caller.id);

    if (!user_id || !organization_id) {
      return new Response(JSON.stringify({ error: "user_id and organization_id required" }), { status: 200, headers: corsHeaders });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Validate caller is member or parent admin
    const { data: isMember } = await admin.rpc("is_member_or_parent_of_org", { _user_id: caller.id, _org_id: organization_id });
    if (!isMember) {
      console.log("[update-member] Caller not member of org");
      return new Response(JSON.stringify({ error: "Sem permissão para gerenciar esta organização" }), { status: 200, headers: corsHeaders });
    }

    // Validate caller has admin role
    const { data: callerRole } = await admin.rpc("get_user_role", { _user_id: caller.id });
    const adminRoles = ["super_admin", "admin", "franqueado", "cliente_admin"];
    if (!adminRoles.includes(callerRole)) {
      console.log("[update-member] Caller role not admin:", callerRole);
      return new Response(JSON.stringify({ error: "Apenas administradores podem gerenciar membros" }), { status: 200, headers: corsHeaders });
    }

    // Cannot modify self on remove
    if (action === "remove" && user_id === caller.id) {
      return new Response(JSON.stringify({ error: "Você não pode remover a si mesmo" }), { status: 200, headers: corsHeaders });
    }

    if (action === "remove") {
      console.log("[update-member] Removing user", user_id, "from org", organization_id);

      // Get teams belonging to this organization so we can clean up team memberships
      const { data: orgTeams } = await admin
        .from("org_teams")
        .select("id")
        .eq("organization_id", organization_id);
      const orgTeamIds = (orgTeams ?? []).map((t: { id: string }) => t.id);

      // Delete team memberships for this org's teams only
      if (orgTeamIds.length > 0) {
        await admin
          .from("org_team_memberships")
          .delete()
          .eq("user_id", user_id)
          .in("team_id", orgTeamIds);
      }

      // Remove membership from this org
      await admin.from("organization_memberships").delete().eq("user_id", user_id).eq("organization_id", organization_id);

      // Only delete user_roles if user has NO other organization memberships
      const { count: otherMemberships } = await admin
        .from("organization_memberships")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user_id);

      if ((otherMemberships ?? 0) === 0) {
        await admin.from("user_roles").delete().eq("user_id", user_id);
        // Clean up auth user completely — no remaining org memberships
        try {
          await admin.auth.admin.deleteUser(user_id);
          console.log(`[update-member] Deleted orphan auth user ${user_id}`);
        } catch (delErr) {
          console.warn(`[update-member] Failed to delete auth user ${user_id}:`, delErr);
        }
      }

      console.log("[update-member] Remove successful");
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // action === "update"
    console.log("[update-member] Updating user", user_id);
    const updates: Promise<unknown>[] = [];

    if (full_name !== undefined || job_title !== undefined) {
      const profileUpdate: Record<string, unknown> = {};
      if (full_name !== undefined) profileUpdate.full_name = full_name;
      if (job_title !== undefined) profileUpdate.job_title = job_title;
      updates.push(admin.from("profiles").update(profileUpdate).eq("id", user_id));
    }

    if (role) {
      // Prevent removing the last super_admin — scoped to this org
      if (role !== "super_admin") {
        const { data: targetRole } = await admin.rpc("get_user_role", { _user_id: user_id });
        if (targetRole === "super_admin") {
          const { data: orgMembers } = await admin
            .from("organization_memberships")
            .select("user_id")
            .eq("organization_id", organization_id);
          const memberIds = (orgMembers ?? []).map((m: { user_id: string }) => m.user_id);

          const { data: superAdminRoles } = await admin
            .from("user_roles")
            .select("user_id")
            .eq("role", "super_admin")
            .in("user_id", memberIds);

          const otherSuperAdmins = (superAdminRoles ?? []).filter((r: { user_id: string }) => r.user_id !== user_id);
          if (otherSuperAdmins.length === 0) {
            return new Response(JSON.stringify({ error: "Não é possível rebaixar o último Super Admin desta organização" }), { status: 200, headers: corsHeaders });
          }
        }
      }
      // Upsert role
      const { data: existing } = await admin.from("user_roles").select("id").eq("user_id", user_id).maybeSingle();
      if (existing) {
        updates.push(admin.from("user_roles").update({ role }).eq("user_id", user_id));
      } else {
        updates.push(admin.from("user_roles").insert({ user_id, role }));
      }
    }

    await Promise.all(updates);
    console.log("[update-member] Update successful");
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err: unknown) {
    const valResp = validationErrorResponse(err, getCorsHeaders(req));
    if (valResp) return valResp;
    console.error("[update-member] Unhandled error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 200, headers: corsHeaders });
  }
});
