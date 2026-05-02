// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'NOEXCUSE <ola@noexcusedigital.com.br>';
const APP_BASE = 'https://sistema.noexcusedigital.com.br';

interface CampaignPayload {
  trigger_event: string;
  organization_id: string;
  user_id?: string | null;
  metadata?: Record<string, unknown>;
  // Optional: explicit dedup key (defaults to `${trigger_event}:${organization_id}`)
  dedup_key?: string;
}

function shell(title: string, bodyHtml: string): string {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a; background:#ffffff;">
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px" />
  <p style="font-size:12px;color:#71717a;margin:0">Você recebeu este email porque está cadastrado na plataforma NOEXCUSE.</p>
  <p style="font-size:12px;color:#71717a;margin:4px 0 0">Dúvidas? WhatsApp (44) 9112-9613</p>
</div>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="background:#e11d48;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;font-weight:600">${label}</a>`;
}

function buildEmail(event: string, name: string, meta: Record<string, any>): { subject: string; html: string } | null {
  const dashboard = `${APP_BASE}/cliente/dashboard`;
  const gpsUrl = `${APP_BASE}/cliente/gps-do-negocio`;
  const creditsUrl = `${APP_BASE}/cliente/plano-creditos`;
  const upgradeUrl = `${APP_BASE}/cliente/plano-creditos`;

  switch (event) {
    case 'account_created':
      return {
        subject: 'Bem-vindo à NOEXCUSE — sua plataforma de marketing está pronta 🚀',
        html: shell('Bem-vindo', `
          <h2 style="font-size:22px;margin:0 0 12px">Olá, ${name}! Sua conta está ativa.</h2>
          <p style="font-size:15px;line-height:1.6">Você acabou de dar um passo importante para o crescimento do seu negócio.</p>
          <p style="font-size:15px;line-height:1.6">Aqui na NOEXCUSE, você tem tudo para fazer seu marketing funcionar de verdade:</p>
          <ul style="font-size:15px;line-height:1.8">
            <li>✅ CRM completo para gestão de leads</li>
            <li>✅ Estratégia de marketing personalizada com IA</li>
            <li>✅ Tráfego pago, redes sociais, sites e muito mais</li>
          </ul>
          <p style="font-size:15px;line-height:1.6"><strong>Próximo passo:</strong> Configure o GPS do Negócio para gerar sua estratégia personalizada.</p>
          ${btn(gpsUrl, 'Configurar meu GPS agora →')}
        `),
      };
    case 'gps_completed':
      return {
        subject: 'Parabéns! Você já entende o que separa negócios que crescem dos que estagnam',
        html: shell('GPS concluído', `
          <h2 style="font-size:22px;margin:0 0 12px">Seu GPS do Negócio está configurado, ${name}! 🎯</h2>
          <p style="font-size:15px;line-height:1.6">Você acaba de provar que entende algo que a maioria dos empresários ignora:</p>
          <blockquote style="border-left:4px solid #e11d48;padding-left:16px;margin:20px 0;color:#3f3f46;font-size:15px">
            <strong>"Negócios que crescem têm estratégia, métricas e dados. Os que estacionam, operam no improviso."</strong>
          </blockquote>
          <p style="font-size:15px;line-height:1.6">Agora que sua estratégia está definida, é hora de executar:</p>
          <ul style="font-size:15px;line-height:1.8">
            <li>📊 Configure suas Metas na ferramenta Metas</li>
            <li>👥 Importe seus primeiros leads no CRM</li>
            <li>📱 Conecte suas redes sociais</li>
          </ul>
          <p style="font-size:15px;line-height:1.6">Cada ferramenta que você ativa reduz custo, otimiza operação e gera dados para crescer com menos esforço.</p>
          ${btn(dashboard, 'Acessar minha plataforma →')}
        `),
      };
    case 'first_payment':
      return {
        subject: 'Investimento confirmado — você tomou a decisão certa 💪',
        html: shell('Pagamento confirmado', `
          <h2 style="font-size:22px;margin:0 0 12px">Parabéns pelo investimento no seu negócio, ${name}!</h2>
          <p style="font-size:15px;line-height:1.6">Assinar um plano é o sinal mais claro de que você leva o crescimento do seu negócio a sério.</p>
          <p style="font-size:15px;line-height:1.6">A partir de agora, você tem acesso completo a:</p>
          <ul style="font-size:15px;line-height:1.8">
            <li>🤖 IA gerando estratégias, conteúdos e análises</li>
            <li>📊 Dados reais do seu tráfego, leads e vendas</li>
            <li>🎯 Ferramentas integradas que trabalham juntas</li>
          </ul>
          <p style="font-size:15px;line-height:1.6">Empresas que usam dados para decidir crescem 3x mais rápido que as que operam por intuição.</p>
          ${btn(dashboard, 'Explorar minha plataforma →')}
        `),
      };
    case 'credits_low': {
      const credits = meta.credits ?? meta.balance ?? 0;
      return {
        subject: '⚠️ Seus créditos estão acabando — não perca o ritmo',
        html: shell('Créditos baixos', `
          <h2 style="font-size:22px;margin:0 0 12px">Atenção, ${name}: você tem apenas ${credits} créditos restantes</h2>
          <p style="font-size:15px;line-height:1.6">Seus créditos estão acabando. Isso significa que em breve você não conseguirá gerar conteúdo, artes e estratégias com IA.</p>
          <p style="font-size:15px;line-height:1.6">Não perca o ritmo agora que você está no caminho certo.</p>
          <p style="font-size:15px;line-height:1.6"><strong>Recarregue agora e continue:</strong></p>
          ${btn(creditsUrl, 'Recarregar créditos →')}
        `),
      };
    }
    case 'upgrade_suggestion': {
      const percent = meta.percent ?? 80;
      const nextPlan = meta.next_plan ?? 'superior';
      const nextCredits = meta.next_credits ?? '—';
      const diff = meta.diff ?? '2';
      return {
        subject: 'Você está aproveitando bem a plataforma — veja o próximo nível 🚀',
        html: shell('Upgrade', `
          <h2 style="font-size:22px;margin:0 0 12px">${name}, você está pronto para o próximo passo</h2>
          <p style="font-size:15px;line-height:1.6">Você usou ${percent}% dos seus créditos este mês. Isso mostra que você está extraindo valor real da plataforma.</p>
          <p style="font-size:15px;line-height:1.6">Com o plano <strong>${nextPlan}</strong>, você teria:</p>
          <ul style="font-size:15px;line-height:1.8">
            <li>⚡ ${nextCredits} créditos por mês (${diff}x mais)</li>
            <li>👥 Mais usuários na equipe</li>
            <li>🔓 Funcionalidades exclusivas desbloqueadas</li>
          </ul>
          ${btn(upgradeUrl, 'Ver planos →')}
        `),
      };
    }
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'send-campaign-email');
  const log = makeLogger(ctx);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');

    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500, headers });
    }

    const payload = (await req.json()) as CampaignPayload;
    const { trigger_event, organization_id, user_id, metadata = {} } = payload;

    if (!trigger_event || !organization_id) {
      return new Response(JSON.stringify({ error: 'trigger_event and organization_id required' }), { status: 400, headers });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Idempotency: dedup_key (or default org+event) — skip if already sent
    const dedupKey = payload.dedup_key || `${trigger_event}:${organization_id}`;
    const { data: existing } = await admin
      .from('email_campaigns')
      .select('id')
      .eq('trigger_event', dedupKey)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'already_sent' }), { headers });
    }

    // Resolve recipient: explicit user_id, or first cliente_admin of org
    let recipientEmail: string | null = null;
    let recipientName = 'Empresário';

    if (user_id) {
      const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user_id).maybeSingle();
      const { data: authUser } = await admin.auth.admin.getUserById(user_id);
      recipientEmail = authUser?.user?.email ?? null;
      recipientName = profile?.full_name?.split(' ')?.[0] || recipientName;
    }

    if (!recipientEmail) {
      const { data: members } = await admin.rpc('get_org_members_with_email', { _org_id: organization_id });
      const target = (members || []).find((m: any) => m.role === 'cliente_admin') || (members || [])[0];
      if (target?.email) {
        recipientEmail = target.email;
        recipientName = (target.full_name || '').split(' ')[0] || recipientName;
      }
    }

    if (!recipientEmail) {
      return new Response(JSON.stringify({ ok: false, error: 'no_recipient' }), { status: 422, headers });
    }

    const email = buildEmail(trigger_event, recipientName, metadata);
    if (!email) {
      return new Response(JSON.stringify({ error: `Unknown trigger_event: ${trigger_event}` }), { status: 400, headers });
    }

    const resp = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [recipientEmail],
        subject: email.subject,
        html: email.html,
      }),
    });

    const respText = await resp.text();
    if (!resp.ok) {
      console.error('Resend error', resp.status, respText);
      await admin.from('email_campaigns').insert({
        trigger_event: `${dedupKey}:failed:${Date.now()}`,
        organization_id,
        user_id: user_id ?? null,
        recipient_email: recipientEmail,
        status: 'failed',
        metadata: { ...metadata, error: respText },
      });
      return new Response(JSON.stringify({ ok: false, error: 'send_failed', detail: respText }), { status: 502, headers });
    }

    await admin.from('email_campaigns').insert({
      trigger_event: dedupKey,
      organization_id,
      user_id: user_id ?? null,
      recipient_email: recipientEmail,
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata,
    });

    return new Response(JSON.stringify({ ok: true, sent_to: recipientEmail }), { headers });
  } catch (err) {
    console.error('send-campaign-email error', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers });
  }
});
