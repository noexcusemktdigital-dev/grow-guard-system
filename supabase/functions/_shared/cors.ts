const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.supabase\.co$/,
];

const ALLOWED_ORIGINS_EXACT = [
  'http://localhost:5173',
  'http://localhost:3000',
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  const isAllowed =
    ALLOWED_ORIGINS_EXACT.includes(origin) ||
    ALLOWED_ORIGIN_PATTERNS.some(p => p.test(origin));
  const allowedOrigin = isAllowed ? origin : 'https://grow-guard-system.lovable.app';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  };
}
