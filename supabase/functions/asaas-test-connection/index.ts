import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "../_shared/asaas-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

// Map Asaas error codes to human-readable messages
const ASAAS_ERROR_MAP: Record<string, string> = {
  invalid_environment: "Chave de API do ambiente errado (sandbox vs produção)",
  access_token_not_found: "Header access_token não enviado ou vazio",
  invalid_access_token_format: "Formato da chave de API inválido",
  invalid_access_token: "Chave de API revogada ou inválida",
  not_allowed_ip: "IP não autorizado na conta Asaas",
};

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
      headers: { access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
    });

    const data = await res.json();

    // Detect specific Asaas error codes
    let errorCode: string | null = null;
    let errorHint: string | null = null;
    if (!res.ok && data?.errors?.length > 0) {
      errorCode = data.errors[0]?.code || null;
      errorHint = errorCode ? (ASAAS_ERROR_MAP[errorCode] || null) : null;
    }

    return new Response(
      JSON.stringify({
        connected: res.ok,
        status: res.status,
        base_url: ASAAS_BASE,
        environment: isSandbox ? "SANDBOX" : "PRODUCTION",
        user_agent_sent: true,
        proxy_url: proxyUrl ? (proxyUrl.trim() === proxyUrl && /^https?:\/\/.+/.test(proxyUrl) ? "valid" : "invalid") : "not_set",
        customer_count: data.totalCount ?? null,
        first_customer: data.data?.[0]?.name ?? null,
        error: res.ok ? null : data,
        error_code: errorCode,
        error_hint: errorHint,
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
