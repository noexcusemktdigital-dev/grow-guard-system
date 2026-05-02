/**
 * edge-error-recovery — invokeEdge {data, error, requestId} paths (Phase 19)
 *
 * Testa src/lib/edge.ts (invokeEdge wrapper) com foco em:
 *   - Retorno estruturado {data, error, requestId}
 *   - Error path preserva error sem lançar exceção
 *   - Network failure tratado como error (sem throw)
 *   - requestId gerado mesmo em caso de erro
 *
 * 8 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Supabase ─────────────────────────────────────────────────────────────
vi.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { ok: true }, error: null }),
    },
  },
}));

import { invokeEdge } from "@/lib/edge";
import { supabase } from "@/lib/supabase";

const mockInvoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;

// ── Testes ────────────────────────────────────────────────────────────────────

describe("edge-error-recovery — invokeEdge return shape", () => {
  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it("retorna objeto com chaves {data, error, requestId} em caso de sucesso", async () => {
    const result = await invokeEdge("test-fn");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("error");
    expect(result).toHaveProperty("requestId");
  });

  it("data contém o resultado do invoke quando bem-sucedido", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { score: 95, label: "premium" }, error: null });
    const result = await invokeEdge<{ score: number; label: string }>("scoring-fn");
    expect(result.data?.score).toBe(95);
    expect(result.data?.label).toBe("premium");
    expect(result.error).toBeNull();
  });

  it("error path: error é preservado sem lançar exceção", async () => {
    const apiError = new Error("Function returned error 500");
    mockInvoke.mockResolvedValueOnce({ data: null, error: apiError });
    const result = await invokeEdge("fail-fn");
    expect(result.error).toBe(apiError);
    expect(result.data).toBeNull();
    // requestId ainda presente mesmo em erro Supabase
    expect(result.requestId).toBeDefined();
  });

  it("network failure (reject) é capturado e retornado como error sem throw", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("ECONNREFUSED: network failure"));
    // Não deve lançar exceção
    const result = await invokeEdge("fn");
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toContain("network failure");
    expect(result.data).toBeNull();
  });

  it("requestId é gerado mesmo quando network failure ocorre", async () => {
    mockInvoke.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const result = await invokeEdge("fn");
    expect(result.requestId).toBeDefined();
    expect(typeof result.requestId).toBe("string");
    expect(result.requestId.length).toBeGreaterThan(0);
  });

  it("requestId é formato UUID v4 válido", async () => {
    const result = await invokeEdge("fn");
    expect(result.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("requestId é único a cada chamada (não reutiliza)", async () => {
    const r1 = await invokeEdge("fn");
    const r2 = await invokeEdge("fn");
    expect(r1.requestId).not.toBe(r2.requestId);
  });

  it("requestId enviado no header x-request-id corresponde ao retornado", async () => {
    const result = await invokeEdge("fn");
    const callArgs = mockInvoke.mock.calls[mockInvoke.mock.calls.length - 1][1];
    expect(callArgs.headers["x-request-id"]).toBe(result.requestId);
  });
});
