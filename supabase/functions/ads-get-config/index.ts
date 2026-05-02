// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

serve(async (req) => {
  const ctx = newRequestContext(req, 'ads-get-config');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  const googleClientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID") || "";
  const metaAppId = Deno.env.get("META_APP_ID") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";

  // Redirect URIs unificados — todos os fluxos usam o mesmo app Meta
  const adsRedirectUri = `${supabaseUrl}/functions/v1/ads-oauth-callback`;
  const socialRedirectUri = `${supabaseUrl}/functions/v1/social-oauth-callback`;

  return new Response(
    JSON.stringify({
      // Compat: chaves planas usadas por hooks legados
      google_client_id: googleClientId,
      meta_app_id: metaAppId,
      app_id: metaAppId,
      redirect_uri: adsRedirectUri,
      // Estrutura nova organizada por fluxo
      meta: {
        app_id: metaAppId,
        ads_redirect_uri: adsRedirectUri,
        social_redirect_uri: socialRedirectUri,
        redirect_uri: adsRedirectUri,
      },
      google: {
        client_id: googleClientId,
      },
    }),
    { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});
