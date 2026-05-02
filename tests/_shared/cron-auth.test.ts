/**
 * Tests para supabase/functions/_shared/cron-auth.ts (PR #18)
 * Roda com: deno test --allow-env tests/_shared/cron-auth.test.ts
 *
 * Código do helper copiado inline pois o helper ainda não existe no main.
 * Quando PR #18 for mergeado, substituir inline pelo import do helper.
 */

import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.220.0/assert/mod.ts";

// ── Helper inline (espelho de cron-auth.ts — PR #18) ─────────────────────────

/**
 * Verifica o CRON_SECRET no header Authorization.
 * Usa comparação constant-time para evitar timing attacks.
 *
 * @returns null se autorizado, Response com status code se rejeitado.
 */
function checkCronSecret(req: Request): Response | null {
  const cronSecret = Deno.env.get("CRON_SECRET");

  // Sem secret configurado → misconfiguration, falha fechada (500)
  if (!cronSecret) {
    return new Response(
      JSON.stringify({ error: "cron_secret_not_configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("authorization") ??
    req.headers.get("Authorization");

  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "missing_authorization_header" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // Extrai token de "Bearer <token>"
  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) {
    return new Response(
      JSON.stringify({ error: "invalid_authorization_format" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const providedToken = authHeader.slice(prefix.length);

  // Constant-time compare para evitar timing oracle
  const a = new TextEncoder().encode(providedToken);
  const b = new TextEncoder().encode(cronSecret);
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }

  if (diff !== 0) {
    return new Response(
      JSON.stringify({ error: "invalid_cron_secret" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  return null; // autorizado
}

// ── checkCronSecret tests ─────────────────────────────────────────────────────

Deno.test("checkCronSecret: retorna 500 quando CRON_SECRET nao esta configurado", () => {
  Deno.env.delete("CRON_SECRET");
  const req = new Request("https://x.com", {
    headers: { authorization: "Bearer qualquer-coisa" },
  });
  const result = checkCronSecret(req);
  assert(result instanceof Response, "esperava Response, recebeu null");
  assertEquals(result.status, 500);
});

Deno.test("checkCronSecret: retorna 401 quando header Authorization ausente", async () => {
  Deno.env.set("CRON_SECRET", "supersecret");
  const req = new Request("https://x.com");
  const result = checkCronSecret(req);
  assert(result instanceof Response);
  assertEquals(result.status, 401);
  const body = await result.json();
  assertEquals(body.error, "missing_authorization_header");
});

Deno.test("checkCronSecret: retorna 401 para token errado", async () => {
  Deno.env.set("CRON_SECRET", "supersecret");
  const req = new Request("https://x.com", {
    headers: { authorization: "Bearer token-errado" },
  });
  const result = checkCronSecret(req);
  assert(result instanceof Response);
  assertEquals(result.status, 401);
  const body = await result.json();
  assertEquals(body.error, "invalid_cron_secret");
});

Deno.test("checkCronSecret: retorna null (autorizado) para token correto", () => {
  Deno.env.set("CRON_SECRET", "supersecret");
  const req = new Request("https://x.com", {
    headers: { authorization: "Bearer supersecret" },
  });
  const result = checkCronSecret(req);
  assertEquals(result, null, "esperava null (autorizado)");
});

Deno.test("checkCronSecret: aceita header Authorization (capital A)", () => {
  Deno.env.set("CRON_SECRET", "s");
  const req = new Request("https://x.com", {
    headers: { Authorization: "Bearer s" },
  });
  const result = checkCronSecret(req);
  assertEquals(result, null, "esperava null (autorizado) com header capitalizado");
});

Deno.test("checkCronSecret: retorna 401 para prefixo Bearer ausente", async () => {
  Deno.env.set("CRON_SECRET", "supersecret");
  const req = new Request("https://x.com", {
    headers: { authorization: "supersecret" }, // sem prefixo Bearer
  });
  const result = checkCronSecret(req);
  assert(result instanceof Response);
  assertEquals(result.status, 401);
});

Deno.test("checkCronSecret: rejeita token quase-correto (1 char diferente)", () => {
  Deno.env.set("CRON_SECRET", "supersecret");
  const req = new Request("https://x.com", {
    headers: { authorization: "Bearer supersecreX" }, // ultimo char errado
  });
  const result = checkCronSecret(req);
  assert(result instanceof Response);
  assertEquals(result.status, 401);
});
