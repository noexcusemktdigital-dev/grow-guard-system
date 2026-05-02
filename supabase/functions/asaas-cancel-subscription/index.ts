// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "../_shared/asaas-fetch.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { assertOrgMember, AuthError } from '../_shared/auth.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { parseOrThrow, validationErrorResponse, SubscriptionSchemas } from '../_shared/schemas.ts';

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'asaas-cancel-subscription');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    console.log("[asaas-cancel-subscription] Request received:", req.method);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Auth via getUser
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[asaas-cancel-subscription] No auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[asaas-cancel-subscription] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { organization_id } = parseOrThrow(SubscriptionSchemas.Cancel, await req.json());

    // SEC-002: Validate org membership before financial mutation (anti-IDOR/BOLA)
    try {
      await assertOrgMember(adminClient, user.id, organization_id);
    } catch (err) {
      if (err instanceof AuthError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    // Get subscription
    const { data: sub, error: subError } = await adminClient
      .from("subscriptions")
      .select("id, asaas_subscription_id, status")
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (subError || !sub) {
      return new Response(JSON.stringify({ error: "Subscription not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Cancel on Asaas if there's an active subscription
    if (sub.asaas_subscription_id) {
      const cancelRes = await asaasFetch(`${ASAAS_BASE}/subscriptions/${sub.asaas_subscription_id}`, {
        method: "DELETE",
        headers: { access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
      });

      if (!cancelRes.ok) {
        const errData = await cancelRes.json();
        console.error("Asaas cancel failed:", errData);
        // If 404 it's already deleted, proceed
        if (cancelRes.status !== 404) {
          return new Response(JSON.stringify({ error: "Failed to cancel on Asaas", details: errData }), {
            status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        }
      }
      console.log(`Asaas subscription ${sub.asaas_subscription_id} cancelled`);
    }

    // Update local status
    await adminClient
      .from("subscriptions")
      .update({ status: "cancelled", asaas_subscription_id: null })
      .eq("id", sub.id);

    console.log(`Subscription cancelled for org ${organization_id}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const valRes = validationErrorResponse(err, getCorsHeaders(req));
    if (valRes) return valRes;
    log.error("asaas-cancel-subscription error", { error: String(err) });
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
