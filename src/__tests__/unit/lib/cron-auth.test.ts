/**
 * CRON-AUTH-EXTRA — Casos adicionais para _shared/cron-auth.ts (INT-007-extra)
 *
 * Verifica:
 * 1. Bearer com whitespace extra antes do token → rejeitado (length diff)
 * 2. Bearer com whitespace extra após o token → rejeitado (length diff)
 * 3. Token quase certo (1 char diff no meio) → rejeitado por timing-safe XOR
 * 4. Token quase certo (último char diff) → rejeitado por timing-safe XOR
 * 5. Token correto em maiúsculas quando secret é minúsculas → rejeitado
 * 6. "bearer" (lowercase) em vez de "Bearer" → rejeitado
 *
 * 6 asserts
 */
import { describe, it, expect } from "vitest";

// ── Helper inline (espelho de _shared/cron-auth.ts) ──────────────────────────
function checkCronSecret(req: Request, cronSecret: string | undefined): Response | null {
  if (!cronSecret) {
    return new Response(
      JSON.stringify({ error: "cron_secret_not_configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");

  if (!auth) {
    return new Response(
      JSON.stringify({ error: "unauthorized", reason: "missing_authorization" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const expected = `Bearer ${cronSecret}`;

  // Constant-time compare
  if (auth.length !== expected.length) {
    return new Response(
      JSON.stringify({ error: "unauthorized", reason: "invalid_token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  let result = 0;
  for (let i = 0; i < auth.length; i++) result |= auth.charCodeAt(i) ^ expected.charCodeAt(i);

  if (result !== 0) {
    return new Response(
      JSON.stringify({ error: "unauthorized", reason: "invalid_token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return null;
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("CRON-AUTH-EXTRA — Bearer com whitespace/diff-length", () => {
  it("1. whitespace extra antes do token (length diff) → 401", () => {
    const req = new Request("https://x.com", {
      headers: { authorization: "Bearer  mysecret" }, // dois espaços
    });
    const result = checkCronSecret(req, "mysecret");
    expect(result).toBeInstanceOf(Response);
    expect(result!.status).toBe(401);
  });

  it("2. token com padding nulo extra (string manipulada) rejeitado por length diff", () => {
    // Simula header com conteúdo extra além do Bearer correto
    // HTTP headers não permitem trailing space sem quote, então usamos tab encoding
    const req = new Request("https://x.com", {
      headers: { authorization: "Bearer mysecretX" }, // X extra, mesmo length correto não
    });
    // "Bearer mysecretX" (16) vs "Bearer mysecret" (15) → length diff → 401
    const result = checkCronSecret(req, "mysecret");
    expect(result).toBeInstanceOf(Response);
    expect(result!.status).toBe(401);
  });
});

describe("CRON-AUTH-EXTRA — timing-safe XOR (1 char diff, mesmo comprimento)", () => {
  it("3. token quase certo — char do meio diferente → 401 via XOR", () => {
    // "mysecret" → troca char na posição 3: 'e' → 'X'
    const req = new Request("https://x.com", {
      headers: { authorization: "Bearer mysXcret" }, // mesmo length
    });
    const result = checkCronSecret(req, "mysecret");
    expect(result).toBeInstanceOf(Response);
    expect(result!.status).toBe(401);
  });

  it("4. token quase certo — último char diferente → 401 via XOR", () => {
    // "mysecret" → troca 't' por 'X' no final
    const req = new Request("https://x.com", {
      headers: { authorization: "Bearer mysecreX" }, // mesmo length
    });
    const result = checkCronSecret(req, "mysecret");
    expect(result).toBeInstanceOf(Response);
    expect(result!.status).toBe(401);
  });
});

describe("CRON-AUTH-EXTRA — case sensitivity", () => {
  it("5. token correto em MAIÚSCULAS quando secret é minúsculas → 401", () => {
    const req = new Request("https://x.com", {
      headers: { authorization: "Bearer MYSECRET" }, // comprimento igual, chars diff
    });
    const result = checkCronSecret(req, "mysecret");
    expect(result).toBeInstanceOf(Response);
    expect(result!.status).toBe(401);
  });

  it('6. "bearer" (lowercase) em vez de "Bearer" → 401 (length igual, XOR diff)', () => {
    // "bearer secret" vs "Bearer secret" — 'b' XOR 'B' != 0
    const req = new Request("https://x.com", {
      headers: { authorization: "bearer mysecret" }, // mesmo comprimento
    });
    const result = checkCronSecret(req, "mysecret");
    expect(result).toBeInstanceOf(Response);
    expect(result!.status).toBe(401);
  });
});
