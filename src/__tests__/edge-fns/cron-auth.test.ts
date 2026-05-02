/**
 * CRON-AUTH — Valida _shared/cron-auth.ts (INT-007)
 *
 * Código do helper copiado inline pois Vitest não roda Deno.env.
 * Espelha exatamente a lógica de supabase/functions/_shared/cron-auth.ts.
 */
import { describe, it, expect } from "vitest";

// ── Helper inline (espelho de _shared/cron-auth.ts) ──────────────────────────

/**
 * Verifica o CRON_SECRET no header Authorization.
 * @param req Request da edge function
 * @param cronSecret Valor de CRON_SECRET (injetado — sem Deno.env)
 * @returns null se autorizado, Response com status code se rejeitado.
 */
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

describe("CRON-AUTH — checkCronSecret()", () => {
  describe("Misconfiguration path — sem CRON_SECRET", () => {
    it("retorna 500 quando CRON_SECRET não está configurado (undefined)", () => {
      const req = new Request("https://x.com", {
        headers: { authorization: "Bearer qualquer-coisa" },
      });
      const result = checkCronSecret(req, undefined);
      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(500);
    });

    it("body da 500 tem error='cron_secret_not_configured'", async () => {
      const req = new Request("https://x.com");
      const result = checkCronSecret(req, undefined);
      const body = await result!.json();
      expect(body.error).toBe("cron_secret_not_configured");
    });
  });

  describe("Error path — header ausente ou inválido", () => {
    it("retorna 401 quando header Authorization está ausente", async () => {
      const req = new Request("https://x.com");
      const result = checkCronSecret(req, "supersecret");
      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(401);
      const body = await result!.json();
      expect(body.reason).toBe("missing_authorization");
    });

    it("retorna 401 para token errado", async () => {
      const req = new Request("https://x.com", {
        headers: { authorization: "Bearer token-errado" },
      });
      const result = checkCronSecret(req, "supersecret");
      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(401);
      const body = await result!.json();
      expect(body.reason).toBe("invalid_token");
    });

    it("retorna 401 quando Bearer prefix está ausente", async () => {
      const req = new Request("https://x.com", {
        headers: { authorization: "supersecret" }, // sem 'Bearer '
      });
      const result = checkCronSecret(req, "supersecret");
      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(401);
    });

    it("rejeita token quase-correto (último char diferente)", () => {
      const req = new Request("https://x.com", {
        headers: { authorization: "Bearer supersecreX" }, // 'X' em vez de 't'
      });
      const result = checkCronSecret(req, "supersecret");
      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(401);
    });

    it("rejeita token com comprimento diferente (timing-safe)", () => {
      const req = new Request("https://x.com", {
        headers: { authorization: "Bearer supersecretXXX" }, // mais longo
      });
      const result = checkCronSecret(req, "supersecret");
      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(401);
    });
  });

  describe("Happy path — autorizado", () => {
    it("retorna null quando token é exatamente correto", () => {
      const req = new Request("https://x.com", {
        headers: { authorization: "Bearer supersecret" },
      });
      const result = checkCronSecret(req, "supersecret");
      expect(result).toBeNull();
    });

    it("aceita header 'Authorization' (capital A)", () => {
      const req = new Request("https://x.com", {
        headers: { Authorization: "Bearer s" },
      });
      const result = checkCronSecret(req, "s");
      expect(result).toBeNull();
    });

    it("aceita secrets longos (64 chars — formato comum de CRON_SECRET)", () => {
      const secret = "a".repeat(64);
      const req = new Request("https://x.com", {
        headers: { authorization: `Bearer ${secret}` },
      });
      const result = checkCronSecret(req, secret);
      expect(result).toBeNull();
    });
  });

  describe("Edge path — casos limítrofes", () => {
    it("secret de 1 char funciona", () => {
      const req = new Request("https://x.com", {
        headers: { authorization: "Bearer x" },
      });
      expect(checkCronSecret(req, "x")).toBeNull();
    });

    it("secret com caracteres especiais funciona", () => {
      const secret = "cron!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const req = new Request("https://x.com", {
        headers: { authorization: `Bearer ${secret}` },
      });
      expect(checkCronSecret(req, secret)).toBeNull();
    });

    it("não lança exceção para token de comprimento zero", () => {
      const req = new Request("https://x.com", {
        headers: { authorization: "" },
      });
      expect(() => checkCronSecret(req, "secret")).not.toThrow();
    });
  });
});
