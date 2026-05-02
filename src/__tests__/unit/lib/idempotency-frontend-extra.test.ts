/**
 * T5 IDEMPOTENCY-FRONTEND-EXTRA — Cobertura adicional de generateIdempotencyKey
 *
 * Verifica:
 * 1. Com payload retorna formato `intent:hash` (32 hex chars após ":")
 * 2. Mesmo payload na mesma janela 10s = mesma key (determinístico)
 * 3. Janela diferente = key diferente (timestamp separado)
 * 4. Sem payload = UUID (formato `intent:uuid`)
 * 5. Payload null tratado como ausente (não determinístico)
 * 6. Payload undefined tratado como ausente (não determinístico)
 * 7. Intent diferente + mesmo payload = chave diferente
 * 8. Hash é hexadecimal puro (apenas [0-9a-f])
 *
 * 8 asserts
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { generateIdempotencyKey, generateRequestId } from "@/lib/idempotency";

describe("T5 IDEMPOTENCY — generateIdempotencyKey com payload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("com payload retorna formato `intent:hash` (32 hex chars após ':')", async () => {
    const key = await generateIdempotencyKey("buy-credits", { pack_id: "basic", qty: 1 });
    // Formato: "buy-credits:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" (32 hex chars)
    expect(key).toMatch(/^buy-credits:[0-9a-f]{32}$/);
  });

  it("mesmo payload na mesma janela 10s retorna mesma key (determinístico)", async () => {
    const payload = { pack_id: "premium", qty: 3 };
    // Ambas chamadas dentro da mesma janela (Date.now() / 10000 === mesmo floor)
    const keyA = await generateIdempotencyKey("buy-credits", payload);
    const keyB = await generateIdempotencyKey("buy-credits", payload);
    expect(keyA).toBe(keyB);
  });

  it("janela diferente (timestamp avançado 10s+) gera key diferente", async () => {
    const payload = { pack_id: "basic" };
    const originalNow = Date.now;

    // Primeira chamada na janela atual
    const keyA = await generateIdempotencyKey("buy-credits", payload);

    // Avança 11 segundos para próxima janela
    vi.spyOn(Date, "now").mockReturnValue(originalNow() + 11_000);
    const keyB = await generateIdempotencyKey("buy-credits", payload);

    expect(keyA).not.toBe(keyB);
  });

  it("sem payload retorna formato `intent:UUID` (não determinístico)", async () => {
    const keyA = await generateIdempotencyKey("buy-credits");
    const keyB = await generateIdempotencyKey("buy-credits");
    // UUID diferente a cada chamada — não determinístico
    expect(keyA).not.toBe(keyB);
    // Mas mantém o prefixo da intent
    expect(keyA.startsWith("buy-credits:")).toBe(true);
  });

  it("payload null tratado como ausente → chave não determinística", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyA = await generateIdempotencyKey("cancel-sub", null as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyB = await generateIdempotencyKey("cancel-sub", null as any);
    expect(keyA).not.toBe(keyB);
  });

  it("payload undefined tratado como ausente → chave não determinística", async () => {
    const keyA = await generateIdempotencyKey("cancel-sub", undefined);
    const keyB = await generateIdempotencyKey("cancel-sub", undefined);
    expect(keyA).not.toBe(keyB);
  });

  it("intent diferente + mesmo payload = chave diferente", async () => {
    const payload = { resource_id: "res-abc" };
    const keyA = await generateIdempotencyKey("buy-credits", payload);
    const keyB = await generateIdempotencyKey("refund-credits", payload);
    expect(keyA).not.toBe(keyB);
  });

  it("hash com payload é hexadecimal puro ([0-9a-f] apenas)", async () => {
    const key = await generateIdempotencyKey("test-intent", { data: "value", num: 42 });
    const [, hash] = key.split(":");
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});

describe("T5 IDEMPOTENCY — generateRequestId", () => {
  it("generateRequestId retorna UUID v4 válido", () => {
    const id = generateRequestId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
