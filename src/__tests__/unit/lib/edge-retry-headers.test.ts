/**
 * T-ERH EDGE-RETRY-HEADERS — Valida propagação de x-request-id em retries
 *
 * Verifica:
 * 1. x-request-id é propagado em todas as tentativas do retry (mesmo UUID)
 * 2. x-request-id é um UUID v4 válido
 * 3. attempts reflete tentativas reais (1 sucesso direto)
 * 4. attempts=2 quando há 1 retry e sucesso na 2ª tentativa
 * 5. attempts=3 quando esgota 2 retries e falha
 * 6. requestId retornado é consistente com o enviado nos headers
 * 7. Headers customizados do caller são mesclados com x-request-id
 * 8. Dois calls independentes geram requestIds distintos
 *
 * 8 asserts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Hoisted mock ──────────────────────────────────────────────────────────────
const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

import { invokeEdge } from "@/lib/edge";

// ── Mock sleep (setTimeout) ───────────────────────────────────────────────────
vi.stubGlobal("setTimeout", (fn: () => void, _ms: number) => {
  fn();
  return 0 as unknown as ReturnType<typeof setTimeout>;
});

function makeError(status: number): Error & { context: { status: number } } {
  const e = new Error(`HTTP ${status}`) as Error & { context: { status: number } };
  e.context = { status };
  return e;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("EDGE-RETRY-HEADERS — x-request-id propagado em retries", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it("mesmo x-request-id é enviado em todas as tentativas do retry", async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: makeError(503) })
      .mockResolvedValueOnce({ data: { ok: true }, error: null });

    await invokeEdge("my-fn", { method: "GET" });

    expect(mockInvoke).toHaveBeenCalledTimes(2);
    const firstCallHeaders = mockInvoke.mock.calls[0][1].headers;
    const secondCallHeaders = mockInvoke.mock.calls[1][1].headers;
    expect(firstCallHeaders["x-request-id"]).toBe(secondCallHeaders["x-request-id"]);
  });

  it("x-request-id gerado é um UUID v4 válido", async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });

    const result = await invokeEdge("my-fn", { method: "GET" });

    expect(result.requestId).toMatch(UUID_REGEX);
  });

  it("attempts=1 quando sucesso direto (sem retry)", async () => {
    mockInvoke.mockResolvedValue({ data: { result: "ok" }, error: null });

    const result = await invokeEdge("my-fn", { method: "GET" });

    expect(result.attempts).toBe(1);
  });

  it("attempts=2 quando há 1 retry e sucesso na 2ª tentativa", async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: makeError(502) })
      .mockResolvedValueOnce({ data: { result: "ok" }, error: null });

    const result = await invokeEdge("my-fn", { method: "GET" });

    expect(result.attempts).toBe(2);
  });

  it("attempts=3 quando esgota 2 retries e falha", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: makeError(503) });

    const result = await invokeEdge("my-fn", { method: "GET", retries: 2 });

    expect(result.attempts).toBe(3);
    expect(result.error).not.toBeNull();
  });

  it("requestId retornado é o mesmo enviado nos headers", async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });

    const result = await invokeEdge("my-fn", { method: "GET" });

    const headersSent = mockInvoke.mock.calls[0][1].headers;
    expect(result.requestId).toBe(headersSent["x-request-id"]);
  });

  it("headers customizados do caller são mesclados com x-request-id", async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });

    await invokeEdge("my-fn", {
      method: "POST",
      headers: { "Idempotency-Key": "test-key-123", "X-Custom": "value" },
    });

    const headers = mockInvoke.mock.calls[0][1].headers;
    expect(headers["x-request-id"]).toBeDefined();
    expect(headers["Idempotency-Key"]).toBe("test-key-123");
    expect(headers["X-Custom"]).toBe("value");
  });

  it("dois calls independentes geram requestIds distintos", async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });

    const r1 = await invokeEdge("fn-a", { method: "GET" });
    const r2 = await invokeEdge("fn-b", { method: "GET" });

    expect(r1.requestId).not.toBe(r2.requestId);
  });
});
