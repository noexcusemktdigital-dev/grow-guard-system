// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { withIdempotency } from "../_shared/idempotency.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const respond = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate auth — only super_admin or admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return respond(401, { error: "Unauthorized" });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return respond(401, { error: "Unauthorized" });
    }

    const userId = user.id;

    // Check role
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = roles?.some((r: { role: string }) => r.role === "super_admin" || r.role === "admin");
    if (!isAdmin) {
      return respond(403, { error: "Forbidden — admin only" });
    }

    const rawBody = await req.text();
    const parsed = JSON.parse(rawBody || "{}");
    const { organization_id, amount, description } = parsed;

    if (!organization_id || !amount || amount <= 0) {
      return respond(400, { error: "Invalid params: organization_id and positive amount required" });
    }

    const reqForIdem = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: rawBody,
    });

    const result = await withIdempotency(
      reqForIdem,
      "recharge-credits",
      { orgId: organization_id, userId },
      async () => {
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

        return { status: 200, body: { success: true, new_balance: newBalance } };
      },
    );

    return respond(result.status, result.body);
  } catch (err) {
    console.error("recharge-credits error:", err);
    return respond(500, { error: err.message });
  }
});
