import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get caller identity
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { user_id, organization_id, action = "update", role, full_name, job_title } = await req.json();
    if (!user_id || !organization_id) return new Response(JSON.stringify({ error: "user_id and organization_id required" }), { status: 400, headers: corsHeaders });

    const admin = createClient(supabaseUrl, serviceKey);

    // Validate caller is member or parent admin
    const { data: isMember } = await admin.rpc("is_member_or_parent_of_org", { _user_id: caller.id, _org_id: organization_id });
    if (!isMember) return new Response(JSON.stringify({ error: "Sem permissão para gerenciar esta organização" }), { status: 403, headers: corsHeaders });

    // Validate caller has admin role
    const { data: callerRole } = await admin.rpc("get_user_role", { _user_id: caller.id });
    const adminRoles = ["super_admin", "admin", "franqueado", "cliente_admin"];
    if (!adminRoles.includes(callerRole)) return new Response(JSON.stringify({ error: "Apenas administradores podem gerenciar membros" }), { status: 403, headers: corsHeaders });

    // Cannot modify self
    if (action === "remove" && user_id === caller.id) {
      return new Response(JSON.stringify({ error: "Você não pode remover a si mesmo" }), { status: 400, headers: corsHeaders });
    }

    if (action === "remove") {
      // Delete from org_team_memberships, user_roles, organization_memberships
      await admin.from("org_team_memberships").delete().eq("user_id", user_id).eq("organization_id", organization_id);
      await admin.from("user_roles").delete().eq("user_id", user_id);
      await admin.from("organization_memberships").delete().eq("user_id", user_id).eq("organization_id", organization_id);
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // action === "update"
    const updates: Promise<any>[] = [];

    if (full_name !== undefined || job_title !== undefined) {
      const profileUpdate: Record<string, any> = {};
      if (full_name !== undefined) profileUpdate.full_name = full_name;
      if (job_title !== undefined) profileUpdate.job_title = job_title;
      updates.push(admin.from("profiles").update(profileUpdate).eq("id", user_id));
    }

    if (role) {
      // Prevent removing the last super_admin
      if (role !== "super_admin") {
        const { data: targetRole } = await admin.rpc("get_user_role", { _user_id: user_id });
        if (targetRole === "super_admin") {
          const { data: allRoles } = await admin.from("user_roles").select("user_id").eq("role", "super_admin");
          const superAdminInOrg = (allRoles ?? []).filter(r => r.user_id !== user_id);
          if (superAdminInOrg.length === 0) {
            return new Response(JSON.stringify({ error: "Não é possível rebaixar o último Super Admin" }), { status: 400, headers: corsHeaders });
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
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
