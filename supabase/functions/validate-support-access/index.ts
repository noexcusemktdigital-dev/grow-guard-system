// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'validate-support-access');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string' || token.length !== 64) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Hash the received token
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tokenRow, error } = await adminClient
      .from('support_access_tokens')
      .select('id, organization_id, expires_at, access_level, is_active, created_by_user_id')
      .eq('token_hash', tokenHash)
      .single();

    if (error || !tokenRow) {
      return new Response(JSON.stringify({ error: 'Token não encontrado' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    if (!tokenRow.is_active) {
      return new Response(JSON.stringify({ error: 'Token revogado ou expirado' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      // Auto-expire
      await adminClient.from('support_access_tokens').update({ is_active: false }).eq('id', tokenRow.id);
      return new Response(JSON.stringify({ error: 'Token expirado' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Get org info
    const { data: org } = await adminClient
      .from('organizations')
      .select('id, name, type')
      .eq('id', tokenRow.organization_id)
      .single();

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

    // Log access
    await adminClient.rpc('insert_support_access_log', {
      _token_id: tokenRow.id,
      _support_user_id: null,
      _organization_id: tokenRow.organization_id,
      _action: 'token_validated',
      _metadata: {},
      _ip_address: ipAddress,
    });

    return new Response(JSON.stringify({
      valid: true,
      token_id: tokenRow.id,
      organization_id: tokenRow.organization_id,
      organization_name: org?.name || '',
      access_level: tokenRow.access_level,
      expires_at: tokenRow.expires_at,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
