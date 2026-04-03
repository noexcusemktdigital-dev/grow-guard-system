// API-004: CORS allowlist — restringe origens ao domínio NOE + localhost dev.
// Wildcard (*) foi removido pois aumenta superfície de ataque CSRF.
// Webhooks externos (Asaas, Z-API) não enviam Origin header — não são afetados.
const ALLOWED_ORIGINS = [
  'https://sistema.noexcusedigital.com.br',
  'https://noexcusedigital.com.br',
  'http://localhost:5173',
  'http://localhost:8080',
];

const CORS_HEADERS_BASE = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Vary': 'Origin',
};

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]; // fallback ao domínio primário (para server-to-server sem Origin)
  return {
    ...CORS_HEADERS_BASE,
    'Access-Control-Allow-Origin': allowedOrigin,
  };
}
