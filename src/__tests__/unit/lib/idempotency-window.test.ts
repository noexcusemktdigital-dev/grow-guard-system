/**
 * T-IDEMPOTENCY-WINDOW — Valida comportamento de janela de tempo (10s)
 *
 * Verifica:
 * 1. Mesma intent+payload na janela 10s geram mesma key
 * 2. Janela de tempo diferente gera key diferente (mesmo payload)
 * 3. Intent diferente com mesmo payload gera key diferente
 * 4. Sem payload: duas chamadas consecutivas geram keys diferentes (UUID)
 * 5. Com payload: key tem formato intent:hex32
 * 6. Payload null tratado como ausente (não determinístico)
 *
 * 6 asserts
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateIdempotencyKey } from '@/lib/idempotency';

describe('idempotency — janela de tempo 10s', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. mesma janela 10s + mesmo payload = mesma key', async () => {
    // Freeze Date.now at a fixed point
    const fixedNow = 1700000000000; // arbitrary ms timestamp
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const payload = { product: 'basic', qty: 1 };
    const a = await generateIdempotencyKey('buy-credits', payload);
    const b = await generateIdempotencyKey('buy-credits', payload);

    expect(a).toBe(b);
  });

  it('2. janela diferente (Date.now avança >10s) = key diferente', async () => {
    const payload = { product: 'basic', qty: 1 };

    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const a = await generateIdempotencyKey('buy-credits', payload);

    // Advance by 11 seconds
    vi.spyOn(Date, 'now').mockReturnValue(1700000011000);
    const b = await generateIdempotencyKey('buy-credits', payload);

    expect(a).not.toBe(b);
  });

  it('3. intent diferente + mesmo payload = key diferente', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const payload = { id: 'abc' };
    const a = await generateIdempotencyKey('buy-credits', payload);
    const b = await generateIdempotencyKey('cancel-sub', payload);

    expect(a).not.toBe(b);
  });

  it('4. sem payload: duas chamadas consecutivas geram UUIDs diferentes', async () => {
    const a = await generateIdempotencyKey('test-intent');
    const b = await generateIdempotencyKey('test-intent');

    expect(a).not.toBe(b);
  });

  it('5. com payload: key tem formato "intent:hex32"', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const key = await generateIdempotencyKey('pay', { amount: 100 });
    expect(key).toMatch(/^pay:[0-9a-f]{32}$/);
  });

  it('6. payload null tratado como ausente — não determinístico', async () => {
    const a = await generateIdempotencyKey('k', null as any);
    const b = await generateIdempotencyKey('k', null as any);

    // null deve cair no branch sem payload → UUID aleatório
    expect(a).not.toBe(b);
  });
});
