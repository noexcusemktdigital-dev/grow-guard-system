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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id, company_name, franchisee_org_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already has a role (avoid duplicate provisioning)
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingRole) {
      return new Response(JSON.stringify({ message: "User already provisioned" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({ name: company_name || "Minha Empresa", type: "cliente" })
      .select("id")
      .single();

    if (orgError) throw orgError;

    // 2. Create organization membership
    const { error: memberError } = await supabaseAdmin
      .from("organization_memberships")
      .insert({ user_id, organization_id: org.id, role: "cliente_admin" });

    if (memberError) throw memberError;

    // 3. Create user role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id, role: "cliente_admin" });

    if (roleError) throw roleError;

    // 4. Create trial subscription (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: subError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        organization_id: org.id,
        plan: "trial",
        status: "active",
        expires_at: expiresAt.toISOString(),
      });

    if (subError) throw subError;

    // 5. Create credit wallet
    const { error: walletError } = await supabaseAdmin
      .from("credit_wallets")
      .insert({ organization_id: org.id, balance: 1000 });

    if (walletError) throw walletError;

    return new Response(
      JSON.stringify({ success: true, organization_id: org.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("signup-saas error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
