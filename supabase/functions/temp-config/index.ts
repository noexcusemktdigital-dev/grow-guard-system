// Temporary diagnostic function — DELETE AFTER USE
const SECRET_PASS = "izitech_temp_2026";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Simple passphrase protection
  const url = new URL(req.url);
  const pass = url.searchParams.get("pass") || "";
  if (pass !== SECRET_PASS) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    service_role_key: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    supabase_url: Deno.env.get("SUPABASE_URL") || "",
    anon_key: Deno.env.get("SUPABASE_ANON_KEY") || "",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
