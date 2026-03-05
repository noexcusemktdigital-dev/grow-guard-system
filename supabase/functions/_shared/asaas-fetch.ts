/**
 * Shared helper to route Asaas API calls through a static IP proxy.
 * - Injects required User-Agent header (mandatory for accounts created after 13/06/2024)
 * - Validates proxy URL before using it
 * - Falls back to direct fetch if proxy fails or is invalid
 */
export function asaasFetch(url: string, options?: RequestInit): Promise<Response> {
  const proxyUrl = Deno.env.get("ASAAS_PROXY_URL");

  // Inject User-Agent header (required by Asaas for new accounts)
  const headers = new Headers(options?.headers);
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "NOE-Platform");
  }
  const patchedOptions = { ...options, headers };

  if (proxyUrl && /^https?:\/\/.+/.test(proxyUrl.trim())) {
    try {
      const client = Deno.createHttpClient({ proxy: { url: proxyUrl.trim() } });
      return fetch(url, { ...patchedOptions, client } as any).catch((err) => {
        console.warn(`[asaasFetch] Proxy fetch failed, falling back to direct: ${err.message}`);
        return fetch(url, patchedOptions);
      });
    } catch (err: any) {
      console.warn(`[asaasFetch] Failed to create proxy client, using direct fetch: ${err.message}`);
    }
  } else if (proxyUrl) {
    console.warn(`[asaasFetch] Invalid ASAAS_PROXY_URL ("${proxyUrl}"), ignoring proxy`);
  }

  return fetch(url, patchedOptions);
}
