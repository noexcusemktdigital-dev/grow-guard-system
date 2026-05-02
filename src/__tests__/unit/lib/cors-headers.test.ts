/**
 * T-CORS-HEADERS — Valida lógica de allowlist por Origin (cors.ts inline)
 *
 * Verifica:
 * 1. localhost:3000 → sempre aceito
 * 2. localhost:8080 → sempre aceito
 * 3. localhost:5173 → sempre aceito
 * 4. subdominio lovable.dev → aceito em dev/staging (sem FRONTEND_URL)
 * 5. origin desconhecida → retorna FRONTEND_URL como fallback
 * 6. sem origin → retorna fallback estático
 *
 * 6 asserts
 */
import { describe, it, expect } from "vitest";

// ── Lógica inline espelhada de supabase/functions/_shared/cors.ts ────────────

const STATIC_ALLOWED_ORIGINS = [
  "https://sistema.noexcusedigital.com.br",
  "https://noexcusedigital.com.br",
];

function buildCorsHeaders(
  origin: string | null,
  opts: {
    frontendUrl?: string;
    allowLovablePreview?: boolean;
  } = {}
): Record<string, string> {
  const { frontendUrl, allowLovablePreview = false } = opts;

  const ALLOWED_PATTERNS: RegExp[] = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
  ];

  if (frontendUrl) {
    ALLOWED_PATTERNS.push(
      new RegExp(`^${frontendUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)
    );
  }

  if (allowLovablePreview || !frontendUrl) {
    ALLOWED_PATTERNS.push(/^https:\/\/[a-z0-9-]+\.lovable\.app$/);
    ALLOWED_PATTERNS.push(/^https:\/\/[a-z0-9-]+\.lovableproject\.com$/);
    ALLOWED_PATTERNS.push(/^https:\/\/[a-z0-9-]+\.lovable\.dev$/);
  }

  function isAllowedOrigin(o: string | null): boolean {
    if (!o) return false;
    if (STATIC_ALLOWED_ORIGINS.includes(o)) return true;
    return ALLOWED_PATTERNS.some((p) => p.test(o));
  }

  const allowedOrigin = isAllowedOrigin(origin)
    ? origin!
    : frontendUrl ?? STATIC_ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey",
    "Vary": "Origin",
  };
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("cors-headers — localhost sempre aceito", () => {
  it("localhost:3000 → retorna própria origin", () => {
    const h = buildCorsHeaders("http://localhost:3000");
    expect(h["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
  });

  it("localhost:8080 → retorna própria origin", () => {
    const h = buildCorsHeaders("http://localhost:8080");
    expect(h["Access-Control-Allow-Origin"]).toBe("http://localhost:8080");
  });

  it("localhost:5173 → retorna própria origin", () => {
    const h = buildCorsHeaders("http://localhost:5173");
    expect(h["Access-Control-Allow-Origin"]).toBe("http://localhost:5173");
  });
});

describe("cors-headers — lovable.dev aceito em dev/staging", () => {
  it("subdomínio lovable.dev aceito quando sem frontendUrl (dev/staging)", () => {
    const h = buildCorsHeaders("https://meuapp-123.lovable.dev");
    expect(h["Access-Control-Allow-Origin"]).toBe(
      "https://meuapp-123.lovable.dev"
    );
  });
});

describe("cors-headers — fallback para origin desconhecida", () => {
  it("origin aleatória → retorna FRONTEND_URL como fallback", () => {
    const prod = "https://app.grupolamadre.com.br";
    const h = buildCorsHeaders("https://evil.com", { frontendUrl: prod });
    expect(h["Access-Control-Allow-Origin"]).toBe(prod);
  });

  it("sem origin → retorna fallback estático quando sem frontendUrl", () => {
    const h = buildCorsHeaders(null);
    expect(h["Access-Control-Allow-Origin"]).toBe(STATIC_ALLOWED_ORIGINS[0]);
  });
});
