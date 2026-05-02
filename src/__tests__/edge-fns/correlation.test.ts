/**
 * correlation — testa _shared/correlation.ts (inline, sem imports Deno)
 * 12 asserts: newRequestContext, makeLogger, withCorrelationHeader
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Helper inline (espelho de _shared/correlation.ts) ───────────────────────

interface RequestContext {
  correlationId: string;
  fnName: string;
  startedAt: number;
}

function getCorrelationId(req: Request): string {
  return req.headers.get('x-request-id') ??
         req.headers.get('x-correlation-id') ??
         crypto.randomUUID();
}

function newRequestContext(req: Request, fnName: string): RequestContext {
  return {
    correlationId: getCorrelationId(req),
    fnName,
    startedAt: Date.now(),
  };
}

function makeLogger(ctx: RequestContext) {
  const fmt = (level: string, msg: string, extra?: Record<string, unknown>) => {
    const log = {
      level,
      ts: new Date().toISOString(),
      correlation_id: ctx.correlationId,
      fn: ctx.fnName,
      duration_ms: Date.now() - ctx.startedAt,
      msg,
      ...extra,
    };
    return JSON.stringify(log);
  };
  return {
    info: (msg: string, extra?: Record<string, unknown>) => console.log(fmt('info', msg, extra)),
    warn: (msg: string, extra?: Record<string, unknown>) => console.warn(fmt('warn', msg, extra)),
    error: (msg: string, extra?: Record<string, unknown>) => console.error(fmt('error', msg, extra)),
    debug: (msg: string, extra?: Record<string, unknown>) => console.log(fmt('debug', msg, extra)),
  };
}

function withCorrelationHeader(
  ctx: RequestContext,
  headers: Record<string, string>
): Record<string, string> {
  return { ...headers, 'x-request-id': ctx.correlationId };
}

// ────────────────────────────────────────────────────────────────────────────

describe('correlation', () => {
  describe('newRequestContext / getCorrelationId', () => {
    it('retorna x-request-id quando presente', () => {
      const req = new Request('https://x.com', { headers: { 'x-request-id': 'abc-123' } });
      const ctx = newRequestContext(req, 'fn-test');
      expect(ctx.correlationId).toBe('abc-123');
    });

    it('aceita fallback x-correlation-id quando x-request-id ausente', () => {
      const req = new Request('https://x.com', { headers: { 'x-correlation-id': 'def-456' } });
      const ctx = newRequestContext(req, 'fn-test');
      expect(ctx.correlationId).toBe('def-456');
    });

    it('gera UUID válido quando nenhum header está presente', () => {
      const req = new Request('https://x.com');
      const ctx = newRequestContext(req, 'fn-test');
      expect(ctx.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('x-request-id tem precedência sobre x-correlation-id', () => {
      const req = new Request('https://x.com', {
        headers: { 'x-request-id': 'req-id', 'x-correlation-id': 'corr-id' },
      });
      expect(newRequestContext(req, 'fn').correlationId).toBe('req-id');
    });

    it('popula fnName e startedAt corretamente', () => {
      const before = Date.now();
      const ctx = newRequestContext(new Request('https://x.com'), 'my-fn');
      const after = Date.now();
      expect(ctx.fnName).toBe('my-fn');
      expect(ctx.startedAt).toBeGreaterThanOrEqual(before);
      expect(ctx.startedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('makeLogger', () => {
    beforeEach(() => vi.restoreAllMocks());

    it('emite JSON estruturado com level=info, fn, msg e correlation_id', () => {
      const req = new Request('https://x.com', { headers: { 'x-request-id': 'test-corr' } });
      const ctx = newRequestContext(req, 'test-fn');
      const log = makeLogger(ctx);
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      log.info('hello world');
      expect(spy).toHaveBeenCalledOnce();
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed.level).toBe('info');
      expect(parsed.fn).toBe('test-fn');
      expect(parsed.msg).toBe('hello world');
      expect(parsed.correlation_id).toBe('test-corr');
      expect(parsed.duration_ms).toBeGreaterThanOrEqual(0);
      expect(typeof parsed.ts).toBe('string');
    });

    it('warn usa console.warn com level=warn', () => {
      const ctx = newRequestContext(new Request('https://x.com'), 'fn');
      const log = makeLogger(ctx);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      log.warn('atenção');
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed.level).toBe('warn');
      expect(parsed.msg).toBe('atenção');
    });

    it('error usa console.error com level=error', () => {
      const ctx = newRequestContext(new Request('https://x.com'), 'fn');
      const log = makeLogger(ctx);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      log.error('algo errado', { code: 500 });
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed.level).toBe('error');
      expect(parsed.code).toBe(500);
    });

    it('extra fields são espalhados no objeto de log', () => {
      const ctx = newRequestContext(new Request('https://x.com'), 'fn');
      const log = makeLogger(ctx);
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      log.info('msg', { extra_key: 'extra_val' });
      const parsed = JSON.parse(spy.mock.calls[0][0]);
      expect(parsed.extra_key).toBe('extra_val');
    });
  });

  describe('withCorrelationHeader', () => {
    it('adiciona x-request-id aos headers existentes', () => {
      const ctx = { correlationId: 'my-uuid', fnName: 'fn', startedAt: 0 };
      const result = withCorrelationHeader(ctx, { 'Content-Type': 'application/json' });
      expect(result['Content-Type']).toBe('application/json');
      expect(result['x-request-id']).toBe('my-uuid');
    });

    it('sobrescreve x-request-id se já existia nos headers', () => {
      const ctx = { correlationId: 'new-id', fnName: 'fn', startedAt: 0 };
      const result = withCorrelationHeader(ctx, { 'x-request-id': 'old-id' });
      expect(result['x-request-id']).toBe('new-id');
    });

    it('funciona com headers vazios', () => {
      const ctx = { correlationId: 'only-id', fnName: 'fn', startedAt: 0 };
      const result = withCorrelationHeader(ctx, {});
      expect(result).toEqual({ 'x-request-id': 'only-id' });
    });
  });
});
