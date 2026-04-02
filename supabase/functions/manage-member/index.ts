import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const responseHeaders = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("[manage-member] Request received", { hasAuth: !!authHeader, method: req.method });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Parse body early so we can handle accept_invitation before auth
    const body = await req.json();
    const { user_id, organization_id, action = "update", role, full_name, job_title } = body;

    const admin = createClient(supabaseUrl, serviceKey);

    // ── accept_invitation: NO auth required — uses service role only ──
    if (action === "accept_invitation") {
      const email = body.email?.toLowerCase();
      if (!email) {
        return new Response(JSON.stringify({ error: "email required" }), { status: 200, headers: responseHeaders });
      }
      console.log("[manage-member] Accepting invitation for", email);
      const { error: upErr } = await admin
        .from("pending_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("email", email)
        .is("accepted_at", null);
      if (upErr) {
        console.warn("[manage-member] Error updating pending_invitations:", upErr.message);
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: responseHeaders });
    }

    // ── All other actions require auth ──
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Sessão expirada. Faça login novamente." }), {
        status: 200,
        headers: responseHeaders,
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authErr } = await userClient.auth.getUser();

    console.log("[manage-member] Auth result", {
      callerId: caller?.id ?? null,
      authErr: authErr?.message ?? null,
    });

    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        status: 200,
        headers: responseHeaders,
      });
    }

    const callerId = caller.id;
    console.log("[manage-member] Payload", { callerId, user_id, organization_id, action, hasRole: !!role });
      if (upErr) {
        console.warn("[manage-member] Error updating pending_invitations:", upErr.message);
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: responseHeaders });
    }

    if (!user_id || !organization_id) {
      return new Response(JSON.stringify({ error: "user_id and organization_id required" }), {
        status: 200,
        headers: responseHeaders,
      });
    }

    const { data: isMember } = await admin.rpc("is_member_or_parent_of_org", {
      _user_id: callerId,
      _org_id: organization_id,
    });

    if (!isMember) {
      return new Response(JSON.stringify({ error: "Sem permissão para gerenciar esta organização" }), {
        status: 200,
        headers: responseHeaders,
      });
    }

    // Determine portal context from org type
    const { data: orgData } = await admin
      .from("organizations")
      .select("type")
      .eq("id", organization_id)
      .single();
    const portal = orgData?.type === "cliente" ? "saas" : "franchise";

    const { data: callerRole } = await admin.rpc("get_user_role", { _user_id: callerId, _portal: portal });
    const adminRoles = ["super_admin", "admin", "franqueado", "cliente_admin"];

    if (!adminRoles.includes(callerRole)) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem gerenciar membros" }), {
        status: 200,
        headers: responseHeaders,
      });
    }

    if (action === "remove" && user_id === callerId) {
      return new Response(JSON.stringify({ error: "Você não pode remover a si mesmo" }), {
        status: 200,
        headers: responseHeaders,
      });
    }

    if (action === "remove") {
      // Clean up team memberships for this org
      const { data: orgTeams } = await admin
        .from("org_teams")
        .select("id")
        .eq("organization_id", organization_id);

      const orgTeamIds = (orgTeams ?? []).map((team: { id: string }) => team.id);

      if (orgTeamIds.length > 0) {
        await admin
          .from("org_team_memberships")
          .delete()
          .eq("user_id", user_id)
          .in("team_id", orgTeamIds);
      }

      // Remove org membership
      await admin
        .from("organization_memberships")
        .delete()
        .eq("user_id", user_id)
        .eq("organization_id", organization_id);

      // Clean up pending_invitations for this user in this org
      try {
        const { data: userData } = await admin.auth.admin.getUserById(user_id);
        if (userData?.user?.email) {
          await admin
            .from("pending_invitations")
            .delete()
            .eq("email", userData.user.email.toLowerCase())
            .eq("organization_id", organization_id);
          console.log("[manage-member] Cleaned pending_invitations for", userData.user.email);
        }
      } catch (cleanupErr) {
        console.warn("[manage-member] Failed to clean pending_invitations:", cleanupErr);
      }

      // Check if user has other memberships
      const { count: otherMemberships } = await admin
        .from("organization_memberships")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user_id);

      if ((otherMemberships ?? 0) === 0) {
        await admin.from("user_roles").delete().eq("user_id", user_id);

        try {
          await admin.auth.admin.deleteUser(user_id);
          console.log(`[manage-member] Deleted orphan auth user ${user_id}`);
        } catch (deleteError) {
          console.warn(`[manage-member] Failed to delete auth user ${user_id}:`, deleteError);
        }
      }

      console.log("[manage-member] Remove successful", { user_id, organization_id });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: responseHeaders });
    }

    // ── action === "update" ──
    const updates: Promise<unknown>[] = [];

    if (full_name !== undefined || job_title !== undefined) {
      const profileUpdate: Record<string, unknown> = {};
      if (full_name !== undefined) profileUpdate.full_name = full_name;
      if (job_title !== undefined) profileUpdate.job_title = job_title;
      updates.push(admin.from("profiles").update(profileUpdate).eq("id", user_id));
    }

    if (role) {
      if (role !== "super_admin") {
        const { data: targetRole } = await admin.rpc("get_user_role", { _user_id: user_id, _portal: portal });
        if (targetRole === "super_admin") {
          const { data: orgMembers } = await admin
            .from("organization_memberships")
            .select("user_id")
            .eq("organization_id", organization_id);

          const memberIds = (orgMembers ?? []).map((member: { user_id: string }) => member.user_id);

          const { data: superAdminRoles } = await admin
            .from("user_roles")
            .select("user_id")
            .eq("role", "super_admin")
            .in("user_id", memberIds);

          const otherSuperAdmins = (superAdminRoles ?? []).filter(
            (entry: { user_id: string }) => entry.user_id !== user_id,
          );

          if (otherSuperAdmins.length === 0) {
            return new Response(JSON.stringify({ error: "Não é possível rebaixar o último Super Admin desta organização" }), {
              status: 200,
              headers: responseHeaders,
            });
          }
        }
      }

      const { data: existing } = await admin
        .from("user_roles")
        .select("id")
        .eq("user_id", user_id)
        .maybeSingle();

      if (existing) {
        updates.push(admin.from("user_roles").update({ role }).eq("user_id", user_id));
      } else {
        updates.push(admin.from("user_roles").insert({ user_id, role }));
      }
    }

    await Promise.all(updates);
    console.log("[manage-member] Update successful", { user_id, organization_id });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: responseHeaders });
  } catch (err: unknown) {
    console.error("[manage-member] Unhandled error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 200,
      headers: responseHeaders,
    });
  }
});
