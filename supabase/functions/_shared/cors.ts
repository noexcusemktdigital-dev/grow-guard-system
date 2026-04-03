// API-004: CORS — origens permitidas (estáticas + dinâmicas para Lovable preview)
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

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Aceitar qualquer subdomínio do Lovable (preview e produção)
  if (origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')) return true;
  return false;
}

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('Origin') ?? '';
  const allowedOrigin = isAllowedOrigin(origin)
    ? origin
    : ALLOWED_ORIGINS[0]; // fallback ao domínio primário (server-to-server sem Origin)
  return {
    ...CORS_HEADERS_BASE,
    'Access-Control-Allow-Origin': allowedOrigin,
  };
}
