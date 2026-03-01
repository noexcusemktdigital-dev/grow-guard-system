/**
 * Shared helper to route Asaas API calls through a static IP proxy.
 * - Validates proxy URL before using it
 * - Falls back to direct fetch if proxy fails or is invalid
 */
export function asaasFetch(url: string, options?: RequestInit): Promise<Response> {
  const proxyUrl = Deno.env.get("ASAAS_PROXY_URL");

  if (proxyUrl && /^https?:\/\/.+/.test(proxyUrl)) {
    try {
      const client = Deno.createHttpClient({ proxy: { url: proxyUrl } });
      return fetch(url, { ...options, client } as any).catch((err) => {
        console.warn(`[asaasFetch] Proxy fetch failed, falling back to direct: ${err.message}`);
        return fetch(url, options);
      });
    } catch (err: any) {
      console.warn(`[asaasFetch] Failed to create proxy client, using direct fetch: ${err.message}`);
    }
  } else if (proxyUrl) {
    console.warn(`[asaasFetch] Invalid ASAAS_PROXY_URL ("${proxyUrl}"), ignoring proxy`);
  }

  return fetch(url, options);
}
