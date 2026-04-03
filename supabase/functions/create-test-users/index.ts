import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceRoleKey);

  const password = "Teste@2026!";
  const results: Record<string, unknown>[] = [];

  // Get orgs
  const { data: orgs } = await sb.from("organizations").select("id, name, type");
  const franqueadora = orgs?.find((o: any) => o.type === "franqueadora");
  const franqueado = orgs?.find((o: any) => o.type === "franqueado");
  const cliente = orgs?.find((o: any) => o.type === "cliente");

  const accounts = [
    { email: "matriz.teste2@noexcuse.com", name: "Teste Matriz 2", role: "admin", org: franqueadora, label: "Matriz" },
    { email: "franqueado.teste2@noexcuse.com", name: "Teste Franqueado 2", role: "franqueado", org: franqueado, label: "Franqueado" },
    { email: "cliente.teste2@noexcuse.com", name: "Teste Cliente 2", role: "cliente_admin", org: cliente, label: "Cliente" },
  ];

  for (const acc of accounts) {
    if (!acc.org) {
      results.push({ label: acc.label, error: `No org of type found` });
      continue;
    }

    const { data: authData, error: authErr } = await sb.auth.admin.createUser({
      email: acc.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: acc.name },
    });

    if (authErr) {
      results.push({ label: acc.label, email: acc.email, error: authErr.message });
      continue;
    }

    const userId = authData.user.id;

    // Profile
    await sb.from("profiles").upsert({ id: userId, full_name: acc.name } as any, { onConflict: "id" });

    // Membership
    const { error: memErr } = await sb.from("organization_memberships").insert({ user_id: userId, organization_id: acc.org.id });

    // Role
    const { error: roleErr } = await sb.from("user_roles").insert({ user_id: userId, role: acc.role } as any);

    results.push({
      label: acc.label,
      email: acc.email,
      userId,
      org: acc.org.name,
      role: acc.role,
      membershipOk: !memErr,
      roleOk: !roleErr,
    });
  }

  return new Response(JSON.stringify({ password, results }, null, 2), { headers });
});
