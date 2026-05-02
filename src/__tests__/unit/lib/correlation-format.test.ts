/**
 * T-CORRELATION-FORMAT — Valida formato de log do makeLogger (inline mirror)
 *
 * Verifica:
 * 1. log.warn — chama console.warn com JSON contendo level "warn"
 * 2. log.warn — JSON inclui correlation_id e fn corretos
 * 3. log.error — chama console.error com JSON contendo level "error"
 * 4. log.error — JSON inclui campo "msg" correto
 * 5. log.info — JSON inclui extra fields passados
 * 6. duration_ms é inteiro não-negativo (Math.floor)
 *
 * 6 asserts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mirror inline de _shared/correlation.ts ───────────────────────────────────
interface RequestContext {
  correlationId: string;
  fnName: string;
  startedAt: number;
}

function makeLogger(ctx: RequestContext) {
  const fmt = (level: string, msg: string, extra?: Record<string, unknown>) => {
    const log = {
      level,
      ts: new Date().toISOString(),
      correlation_id: ctx.correlationId,
      fn: ctx.fnName,
      duration_ms: Math.floor(Date.now() - ctx.startedAt),
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

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('makeLogger — log.warn', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let ctx: RequestContext;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    ctx = { correlationId: 'corr-abc-123', fnName: 'test-fn', startedAt: Date.now() };
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('1. chama console.warn exatamente uma vez', () => {
    const log = makeLogger(ctx);
    log.warn('algo suspeito');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('2. JSON emitido contém correlation_id e fn corretos', () => {
    const log = makeLogger(ctx);
    log.warn('teste de warn');

    const raw = warnSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(raw);
    expect(parsed.correlation_id).toBe('corr-abc-123');
    expect(parsed.fn).toBe('test-fn');
    expect(parsed.level).toBe('warn');
  });
});

describe('makeLogger — log.error', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let ctx: RequestContext;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    ctx = { correlationId: 'corr-err-999', fnName: 'err-fn', startedAt: Date.now() };
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('3. chama console.error com JSON contendo level "error"', () => {
    const log = makeLogger(ctx);
    log.error('falha crítica');

    const raw = errorSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(raw);
    expect(parsed.level).toBe('error');
  });

  it('4. JSON inclui campo "msg" com a mensagem passada', () => {
    const log = makeLogger(ctx);
    log.error('mensagem de erro específica');

    const raw = errorSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(raw);
    expect(parsed.msg).toBe('mensagem de erro específica');
  });
});

describe('makeLogger — log.info com extra fields', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let ctx: RequestContext;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    ctx = { correlationId: 'corr-info-xyz', fnName: 'info-fn', startedAt: Date.now() };
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('5. JSON inclui extra fields mesclados no log', () => {
    const log = makeLogger(ctx);
    log.info('operação ok', { userId: 'u-777', status: 200 });

    const raw = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(raw);
    expect(parsed.userId).toBe('u-777');
    expect(parsed.status).toBe(200);
  });

  it('6. duration_ms é inteiro não-negativo', () => {
    const log = makeLogger(ctx);
    log.info('check duration');

    const raw = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(raw);
    expect(Number.isInteger(parsed.duration_ms)).toBe(true);
    expect(parsed.duration_ms).toBeGreaterThanOrEqual(0);
  });
});
