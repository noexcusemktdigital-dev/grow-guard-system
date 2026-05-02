/**
 * idempotency-edge — generateIdempotencyKey / generateRequestId
 *
 * Asserts (6):
 * 1. hashPayload determinístico: mesma intent+payload na mesma janela de 10s → mesma key
 * 2. intent diferente → key diferente
 * 3. payload diferente → key diferente
 * 4. payload vazio → key usa UUID (não determinística, mas válida)
 * 5. key tem formato "intent:hex32" quando payload fornecido
 * 6. generateRequestId retorna UUID válido (formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
 */
import { describe, it, expect, vi, afterEach } from "vitest";

// Stub global crypto.subtle e crypto.randomUUID para controle determinístico
const realCrypto = globalThis.crypto;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Converte hex string em Uint8Array (para simular digest output) */
function hexToUint8Array(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

import { generateIdempotencyKey, generateRequestId } from "@/lib/idempotency";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("generateIdempotencyKey", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("é determinístico: mesma intent+payload na mesma janela → mesma key", async () => {
    const k1 = await generateIdempotencyKey("buy-credits", { pack_id: "p1", qty: 10 });
    const k2 = await generateIdempotencyKey("buy-credits", { pack_id: "p1", qty: 10 });
    expect(k1).toBe(k2);
  });

  it("intent diferente → key diferente", async () => {
    const k1 = await generateIdempotencyKey("buy-credits", { pack_id: "p1" });
    const k2 = await generateIdempotencyKey("cancel-plan", { pack_id: "p1" });
    expect(k1).not.toBe(k2);
  });

  it("payload diferente → key diferente", async () => {
    const k1 = await generateIdempotencyKey("buy-credits", { pack_id: "p1" });
    const k2 = await generateIdempotencyKey("buy-credits", { pack_id: "p2" });
    expect(k1).not.toBe(k2);
  });

  it("payload undefined → key começa com 'intent:' e termina com UUID (não determinística)", async () => {
    const k1 = await generateIdempotencyKey("no-payload-intent");
    const k2 = await generateIdempotencyKey("no-payload-intent");
    // Ambas começam com o prefixo correto
    expect(k1.startsWith("no-payload-intent:")).toBe(true);
    expect(k2.startsWith("no-payload-intent:")).toBe(true);
    // Sem payload → UUID aleatório → keys diferentes entre chamadas
    expect(k1).not.toBe(k2);
  });

  it("key com payload tem formato 'intent:hex32chars'", async () => {
    const key = await generateIdempotencyKey("test-intent", { value: 42 });
    const [prefix, hash] = key.split(":");
    expect(prefix).toBe("test-intent");
    expect(hash).toHaveLength(32);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});

describe("generateRequestId", () => {
  it("retorna UUID válido no formato padrão", () => {
    const id = generateRequestId();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidRegex);
  });
});
