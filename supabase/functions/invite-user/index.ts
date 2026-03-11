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
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate caller auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = user.id;

    const { email, full_name, role, organization_id, team_ids } = await req.json();

    if (!email || !organization_id) {
      return new Response(JSON.stringify({ error: "email and organization_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is member of the org (or parent org for franqueadora)
    const { data: isMember } = await adminClient.rpc("is_member_or_parent_of_org", {
      _user_id: callerId,
      _org_id: organization_id,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Validate maxUsers server-side ----
    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("plan, status")
      .eq("organization_id", organization_id)
      .maybeSingle();

    const planLimits: Record<string, number> = { starter: 10, pro: 20, enterprise: 9999, trial: 2 };
    const maxUsers = planLimits[sub?.plan ?? ""] ?? 10;

    const { count: currentMembers } = await adminClient
      .from("organization_memberships")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization_id);

    if ((currentMembers ?? 0) >= maxUsers) {
      return new Response(
        JSON.stringify({ error: `Limite de ${maxUsers} usuários do plano atingido. Faça upgrade para adicionar mais.` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invite user via email
    const redirectTo = Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", ".supabase.co");
    const { data: newUser, error: createErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: full_name || email.split("@")[0] },
      redirectTo,
    });
    let userId: string;

    if (createErr) {
      if (createErr.message?.includes("already been registered")) {
        // User exists (e.g. signed up via Google OAuth) — link to org instead of rejecting
        const { data: listData, error: listErr } = await adminClient.auth.admin.listUsers();
        if (listErr) throw listErr;
        const existingUser = listData.users.find((u: any) => u.email === email);
        if (!existingUser) {
          return new Response(JSON.stringify({ error: "Usuário existe mas não foi encontrado" }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Check if already a member of this org
        const { data: existingMembership } = await adminClient
          .from("organization_memberships")
          .select("id")
          .eq("user_id", existingUser.id)
          .eq("organization_id", organization_id)
          .maybeSingle();
        if (existingMembership) {
          return new Response(JSON.stringify({ error: "Este usuário já é membro desta organização" }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = existingUser.id;
      } else {
        throw createErr;
      }
    } else {
      userId = newUser.user.id;
    }

    // Update profile
    await adminClient
      .from("profiles")
      .update({ full_name: full_name || email.split("@")[0] })
      .eq("id", userId);

    // Create membership (ignore if already exists)
    await adminClient.from("organization_memberships").upsert({
      user_id: userId,
      organization_id,
    }, { onConflict: "user_id,organization_id", ignoreDuplicates: true });

    // Set role (upsert to handle existing users)
    const allowedRoles = ["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"];
    const validRole = allowedRoles.includes(role) ? role : "cliente_user";
    await adminClient.from("user_roles").upsert({
      user_id: userId,
      role: validRole,
    }, { onConflict: "user_id,role", ignoreDuplicates: true });

    // Assign to teams if provided
    if (Array.isArray(team_ids) && team_ids.length > 0) {
      const teamRows = team_ids.map((tid: string) => ({ team_id: tid, user_id: userId }));
      await adminClient.from("org_team_memberships").insert(teamRows);
    }

    console.log(`User invited: ${email} -> org ${organization_id} as ${validRole} (teams: ${team_ids?.length ?? 0})`);

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("invite-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
