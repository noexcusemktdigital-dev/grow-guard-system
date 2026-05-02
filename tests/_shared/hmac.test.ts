/**
 * Tests para supabase/functions/_shared/hmac.ts
 * Roda com: deno test --allow-env tests/_shared/hmac.test.ts
 *
 * Código do helper copiado inline pois os helpers ainda não existem no main.
 * Quando PR #4/#5 for mergeado, substituir inline por:
 *   import { computeMetaSignature, timingSafeEqual, verifyMetaWebhook } from "../supabase/functions/_shared/hmac.ts";
 */

import {
  assertEquals,
  assert,
  assertFalse,
} from "https://deno.land/std@0.220.0/assert/mod.ts";

// ── Helper inline (espelho de hmac.ts — PR #4/#5) ────────────────────────────

async function computeMetaSignature(
  appSecret: string,
  rawBody: string,
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256=${hex}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  // Constant-time compare: always iterate max(len) characters
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  const maxLen = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length; // length mismatch contributes
  for (let i = 0; i < maxLen; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

async function verifyMetaWebhook(
  req: Request,
  rawBody: string,
  appSecret: string | undefined,
): Promise<{ valid: boolean; reason?: string }> {
  if (!appSecret) {
    return { valid: false, reason: "missing_app_secret_env" };
  }
  const header = req.headers.get("x-hub-signature-256");
  if (!header) {
    return { valid: false, reason: "missing_signature_header" };
  }
  const expected = await computeMetaSignature(appSecret, rawBody);
  if (!timingSafeEqual(header, expected)) {
    return { valid: false, reason: "invalid_signature" };
  }
  return { valid: true };
}

// ── computeMetaSignature ─────────────────────────────────────────────────────

Deno.test("computeMetaSignature: gera sha256 hex prefixado com 'sha256='", async () => {
  const sig = await computeMetaSignature("secret123", "hello world");
  assert(sig.startsWith("sha256="), `esperava prefixo sha256=, recebeu: ${sig}`);
  assertEquals(sig.length, 7 + 64, "sha256= (7) + 64 hex chars");
});

Deno.test("computeMetaSignature: deterministico — mesma key+body = mesma sig", async () => {
  const a = await computeMetaSignature("k", "body");
  const b = await computeMetaSignature("k", "body");
  assertEquals(a, b);
});

Deno.test("computeMetaSignature: body diferente produz sig diferente", async () => {
  const a = await computeMetaSignature("k", "body1");
  const b = await computeMetaSignature("k", "body2");
  assert(a !== b, "bodies diferentes devem gerar sigs diferentes");
});

Deno.test("computeMetaSignature: key diferente produz sig diferente", async () => {
  const a = await computeMetaSignature("secret-A", "body");
  const b = await computeMetaSignature("secret-B", "body");
  assert(a !== b, "secrets diferentes devem gerar sigs diferentes");
});

// ── timingSafeEqual ──────────────────────────────────────────────────────────

Deno.test("timingSafeEqual: strings iguais retornam true", () => {
  assert(timingSafeEqual("abc", "abc"));
  assert(timingSafeEqual("", ""));
  assert(timingSafeEqual("sha256=abcdef1234567890", "sha256=abcdef1234567890"));
});

Deno.test("timingSafeEqual: strings diferentes retornam false", () => {
  assertFalse(timingSafeEqual("abc", "abd"), "ultimo char diferente");
  assertFalse(timingSafeEqual("abc", "ab"), "comprimento diferente — mais curto");
  assertFalse(timingSafeEqual("ab", "abc"), "comprimento diferente — mais longo");
  assertFalse(timingSafeEqual("abc", ""), "vazio vs nao-vazio");
});

// ── verifyMetaWebhook ────────────────────────────────────────────────────────

Deno.test("verifyMetaWebhook: rejeita quando appSecret é undefined", async () => {
  const req = new Request("https://x.com", { method: "POST" });
  const result = await verifyMetaWebhook(req, "{}", undefined);
  assertFalse(result.valid);
  assertEquals(result.reason, "missing_app_secret_env");
});

Deno.test("verifyMetaWebhook: rejeita quando header x-hub-signature-256 ausente", async () => {
  const req = new Request("https://x.com", { method: "POST" });
  const result = await verifyMetaWebhook(req, "{}", "mysecret");
  assertFalse(result.valid);
  assertEquals(result.reason, "missing_signature_header");
});

Deno.test("verifyMetaWebhook: rejeita signature inválida (deadbeef)", async () => {
  const req = new Request("https://x.com", {
    method: "POST",
    headers: { "x-hub-signature-256": "sha256=deadbeef" },
  });
  const result = await verifyMetaWebhook(req, "{}", "mysecret");
  assertFalse(result.valid);
  assertEquals(result.reason, "invalid_signature");
});

Deno.test("verifyMetaWebhook: aceita signature válida end-to-end", async () => {
  const body = JSON.stringify({ event: "leadgen", id: "123" });
  const sig = await computeMetaSignature("mysecret", body);
  const req = new Request("https://x.com", {
    method: "POST",
    headers: { "x-hub-signature-256": sig },
  });
  const result = await verifyMetaWebhook(req, body, "mysecret");
  assert(result.valid, `esperava válido, motivo: ${result.reason}`);
});

Deno.test("verifyMetaWebhook: rejeita quando secret é diferente do usado para assinar", async () => {
  const body = "{}";
  const sig = await computeMetaSignature("secret-A", body);
  const req = new Request("https://x.com", {
    method: "POST",
    headers: { "x-hub-signature-256": sig },
  });
  const result = await verifyMetaWebhook(req, body, "secret-B");
  assertFalse(result.valid);
  assertEquals(result.reason, "invalid_signature");
});
