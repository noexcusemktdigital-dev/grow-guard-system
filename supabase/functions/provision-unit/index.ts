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
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.user.id;

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
    } = await req.json();

    if (!unit_name || !manager_email || !parent_org_id) {
      return new Response(
        JSON.stringify({ error: "unit_name, manager_email and parent_org_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is member of the parent org
    const { data: isMember } = await adminClient.rpc("is_member_of_org", {
      _user_id: callerId,
      _org_id: parent_org_id,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get parent org name for naming
    const { data: parentOrg } = await adminClient
      .from("organizations")
      .select("name")
      .eq("id", parent_org_id)
      .single();

    // 1. Create organization of type franqueado
    const { data: newOrg, error: orgErr } = await adminClient
      .from("organizations")
      .insert({
        name: unit_name,
        type: "franqueado",
        parent_org_id: parent_org_id,
      })
      .select()
      .single();
    if (orgErr) throw orgErr;

    const orgId = newOrg.id;

    // 2. Create user for the franchisee manager
    const tempPassword = crypto.randomUUID().slice(0, 12) + "A1!";
    const { data: newUser, error: userErr } = await adminClient.auth.admin.createUser({
      email: manager_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: manager_name || manager_email.split("@")[0] },
    });

    let userId: string;
    let userAlreadyExists = false;

    if (userErr) {
      if (userErr.message?.includes("already been registered")) {
        // User already exists, find them
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const existing = existingUsers?.users?.find((u: any) => u.email === manager_email);
        if (!existing) throw new Error("User exists but could not be found");
        userId = existing.id;
        userAlreadyExists = true;
      } else {
        throw userErr;
      }
    } else {
      userId = newUser.user.id;
    }

    // 3. Update profile
    if (!userAlreadyExists) {
      await adminClient
        .from("profiles")
        .update({ full_name: manager_name || manager_email.split("@")[0] })
        .eq("id", userId);
    }

    // 4. Create membership for the new org
    const { error: memErr } = await adminClient.from("organization_memberships").insert({
      user_id: userId,
      organization_id: orgId,
    });
    // Ignore duplicate membership errors
    if (memErr && !memErr.message?.includes("duplicate")) throw memErr;

    // 5. Set role to franqueado (if not already set)
    const { error: roleErr } = await adminClient.from("user_roles").insert({
      user_id: userId,
      role: "franqueado",
    });
    // Ignore duplicate role errors
    if (roleErr && !roleErr.message?.includes("duplicate")) throw roleErr;

    // 6. Create the unit record linked to this org
    const { data: unitData, error: unitErr } = await adminClient
      .from("units")
      .insert({
        name: unit_name,
        city: city || null,
        state: state || null,
        address: address || null,
        phone: phone || null,
        manager_name: manager_name || null,
        email: manager_email,
        organization_id: parent_org_id,
        unit_org_id: orgId,
        status: "active",
      })
      .select()
      .single();
    if (unitErr) throw unitErr;

    // 7. Create franchisee system payment config if system_fee provided
    if (system_fee && system_fee > 0) {
      await adminClient.from("franchisee_system_payments").insert({
        organization_id: orgId,
        month: new Date().toISOString().slice(0, 7),
        amount: system_fee,
        status: "pending",
      });
    }

    console.log(`Unit provisioned: ${unit_name} -> org ${orgId}, user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        unit_id: unitData.id,
        organization_id: orgId,
        user_id: userId,
        temp_password: userAlreadyExists ? null : tempPassword,
        user_already_exists: userAlreadyExists,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("provision-unit error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
