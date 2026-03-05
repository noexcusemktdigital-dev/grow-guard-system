import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "../_shared/asaas-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[asaas-test-connection] Request received:", req.method);
    // Auth check
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[asaas-test-connection] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const proxyUrl = Deno.env.get("ASAAS_PROXY_URL") || null;
    const isSandbox = ASAAS_BASE.includes("sandbox");

    const res = await asaasFetch(`${ASAAS_BASE}/customers?limit=1`, {
      headers: { access_token: asaasApiKey },
    });

    const data = await res.json();

    return new Response(
      JSON.stringify({
        connected: res.ok,
        status: res.status,
        base_url: ASAAS_BASE,
        environment: isSandbox ? "SANDBOX" : "PRODUCTION",
        proxy_url: proxyUrl ? (proxyUrl.trim() === proxyUrl && /^https?:\/\/.+/.test(proxyUrl) ? "valid" : "invalid") : "not_set",
        customer_count: data.totalCount ?? null,
        first_customer: data.data?.[0]?.name ?? null,
        error: res.ok ? null : data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ connected: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
