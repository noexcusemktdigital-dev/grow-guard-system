import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkCronSecret } from '../_shared/cron-auth.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

/**
 * Cron job: runs daily, finds subscriptions/payments due in 3 days
 * and triggers billing-reminder emails (idempotent via email_campaigns).
 */
Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'billing-reminder-check');
  const log = makeLogger(ctx);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const authError = checkCronSecret(req);
  if (authError) return authError;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Target date: 3 days from today (yyyy-mm-dd)
  const target = new Date();
  target.setDate(target.getDate() + 3);
  const targetDateStr = target.toISOString().split('T')[0];

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  try {
    // 1) Client payments due in 3 days (status pending)
    const { data: clientPayments } = await admin
      .from('client_payments')
      .select('id, organization_id, amount, due_date')
      .eq('status', 'pending')
      .eq('due_date', targetDateStr);

    for (const cp of clientPayments || []) {
      const triggerKey = `billing_reminder_client:${cp.id}`;
      const { data: existing } = await admin
        .from('email_campaigns')
        .select('id')
        .eq('trigger_event', triggerKey)
        .maybeSingle();
      if (existing) {
        skippedCount++;
        continue;
      }

      // Find admin email for that org
      type OrgMember = { role: string; email?: string; full_name?: string };
      const { data: members } = await admin.rpc('get_org_members_with_email', { _org_id: cp.organization_id });
      const target = ((members || []) as OrgMember[]).find((m) => m.role === 'cliente_admin') || ((members || []) as OrgMember[])[0];
      if (!target?.email) {
        skippedCount++;
        continue;
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-billing-reminder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'client',
          org_id: cp.organization_id,
          due_date: cp.due_date,
          amount: Number(cp.amount || 0),
          user_email: target.email,
          user_name: target.full_name || 'Empresário',
        }),
      });

      if (resp.ok) {
        sentCount++;
        await admin.from('email_campaigns').insert({
          trigger_event: triggerKey,
          recipient_email: target.email,
          organization_id: cp.organization_id,
          status: 'sent',
        });
      } else {
        failedCount++;
      }
    }

    // 2) Franchisee system payments due in 3 days
    const { data: sysPayments } = await admin
      .from('franchisee_system_payments')
      .select('id, organization_id, amount, due_date')
      .eq('status', 'pending')
      .eq('due_date', targetDateStr);

    for (const sp of sysPayments || []) {
      const triggerKey = `billing_reminder_franchisee:${sp.id}`;
      const { data: existing } = await admin
        .from('email_campaigns')
        .select('id')
        .eq('trigger_event', triggerKey)
        .maybeSingle();
      if (existing) {
        skippedCount++;
        continue;
      }

      const { data: members } = await admin.rpc('get_org_members_with_email', { _org_id: sp.organization_id });
      const target = (members || [])[0];
      if (!target?.email) {
        skippedCount++;
        continue;
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-billing-reminder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'franchisee',
          org_id: sp.organization_id,
          due_date: sp.due_date,
          amount: Number(sp.amount || 0),
          user_email: target.email,
          user_name: target.full_name || 'Franqueado',
        }),
      });

      if (resp.ok) {
        sentCount++;
        await admin.from('email_campaigns').insert({
          trigger_event: triggerKey,
          recipient_email: target.email,
          organization_id: sp.organization_id,
          status: 'sent',
        });
      } else {
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, skipped: skippedCount, failed: failedCount, target_date: targetDateStr }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('billing-reminder-check error', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
