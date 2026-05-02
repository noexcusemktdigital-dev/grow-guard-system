// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'generate-support-access');
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

    const _rl = await checkRateLimit(user.id, null, 'generate-support-access', { windowSeconds: 60, maxRequests: 5 });
    if (!_rl.allowed) return rateLimitResponse(_rl, cors);

    const body = await req.json();
    const { duration_minutes, access_level, ticket_id, organization_id } = body;

    if (!duration_minutes || !organization_id) {
      return new Response(JSON.stringify({ error: 'duration_minutes and organization_id are required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    if (duration_minutes < 1 || duration_minutes > 1440) {
      return new Response(JSON.stringify({ error: 'Duration must be between 1 and 1440 minutes' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    if (access_level && !['read_only', 'full'].includes(access_level)) {
      return new Response(JSON.stringify({ error: 'Invalid access_level' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Generate secure token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const tokenPlain = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tokenPlain));
    const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const expiresAt = new Date(Date.now() + duration_minutes * 60 * 1000).toISOString();
    const ipCreated = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || null;

    // Insert token
    const { data: token, error: insertErr } = await supabase
      .from('support_access_tokens')
      .insert({
        organization_id,
        created_by_user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        access_level: access_level || 'read_only',
        ip_created: ipCreated,
        ticket_id: ticket_id || null,
      })
      .select('id')
      .single();

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Log creation
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    await adminClient.rpc('insert_support_access_log', {
      _token_id: token.id,
      _support_user_id: null,
      _organization_id: organization_id,
      _action: 'token_created',
      _metadata: { created_by: user.id, duration_minutes, access_level: access_level || 'read_only' },
      _ip_address: ipCreated,
    });

    // Create notification for org members
    const { data: members } = await adminClient
      .from('organization_memberships')
      .select('user_id')
      .eq('organization_id', organization_id);

    if (members?.length) {
      const notifications = members.map(m => ({
        user_id: m.user_id,
        organization_id,
        title: 'Acesso de suporte autorizado',
        message: `Acesso temporário de ${duration_minutes} minutos foi autorizado. Nível: ${access_level || 'read_only'}`,
        type: 'Segurança',
        action_url: '/cliente/configuracoes?tab=suporte',
      }));
      await adminClient.from('client_notifications').insert(notifications);
    }

    return new Response(JSON.stringify({
      token: tokenPlain,
      token_id: token.id,
      expires_at: expiresAt,
      access_level: access_level || 'read_only',
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
