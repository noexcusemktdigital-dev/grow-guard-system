// @ts-nocheck
// Idempotency helper for Asaas / credit mutations.
// Uses Idempotency-Key header + SHA-256 hash do payload para detectar replays.
// Cliente Supabase com service_role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export async function hashPayload(body: unknown): Promise<string> {
  const data = new TextEncoder().encode(typeof body === "string" ? body : JSON.stringify(body));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export interface IdempotencyResult {
  cached: boolean;
  status?: number;
  body?: any;
}

/** Returns cached response if key already used. Otherwise null (caller proceeds). */
export async function getCachedResponse(
  key: string, fnName: string, requestHash: string
): Promise<IdempotencyResult | null> {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data, error } = await sb
    .from("idempotency_keys")
    .select("response_status, response_body, request_hash, expires_at")
    .eq("key", key).eq("fn_name", fnName).maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  // Mismatch de hash = mesma key mas payload diferente = ataque/erro de cliente
  if (data.request_hash !== requestHash) {
    throw new Error("idempotency_key_conflict: same key, different payload");
  }
  if (data.response_status == null) {
    // Em processamento — retornar 409
    return { cached: true, status: 409, body: { error: "request_in_progress" } };
  }
  return { cached: true, status: data.response_status, body: data.response_body };
}

export async function saveResponse(
  key: string, fnName: string, orgId: string | null, userId: string | null,
  requestHash: string, status: number, body: any
): Promise<void> {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  await sb.from("idempotency_keys").upsert({
    key, fn_name: fnName, organization_id: orgId, user_id: userId,
    request_hash: requestHash, response_status: status, response_body: body,
  }, { onConflict: "key,fn_name" });
}

/** Wrapper: extrai header Idempotency-Key, valida cache, executa handler, salva.
 * Se nao houver header, executa handler sem cachear (mantem compat com clientes existentes).
 */
export async function withIdempotency<T>(
  req: Request, fnName: string,
  ctx: { orgId?: string | null, userId?: string | null },
  handler: () => Promise<{ status: number, body: T }>
): Promise<{ status: number, body: T | { error: string } }> {
  const key = req.headers.get("idempotency-key") || req.headers.get("Idempotency-Key");
  if (!key) {
    // Sem key = nao-idempotente (compat). Executa handler direto.
    return await handler();
  }
  const bodyClone = await req.clone().text();
  const requestHash = await hashPayload(bodyClone);
  try {
    const cached = await getCachedResponse(key, fnName, requestHash);
    if (cached) return { status: cached.status!, body: cached.body };
  } catch (e) {
    return { status: 409, body: { error: String(e instanceof Error ? e.message : e) } };
  }
  const result = await handler();
  try {
    await saveResponse(key, fnName, ctx.orgId ?? null, ctx.userId ?? null, requestHash, result.status, result.body);
  } catch (e) {
    console.error("[idempotency] failed to save response:", e);
  }
  return result;
}
