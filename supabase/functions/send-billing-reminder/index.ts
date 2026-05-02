import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { maskEmail } from '../_shared/redact.ts';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'NOEXCUSE <financeiro@noexcusedigital.com.br>';

interface ReminderPayload {
  type: 'client' | 'franchisee' | 'blocked';
  org_id?: string;
  due_date?: string;
  amount: number;
  user_email: string;
  user_name?: string;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildClientReminder(name: string, due: string, amount: number) {
  return {
    subject: 'Sua mensalidade vence em 3 dias — mantenha sua plataforma ativa',
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
  <h1 style="font-size: 22px; margin: 0 0 16px;">Olá, ${name}!</h1>
  <p style="font-size: 15px; line-height: 1.6;">Sua mensalidade da plataforma NOEXCUSE vence em <strong>3 dias (${due})</strong>.</p>
  <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0 0 8px; font-size: 14px;"><strong>Valor:</strong> R$ ${formatBRL(amount)}</p>
    <p style="margin: 0; font-size: 14px;"><strong>Vencimento:</strong> ${due}</p>
  </div>
  <p style="font-size: 14px; line-height: 1.6;">Mantenha o pagamento em dia para continuar com acesso completo a todas as ferramentas da plataforma.</p>
  <a href="https://sistema.noexcusedigital.com.br/cliente/plano-creditos" style="display:inline-block; background:#7c3aed; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin: 16px 0;">Acessar área de pagamento →</a>
  <p style="font-size: 12px; color: #71717a; margin-top: 32px;">Dúvidas? Fale conosco pelo WhatsApp: (44) 9112-9613</p>
</div>`,
  };
}

function buildFranchiseeReminder(name: string, due: string, amount: number) {
  return {
    subject: 'Mensalidade do sistema vence em 3 dias',
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
  <h1 style="font-size: 22px; margin: 0 0 16px;">Olá, ${name}!</h1>
  <p style="font-size: 15px; line-height: 1.6;">A mensalidade do sistema da sua franquia vence em <strong>3 dias (${due})</strong>.</p>
  <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0 0 8px; font-size: 14px;"><strong>Valor:</strong> R$ ${formatBRL(amount)}</p>
    <p style="margin: 0; font-size: 14px;"><strong>Vencimento:</strong> ${due}</p>
  </div>
  <p style="font-size: 14px; line-height: 1.6;">Mantenha o pagamento em dia para continuar operando com todos os recursos da plataforma e atendendo seus clientes.</p>
  <a href="https://sistema.noexcusedigital.com.br/franqueado/financeiro" style="display:inline-block; background:#7c3aed; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin: 16px 0;">Acessar área financeira →</a>
  <p style="font-size: 12px; color: #71717a; margin-top: 32px;">Dúvidas? Fale conosco pelo WhatsApp: (44) 9112-9613</p>
</div>`,
  };
}

function buildBlockedEmail(name: string, amount: number) {
  return {
    subject: '🔴 Sua plataforma foi suspensa por falta de pagamento',
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
  <h1 style="font-size: 24px; margin: 0 0 16px; color: #dc2626;">⛔ Plataforma suspensa</h1>
  <p style="font-size: 15px; line-height: 1.6;">Olá${name ? `, ${name}` : ''}. Sua mensalidade está em atraso há mais de 2 dias e o acesso à plataforma foi <strong>suspenso</strong>.</p>
  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0; font-size: 16px; color: #991b1b;"><strong>Valor em aberto: R$ ${formatBRL(amount)}</strong></p>
  </div>
  <p style="font-size: 14px; line-height: 1.6;">Regularize para restaurar o acesso imediatamente.</p>
  <a href="https://sistema.noexcusedigital.com.br/cliente/plano-creditos" style="display:inline-block; background:#dc2626; color:white; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:600; margin: 16px 0;">Regularizar pagamento →</a>
  <p style="font-size: 12px; color: #71717a; margin-top: 32px;">Após o pagamento, o acesso é restaurado automaticamente em até 1 hora.<br>Dúvidas? WhatsApp: (44) 9112-9613</p>
</div>`,
  };
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'send-billing-reminder');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  let body: ReminderPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  if (!body.type || !body.user_email || typeof body.amount !== 'number') {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  const name = body.user_name || 'Empresário';
  const due = body.due_date || '';

  let template: { subject: string; html: string };
  if (body.type === 'client') template = buildClientReminder(name, due, body.amount);
  else if (body.type === 'franchisee') template = buildFranchiseeReminder(name, due, body.amount);
  else if (body.type === 'blocked') template = buildBlockedEmail(name, body.amount);
  else {
    return new Response(JSON.stringify({ error: 'Invalid type' }), {
      status: 400,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [body.user_email],
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Resend API error', { status: response.status, body: errorBody });
      return new Response(JSON.stringify({ error: `Email send failed: ${response.status}` }), {
        status: 502,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    console.log('Billing reminder sent', { type: body.type, to: maskEmail(body.user_email), id: result.id });

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Failed to send billing reminder', { error: errorMsg });
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
