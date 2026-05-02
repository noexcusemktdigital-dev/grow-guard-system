/**
 * Daily cron: detect organizations with low credit balance (>0 and <=50)
 * and trigger the credits_low campaign email — once every 7 days per org.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkCronSecret } from '../_shared/cron-auth.ts';
import { logJobFailure } from '../_shared/job-failures.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'credits-low-check');
  const log = makeLogger(ctx);
  if (req.method === 'OPTIONS') return new Response(null, { headers: getCorsHeaders(req) });
  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  const authError = checkCronSecret(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: wallets } = await admin
      .from('credit_wallets')
      .select('organization_id, balance')
      .gt('balance', 0)
      .lte('balance', 50);

    let sent = 0;
    let skipped = 0;

    for (const w of wallets || []) {
      // Has a credits_low email been sent in the last 7 days?
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await admin
        .from('email_campaigns')
        .select('id')
        .eq('organization_id', w.organization_id)
        .like('trigger_event', 'credits_low:%')
        .gte('sent_at', sevenDaysAgo)
        .limit(1);

      if (recent && recent.length > 0) {
        skipped++;
        continue;
      }

      // Use a weekly bucket key for dedup so the next 7-day window can re-fire
      const weekBucket = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      const dedupKey = `credits_low:${w.organization_id}:w${weekBucket}`;

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-campaign-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger_event: 'credits_low',
          organization_id: w.organization_id,
          metadata: { credits: w.balance },
          dedup_key: dedupKey,
        }),
      });
      if (resp.ok) sent++;
      else skipped++;
    }

    return new Response(JSON.stringify({ ok: true, sent, skipped, total: (wallets || []).length }), { headers });
  } catch (err) {
    await logJobFailure({ jobName: 'credits-low-check', jobKind: 'cron' }, err);
    console.error('credits-low-check error', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers });
  }
});
