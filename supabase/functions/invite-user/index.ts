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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate caller auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;

    const { email, full_name, role, organization_id } = await req.json();

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

    // Create user in auth
    const password = crypto.randomUUID().slice(0, 12) + "A1!";
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || email.split("@")[0] },
    });
    if (createErr) {
      // User might already exist
      if (createErr.message?.includes("already been registered")) {
        return new Response(JSON.stringify({ error: "Este e-mail já está cadastrado" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw createErr;
    }

    const userId = newUser.user.id;

    // Update profile
    await adminClient
      .from("profiles")
      .update({ full_name: full_name || email.split("@")[0] })
      .eq("id", userId);

    // Create membership
    await adminClient.from("organization_memberships").insert({
      user_id: userId,
      organization_id,
    });

    // Set role — accept all valid app_role values
    const allowedRoles = ["super_admin", "admin", "franqueado", "cliente_admin", "cliente_user"];
    const validRole = allowedRoles.includes(role) ? role : "cliente_user";
    await adminClient.from("user_roles").insert({
      user_id: userId,
      role: validRole,
    });

    console.log(`User invited: ${email} -> org ${organization_id} as ${validRole}`);

    return new Response(
      JSON.stringify({ success: true, user_id: userId, temp_password: password }),
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
