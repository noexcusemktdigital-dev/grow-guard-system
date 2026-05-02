/**
 * idempotency-frontend — testa src/lib/idempotency.ts
 * 10 asserts: generateIdempotencyKey (hash determinístico) e generateRequestId
 */
import { describe, it, expect } from 'vitest';
import { generateIdempotencyKey, generateRequestId } from '@/lib/idempotency';

describe('idempotency — frontend', () => {
  describe('generateRequestId', () => {
    it('retorna UUID v4 válido', () => {
      const id = generateRequestId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('gera IDs únicos a cada chamada', () => {
      const a = generateRequestId();
      const b = generateRequestId();
      expect(a).not.toBe(b);
    });
  });

  describe('generateIdempotencyKey', () => {
    it('sem payload retorna chave com prefixo da intent', async () => {
      const key = await generateIdempotencyKey('buy-credits');
      expect(key.startsWith('buy-credits:')).toBe(true);
    });

    it('sem payload gera UUID aleatório (não determinístico)', async () => {
      const a = await generateIdempotencyKey('buy-credits');
      const b = await generateIdempotencyKey('buy-credits');
      // UUID diferentes (aleatorios)
      expect(a).not.toBe(b);
    });

    it('com payload retorna chave determinística para mesmos inputs', async () => {
      const payload = { pack_id: 'basic', qty: 1 };
      const a = await generateIdempotencyKey('buy-credits', payload);
      const b = await generateIdempotencyKey('buy-credits', payload);
      expect(a).toBe(b);
    });

    it('com payload diferente retorna chave diferente', async () => {
      const a = await generateIdempotencyKey('buy-credits', { pack_id: 'basic' });
      const b = await generateIdempotencyKey('buy-credits', { pack_id: 'premium' });
      expect(a).not.toBe(b);
    });

    it('intents diferentes com mesmo payload produzem chaves diferentes', async () => {
      const payload = { id: 'x' };
      const a = await generateIdempotencyKey('buy-credits', payload);
      const b = await generateIdempotencyKey('cancel-sub', payload);
      expect(a).not.toBe(b);
    });

    it('formato: intent:hex32 (sem payload UUID, com payload hash)', async () => {
      const key = await generateIdempotencyKey('test-intent', { data: 'value' });
      expect(key).toMatch(/^test-intent:[0-9a-f]{32}$/);
    });

    it('chave sem payload tem comprimento razoável (intent + uuid)', async () => {
      const key = await generateIdempotencyKey('intent');
      // "intent:" (7) + UUID (36) = 43
      expect(key.length).toBeGreaterThan(10);
    });

    it('payload null/undefined trata como ausente (não determinístico)', async () => {
      const a = await generateIdempotencyKey('k', undefined);
      const b = await generateIdempotencyKey('k', undefined);
      expect(a).not.toBe(b);
    });
  });
});
