/**
 * Gera idempotency key estável por intent + payload.
 *
 * Uso típico:
 *   const idempKey = await generateIdempotencyKey('buy-credits', { pack_id, billing_type });
 *   await supabase.functions.invoke('asaas-buy-credits', {
 *     body: { ... },
 *     headers: { 'Idempotency-Key': idempKey, 'x-request-id': generateRequestId() },
 *   });
 *
 * MESMA intent + MESMO payload em N tabs = MESMA key = 1 cobrança no Asaas.
 * NOVA intent (clique novo) = NOVA key (UUID + timestamp ms).
 */
export async function generateIdempotencyKey(intent: string, payload?: unknown): Promise<string> {
  if (!payload) {
    return `${intent}:${crypto.randomUUID()}`;
  }
  // Hash determinístico do payload + janela de tempo (10s) — protege contra duplo-clique mas
  // permite re-tentativa explícita após esperar.
  const window = Math.floor(Date.now() / 10000);
  const data = new TextEncoder().encode(JSON.stringify({ intent, payload, window }));
  const buf = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${intent}:${hex.slice(0, 32)}`;
}

/** Gera correlation ID para frontend → backend tracing. */
export function generateRequestId(): string {
  return crypto.randomUUID();
}
