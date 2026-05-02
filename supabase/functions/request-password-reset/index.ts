// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { maskEmail } from '../_shared/redact.ts';

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "NoExcuse Digital <noreply@noexcusedigital.com.br>";

function buildRecoveryHtml(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Inter',Arial,sans-serif;">
  <div style="padding:40px 25px;max-width:560px;margin:0 auto;">
    <img src="https://gxrhdpbbxfipeopdyygn.supabase.co/storage/v1/object/public/email-assets/logo-noexcuse.png" alt="NoExcuse Digital" width="160" style="margin:0 0 24px;display:block;" />
    <h1 style="font-size:22px;font-weight:bold;color:#141a24;margin:0 0 20px;">Redefinir sua senha</h1>
    <p style="font-size:14px;color:#6c7280;line-height:1.6;margin:0 0 25px;">
      Recebemos uma solicitação para redefinir sua senha na <strong>NoExcuse Digital</strong>. Clique no botão abaixo para escolher uma nova senha.
    </p>
    <a href="${resetUrl}" style="display:inline-block;background-color:#E2233B;color:#ffffff;font-size:14px;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:500;">
      Redefinir senha
    </a>
    <p style="font-size:12px;color:#999999;margin:30px 0 0;">
      Se você não solicitou a redefinição, pode ignorar este e-mail com segurança. Sua senha não será alterada.
    </p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'request-password-reset');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const { email, portal } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email é obrigatório" }), { headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://sistema.noexcusedigital.com.br";

    if (!resendApiKey) {
      console.error("[request-password-reset] RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Configuração de e-mail não encontrada" }), { headers });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const portalParam = portal === "saas" ? "saas" : "franchise";
    const redirectTo = `${siteUrl}/reset-password?portal=${portalParam}`;

    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkErr) {
      console.error("[request-password-reset] generateLink error:", linkErr);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // Use hashed_token pattern (same as invite-user) to prevent
    // email security scanners from consuming the one-time token.
    const hashedToken = linkData?.properties?.hashed_token;
    const actionLink = linkData?.properties?.action_link;

    let resetUrl: string;

    if (hashedToken) {
      // Safe URL: token is only verified when the user loads the page
      const encodedEmail = encodeURIComponent(email);
      resetUrl = `${siteUrl}/reset-password?token_hash=${hashedToken}&type=recovery&email=${encodedEmail}&portal=${portalParam}`;
      console.log("[request-password-reset] Using hashed_token pattern for", maskEmail(email));
    } else if (actionLink) {
      // Fallback to action_link (less safe but functional)
      resetUrl = actionLink;
      console.warn("[request-password-reset] Falling back to action_link for", maskEmail(email));
    } else {
      console.error("[request-password-reset] No hashed_token or action_link returned");
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // Send branded email via Resend
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject: "Redefinir sua senha — NoExcuse Digital",
        html: buildRecoveryHtml(resetUrl),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[request-password-reset] Resend error:", response.status, errorBody);
    } else {
      console.log("[request-password-reset] Recovery email sent to", maskEmail(email));
    }

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    console.error("[request-password-reset] Error:", err);
    return new Response(JSON.stringify({ error: "Erro ao processar solicitação" }), { headers });
  }
});
