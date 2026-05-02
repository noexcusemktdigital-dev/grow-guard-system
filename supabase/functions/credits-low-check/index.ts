// @ts-nocheck
/**
 * Daily cron: detect organizations with credit balance < 15% of their plan total
 * (or absolute <= 50 as a floor for trial) and trigger the credits_low campaign — once every 7 days per org.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkCronSecret } from '../_shared/cron-auth.ts';

// Plan → credit allotment (must mirror src/constants/plans.ts CRM_LEAD_LIMITS-style table for credits)
const PLAN_CREDITS: Record<string, number> = {
  trial: 200,
  starter: 800,
  pro: 5000,
  enterprise: 999999,
};
const LOW_THRESHOLD_PCT = 0.15;
const ABSOLUTE_FLOOR = 50;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: getCorsHeaders(req) });
  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  const authError = checkCronSecret(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Pull every wallet with positive balance, then filter by per-plan threshold below.
    const { data: wallets } = await admin
      .from('credit_wallets')
      .select('organization_id, balance')
      .gt('balance', 0);

    let sent = 0;
    let skipped = 0;

    for (const w of wallets || []) {
      // Resolve plan total to compute 15% threshold
      const { data: sub } = await admin
        .from('subscriptions')
        .select('plan')
        .eq('organization_id', w.organization_id)
        .eq('status', 'active')
        .maybeSingle();
      const planTotal = PLAN_CREDITS[(sub as any)?.plan || 'starter'] ?? PLAN_CREDITS.starter;
      const threshold = Math.max(ABSOLUTE_FLOOR, Math.floor(planTotal * LOW_THRESHOLD_PCT));
      if (w.balance > threshold) {
        skipped++;
        continue;
      }

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
    console.error('credits-low-check error', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers });
  }
});
