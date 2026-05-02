// @ts-nocheck
/**
 * Notifies the franchisee when a client payment is confirmed and the 20% commission
 * was credited (or split via Asaas).
 * Idempotent via email_campaigns (trigger_event = franchisee_commission:<payment_id>).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "NOEXCUSE <financeiro@noexcusedigital.com.br>";
const SITE_URL = "https://sistema.noexcusedigital.com.br";

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function buildHtml(franchiseeName: string, clientName: string, total: number, commission: number) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#141a24;">
  <div style="max-width:560px;margin:0 auto;padding:40px 25px;">
    <h1 style="font-size:22px;margin:0 0 12px;">Comissão recebida 💰</h1>
    <p style="font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 18px;">
      Olá${franchiseeName ? `, ${franchiseeName}` : ""}! Um cliente da sua unidade pagou e a sua comissão já está disponível.
    </p>
    <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;"><strong>Cliente:</strong> ${clientName || "—"}</p>
      <p style="margin:0 0 8px;font-size:14px;"><strong>Valor pago:</strong> R$ ${formatBRL(total)}</p>
      <p style="margin:0;font-size:14px;color:#16a34a;"><strong>Sua comissão (20%):</strong> R$ ${formatBRL(commission)}</p>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#52525b;margin:0 0 20px;">
      O valor é creditado automaticamente via split na sua conta Asaas vinculada.
    </p>
    <a href="${SITE_URL}/franqueado/financeiro" style="display:inline-block;background:#E2233B;color:#ffffff;font-size:14px;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:600;">
      Ver financeiro →
    </a>
    <p style="font-size:12px;color:#71717a;margin:32px 0 0;">Dúvidas? WhatsApp (44) 9112-9613</p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });
  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const { payment_id, franchisee_email, franchisee_name, client_name, total_amount, commission_amount, organization_id } = await req.json();
    if (!payment_id || !franchisee_email || total_amount == null) {
      return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return new Response(JSON.stringify({ error: "email_not_configured" }), { status: 500, headers });

    const admin = createClient(supabaseUrl, serviceKey);
    const triggerKey = `franchisee_commission:${payment_id}`;
    const { data: existing } = await admin
      .from("email_campaigns").select("id").eq("trigger_event", triggerKey).maybeSingle();
    if (existing) return new Response(JSON.stringify({ skipped: true }), { headers });

    const resp = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [franchisee_email],
        subject: `Comissão recebida — R$ ${formatBRL(Number(commission_amount || 0))}`,
        html: buildHtml(franchisee_name || "", client_name || "", Number(total_amount), Number(commission_amount || total_amount * 0.2)),
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error("[send-franchisee-commission-email] Resend error:", resp.status, body);
      return new Response(JSON.stringify({ error: "send_failed" }), { status: 500, headers });
    }
    await admin.from("email_campaigns").insert({
      trigger_event: triggerKey,
      recipient_email: franchisee_email,
      organization_id: organization_id || null,
      status: "sent",
    });
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    console.error("send-franchisee-commission-email error", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers });
  }
});
