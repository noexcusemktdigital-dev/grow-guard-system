import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate auth — only super_admin or admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Check role
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = roles?.some((r: { role: string }) => r.role === "super_admin" || r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
        status: 403,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { organization_id, amount, description } = await req.json();

    if (!organization_id || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid params: organization_id and positive amount required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Get or create wallet
    let { data: wallet } = await adminClient
      .from("credit_wallets")
      .select("id, balance")
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet, error: createErr } = await adminClient
        .from("credit_wallets")
        .insert({ organization_id, balance: 0 })
        .select()
        .single();
      if (createErr) throw createErr;
      wallet = newWallet;
    }

    const newBalance = wallet.balance + amount;

    await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);

    await adminClient.from("credit_transactions").insert({
      organization_id,
      type: "purchase",
      amount,
      balance_after: newBalance,
      description: description || `Recarga manual de ${amount} créditos`,
      created_by: userId,
      metadata: { source: "manual_recharge" },
    });

    return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("recharge-credits error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
