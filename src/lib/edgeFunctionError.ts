/**
 * Extracts the real error message from a Supabase FunctionsHttpError.
 * The SDK wraps non-2xx responses in a generic error; this helper
 * reads the JSON body from `error.context` (a Response object) to
 * surface the actual backend message.
 */
export async function extractEdgeFunctionError(error: unknown): Promise<Error> {
  const ctx = (error as any)?.context;
  if (ctx instanceof Response) {
    const body = await ctx.json().catch(() => null);
    return new Error(body?.error || (error as any)?.message || "Erro desconhecido");
  }
  return error instanceof Error ? error : new Error(String(error));
}
