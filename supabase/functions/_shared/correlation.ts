// Helper para propagar correlation_id (request tracing) em logs estruturados.
//
// Cada request recebe um ID único — propagado via header x-request-id (entrante)
// ou gerado se ausente. Retorna no response e usado em todos os logs da fn.
//
// Frontend deve enviar x-request-id no fetch para correlacionar com Sentry/GlitchTip.

export interface RequestContext {
  correlationId: string;
  fnName: string;
  startedAt: number;
}

export function getCorrelationId(req: Request): string {
  return req.headers.get('x-request-id') ??
         req.headers.get('x-correlation-id') ??
         crypto.randomUUID();
}

export function newRequestContext(req: Request, fnName: string): RequestContext {
  return {
    correlationId: getCorrelationId(req),
    fnName,
    startedAt: Date.now(),
  };
}

/** Logger estruturado bound ao request context. */
export function makeLogger(ctx: RequestContext) {
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

/** Adiciona x-request-id ao header de resposta. */
export function withCorrelationHeader(
  ctx: RequestContext,
  headers: Record<string, string>
): Record<string, string> {
  return { ...headers, 'x-request-id': ctx.correlationId };
}
