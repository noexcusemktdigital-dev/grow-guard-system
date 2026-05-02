/**
 * edge-wrapper — testa src/lib/edge.ts (invokeEdge wrapper)
 * 8 asserts: mock supabase.functions.invoke, x-request-id, error handling
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

import { invokeEdge } from '@/lib/edge';
import { supabase } from '@/lib/supabase';

const mockInvoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;

describe('edge — invokeEdge wrapper', () => {
  beforeEach(() => {
    mockInvoke.mockClear();
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
  });

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

  it('retorna error quando invoke retorna erro do Supabase', async () => {
    const supabaseErr = new Error('Function error');
    mockInvoke.mockResolvedValueOnce({ data: null, error: supabaseErr });
    const result = await invokeEdge('fn');
    expect(result.data).toBeNull();
    expect(result.error).toBe(supabaseErr);
  });

  it('captura exceção de rede e retorna error sem lançar', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('network failure'));
    const result = await invokeEdge('fn');
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
});
