/**
 * Shared helper to route Asaas API calls through a static IP proxy.
 * If ASAAS_PROXY_URL is set, uses Deno.createHttpClient with proxy.
 * Otherwise falls back to standard fetch (useful for sandbox/dev).
 */
export function asaasFetch(url: string, options?: RequestInit): Promise<Response> {
  const proxyUrl = Deno.env.get("ASAAS_PROXY_URL");
  if (proxyUrl) {
    const client = Deno.createHttpClient({ proxy: { url: proxyUrl } });
    return fetch(url, { ...options, client } as any);
  }
  return fetch(url, options);
}
