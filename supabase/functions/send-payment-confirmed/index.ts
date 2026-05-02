// @ts-nocheck
/**
 * Sends "payment confirmed" email to client (after Asaas confirms a paid invoice).
 * Idempotent via email_campaigns (trigger_event = payment_confirmed:<payment_id>).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "NOEXCUSE <financeiro@noexcusedigital.com.br>";
const SITE_URL = "https://sistema.noexcusedigital.com.br";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildHtml(name: string, amount: number, paidAt: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#141a24;">
  <div style="max-width:560px;margin:0 auto;padding:40px 25px;">
    <h1 style="font-size:22px;margin:0 0 12px;">Pagamento confirmado ✅</h1>
    <p style="font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 20px;">
      Olá${name ? `, ${name}` : ""}! Recebemos seu pagamento com sucesso.
    </p>
    <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;"><strong>Valor:</strong> R$ ${formatBRL(amount)}</p>
      <p style="margin:0;font-size:14px;"><strong>Confirmado em:</strong> ${paidAt}</p>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#52525b;margin:0 0 20px;">
      Seu acesso à plataforma continua liberado. Obrigado por seguir com a NOEXCUSE!
    </p>
    <a href="${SITE_URL}/cliente/plano-creditos" style="display:inline-block;background:#E2233B;color:#ffffff;font-size:14px;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:600;">
      Ver área de pagamentos →
    </a>
    <p style="font-size:12px;color:#71717a;margin:32px 0 0;">Dúvidas? WhatsApp (44) 9112-9613</p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });
  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const { payment_id, organization_id, user_email, user_name, amount, paid_at } = await req.json();
    if (!payment_id || !user_email || amount == null) {
      return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return new Response(JSON.stringify({ error: "email_not_configured" }), { status: 500, headers });

    const admin = createClient(supabaseUrl, serviceKey);
    const triggerKey = `payment_confirmed:${payment_id}`;

    const { data: existing } = await admin
      .from("email_campaigns").select("id").eq("trigger_event", triggerKey).maybeSingle();
    if (existing) return new Response(JSON.stringify({ skipped: true }), { headers });

    const resp = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [user_email],
        subject: "Pagamento confirmado — sua plataforma segue ativa",
        html: buildHtml(user_name || "", Number(amount), paid_at || new Date().toLocaleDateString("pt-BR")),
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error("[send-payment-confirmed] Resend error:", resp.status, body);
      return new Response(JSON.stringify({ error: "send_failed" }), { status: 500, headers });
    }
    await admin.from("email_campaigns").insert({
      trigger_event: triggerKey,
      recipient_email: user_email,
      organization_id: organization_id || null,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    console.error("send-payment-confirmed error", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers });
  }
});
