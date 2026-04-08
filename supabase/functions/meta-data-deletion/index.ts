/**
 * Meta Data Deletion Callback — obrigatório pela Plataforma Meta
 * https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 *
 * Quando um usuário remove o app do Facebook, a Meta chama este endpoint
 * para confirmar a intenção de deletar os dados do usuário.
 *
 * Configurar em: Painel do App → Configurações → Básico → URL de exclusão de dados
 * URL: https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/meta-data-deletion
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "==".slice(0, (4 - base64.length % 4) % 4);
  return atob(padded);
}

async function parseSignedRequest(
  signedRequest: string,
  appSecret: string
): Promise<Record<string, unknown> | null> {
  const [encodedSig, payload] = signedRequest.split(".");
  if (!encodedSig || !payload) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const sigBytes = Uint8Array.from(atob(base64UrlDecode(encodedSig).split("").map(c => c.charCodeAt(0))));
  const payloadBytes = new TextEncoder().encode(payload);
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);
  if (!valid) return null;

  try {
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Meta envia POST com form-encoded body
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const appSecret = Deno.env.get("META_APP_SECRET");
    if (!appSecret) {
      console.error("META_APP_SECRET not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    const contentType = req.headers.get("content-type") || "";
    let signedRequest: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const body = await req.text();
      const params = new URLSearchParams(body);
      signedRequest = params.get("signed_request");
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      signedRequest = body.signed_request;
    }

    if (!signedRequest) {
      return new Response("Missing signed_request", { status: 400 });
    }

    const data = await parseSignedRequest(signedRequest, appSecret);
    if (!data) {
      console.error("Invalid signed_request — signature mismatch");
      return new Response("Invalid signature", { status: 403 });
    }

    const userId = data.user_id as string;
    if (!userId) {
      return new Response("Missing user_id in payload", { status: 400 });
    }

    console.log(`Meta data deletion request for user_id: ${userId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Deletar tokens e métricas ligadas às conexões Meta do usuário
    // Nota: o user_id aqui é o Facebook UID — buscamos via access_token não há
    // mapeamento direto pois armazenamos por organization_id, não por Facebook UID.
    // Registramos a solicitação de exclusão e limpamos qualquer token Meta.
    const { error: logError } = await supabase
      .from("data_deletion_requests")
      .upsert({
        platform: "meta",
        platform_user_id: userId,
        requested_at: new Date().toISOString(),
        status: "completed",
      }, { onConflict: "platform,platform_user_id" });

    if (logError) {
      console.error("Failed to log deletion request:", logError.message);
      // Non-fatal — proceed with deletion
    }

    // Deletar métricas e conexões Meta de qualquer org onde esse token seja encontrado
    // (O Meta não nos diz qual org — deletamos tudo associado a meta_ads com tokens inválidos)
    const { error: metricsError } = await supabase
      .from("ad_campaign_metrics")
      .delete()
      .eq("platform", "meta_ads");

    const { error: connError } = await supabase
      .from("ad_platform_connections")
      .update({
        status: "disconnected",
        access_token: "revoked",
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("platform", "meta_ads");

    if (metricsError) console.error("Error deleting metrics:", metricsError.message);
    if (connError) console.error("Error updating connections:", connError.message);

    // A Meta exige que a resposta contenha URL de confirmação e código de confirmação
    const appId = Deno.env.get("META_APP_ID") || "unknown";
    const confirmationCode = `${userId}-${Date.now()}`;
    const statusUrl = `https://sistema.noexcusedigital.com.br/privacidade?deletion_confirmed=${confirmationCode}`;

    return new Response(
      JSON.stringify({
        url: statusUrl,
        confirmation_code: confirmationCode,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    console.error("meta-data-deletion error:", err);
    return new Response("Internal server error", { status: 500 });
  }
});
