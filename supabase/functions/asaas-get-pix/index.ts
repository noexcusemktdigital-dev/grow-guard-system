import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchPixQrCode } from "../_shared/asaas-customer.ts";
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[asaas-get-pix] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { payment_id } = await req.json();

    if (!payment_id) {
      return new Response(JSON.stringify({ error: "payment_id is required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const pixData = await fetchPixQrCode(asaasApiKey, payment_id, 3, 2000);

    return new Response(JSON.stringify({
      success: true,
      encoded_image: pixData.encodedImage,
      copy_paste: pixData.payload,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("asaas-get-pix error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
