/**
 * cors — testa lógica de _shared/cors.ts (getCorsHeaders allowlist por origin)
 * 10 asserts
 *
 * O módulo original usa `Deno.env.get` em module scope, então colamos
 * a lógica inline com env vars controlados via variáveis do teste.
 */
import { describe, it, expect } from 'vitest';

// ── Lógica inline (espelho de _shared/cors.ts — parametrizada para teste) ───

const ALLOWED_HEADERS = [
  'authorization', 'x-client-info', 'apikey', 'content-type',
  'idempotency-key', 'x-request-id', 'x-hub-signature-256',
].join(', ');

const CORS_HEADERS_BASE = {
  'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
};

const STATIC_ALLOWED_ORIGINS = [
  'https://sistema.noexcusedigital.com.br',
  'https://noexcusedigital.com.br',
];

function buildCorsHeaders(req: Request | undefined, opts: {
  prodFrontend?: string;
  allowLovablePreview?: boolean;
} = {}): Record<string, string> {
  const { prodFrontend, allowLovablePreview = false } = opts;

  const ALLOWED_PATTERNS: RegExp[] = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
  ];

  if (prodFrontend) {
    ALLOWED_PATTERNS.push(
      new RegExp(`^${prodFrontend.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
    );
  }

  if (allowLovablePreview || !prodFrontend) {
    ALLOWED_PATTERNS.push(/^https:\/\/[a-z0-9-]+\.lovable\.app$/);
    ALLOWED_PATTERNS.push(/^https:\/\/[a-z0-9-]+\.lovableproject\.com$/);
  }

  function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return false;
    if (STATIC_ALLOWED_ORIGINS.includes(origin)) return true;
    return ALLOWED_PATTERNS.some((p) => p.test(origin));
  }

  const origin = req?.headers.get('Origin') ?? null;
  const allowedOrigin = isAllowedOrigin(origin)
    ? origin!
    : (prodFrontend ?? STATIC_ALLOWED_ORIGINS[0]);

  return { ...CORS_HEADERS_BASE, 'Access-Control-Allow-Origin': allowedOrigin };
}

// ────────────────────────────────────────────────────────────────────────────

describe('cors — getCorsHeaders', () => {
  it('retorna origin estático permitido (sistema.noexcusedigital.com.br)', () => {
    const req = new Request('https://api.x.com', {
      headers: { Origin: 'https://sistema.noexcusedigital.com.br' },
    });
    const h = buildCorsHeaders(req);
    expect(h['Access-Control-Allow-Origin']).toBe('https://sistema.noexcusedigital.com.br');
  });

  it('aceita localhost em qualquer porta', () => {
    const req = new Request('https://api.x.com', {
      headers: { Origin: 'http://localhost:5173' },
    });
    const h = buildCorsHeaders(req);
    expect(h['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
  });

  it('aceita 127.0.0.1 em qualquer porta', () => {
    const req = new Request('https://api.x.com', {
      headers: { Origin: 'http://127.0.0.1:3000' },
    });
    const h = buildCorsHeaders(req);
    expect(h['Access-Control-Allow-Origin']).toBe('http://127.0.0.1:3000');
  });

  it('aceita lovable.app em modo dev (sem prodFrontend)', () => {
    const req = new Request('https://api.x.com', {
      headers: { Origin: 'https://my-app.lovable.app' },
    });
    const h = buildCorsHeaders(req); // sem prodFrontend = dev mode
    expect(h['Access-Control-Allow-Origin']).toBe('https://my-app.lovable.app');
  });

  it('rejeita lovable.app em prod sem opt-in (retorna fallback)', () => {
    const req = new Request('https://api.x.com', {
      headers: { Origin: 'https://my-app.lovable.app' },
    });
    const h = buildCorsHeaders(req, {
      prodFrontend: 'https://sistema.noexcusedigital.com.br',
      allowLovablePreview: false,
    });
    // não é lovable, retorna o prodFrontend como fallback
    expect(h['Access-Control-Allow-Origin']).toBe('https://sistema.noexcusedigital.com.br');
  });

  it('aceita lovable.app em prod quando ALLOW_LOVABLE_PREVIEW=true', () => {
    const req = new Request('https://api.x.com', {
      headers: { Origin: 'https://my-app.lovable.app' },
    });
    const h = buildCorsHeaders(req, {
      prodFrontend: 'https://sistema.noexcusedigital.com.br',
      allowLovablePreview: true,
    });
    expect(h['Access-Control-Allow-Origin']).toBe('https://my-app.lovable.app');
  });

  it('rejeita origin desconhecido e retorna fallback prodFrontend', () => {
    const req = new Request('https://api.x.com', {
      headers: { Origin: 'https://evil.com' },
    });
    const h = buildCorsHeaders(req, { prodFrontend: 'https://sistema.noexcusedigital.com.br' });
    expect(h['Access-Control-Allow-Origin']).toBe('https://sistema.noexcusedigital.com.br');
  });

  it('sem Origin usa fallback (origem default)', () => {
    const req = new Request('https://api.x.com');
    const h = buildCorsHeaders(req, { prodFrontend: 'https://sistema.noexcusedigital.com.br' });
    expect(h['Access-Control-Allow-Origin']).toBe('https://sistema.noexcusedigital.com.br');
  });

  it('inclui Vary: Origin nos headers de resposta', () => {
    const h = buildCorsHeaders(undefined);
    expect(h['Vary']).toBe('Origin');
  });

  it('inclui Access-Control-Max-Age para preflight caching', () => {
    const h = buildCorsHeaders(undefined);
    expect(h['Access-Control-Max-Age']).toBe('86400');
  });
});
