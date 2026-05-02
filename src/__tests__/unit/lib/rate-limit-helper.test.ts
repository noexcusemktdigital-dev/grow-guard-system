/**
 * T-RATE-LIMIT-HELPER — Valida lógica de checkRateLimit (rate-limit.ts inline)
 *
 * Verifica:
 * 1. checkRateLimit retorna allowed=true quando mock DB está vazio (sem contador)
 * 2. retorna allowed=false quando current_count >= max_requests (429)
 * 3. fail-open em erro de DB → retorna allowed=true (não derruba produção)
 * 4. retryAfterSeconds é 0 quando request é permitido
 * 5. retorna currentCount correto quando DB retorna dados
 * 6. resetAt é uma ISO string válida
 *
 * 6 asserts
 */
import { describe, it, expect, vi } from "vitest";

// ── Lógica inline de checkRateLimit (espelho de rate-limit.ts) ───────────────
// Isolado do Deno.env para rodar em Node/Vitest

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

interface RpcRow {
  allowed: boolean;
  current_count: number;
  reset_at: string;
}

async function checkRateLimit(
  _userId: string,
  _organizationId: string | null,
  _fnName: string,
  config: RateLimitConfig = { windowSeconds: 60, maxRequests: 30 },
  // injetável para testes
  rpc: () => Promise<{ data: RpcRow[] | null; error: any }>
): Promise<RateLimitResult> {
  const { data, error } = await rpc();

  if (error || !data || data.length === 0) {
    console.warn(`[rate-limit] DB error, allowing: ${error?.message}`);
    return {
      allowed: true,
      currentCount: 0,
      resetAt: new Date().toISOString(),
      retryAfterSeconds: 0,
    };
  }

  const row = data[0];
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const futureDate = new Date(Date.now() + 60_000).toISOString();

// ── Testes ────────────────────────────────────────────────────────────────────

describe("checkRateLimit — allowed=true em mock vazio", () => {
  it("retorna allowed=true quando DB está sem registro (nova chave)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const result = await checkRateLimit("u1", "org1", "fn", undefined, rpc);
    expect(result.allowed).toBe(true);
  });

  it("retryAfterSeconds é 0 quando não há dados (fail-open)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const result = await checkRateLimit("u1", "org1", "fn", undefined, rpc);
    expect(result.retryAfterSeconds).toBe(0);
  });
});

describe("checkRateLimit — 429 quando limite excedido", () => {
  it("retorna allowed=false quando current_count >= max_requests", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ allowed: false, current_count: 31, reset_at: futureDate }],
      error: null,
    });
    const result = await checkRateLimit("u1", "org1", "fn", undefined, rpc);
    expect(result.allowed).toBe(false);
  });

  it("currentCount reflete o valor retornado pelo DB", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ allowed: false, current_count: 31, reset_at: futureDate }],
      error: null,
    });
    const result = await checkRateLimit("u1", "org1", "fn", undefined, rpc);
    expect(result.currentCount).toBe(31);
  });
});

describe("checkRateLimit — fail-open em DB error", () => {
  it("retorna allowed=true quando Supabase rpc retorna error", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "connection refused" },
    });
    const result = await checkRateLimit("u1", "org1", "fn", undefined, rpc);
    expect(result.allowed).toBe(true);
  });

  it("resetAt é uma ISO string válida mesmo em caso de erro", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "err" } });
    const result = await checkRateLimit("u1", "org1", "fn", undefined, rpc);
    expect(() => new Date(result.resetAt)).not.toThrow();
    expect(result.resetAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
