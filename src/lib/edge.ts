/**
 * Wrapper para supabase.functions.invoke que injeta x-request-id automaticamente.
 * Garante que toda call de edge fn tem correlation ID propagado para logs.
 * Suporta retry com exponential backoff para erros 5xx / network errors.
 *
 * Uso:
 *   import { invokeEdge } from '@/lib/edge';
 *   const { data, error, requestId, attempts } = await invokeEdge('generate-content', {
 *     body: { ... }
 *   });
 *
 * Toast/log de erro pode incluir requestId pra ajudar debug:
 *   toast.error(`Erro ao gerar conteúdo (id: ${requestId.slice(0, 8)})`);
 */
import { supabase } from "@/lib/supabase";

export interface InvokeEdgeOptions {
  body?: unknown;
  headers?: Record<string, string>;
  method?: "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
  /** Tentativas adicionais em caso de 5xx ou network error. Default: 2 (3 total). */
  retries?: number;
  /** Base ms para backoff exponencial (default 500ms). */
  retryBaseMs?: number;
  /** Não retry em mutações não-idempotentes? Force false se body tem Idempotency-Key. */
  retryIdempotent?: boolean;
}

export interface InvokeEdgeResult<T = any> {
  data: T | null;
  error: Error | null;
  requestId: string;
  attempts: number;
}

const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504]);

export async function invokeEdge<T = any>(
  fnName: string,
  options: InvokeEdgeOptions = {}
): Promise<InvokeEdgeResult<T>> {
  const requestId = crypto.randomUUID();
  const headers = {
    "x-request-id": requestId,
    ...(options.headers ?? {}),
  };
  const maxRetries = options.retries ?? 2;
  const baseMs = options.retryBaseMs ?? 500;
  // Retry only for idempotent methods or when caller explicitly provides Idempotency-Key
  const hasIdempotencyKey = Object.keys(headers).some(
    (k) => k.toLowerCase() === "idempotency-key"
  );
  const isIdempotent = options.method === "GET" || hasIdempotencyKey;
  const allowRetry = options.retryIdempotent ?? isIdempotent;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    attempt++;
    try {
      const result = await supabase.functions.invoke(fnName, {
        body: options.body as any,
        headers,
        method: options.method,
      });

      if (result.error) {
        const status = (result.error as any).context?.status ?? 0;
        if (
          allowRetry &&
          attempt <= maxRetries &&
          (status === 0 || RETRYABLE_STATUS.has(status))
        ) {
          await sleep(baseMs * Math.pow(2, attempt - 1) + Math.random() * 100);
          lastError = result.error as Error;
          continue;
        }
        return { data: null, error: result.error as Error, requestId, attempts: attempt };
      }

      return { data: result.data, error: null, requestId, attempts: attempt };
    } catch (err) {
      lastError = err as Error;
      if (allowRetry && attempt <= maxRetries) {
        await sleep(baseMs * Math.pow(2, attempt - 1) + Math.random() * 100);
        continue;
      }
      return { data: null, error: err as Error, requestId, attempts: attempt };
    }
  }

  return {
    data: null,
    error: lastError ?? new Error("max_retries_exceeded"),
    requestId,
    attempts: attempt,
  };
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
