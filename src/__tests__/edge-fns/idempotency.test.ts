/**
 * IDEMPOTENCY — Valida _shared/idempotency.ts (API-004)
 *
 * Código do helper copiado inline pois Vitest não roda Deno imports.
 * crypto.subtle disponível no jsdom — hashPayload funciona nativamente.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Helper inline: hashPayload ────────────────────────────────────────────────

async function hashPayload(body: unknown): Promise<string> {
  const data = new TextEncoder().encode(
    typeof body === "string" ? body : JSON.stringify(body)
  );
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Helper inline: getCachedResponse (com client injetável) ──────────────────

interface IdempotencyResult {
  cached: boolean;
  status?: number;
  body?: unknown;
}

interface IdempotencyRow {
  response_status: number | null;
  response_body: unknown;
  request_hash: string;
  expires_at: string;
}

async function getCachedResponseWithClient(
  sb: {
    from: (t: string) => {
      select: (s: string) => {
        eq: (k: string, v: string) => {
          eq: (k: string, v: string) => {
            maybeSingle: () => Promise<{ data: IdempotencyRow | null; error: unknown }>;
          };
        };
      };
    };
  },
  key: string,
  fnName: string,
  requestHash: string
): Promise<IdempotencyResult | null> {
  const { data, error } = await sb
    .from("idempotency_keys")
    .select("response_status, response_body, request_hash, expires_at")
    .eq("key", key)
    .eq("fn_name", fnName)
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  if (data.request_hash !== requestHash) {
    throw new Error("idempotency_key_conflict: same key, different payload");
  }

  if (data.response_status == null) {
    return { cached: true, status: 409, body: { error: "request_in_progress" } };
  }

  return { cached: true, status: data.response_status, body: data.response_body };
}

// ── Mock Supabase factory ─────────────────────────────────────────────────────

function makeIdempotencyMock(row: IdempotencyRow | null, dbError = false) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: row,
    error: dbError ? { message: "DB error" } : null,
  });
  const secondEq = vi.fn().mockReturnValue({ maybeSingle });
  const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
  const select = vi.fn().mockReturnValue({ eq: firstEq });
  const from = vi.fn().mockReturnValue({ select });
  return { from };
}

// ── Testes: hashPayload ───────────────────────────────────────────────────────

describe("IDEMPOTENCY — hashPayload()", () => {
  it("é determinístico — mesmo input = mesmo hash", async () => {
    const a = await hashPayload({ action: "buy", amount: 100 });
    const b = await hashPayload({ action: "buy", amount: 100 });
    expect(a).toBe(b);
  });

  it("inputs diferentes produzem hashes diferentes", async () => {
    const a = await hashPayload({ action: "buy", amount: 100 });
    const b = await hashPayload({ action: "buy", amount: 101 });
    expect(a).not.toBe(b);
  });

  it("retorna string hex de 64 caracteres (SHA-256)", async () => {
    const hash = await hashPayload("qualquer texto");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("serializa objeto para JSON antes de hash (order-sensitive)", async () => {
    const a = await hashPayload({ x: 1, y: 2 });
    const b = await hashPayload('{"x":1,"y":2}'); // string já serializada
    expect(a).toBe(b);
  });

  it("string e objeto com mesmo conteúdo produzem hash idêntico", async () => {
    const payload = { event: "test" };
    const asObj = await hashPayload(payload);
    const asStr = await hashPayload(JSON.stringify(payload));
    expect(asObj).toBe(asStr);
  });
});

// ── Testes: getCachedResponse ─────────────────────────────────────────────────

describe("IDEMPOTENCY — getCachedResponse()", () => {
  const KEY = "idempotency-key-abc";
  const FN_NAME = "asaas-charge";
  const HASH = "deadbeef".padEnd(64, "0");
  const FUTURE_EXPIRES = new Date(Date.now() + 3600_000).toISOString();
  const PAST_EXPIRES = new Date(Date.now() - 1000).toISOString();

  describe("Happy path — cache hit", () => {
    it("retorna cached=true e response quando key existe e não expirou", async () => {
      const sb = makeIdempotencyMock({
        response_status: 200,
        response_body: { ok: true },
        request_hash: HASH,
        expires_at: FUTURE_EXPIRES,
      });
      const result = await getCachedResponseWithClient(sb, KEY, FN_NAME, HASH);
      expect(result).not.toBeNull();
      expect(result!.cached).toBe(true);
      expect(result!.status).toBe(200);
      expect(result!.body).toEqual({ ok: true });
    });

    it("retorna 409 quando response_status é null (request in progress)", async () => {
      const sb = makeIdempotencyMock({
        response_status: null,
        response_body: null,
        request_hash: HASH,
        expires_at: FUTURE_EXPIRES,
      });
      const result = await getCachedResponseWithClient(sb, KEY, FN_NAME, HASH);
      expect(result).not.toBeNull();
      expect(result!.status).toBe(409);
      expect((result!.body as { error: string }).error).toBe("request_in_progress");
    });
  });

  describe("Error path — sem cache", () => {
    it("retorna null quando key não existe (data=null)", async () => {
      const sb = makeIdempotencyMock(null);
      const result = await getCachedResponseWithClient(sb, KEY, FN_NAME, HASH);
      expect(result).toBeNull();
    });

    it("retorna null quando DB retorna erro", async () => {
      const sb = makeIdempotencyMock(null, true);
      const result = await getCachedResponseWithClient(sb, KEY, FN_NAME, HASH);
      expect(result).toBeNull();
    });

    it("retorna null quando registro expirou (expires_at no passado)", async () => {
      const sb = makeIdempotencyMock({
        response_status: 200,
        response_body: { ok: true },
        request_hash: HASH,
        expires_at: PAST_EXPIRES,
      });
      const result = await getCachedResponseWithClient(sb, KEY, FN_NAME, HASH);
      expect(result).toBeNull();
    });
  });

  describe("Edge path — conflito de hash (ataque/bug de cliente)", () => {
    it("lança erro quando mesma key tem payload diferente", async () => {
      const DIFFERENT_HASH = "cafebabe".padEnd(64, "0");
      const sb = makeIdempotencyMock({
        response_status: 200,
        response_body: { ok: true },
        request_hash: HASH, // hash salvo é diferente do que foi enviado
        expires_at: FUTURE_EXPIRES,
      });
      await expect(
        getCachedResponseWithClient(sb, KEY, FN_NAME, DIFFERENT_HASH)
      ).rejects.toThrow("idempotency_key_conflict");
    });

    it("mensagem de erro contém 'same key, different payload'", async () => {
      const DIFFERENT_HASH = "00000000".padEnd(64, "1");
      const sb = makeIdempotencyMock({
        response_status: 200,
        response_body: {},
        request_hash: HASH,
        expires_at: FUTURE_EXPIRES,
      });
      await expect(
        getCachedResponseWithClient(sb, KEY, FN_NAME, DIFFERENT_HASH)
      ).rejects.toThrow("different payload");
    });
  });
});
