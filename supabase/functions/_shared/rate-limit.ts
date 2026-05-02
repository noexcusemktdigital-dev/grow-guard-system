// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  resetAt: string;
  retryAfterSeconds: number;
}

/**
 * Verifica e incrementa rate limit por (userId, fnName).
 * Defaults conservadores: 30 req / 60s (1 req/2s sustained, allows burst).
 * Fail-open em erro de DB para nao derrubar producao.
 */
export async function checkRateLimit(
  userId: string,
  organizationId: string | null,
  fnName: string,
  config: RateLimitConfig = { windowSeconds: 60, maxRequests: 30 }
): Promise<RateLimitResult> {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data, error } = await sb.rpc('check_and_increment_rate_limit', {
    p_user_id: userId,
    p_organization_id: organizationId,
    p_fn_name: fnName,
    p_window_seconds: config.windowSeconds,
    p_max_requests: config.maxRequests,
  });
  if (error || !data || data.length === 0) {
    console.warn(`[rate-limit] DB error, allowing: ${error?.message}`);
    return { allowed: true, currentCount: 0, resetAt: new Date().toISOString(), retryAfterSeconds: 0 };
  }
  const row = data[0];
  const resetAt = new Date(row.reset_at);
  return {
    allowed: row.allowed,
    currentCount: row.current_count,
    resetAt: resetAt.toISOString(),
    retryAfterSeconds: Math.max(0, Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
  };
}

/** Resposta 429 padronizada. */
export function rateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: 'rate_limit_exceeded',
      current_count: result.currentCount,
      reset_at: result.resetAt,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Reset': result.resetAt,
      },
    }
  );
}
