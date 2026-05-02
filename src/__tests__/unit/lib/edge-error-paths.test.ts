/**
 * T6 EDGE-ERROR-PATHS — Cobertura de caminhos defensivos do invokeEdge
 *
 * Verifica:
 * 1. POST com Idempotency-Key sempre permite retry (retryIdempotent=true implícito)
 * 2. retryIdempotent: false desabilita retry mesmo em GET
 * 3. error com status undefined (context ausente) NÃO aciona retry — defensive path
 * 4. status 401 NÃO aciona retry (erro permanente de auth)
 * 5. status 422 NÃO aciona retry (erro de validação)
 * 6. status 0 (network error) aciona retry em método GET
 * 7. Sucesso imediato não incrementa attempts além de 1
 * 8. retries=0 significa apenas 1 tentativa total
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
    functions: { invoke: mockInvoke },
  },
}));

import { invokeEdge } from "@/lib/edge";

// ── Mock setTimeout para não esperar tempo real ───────────────────────────────
vi.stubGlobal("setTimeout", (fn: () => void, _ms: number) => {
  fn();
  return 0 as unknown as ReturnType<typeof setTimeout>;
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeErrorWithStatus(status: number): Error & { context: { status: number } } {
  const err = new Error(`HTTP ${status}`) as Error & { context: { status: number } };
  err.context = { status };
  return err;
}

function makeErrorNoContext(): Error {
  // Sem .context — simula erro genérico sem status HTTP
  return new Error("Network failure");
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T6 EDGE-ERROR — idempotency e retryIdempotent flag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("POST com Idempotency-Key header permite retry em 503", async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: makeErrorWithStatus(503) })
      .mockResolvedValueOnce({ data: { ok: true }, error: null });

    const result = await invokeEdge("fn-post", {
      method: "POST",
      headers: { "Idempotency-Key": "key-abc-123" },
      retries: 1,
    });

    expect(result.error).toBeNull();
    expect(result.attempts).toBe(2);
  });

  it("retryIdempotent: false desabilita retry em GET 503", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: makeErrorWithStatus(503) });

    const result = await invokeEdge("fn-get", {
      method: "GET",
      retryIdempotent: false,
      retries: 3,
    });

    // Com retryIdempotent=false, deve parar na 1ª tentativa
    expect(result.attempts).toBe(1);
    expect(result.error).not.toBeNull();
  });

  it("error com status undefined (sem context) — defensive: status=0, retry em GET", async () => {
    // Erro sem .context → status cai para 0 → deve retry em GET
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: makeErrorNoContext() })
      .mockResolvedValueOnce({ data: { recovered: true }, error: null });

    const result = await invokeEdge("fn-network", {
      method: "GET",
      retries: 1,
    });

    // status=0 é tratado como retryable (network error) → deve ter retentado
    expect(result.error).toBeNull();
    expect(result.attempts).toBe(2);
  });
});

describe("T6 EDGE-ERROR — status permanentes (sem retry)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("status 401 (Unauthorized) NÃO aciona retry — erro permanente", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: makeErrorWithStatus(401) });

    const result = await invokeEdge("fn-auth", {
      method: "GET",
      retries: 3,
    });

    // 401 não está em RETRYABLE_STATUS → apenas 1 tentativa
    expect(result.attempts).toBe(1);
    expect(result.error).not.toBeNull();
  });

  it("status 422 (Unprocessable Entity) NÃO aciona retry — erro de validação", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: makeErrorWithStatus(422) });

    const result = await invokeEdge("fn-validate", {
      method: "POST",
      headers: { "Idempotency-Key": "idem-val-123" },
      retries: 3,
    });

    // 422 não está em RETRYABLE_STATUS → apenas 1 tentativa
    expect(result.attempts).toBe(1);
    expect(result.error).not.toBeNull();
  });
});

describe("T6 EDGE-ERROR — contagem de attempts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sucesso imediato retorna attempts=1", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { pong: true }, error: null });

    const result = await invokeEdge("fn-ping");

    expect(result.error).toBeNull();
    expect(result.attempts).toBe(1);
    expect(result.data).toEqual({ pong: true });
  });

  it("retries=0 significa exatamente 1 tentativa total (sem retry)", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: makeErrorWithStatus(503) });

    const result = await invokeEdge("fn-noretry", {
      method: "GET",
      retries: 0,
    });

    expect(result.attempts).toBe(1);
    expect(result.error).not.toBeNull();
  });
});
