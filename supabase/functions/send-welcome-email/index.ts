// @ts-nocheck
/**
 * Sends a welcome email to a newly-signed-up user.
 * Idempotent via email_campaigns (trigger_event = welcome:<user_id>).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "NoExcuse Digital <noreply@noexcusedigital.com.br>";
const SITE_URL = "https://sistema.noexcusedigital.com.br";

function buildHtml(name: string): string {
  const greeting = name ? `Olá, ${name}!` : "Seja muito bem-vindo(a)!";
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#141a24;">
  <div style="max-width:560px;margin:0 auto;padding:40px 25px;">
    <img src="https://gxrhdpbbxfipeopdyygn.supabase.co/storage/v1/object/public/email-assets/logo-noexcuse.png" alt="NoExcuse Digital" width="160" style="margin:0 0 24px;display:block;" />
    <h1 style="font-size:24px;margin:0 0 16px;">${greeting}</h1>
    <p style="font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 18px;">
      Sua conta foi criada com sucesso. Você ganhou <strong>200 créditos de cortesia</strong> e <strong>7 dias de teste</strong> para explorar tudo que a plataforma faz por você.
    </p>
    <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#141a24;">Próximo passo: complete o GPS do Negócio</p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#52525b;">
        O GPS é o diagnóstico estratégico que destrava todas as ferramentas (CRM, Tráfego, Conteúdo, Sites). Leva uns 10 minutos e a plataforma adapta tudo ao seu negócio.
      </p>
    </div>
    <a href="${SITE_URL}/cliente/gps-negocio" style="display:inline-block;background:#E2233B;color:#ffffff;font-size:14px;border-radius:12px;padding:14px 28px;text-decoration:none;font-weight:600;">
      Começar o GPS agora →
    </a>
    <p style="font-size:13px;color:#71717a;margin:32px 0 0;line-height:1.5;">
      Qualquer dúvida, fale com a gente no WhatsApp <strong>(44) 9112-9613</strong>. Boas vendas!
    </p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });
  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const { user_id, email, full_name, organization_id } = await req.json();
    if (!user_id || !email) {
      return new Response(JSON.stringify({ error: "user_id and email required" }), { status: 400, headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[send-welcome-email] RESEND_API_KEY not set");
      return new Response(JSON.stringify({ error: "email_not_configured" }), { status: 500, headers });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const triggerKey = `welcome:${user_id}`;

    // Idempotency
    const { data: existing } = await admin
      .from("email_campaigns")
      .select("id")
      .eq("trigger_event", triggerKey)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ skipped: true, reason: "already_sent" }), { headers });
    }

    const resp = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject: "Bem-vindo(a) à NOEXCUSE — sua conta está pronta",
        html: buildHtml(full_name || ""),
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error("[send-welcome-email] Resend error:", resp.status, body);
      return new Response(JSON.stringify({ error: "send_failed", details: body }), { status: 500, headers });
    }

    await admin.from("email_campaigns").insert({
      trigger_event: triggerKey,
      recipient_email: email,
      organization_id: organization_id || null,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    console.error("send-welcome-email error", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers });
  }
});
