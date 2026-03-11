import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "../_shared/asaas-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = (Deno.env.get("ASAAS_API_KEY") || "").trim();
    const baseUrl = (Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3").replace(/\/$/, "");

    if (!apiKey) return new Response(JSON.stringify({ error: "ASAAS_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Auth check
    const authHeader = req.headers.get("authorization") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { action, payment_id, value, dueDate, description } = await req.json();

    if (!payment_id) return new Response(JSON.stringify({ error: "payment_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const headers = { access_token: apiKey, "Content-Type": "application/json" };

    if (action === "cancel") {
      const res = await asaasFetch(`${baseUrl}/payments/${payment_id}`, { method: "DELETE", headers });
      const data = await res.json();
      if (!res.ok) {
        console.error("[asaas-manage-payment] Cancel error:", JSON.stringify(data));
        return new Response(JSON.stringify({ error: data.errors?.[0]?.description || "Erro ao cancelar cobrança" }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true, deleted: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update") {
      const body: Record<string, unknown> = {};
      if (value !== undefined) body.value = value;
      if (dueDate) body.dueDate = dueDate;
      if (description !== undefined) body.description = description;

      const res = await asaasFetch(`${baseUrl}/payments/${payment_id}`, { method: "PUT", headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        console.error("[asaas-manage-payment] Update error:", JSON.stringify(data));
        return new Response(JSON.stringify({ error: data.errors?.[0]?.description || "Erro ao editar cobrança" }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true, payment: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'cancel' or 'update'." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("[asaas-manage-payment] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
