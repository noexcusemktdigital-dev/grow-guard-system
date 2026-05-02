// @ts-nocheck
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
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

function base64UrlDecodeBytes(str: string): Uint8Array {
  return Uint8Array.from(base64UrlDecode(str), (char) => char.charCodeAt(0));
}

async function parseSignedRequest(
  signedRequest: string,
  appSecret: string,
): Promise<Record<string, unknown> | null> {
  const [encodedSig, payload] = signedRequest.split(".");
  if (!encodedSig || !payload) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const sigBytes = base64UrlDecodeBytes(encodedSig);
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
  const ctx = newRequestContext(req, 'meta-data-deletion');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

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

    const nowIso = new Date().toISOString();

    // Buscar contas sociais Meta vinculadas ao user_id da Meta via metadata
    const { data: metaAccounts, error: accountsError } = await supabase
      .from("social_accounts")
      .select("id, platform, metadata")
      .in("platform", ["facebook", "instagram"])
      .eq("metadata->>user_id", userId);

    if (accountsError) {
      console.error("Error querying social_accounts:", accountsError.message);
    }

    const accountIds = (metaAccounts ?? []).map((a) => a.id);
    let deletionNotes = "";

    if (accountIds.length > 0) {
      console.log(`Found ${accountIds.length} Meta social account(s) for user_id ${userId}`);

      // Buscar posts dessas contas
      const { data: posts, error: postsError } = await supabase
        .from("social_posts")
        .select("id")
        .in("social_account_id", accountIds);

      if (postsError) console.error("Error querying social_posts:", postsError.message);

      const postIds = (posts ?? []).map((p) => p.id);

      // Deletar métricas de engajamento dos posts encontrados
      if (postIds.length > 0) {
        const { error: metricsError } = await supabase
          .from("social_engagement_metrics")
          .delete()
          .in("social_post_id", postIds);
        if (metricsError) {
          console.error("Error deleting social_engagement_metrics:", metricsError.message);
        }
      }

      // Desconectar apenas as contas Meta correspondentes
      const { error: updateError } = await supabase
        .from("social_accounts")
        .update({
          status: "disconnected",
          access_token: "revoked",
          refresh_token: null,
          updated_at: nowIso,
        })
        .in("id", accountIds);

      if (updateError) {
        console.error("Error disconnecting social_accounts:", updateError.message);
      }

      deletionNotes = `Callback Meta verificado. ${accountIds.length} conta(s) social(is) desconectada(s) e ${postIds.length} post(s) tiveram métricas removidas para metadata.user_id=${userId}.`;
    } else {
      console.log(`No Meta social accounts found for user_id ${userId}`);
      deletionNotes = `Callback Meta verificado. Nenhuma conta social Meta conectada foi encontrada para metadata.user_id=${userId}.`;
    }

    // Registrar a solicitação de exclusão
    const { error: logError } = await supabase
      .from("meta_data_deletion_requests")
      .upsert({
        platform: "meta",
        platform_user_id: userId,
        requested_at: nowIso,
        completed_at: nowIso,
        status: "completed",
        notes: deletionNotes,
      }, { onConflict: "platform,platform_user_id" });

    if (logError) {
      console.error("Failed to log deletion request:", logError.message);
    }

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
      },
    );
  } catch (err: unknown) {
    console.error("meta-data-deletion error:", err);
    return new Response("Internal server error", { status: 500 });
  }
});
