// PERF-003: Shared Map-based deduplication cache for AI generation calls
// Prevents duplicate API calls for the same prompt within 30 minutes

const AI_CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, Promise<any>>()

/**
 * Build a stable cache key from an object payload.
 * Uses btoa(JSON) truncated to 64 chars — good enough for dedup, not cryptographic.
 */
export function aiCacheKey(payload: unknown): string {
  try {
    const json = JSON.stringify(payload)
    return btoa(encodeURIComponent(json)).slice(0, 64)
  } catch {
    return String(Date.now())
  }
}

/**
 * Wrap an async AI call with Map-based caching.
 * If the same key is already in-flight or was computed recently, returns the
 * cached promise instead of calling the factory again.
 */
export function withAICache<T>(key: string, factory: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    const promise = factory().catch((err) => {
      // Remove failed promises immediately so the next call retries
      cache.delete(key)
      throw err
    })
    cache.set(key, promise)
    // Auto-expire after TTL
    setTimeout(() => cache.delete(key), AI_CACHE_TTL_MS)
  }
  return cache.get(key) as Promise<T>
}
