import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID") || "";
  const metaAppId = Deno.env.get("META_APP_ID") || "";

  return new Response(
    JSON.stringify({ google_client_id: clientId, meta_app_id: metaAppId }),
    { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});
