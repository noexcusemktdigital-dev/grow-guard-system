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

    const results: Record<string, unknown> = {};

    // ── 1. Super Admin ──
    const { data: adminUser, error: adminErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: "davi.ttesch@gmail.com",
        password: "19961996",
        email_confirm: true,
        user_metadata: { full_name: "Davi Tesch" },
      });

    if (adminErr && !adminErr.message.includes("already been registered")) {
      throw adminErr;
    }

    const adminId = adminUser?.user?.id;

    if (adminId) {
      // Create franqueadora org
      const { data: franqueadoraOrg } = await supabaseAdmin
        .from("organizations")
        .insert({ name: "NoExcuse Franqueadora", type: "franqueadora" })
        .select("id")
        .single();

      if (franqueadoraOrg) {
        await supabaseAdmin
          .from("organization_memberships")
          .insert({
            user_id: adminId,
            organization_id: franqueadoraOrg.id,
            role: "super_admin",
          });
      }

      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: adminId, role: "super_admin" });

      results.super_admin = { id: adminId, email: "davi.ttesch@gmail.com" };
    } else {
      results.super_admin = { message: "User already exists" };
    }

    // ── 2. Cliente SaaS ──
    const { data: clienteUser, error: clienteErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: "cliente.teste@noexcuse.com",
        password: "19961996",
        email_confirm: true,
        user_metadata: { full_name: "Cliente Teste", signup_source: "saas" },
      });

    if (clienteErr && !clienteErr.message.includes("already been registered")) {
      throw clienteErr;
    }

    const clienteId = clienteUser?.user?.id;

    if (clienteId) {
      // Create cliente org
      const { data: clienteOrg } = await supabaseAdmin
        .from("organizations")
        .insert({ name: "Empresa Teste", type: "cliente" })
        .select("id")
        .single();

      if (clienteOrg) {
        await supabaseAdmin
          .from("organization_memberships")
          .insert({
            user_id: clienteId,
            organization_id: clienteOrg.id,
            role: "cliente_admin",
          });

        // Trial subscription
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await supabaseAdmin.from("subscriptions").insert({
          organization_id: clienteOrg.id,
          plan: "trial",
          status: "active",
          expires_at: expiresAt.toISOString(),
        });

        // Credit wallet
        await supabaseAdmin
          .from("credit_wallets")
          .insert({ organization_id: clienteOrg.id, balance: 100 });
      }

      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: clienteId, role: "cliente_admin" });

      results.cliente = { id: clienteId, email: "cliente.teste@noexcuse.com" };
    } else {
      results.cliente = { message: "User already exists" };
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("seed-users error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
