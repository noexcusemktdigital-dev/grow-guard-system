// Deno-compatible HMAC SHA-256 com timing-safe compare.
// Usado por webhooks de Meta (Leadgen, WhatsApp Cloud, Instagram).
//
// Meta envia header `x-hub-signature-256: sha256=<hex>`
// Computado: HMAC-SHA256(APP_SECRET, raw_body)

export async function computeMetaSignature(secret: string, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  return 'sha256=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export interface MetaWebhookValidation {
  valid: boolean;
  reason?: string;
}

/** Valida x-hub-signature-256 com APP_SECRET. */
export async function verifyMetaWebhook(
  req: Request, rawBody: string, secret: string | undefined
): Promise<MetaWebhookValidation> {
  if (!secret) return { valid: false, reason: 'missing_app_secret_env' };
  const provided = req.headers.get('x-hub-signature-256');
  if (!provided) return { valid: false, reason: 'missing_signature_header' };
  const expected = await computeMetaSignature(secret, rawBody);
  if (!timingSafeEqual(provided, expected)) return { valid: false, reason: 'invalid_signature' };
  return { valid: true };
}
