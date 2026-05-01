import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface JobFailureContext {
  jobName: string;
  jobKind?: 'cron' | 'webhook' | 'edge_fn' | 'worker';
  payload?: unknown;
  organizationId?: string | null;
  correlationId?: string | null;
}

/**
 * Registra falha de job na tabela job_failures.
 * Não-bloqueante: erros de log são suprimidos para não cascata.
 */
export async function logJobFailure(
  ctx: JobFailureContext, error: unknown
): Promise<void> {
  try {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    await sb.rpc('log_job_failure', {
      p_job_name: ctx.jobName,
      p_error_message: message,
      p_error_stack: stack ?? null,
      p_payload: ctx.payload ? JSON.parse(JSON.stringify(ctx.payload)) : null,
      p_organization_id: ctx.organizationId ?? null,
      p_correlation_id: ctx.correlationId ?? null,
      p_job_kind: ctx.jobKind ?? 'cron',
    });
  } catch (logErr) {
    console.error('[logJobFailure] failed to log:', logErr);
  }
}

/**
 * Wrapper: tenta executar handler, se falhar registra em job_failures e re-lança.
 */
export async function withJobFailureLog<T>(
  ctx: JobFailureContext, handler: () => Promise<T>
): Promise<T> {
  try {
    return await handler();
  } catch (err) {
    await logJobFailure(ctx, err);
    throw err;
  }
}
