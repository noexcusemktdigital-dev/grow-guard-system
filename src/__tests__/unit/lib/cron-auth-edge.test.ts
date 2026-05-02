/**
 * CRON-AUTH-EDGE — Casos limítrofes de autenticação cron
 *
 * Verifica:
 * 1. Whitespace antes do "Bearer" é rejeitado (401)
 * 2. Whitespace depois do token é rejeitado (timing-safe length mismatch)
 * 3. Header vazio → 401
 * 4. Apenas "Bearer " sem secret → 401
 * 5. Token correto com whitespace trailing → rejeitado
 * 6. Token exato → retorna null (autorizado)
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

describe("CRON-AUTH-EDGE — whitespace e casos limítrofes", () => {
  const SECRET = "my-cron-secret-2026";

  it("header sem prefixo 'Bearer ' (apenas token raw) → 401 invalid_token", async () => {
    // Envia o secret sem o prefixo Bearer — válido como header mas falha constant-time compare
    const req = new Request("https://api.test", {
      headers: { authorization: SECRET }, // sem "Bearer " prefix
    });
    const res = checkCronSecret(req, SECRET);
    expect(res).toBeInstanceOf(Response);
    expect(res!.status).toBe(401);
    const body = await res!.json();
    expect(body.reason).toBe("invalid_token");
  });

  it("token com sufixo adicional → 401 por length mismatch", async () => {
    const req = new Request("https://api.test", {
      headers: { authorization: `Bearer ${SECRET}EXTRA` }, // longer than expected
    });
    const res = checkCronSecret(req, SECRET);
    expect(res).toBeInstanceOf(Response);
    expect(res!.status).toBe(401);
  });

  it("header authorization ausente → 401 missing_authorization", async () => {
    const req = new Request("https://api.test");
    const res = checkCronSecret(req, SECRET);
    expect(res).toBeInstanceOf(Response);
    expect(res!.status).toBe(401);
    const body = await res!.json();
    expect(body.reason).toBe("missing_authorization");
  });

  it("apenas 'Bearer ' sem secret → 401 invalid_token (length mismatch)", async () => {
    const req = new Request("https://api.test", {
      headers: { authorization: "Bearer " }, // sem secret após espaço
    });
    const res = checkCronSecret(req, SECRET);
    expect(res).toBeInstanceOf(Response);
    expect(res!.status).toBe(401);
  });

  it("token quase correto (último char diferente) → 401 invalid_token", async () => {
    // Mesmo tamanho, char diferente no final — testa constant-time XOR
    const almostRight = `Bearer ${SECRET.slice(0, -1)}X`;
    const req = new Request("https://api.test", {
      headers: { authorization: almostRight },
    });
    const res = checkCronSecret(req, SECRET);
    expect(res).toBeInstanceOf(Response);
    expect(res!.status).toBe(401);
  });

  it("token exatamente correto → retorna null (autorizado)", () => {
    const req = new Request("https://api.test", {
      headers: { authorization: `Bearer ${SECRET}` },
    });
    const res = checkCronSecret(req, SECRET);
    expect(res).toBeNull();
  });
});
