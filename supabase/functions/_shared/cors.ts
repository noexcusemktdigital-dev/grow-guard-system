// API-008: CORS hardening — separa prod/staging/dev via env vars
//
// Política CORS:
// - Produção (FRONTEND_URL definido): apenas o frontend oficial + localhost
//   Lovable previews só são aceitos se ALLOW_LOVABLE_PREVIEW=true (opt-in explícito)
// - Dev/staging (sem FRONTEND_URL): aceita lovable.app/lovableproject.com/lovable.dev
// - Sempre: localhost/127.0.0.1 em qualquer porta
//
// Novas funções devem usar `getCorsHeaders(req)` (whitelist por Origin).
// `corsHeaders` estático é mantido para compatibilidade retroativa — DEPRECADO.

const PROD_FRONTEND = Deno.env.get('FRONTEND_URL'); // ex: https://sistema.noexcusedigital.com.br
const ALLOW_LOVABLE_PREVIEW = Deno.env.get('ALLOW_LOVABLE_PREVIEW') === 'true';

// Domínios oficiais sempre permitidos (legado — manter compat com deploys atuais)
const STATIC_ALLOWED_ORIGINS = [
  'https://sistema.noexcusedigital.com.br',
  'https://noexcusedigital.com.br',
];

const ALLOWED_PATTERNS: RegExp[] = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

if (PROD_FRONTEND) {
  ALLOWED_PATTERNS.push(
    new RegExp(`^${PROD_FRONTEND.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
  );
}

// Lovable previews: liberados apenas em dev/staging, OU em prod se opt-in via env
if (ALLOW_LOVABLE_PREVIEW || !PROD_FRONTEND) {
  ALLOWED_PATTERNS.push(/^https:\/\/[a-z0-9-]+\.lovable\.app$/);
  ALLOWED_PATTERNS.push(/^https:\/\/[a-z0-9-]+\.lovableproject\.com$/);
  ALLOWED_PATTERNS.push(/^https:\/\/[a-z0-9-]+\.lovable\.dev$/);
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (STATIC_ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_PATTERNS.some((p) => p.test(origin));
}

const ALLOWED_HEADERS = [
  'authorization',
  'x-client-info',
  'apikey',
  'content-type',
  'idempotency-key',          // API-004 (idempotência)
  'x-request-id',             // OPS-CRITICAL-01 (tracing)
  'x-hub-signature-256',      // Meta/WhatsApp webhooks
  'asaas-access-token',       // Asaas webhook
  'x-evolution-secret',       // Evolution API webhook
  'x-webhook-signature',      // CRM webhooks genéricos
  'x-webhook-secret',         // legado
  'x-api-key',                // legado
  'x-supabase-client-platform',
  'x-supabase-client-platform-version',
  'x-supabase-client-runtime',
  'x-supabase-client-runtime-version',
].join(', ');

const CORS_HEADERS_BASE = {
  'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
};

/** Headers CORS dinâmicos baseados no Origin do request. PREFERIR esta versão. */
export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('Origin') ?? null;
  const allowedOrigin = isAllowedOrigin(origin)
    ? origin!
    : (PROD_FRONTEND ?? STATIC_ALLOWED_ORIGINS[0]);
  return {
    ...CORS_HEADERS_BASE,
    'Access-Control-Allow-Origin': allowedOrigin,
  };
}

/**
 * Compatibilidade retroativa: `corsHeaders` estático com `*`.
 * @deprecated Use `getCorsHeaders(req)` — esta export será removido após
 * migração das funções legadas.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
};
