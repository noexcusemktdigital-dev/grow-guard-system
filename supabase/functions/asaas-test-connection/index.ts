import { asaasFetch } from "../_shared/asaas-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;

    const res = await asaasFetch(`${ASAAS_BASE}/customers?limit=1`, {
      headers: { access_token: asaasApiKey },
    });

    const data = await res.json();

    return new Response(
      JSON.stringify({
        connected: res.ok,
        status: res.status,
        base_url: ASAAS_BASE,
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
