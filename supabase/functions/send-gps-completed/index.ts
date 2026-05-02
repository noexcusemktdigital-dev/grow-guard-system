// @ts-nocheck
/**
 * Notifies the client admin when their first GPS do Negócio is approved.
 * Idempotent via email_campaigns (trigger_event = gps_completed:<strategy_id>).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "NoExcuse Digital <noreply@noexcusedigital.com.br>";
const SITE_URL = "https://sistema.noexcusedigital.com.br";

function buildHtml(name: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#141a24;">
  <div style="max-width:560px;margin:0 auto;padding:40px 25px;">
    <h1 style="font-size:24px;margin:0 0 16px;">GPS do Negócio aprovado 🎯</h1>
    <p style="font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 18px;">
      ${name ? `${name}, parabéns!` : "Parabéns!"} Seu diagnóstico estratégico está pronto e <strong>todas as ferramentas da plataforma foram desbloqueadas</strong>: CRM, Tráfego Pago, Conteúdo IA, Sites, Disparos e Agentes de IA.
    </p>
    <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;">O que fazer agora:</p>
      <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.7;color:#52525b;">
        <li>Veja seu plano de marketing personalizado no GPS</li>
        <li>Configure o CRM e importe seus leads</li>
        <li>Crie o primeiro post com IA</li>
      </ol>
    </div>
    <a href="${SITE_URL}/cliente/inicio" style="display:inline-block;background:#E2233B;color:#ffffff;font-size:14px;border-radius:12px;padding:14px 28px;text-decoration:none;font-weight:600;">
      Acessar minha conta →
    </a>
    <p style="font-size:12px;color:#71717a;margin:32px 0 0;">Boas vendas!</p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });
  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const { strategy_id, organization_id } = await req.json();
    if (!strategy_id || !organization_id) {
      return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return new Response(JSON.stringify({ error: "email_not_configured" }), { status: 500, headers });

    const admin = createClient(supabaseUrl, serviceKey);
    const triggerKey = `gps_completed:${strategy_id}`;

    const { data: existing } = await admin
      .from("email_campaigns").select("id").eq("trigger_event", triggerKey).maybeSingle();
    if (existing) return new Response(JSON.stringify({ skipped: true }), { headers });

    // Find admin email of org
    const { data: members } = await admin.rpc("get_org_members_with_email", { _org_id: organization_id });
    const target = (members || []).find((m: any) => m.role === "cliente_admin") || (members || [])[0];
    if (!target?.email) return new Response(JSON.stringify({ skipped: true, reason: "no_admin" }), { headers });

    const resp = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [target.email],
        subject: "GPS aprovado — sua plataforma está liberada 🎯",
        html: buildHtml(target.full_name || ""),
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error("[send-gps-completed] Resend error:", resp.status, body);
      return new Response(JSON.stringify({ error: "send_failed" }), { status: 500, headers });
    }
    await admin.from("email_campaigns").insert({
      trigger_event: triggerKey,
      recipient_email: target.email,
      organization_id,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    console.error("send-gps-completed error", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers });
  }
});
