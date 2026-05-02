// @ts-nocheck
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/auth.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

/**
 * LGPD Art. 18 — Direito ao esquecimento.
 *
 * Soft-delete da conta + dados associados:
 * - organization_memberships.deleted_at = now() (todos do user)
 * - crm_leads.deleted_at = now() (leads assigned_to do user)
 *
 * finance_clients e whatsapp_messages são org-scoped e não pertencem
 * diretamente ao user — não são soft-deleted individualmente aqui.
 * A exclusão da conta (memberships) remove o acesso do user às orgs.
 *
 * Hard delete real ocorre em 6 meses via purge_soft_deleted() (LGPD-002).
 * organization_memberships: retenção de 2 anos por obrigação legal.
 *
 * Cria registro em dsr_requests para audit trail (compliance).
 *
 * Body: { confirm: 'DELETE_MY_ACCOUNT' } — proteção contra delete acidental.
 * Super_admin: body.target_user_id para operar em outro user.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: getCorsHeaders(req) });

  const ctx = newRequestContext(req, 'dsr-delete-account');
  const log = makeLogger(ctx);
  log.info('dsr_delete_requested');

  try {
    const { user, admin } = await requireAuth(req);
    const body = await req.json().catch(() => ({}));

    if (body.confirm !== 'DELETE_MY_ACCOUNT') {
      throw new AuthError(400, 'confirmation_required: send body { confirm: "DELETE_MY_ACCOUNT" }');
    }

    const targetUserId = body.target_user_id ?? user.id;

    if (targetUserId !== user.id) {
      const { data: prof } = await admin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (prof?.role !== 'super_admin') {
        throw new AuthError(403, 'only_super_admin_can_delete_other_users');
      }
    }

    const now = new Date().toISOString();
    const results: Record<string, number> = {};

    // Soft delete de organization_memberships (user_id)
    const { count: memCount, error: memErr } = await admin
      .from('organization_memberships')
      .update({ deleted_at: now })
      .eq('user_id', targetUserId)
      .is('deleted_at', null)
      .select('*', { count: 'exact', head: true });
    if (memErr) log.warn('soft_delete_failed', { table: 'organization_memberships', error: memErr.message });
    results['organization_memberships'] = memCount ?? 0;

    // Soft delete de crm_leads (assigned_to = user_id)
    const { count: leadsCount, error: leadsErr } = await admin
      .from('crm_leads')
      .update({ deleted_at: now })
      .eq('assigned_to', targetUserId)
      .is('deleted_at', null)
      .select('*', { count: 'exact', head: true });
    if (leadsErr) log.warn('soft_delete_failed', { table: 'crm_leads', error: leadsErr.message });
    results['crm_leads'] = leadsCount ?? 0;

    // Auditoria DSR
    const { error: dsrErr } = await admin.from('dsr_requests').insert({
      user_id: targetUserId,
      requested_by: user.id,
      request_type: 'delete',
      status: 'completed',
      details: results,
      processed_at: now,
    });
    if (dsrErr) log.warn('dsr_audit_insert_failed', { error: dsrErr.message });

    log.info('dsr_delete_complete', { target: targetUserId, results });

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Account soft-deleted. Hard delete in 6 months per retention policy.',
        details: results,
      }),
      {
        status: 200,
        headers: withCorrelationHeader(ctx, {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json',
        }),
      },
    );
  } catch (err) {
    log.error('dsr_delete_error', { error: String(err) });
    const status = err instanceof AuthError ? err.status : 500;
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'internal_error' }),
      {
        status,
        headers: withCorrelationHeader(ctx, {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json',
        }),
      },
    );
  }
});
