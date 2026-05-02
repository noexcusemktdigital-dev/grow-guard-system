/**
 * Wrapper para supabase.functions.invoke que injeta x-request-id automaticamente.
 * Garante que toda call de edge fn tem correlation ID propagado para logs.
 *
 * Uso:
 *   import { invokeEdge } from '@/lib/edge';
 *   const { data, error, requestId } = await invokeEdge('generate-content', {
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
}

export interface InvokeEdgeResult<T = any> {
  data: T | null;
  error: Error | null;
  requestId: string;
}

export async function invokeEdge<T = any>(
  fnName: string,
  options: InvokeEdgeOptions = {}
): Promise<InvokeEdgeResult<T>> {
  const requestId = crypto.randomUUID();
  const headers = {
    "x-request-id": requestId,
    ...(options.headers ?? {}),
  };

  try {
    const result = await supabase.functions.invoke(fnName, {
      body: options.body as any,
      headers,
      method: options.method,
    });
    return { data: result.data, error: result.error, requestId };
  } catch (err) {
    return { data: null, error: err as Error, requestId };
  }
}
