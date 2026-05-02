/**
 * edge-wrapper — testa src/lib/edge.ts (invokeEdge wrapper)
 * Cobre: mock supabase.functions.invoke, x-request-id, retry/backoff, idempotência
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock do cliente Supabase ──────────────────────────────────────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { ok: true }, error: null }),
    },
  },
}));

// Acelera sleep para testes (evita aguardar backoff real)
vi.mock('@/lib/edge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/edge')>();
  return actual;
});

vi.useFakeTimers();

import { invokeEdge } from '@/lib/edge';
import { supabase } from '@/lib/supabase';

const mockInvoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;

// Helper: faz retry test sem aguardar o timer real
async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
  const result = Promise.resolve(promise);
  // Avança todos os timers pendentes
  vi.runAllTimersAsync();
  return result;
}

describe('edge — invokeEdge wrapper', () => {
  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
  });

  // ── Testes originais (regressão) ──────────────────────────────────────────

  it('chama supabase.functions.invoke com o nome da função', async () => {
    await invokeEdge('generate-content', { body: { count: 5 } });
    expect(mockInvoke).toHaveBeenCalledOnce();
    expect(mockInvoke.mock.calls[0][0]).toBe('generate-content');
  });

  it('injeta x-request-id automaticamente nos headers', async () => {
    await invokeEdge('test-fn');
    const callArgs = mockInvoke.mock.calls[0][1];
    expect(callArgs.headers['x-request-id']).toBeDefined();
    expect(callArgs.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('retorna requestId consistente com o enviado na chamada', async () => {
    const result = await invokeEdge('test-fn');
    const callArgs = mockInvoke.mock.calls[0][1];
    expect(result.requestId).toBe(callArgs.headers['x-request-id']);
  });

  it('headers customizados são mesclados com x-request-id', async () => {
    await invokeEdge('fn', { headers: { Authorization: 'Bearer token' } });
    const callArgs = mockInvoke.mock.calls[0][1];
    expect(callArgs.headers['Authorization']).toBe('Bearer token');
    expect(callArgs.headers['x-request-id']).toBeDefined();
  });

  it('retorna data e error do invoke em caso de sucesso', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { content: 'hello' }, error: null });
    const result = await invokeEdge<{ content: string }>('fn');
    expect(result.data?.content).toBe('hello');
    expect(result.error).toBeNull();
  });

  it('retorna error quando invoke retorna erro do Supabase sem retry (POST sem Idempotency-Key)', async () => {
    const supabaseErr = Object.assign(new Error('Function error'), { context: { status: 503 } });
    mockInvoke.mockResolvedValue({ data: null, error: supabaseErr });
    const result = await invokeEdge('fn', { method: 'POST' });
    // POST sem Idempotency-Key → NÃO retry
    expect(result.data).toBeNull();
    expect(result.error).toBe(supabaseErr);
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });

  it('captura exceção de rede e retorna error sem lançar (POST sem retry)', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('network failure'));
    const result = await invokeEdge('fn', { method: 'POST' });
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('network failure');
    expect(result.requestId).toBeDefined();
  });

  it('passa method e body corretamente ao invoke', async () => {
    await invokeEdge('fn', { method: 'POST', body: { x: 1 } });
    const callArgs = mockInvoke.mock.calls[0][1];
    expect(callArgs.method).toBe('POST');
    expect(callArgs.body).toEqual({ x: 1 });
  });

  // ── Testes de retry/backoff ───────────────────────────────────────────────

  it('retorna attempts=1 em caso de sucesso imediato', async () => {
    const result = await invokeEdge('fn');
    expect(result.attempts).toBe(1);
  });

  it('retry em 503 — sucesso na 2ª tentativa (GET)', async () => {
    const err503 = Object.assign(new Error('Service Unavailable'), {
      context: { status: 503 },
    });
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: err503 })
      .mockResolvedValueOnce({ data: { ok: true }, error: null });

    const resultPromise = invokeEdge('fn', { method: 'GET', retryBaseMs: 1 });
    vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.data).toEqual({ ok: true });
    expect(result.error).toBeNull();
    expect(result.attempts).toBe(2);
    expect(mockInvoke).toHaveBeenCalledTimes(2);
  });

  it('retry em network error (exception) — GET bem sucedido na 2ª tentativa', async () => {
    mockInvoke
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce({ data: { recovered: true }, error: null });

    const resultPromise = invokeEdge('fn', { method: 'GET', retryBaseMs: 1 });
    vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.data).toEqual({ recovered: true });
    expect(result.error).toBeNull();
    expect(result.attempts).toBe(2);
  });

  it('NÃO retry em POST sem Idempotency-Key — tenta apenas 1x', async () => {
    const err503 = Object.assign(new Error('Service Unavailable'), {
      context: { status: 503 },
    });
    mockInvoke.mockResolvedValue({ data: null, error: err503 });

    const result = await invokeEdge('fn', { method: 'POST', retryBaseMs: 1 });

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(result.attempts).toBe(1);
    expect(result.error).toBe(err503);
  });

  it('NÃO retry quando method é omitido — invoke padrão é POST', async () => {
    const err503 = Object.assign(new Error('Service Unavailable'), {
      context: { status: 503 },
    });
    mockInvoke.mockResolvedValue({ data: null, error: err503 });

    const result = await invokeEdge('fn', { retryBaseMs: 1 });

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(result.attempts).toBe(1);
    expect(result.error).toBe(err503);
  });

  it('retry em POST com Idempotency-Key header — tenta até maxRetries+1', async () => {
    const err503 = Object.assign(new Error('Service Unavailable'), {
      context: { status: 503 },
    });
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: err503 })
      .mockResolvedValueOnce({ data: { ok: true }, error: null });

    const resultPromise = invokeEdge('fn', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'idem-123' },
      retryBaseMs: 1,
    });
    vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.data).toEqual({ ok: true });
    expect(result.attempts).toBe(2);
  });

  it('GET sempre permite retry — 3 tentativas totais (default retries=2)', async () => {
    const err502 = Object.assign(new Error('Bad Gateway'), {
      context: { status: 502 },
    });
    mockInvoke.mockResolvedValue({ data: null, error: err502 });

    const resultPromise = invokeEdge('fn', { method: 'GET', retryBaseMs: 1 });
    vi.runAllTimersAsync();
    const result = await resultPromise;

    // attempts deve ser 3 (1 inicial + 2 retries)
    expect(mockInvoke).toHaveBeenCalledTimes(3);
    expect(result.attempts).toBe(3);
    expect(result.error).toBe(err502);
  });

  it('attempts contado corretamente em sucesso na 3ª tentativa', async () => {
    const err504 = Object.assign(new Error('Gateway Timeout'), {
      context: { status: 504 },
    });
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: err504 })
      .mockResolvedValueOnce({ data: null, error: err504 })
      .mockResolvedValueOnce({ data: { final: true }, error: null });

    const resultPromise = invokeEdge('fn', { method: 'GET', retryBaseMs: 1 });
    vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.data).toEqual({ final: true });
    expect(result.attempts).toBe(3);
    expect(mockInvoke).toHaveBeenCalledTimes(3);
  });

  it('retryIdempotent: false desabilita retry mesmo em GET', async () => {
    const err503 = Object.assign(new Error('Service Unavailable'), {
      context: { status: 503 },
    });
    mockInvoke.mockResolvedValue({ data: null, error: err503 });

    const result = await invokeEdge('fn', {
      method: 'GET',
      retryIdempotent: false,
      retryBaseMs: 1,
    });

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(result.attempts).toBe(1);
  });
});
