import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: getCorsHeaders(req) });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get caller identity
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: getCorsHeaders(req) });

    const { user_id, organization_id, action = "update", role, full_name, job_title } = await req.json();
    if (!user_id || !organization_id) return new Response(JSON.stringify({ error: "user_id and organization_id required" }), { status: 400, headers: getCorsHeaders(req) });

    const admin = createClient(supabaseUrl, serviceKey);

    // Validate caller is member or parent admin
    const { data: isMember } = await admin.rpc("is_member_or_parent_of_org", { _user_id: caller.id, _org_id: organization_id });
    if (!isMember) return new Response(JSON.stringify({ error: "Sem permissão para gerenciar esta organização" }), { status: 403, headers: getCorsHeaders(req) });

    // Validate caller has admin role
    const { data: callerRole } = await admin.rpc("get_user_role", { _user_id: caller.id });
    const adminRoles = ["super_admin", "admin", "franqueado", "cliente_admin"];
    if (!adminRoles.includes(callerRole)) return new Response(JSON.stringify({ error: "Apenas administradores podem gerenciar membros" }), { status: 403, headers: getCorsHeaders(req) });

    // Cannot modify self on remove
    if (action === "remove" && user_id === caller.id) {
      return new Response(JSON.stringify({ error: "Você não pode remover a si mesmo" }), { status: 400, headers: getCorsHeaders(req) });
    }

    if (action === "remove") {
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

      return new Response(JSON.stringify({ success: true }), { headers: getCorsHeaders(req) });
    }

    // action === "update"
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
          // Count super_admins that are members of THIS organization
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
            return new Response(JSON.stringify({ error: "Não é possível rebaixar o último Super Admin desta organização" }), { status: 400, headers: getCorsHeaders(req) });
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
    return new Response(JSON.stringify({ success: true }), { headers: getCorsHeaders(req) });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: getCorsHeaders(req) });
  }
});
