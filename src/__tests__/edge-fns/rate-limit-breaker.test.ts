/**
 * T6 CIRCUIT-BREAKER / RATE-LIMIT — Valida _shared/rate-limit.ts
 *
 * Código do helper copiado inline pois Vitest não roda Deno imports.
 * Quando _shared/rate-limit.ts for bundleável no frontend, substituir.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Tipos (espelho de rate-limit.ts) ─────────────────────────────────────────

interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  resetAt: string;
  retryAfterSeconds: number;
}

// ── Mock Supabase + RPC ───────────────────────────────────────────────────────

type MockRow = {
  allowed: boolean;
  current_count: number;
  reset_at: string;
};

function makeSupabaseMock(row: MockRow | null, dbError = false) {
  return {
    rpc: vi.fn().mockResolvedValue({
      data: row ? [row] : [],
      error: dbError ? { message: "DB connection failed" } : null,
    }),
  };
}

// ── Lógica inline do checkRateLimit (sem Deno env) ───────────────────────────

async function checkRateLimitWithClient(
  sb: { rpc: ReturnType<typeof vi.fn> },
  userId: string,
  organizationId: string | null,
  fnName: string,
  config: RateLimitConfig = { windowSeconds: 60, maxRequests: 30 }
): Promise<RateLimitResult> {
  const { data, error } = await sb.rpc("check_and_increment_rate_limit", {
    p_user_id: userId,
    p_organization_id: organizationId,
    p_fn_name: fnName,
    p_window_seconds: config.windowSeconds,
    p_max_requests: config.maxRequests,
  });
  if (error || !data || data.length === 0) {
    // Fail-open em erro de DB
    return {
      allowed: true,
      currentCount: 0,
      resetAt: new Date().toISOString(),
      retryAfterSeconds: 0,
    };
  }
  const row = data[0] as MockRow;
  const resetAt = new Date(row.reset_at);
  return {
    allowed: row.allowed,
    currentCount: row.current_count,
    resetAt: resetAt.toISOString(),
    retryAfterSeconds: Math.max(
      0,
      Math.ceil((resetAt.getTime() - Date.now()) / 1000)
    ),
  };
}

function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limit_exceeded",
      current_count: result.currentCount,
      reset_at: result.resetAt,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Reset": result.resetAt,
      },
    }
  );
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T6 RATE-LIMIT / CIRCUIT-BREAKER — checkRateLimit", () => {
  const RESET_AT = new Date(Date.now() + 60_000).toISOString();
  const USER_ID = "user-uuid-001";
  const ORG_ID = "org-uuid-001";
  const FN_NAME = "test-fn";

  describe("Happy path — dentro do limite", () => {
    it("retorna allowed=true quando abaixo do limite", async () => {
      const sb = makeSupabaseMock({
        allowed: true,
        current_count: 5,
        reset_at: RESET_AT,
      });
      const result = await checkRateLimitWithClient(sb, USER_ID, ORG_ID, FN_NAME);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(5);
    });

    it("chama RPC com parâmetros corretos", async () => {
      const sb = makeSupabaseMock({ allowed: true, current_count: 1, reset_at: RESET_AT });
      await checkRateLimitWithClient(sb, USER_ID, ORG_ID, FN_NAME, {
        windowSeconds: 120,
        maxRequests: 10,
      });
      expect(sb.rpc).toHaveBeenCalledWith("check_and_increment_rate_limit", {
        p_user_id: USER_ID,
        p_organization_id: ORG_ID,
        p_fn_name: FN_NAME,
        p_window_seconds: 120,
        p_max_requests: 10,
      });
    });

    it("aceita organizationId null (usuário sem org)", async () => {
      const sb = makeSupabaseMock({ allowed: true, current_count: 1, reset_at: RESET_AT });
      const result = await checkRateLimitWithClient(sb, USER_ID, null, FN_NAME);
      expect(result.allowed).toBe(true);
    });
  });

  describe("Error path — limite excedido", () => {
    it("retorna allowed=false quando limite atingido", async () => {
      const sb = makeSupabaseMock({
        allowed: false,
        current_count: 30,
        reset_at: RESET_AT,
      });
      const result = await checkRateLimitWithClient(sb, USER_ID, ORG_ID, FN_NAME);
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(30);
    });

    it("retorna retryAfterSeconds > 0 quando bloqueado", async () => {
      const futureReset = new Date(Date.now() + 30_000).toISOString();
      const sb = makeSupabaseMock({
        allowed: false,
        current_count: 30,
        reset_at: futureReset,
      });
      const result = await checkRateLimitWithClient(sb, USER_ID, ORG_ID, FN_NAME);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe("Edge path — fail-open em erro de DB", () => {
    it("retorna allowed=true quando DB retorna erro (fail-open)", async () => {
      const sb = makeSupabaseMock(null, true);
      const result = await checkRateLimitWithClient(sb, USER_ID, ORG_ID, FN_NAME);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(0);
    });

    it("retorna allowed=true quando RPC retorna data vazio (sem rows)", async () => {
      const sb = makeSupabaseMock(null, false);
      const result = await checkRateLimitWithClient(sb, USER_ID, ORG_ID, FN_NAME);
      expect(result.allowed).toBe(true);
    });
  });

  describe("rateLimitResponse — resposta 429 padronizada", () => {
    it("retorna status 429 quando rate limit excedido", () => {
      const result: RateLimitResult = {
        allowed: false,
        currentCount: 30,
        resetAt: RESET_AT,
        retryAfterSeconds: 45,
      };
      const response = rateLimitResponse(result, { "Access-Control-Allow-Origin": "*" });
      expect(response.status).toBe(429);
    });

    it("inclui header Retry-After na resposta 429", () => {
      const result: RateLimitResult = {
        allowed: false,
        currentCount: 30,
        resetAt: RESET_AT,
        retryAfterSeconds: 45,
      };
      const response = rateLimitResponse(result, {});
      expect(response.headers.get("Retry-After")).toBe("45");
    });

    it("body da 429 tem campo error='rate_limit_exceeded'", async () => {
      const result: RateLimitResult = {
        allowed: false,
        currentCount: 30,
        resetAt: RESET_AT,
        retryAfterSeconds: 45,
      };
      const response = rateLimitResponse(result, {});
      const body = await response.json();
      expect(body.error).toBe("rate_limit_exceeded");
      expect(body.current_count).toBe(30);
    });

    it("inclui X-RateLimit-Reset no header da 429", () => {
      const result: RateLimitResult = {
        allowed: false,
        currentCount: 30,
        resetAt: RESET_AT,
        retryAfterSeconds: 10,
      };
      const response = rateLimitResponse(result, {});
      expect(response.headers.get("X-RateLimit-Reset")).toBe(RESET_AT);
    });

    it("propaga corsHeaders na resposta", () => {
      const result: RateLimitResult = {
        allowed: false,
        currentCount: 30,
        resetAt: RESET_AT,
        retryAfterSeconds: 10,
      };
      const response = rateLimitResponse(result, {
        "Access-Control-Allow-Origin": "https://app.grupolamadre.com.br",
      });
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
        "https://app.grupolamadre.com.br"
      );
    });
  });
});
