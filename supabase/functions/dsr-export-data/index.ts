// @ts-nocheck
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/auth.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

/**
 * LGPD Art. 18 — Direito de portabilidade dos dados.
 *
 * Exporta JSON com todos os dados pessoais do titular:
 * - profile (via profiles.id = auth user id)
 * - organization_memberships (via user_id)
 * - crm_leads (via assigned_to)
 * - whatsapp_messages (via organizações do user)
 * - audit_logs (acessos do user)
 *
 * Auth: user exporta seus próprios dados.
 * super_admin pode exportar de outros via ?user_id=X
 *
 * SLA LGPD: 15 dias. Esta fn responde imediatamente.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: getCorsHeaders(req) });

  const ctx = newRequestContext(req, 'dsr-export-data');
  const log = makeLogger(ctx);
  log.info('dsr_export_requested');

  try {
    const { user, admin } = await requireAuth(req);

    // Determinar target_user_id
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('user_id') ?? user.id;

    if (targetUserId !== user.id) {
      // Apenas super_admin pode exportar dados de outro user
      const { data: prof } = await admin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (prof?.role !== 'super_admin') {
        throw new AuthError(403, 'only_super_admin_can_export_other_users');
      }
    }

    // Buscar profile do titular
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle();

    // Buscar memberships do titular
    const { data: memberships } = await admin
      .from('organization_memberships')
      .select('*')
      .eq('user_id', targetUserId);

    // IDs das orgs do titular para queries org-scoped
    const orgIds = (memberships ?? []).map((m: { organization_id: string }) => m.organization_id);

    // Buscar leads atribuídos ao titular
    const { data: leads } = await admin
      .from('crm_leads')
      .select('*')
      .eq('assigned_to', targetUserId)
      .limit(10000);

    // Buscar mensagens WhatsApp das orgs do titular (org-scoped, sem user_id direto)
    const { data: messages } = orgIds.length > 0
      ? await admin
          .from('whatsapp_messages')
          .select('*')
          .in('organization_id', orgIds)
          .limit(10000)
      : { data: [] };

    // Buscar audit_logs do titular
    const { data: auditLogs } = await admin
      .from('audit_logs')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(1000);

    const exportPayload = {
      meta: {
        exported_at: new Date().toISOString(),
        target_user_id: targetUserId,
        requested_by: user.id,
        format: 'json',
        legal_basis: 'LGPD Art. 18 — Portabilidade',
      },
      profile: profile ?? null,
      memberships: memberships ?? [],
      crm_leads: leads ?? [],
      whatsapp_messages: messages ?? [],
      audit_logs: auditLogs ?? [],
    };

    log.info('dsr_export_complete', {
      target: targetUserId,
      sizes: {
        memberships: (memberships ?? []).length,
        leads: (leads ?? []).length,
        messages: (messages ?? []).length,
        audit_logs: (auditLogs ?? []).length,
      },
    });

    return new Response(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: withCorrelationHeader(ctx, {
        ...getCorsHeaders(req),
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="dsr-export-${targetUserId}-${Date.now()}.json"`,
      }),
    });
  } catch (err) {
    log.error('dsr_export_error', { error: String(err) });
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
