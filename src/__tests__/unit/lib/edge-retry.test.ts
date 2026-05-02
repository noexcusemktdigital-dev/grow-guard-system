/**
 * T5 EDGE-RETRY — Cobertura adicional de invokeEdge retry (PR #64)
 *
 * Verifica:
 * 1. Retry com baseMs custom
 * 2. Backoff exponencial (verifica sleep ms aproximado)
 * 3. Status 429 aciona retry
 * 4. Status 504 aciona retry
 * 5. Sucesso na 2ª tentativa — attempts=2
 * 6. Retry respeita maxRetries (attempts <= retries+1)
 * 7. GET é idempotente por default → retry habilitado
 * 8. POST sem Idempotency-Key → retry desabilitado
 * 9. POST com Idempotency-Key → retry habilitado
 * 10. Esgotando retries → error max_retries_exceeded (ou último erro)
 *
 * 10 asserts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Hoisted mock para evitar "Cannot access before initialization" ─────────────
const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

// ── Mock Supabase ─────────────────────────────────────────────────────────────
vi.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

import { invokeEdge } from "@/lib/edge";

// ── Mock do sleep interno ────────────────────────────────────────────────────
// Intercepta setTimeout para medir backoff sem esperar tempo real
const sleepCalls: number[] = [];

vi.stubGlobal("setTimeout", (fn: () => void, ms: number) => {
  sleepCalls.push(ms);
  fn(); // executa imediatamente em testes
  return 0 as unknown as ReturnType<typeof setTimeout>;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeError(status: number): Error & { context: { status: number } } {
  const err = new Error(`HTTP ${status}`) as Error & { context: { status: number } };
  err.context = { status };
  return err;
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T5 EDGE-RETRY — baseMs custom e backoff exponencial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sleepCalls.length = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("retry com baseMs=200 gera sleep >= 200ms na primeira tentativa", async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: makeError(503) })
      .mockResolvedValueOnce({ data: { ok: true }, error: null });

    await invokeEdge("fn", { retryBaseMs: 200 });

    // Primeiro sleep deve ser baseMs * 2^0 = 200 (+ jitter random <100)
    expect(sleepCalls.length).toBeGreaterThanOrEqual(1);
    expect(sleepCalls[0]).toBeGreaterThanOrEqual(200);
  });

  it("backoff exponencial: segunda tentativa dorme mais que a primeira", async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: makeError(503) })
      .mockResolvedValueOnce({ data: null, error: makeError(503) })
      .mockResolvedValueOnce({ data: { ok: true }, error: null });

    await invokeEdge("fn", { retryBaseMs: 100, retries: 2 });

    // attempt 1: sleep = 100 * 2^0 = 100
    // attempt 2: sleep = 100 * 2^1 = 200
    expect(sleepCalls.length).toBeGreaterThanOrEqual(2);
    expect(sleepCalls[1]).toBeGreaterThan(sleepCalls[0]);
  });
});

describe("T5 EDGE-RETRY — status 429 e 504", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sleepCalls.length = 0;
  });

  it("status 429 (rate limit) aciona retry — sucesso na 2ª tentativa", async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: makeError(429) })
      .mockResolvedValueOnce({ data: { done: true }, error: null });

    const result = await invokeEdge("fn");

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ done: true });
    expect(result.attempts).toBe(2);
  });

  it("status 504 (gateway timeout) aciona retry — sucesso na 2ª tentativa", async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: makeError(504) })
      .mockResolvedValueOnce({ data: { score: 88 }, error: null });

    const result = await invokeEdge("fn");

    expect(result.error).toBeNull();
    expect(result.data?.score).toBe(88);
    expect(result.attempts).toBe(2);
  });

  it("attempts contabiliza corretamente quando há retry", async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: makeError(503) })
      .mockResolvedValueOnce({ data: { ok: true }, error: null });

    const result = await invokeEdge("fn", { retries: 2 });

    expect(result.attempts).toBe(2);
  });
});

describe("T5 EDGE-RETRY — idempotência e POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sleepCalls.length = 0;
  });

  it("GET (default) é idempotente — retry habilitado em 503", async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: makeError(503) })
      .mockResolvedValueOnce({ data: { ok: true }, error: null });

    const result = await invokeEdge("fn", { method: "GET" });

    expect(result.error).toBeNull();
    expect(result.attempts).toBe(2);
  });

  it("POST sem Idempotency-Key → sem retry (attempts=1 em falha)", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: makeError(503) });

    const result = await invokeEdge("fn", { method: "POST", retries: 2 });

    // POST sem Idempotency-Key não deve retentar
    expect(result.attempts).toBe(1);
    expect(result.error).not.toBeNull();
  });

  it("POST com Idempotency-Key header → retry habilitado", async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: makeError(503) })
      .mockResolvedValueOnce({ data: { charged: true }, error: null });

    const result = await invokeEdge("fn", {
      method: "POST",
      headers: { "Idempotency-Key": "idem-key-abc123" },
      retries: 1,
    });

    expect(result.error).toBeNull();
    expect(result.attempts).toBe(2);
  });
});

describe("T5 EDGE-RETRY — esgotamento de retries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sleepCalls.length = 0;
  });

  it("esgotando retries → retorna error (não lança exceção)", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: makeError(503) });

    const result = await invokeEdge("fn", { retries: 2 });

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    // attempts = retries + 1 (tentativas totais)
    expect(result.attempts).toBe(3);
  });
});
