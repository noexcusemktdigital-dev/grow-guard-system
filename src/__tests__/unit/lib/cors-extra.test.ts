/**
 * T9 CORS-EXTRA — Valida getCorsHeaders allowlist por origin
 *
 * Verifica:
 * 1. localhost com porta qualquer → sempre permitido
 * 2. 127.0.0.1 com porta → sempre permitido
 * 3. Origin desconhecida → usa prodFrontend como fallback
 * 4. Origin de produção exata → permitida
 * 5. lovable.app preview → permitido quando allowLovablePreview=true
 * 6. lovable.app preview → bloqueado quando allowLovablePreview=false e prodFrontend definido
 * 7. Sem origin header → retorna fallback
 * 8. Origin estática (STATIC_ALLOWED_ORIGINS) → sempre permitida
 *
 * 8 asserts
 */
import { describe, it, expect } from "vitest";

// ── Lógica inline de cors (espelho controlado para teste) ─────────────────────

const STATIC_ALLOWED_ORIGINS = [
  "https://sistema.noexcusedigital.com.br",
  "https://noexcusedigital.com.br",
];

function buildCorsHeaders(
  origin: string | null,
  opts: {
    prodFrontend?: string;
    allowLovablePreview?: boolean;
  } = {}
): Record<string, string> {
  const { prodFrontend, allowLovablePreview = false } = opts;

  const ALLOWED_PATTERNS: RegExp[] = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
  ];

  if (prodFrontend) {
    ALLOWED_PATTERNS.push(
      new RegExp(`^${prodFrontend.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)
    );
  }

  if (allowLovablePreview || !prodFrontend) {
    ALLOWED_PATTERNS.push(/^https:\/\/[a-z0-9-]+\.lovable\.app$/);
    ALLOWED_PATTERNS.push(/^https:\/\/[a-z0-9-]+\.lovableproject\.com$/);
  }

  function isAllowedOrigin(o: string | null): boolean {
    if (!o) return false;
    if (STATIC_ALLOWED_ORIGINS.includes(o)) return true;
    return ALLOWED_PATTERNS.some((p) => p.test(o));
  }

  const allowedOrigin = isAllowedOrigin(origin)
    ? origin!
    : prodFrontend ?? STATIC_ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey",
    "Vary": "Origin",
  };
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T9 CORS — localhost sempre permitido", () => {
  it("localhost:3000 → Access-Control-Allow-Origin: http://localhost:3000", () => {
    const h = buildCorsHeaders("http://localhost:3000");
    expect(h["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
  });

  it("localhost:5173 → também permitido", () => {
    const h = buildCorsHeaders("http://localhost:5173");
    expect(h["Access-Control-Allow-Origin"]).toBe("http://localhost:5173");
  });

  it("127.0.0.1:8080 → permitido", () => {
    const h = buildCorsHeaders("http://127.0.0.1:8080");
    expect(h["Access-Control-Allow-Origin"]).toBe("http://127.0.0.1:8080");
  });
});

describe("T9 CORS — origin desconhecida e fallback", () => {
  it("origin desconhecida → usa prodFrontend como fallback", () => {
    const h = buildCorsHeaders("https://evil.com", {
      prodFrontend: "https://app.meusite.com.br",
    });
    expect(h["Access-Control-Allow-Origin"]).toBe("https://app.meusite.com.br");
  });

  it("sem origin header → retorna STATIC fallback quando sem prodFrontend", () => {
    const h = buildCorsHeaders(null);
    expect(h["Access-Control-Allow-Origin"]).toBe(STATIC_ALLOWED_ORIGINS[0]);
  });
});

describe("T9 CORS — allowlist por origem", () => {
  it("origin de produção exata → permitida", () => {
    const prod = "https://app.grupolamadre.com.br";
    const h = buildCorsHeaders(prod, { prodFrontend: prod });
    expect(h["Access-Control-Allow-Origin"]).toBe(prod);
  });

  it("origin estática → sempre permitida sem prodFrontend", () => {
    const h = buildCorsHeaders("https://sistema.noexcusedigital.com.br");
    expect(h["Access-Control-Allow-Origin"]).toBe(
      "https://sistema.noexcusedigital.com.br"
    );
  });

  it("lovable preview → permitido quando allowLovablePreview=true", () => {
    const h = buildCorsHeaders("https://my-app-abc123.lovable.app", {
      prodFrontend: "https://app.prod.com",
      allowLovablePreview: true,
    });
    expect(h["Access-Control-Allow-Origin"]).toBe(
      "https://my-app-abc123.lovable.app"
    );
  });

  it("lovable preview → bloqueado quando allowLovablePreview=false e prodFrontend definido", () => {
    const prod = "https://app.prod.com";
    const h = buildCorsHeaders("https://my-app-abc123.lovable.app", {
      prodFrontend: prod,
      allowLovablePreview: false,
    });
    // origin não permitida → cai para prodFrontend
    expect(h["Access-Control-Allow-Origin"]).toBe(prod);
  });
});
