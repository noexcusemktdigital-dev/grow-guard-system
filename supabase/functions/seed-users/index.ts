// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'seed-users');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
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
          .insert({ organization_id: clienteOrg.id, balance: 200 });
      }

      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: clienteId, role: "cliente_admin" });

      results.cliente = { id: clienteId, email: "cliente.teste@noexcuse.com" };
    } else {
      results.cliente = { message: "User already exists" };
    }

    // ── 3. Franqueado ──
    const { data: franqueadoUser, error: franqueadoErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: "franqueado.teste@noexcuse.com",
        password: "19961996",
        email_confirm: true,
        user_metadata: { full_name: "Franqueado Teste" },
      });

    if (franqueadoErr && !franqueadoErr.message.includes("already been registered")) {
      throw franqueadoErr;
    }

    const franqueadoId = franqueadoUser?.user?.id;

    if (franqueadoId) {
      // Create franqueado org
      const { data: franqueadoOrg } = await supabaseAdmin
        .from("organizations")
        .insert({ name: "Unidade Teste", type: "franqueado" })
        .select("id")
        .single();

      if (franqueadoOrg) {
        await supabaseAdmin
          .from("organization_memberships")
          .insert({
            user_id: franqueadoId,
            organization_id: franqueadoOrg.id,
            role: "franqueado",
          });
      }

      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: franqueadoId, role: "franqueado" });

      results.franqueado = { id: franqueadoId, email: "franqueado.teste@noexcuse.com" };
    } else {
      results.franqueado = { message: "User already exists" };
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("seed-users error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
