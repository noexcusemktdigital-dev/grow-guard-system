/**
 * job-failures — testa _shared/job-failures.ts
 * 8 asserts: logJobFailure (mock Supabase) e withJobFailureLog
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase createClient ────────────────────────────────────────────────

const mockRpc = vi.fn().mockResolvedValue({ error: null });
const mockCreateClient = vi.fn().mockReturnValue({ rpc: mockRpc });

// ── Helper inline (espelho de _shared/job-failures.ts sem imports Deno) ─────

interface JobFailureContext {
  jobName: string;
  jobKind?: 'cron' | 'webhook' | 'edge_fn' | 'worker';
  payload?: unknown;
  organizationId?: string | null;
  correlationId?: string | null;
}

async function logJobFailure(ctx: JobFailureContext, error: unknown): Promise<void> {
  try {
    const sb = mockCreateClient('url', 'key');
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

async function withJobFailureLog<T>(
  ctx: JobFailureContext, handler: () => Promise<T>
): Promise<T> {
  try {
    return await handler();
  } catch (err) {
    await logJobFailure(ctx, err);
    throw err;
  }
}

// ────────────────────────────────────────────────────────────────────────────

describe('job-failures', () => {
  beforeEach(() => {
    mockRpc.mockClear();
    mockCreateClient.mockClear();
  });

  describe('logJobFailure', () => {
    it('chama rpc com jobName e message do Error', async () => {
      const err = new Error('timeout no conector');
      await logJobFailure({ jobName: 'quote-worker' }, err);
      expect(mockRpc).toHaveBeenCalledOnce();
      const args = mockRpc.mock.calls[0][1];
      expect(args.p_job_name).toBe('quote-worker');
      expect(args.p_error_message).toBe('timeout no conector');
    });

    it('converte string error para mensagem', async () => {
      await logJobFailure({ jobName: 'cron-job' }, 'string error');
      const args = mockRpc.mock.calls[0][1];
      expect(args.p_error_message).toBe('string error');
      expect(args.p_error_stack).toBeNull();
    });

    it('propaga organizationId e correlationId', async () => {
      await logJobFailure({
        jobName: 'webhook',
        organizationId: 'org-123',
        correlationId: 'corr-abc',
        jobKind: 'webhook',
      }, new Error('fail'));
      const args = mockRpc.mock.calls[0][1];
      expect(args.p_organization_id).toBe('org-123');
      expect(args.p_correlation_id).toBe('corr-abc');
      expect(args.p_job_kind).toBe('webhook');
    });

    it('usa jobKind=cron como default', async () => {
      await logJobFailure({ jobName: 'test' }, new Error('x'));
      const args = mockRpc.mock.calls[0][1];
      expect(args.p_job_kind).toBe('cron');
    });

    it('não propaga exceção se rpc falhar (não-bloqueante)', async () => {
      mockRpc.mockRejectedValueOnce(new Error('db down'));
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // não deve lançar
      await expect(logJobFailure({ jobName: 'test' }, new Error('x'))).resolves.toBeUndefined();
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[logJobFailure]'), expect.anything());
      spy.mockRestore();
    });
  });

  describe('withJobFailureLog', () => {
    it('retorna resultado do handler em caso de sucesso', async () => {
      const result = await withJobFailureLog({ jobName: 'job' }, async () => 'success');
      expect(result).toBe('success');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('chama logJobFailure e re-lança erro em caso de falha', async () => {
      const err = new Error('handler failed');
      await expect(
        withJobFailureLog({ jobName: 'failing-job' }, async () => { throw err; })
      ).rejects.toThrow('handler failed');
      expect(mockRpc).toHaveBeenCalledOnce();
      const args = mockRpc.mock.calls[0][1];
      expect(args.p_job_name).toBe('failing-job');
    });

    it('preserva o erro original ao re-lançar', async () => {
      class CustomError extends Error {}
      const original = new CustomError('specific error');
      let caught: unknown;
      try {
        await withJobFailureLog({ jobName: 'job' }, async () => { throw original; });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBe(original);
    });
  });
});
