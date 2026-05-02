// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'revoke-support-access');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const { token_id } = await req.json();
    if (!token_id) {
      return new Response(JSON.stringify({ error: 'token_id is required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Update via user's RLS context
    const { error: updateErr } = await supabase
      .from('support_access_tokens')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('id', token_id)
      .eq('is_active', true);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Log revocation
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get org_id from token
    const { data: tokenRow } = await adminClient
      .from('support_access_tokens')
      .select('organization_id')
      .eq('id', token_id)
      .single();

    if (tokenRow) {
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
      await adminClient.rpc('insert_support_access_log', {
        _token_id: token_id,
        _support_user_id: null,
        _organization_id: tokenRow.organization_id,
        _action: 'token_revoked',
        _metadata: { revoked_by: user.id },
        _ip_address: ipAddress,
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
