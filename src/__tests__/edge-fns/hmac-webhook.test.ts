/**
 * HMAC — Valida _shared/hmac.ts (INT-001/002)
 *
 * Código do helper copiado inline pois Vitest não roda Deno imports (crypto.subtle ok no jsdom).
 * Quando _shared/hmac.ts for bundleável, substituir inline por import.
 */
import { describe, it, expect } from "vitest";

// ── Helper inline (espelho de _shared/hmac.ts) ────────────────────────────────

async function computeMetaSignature(secret: string, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return (
    "sha256=" +
    Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

interface MetaWebhookValidation {
  valid: boolean;
  reason?: string;
}

async function verifyMetaWebhook(
  req: Request,
  rawBody: string,
  secret: string | undefined
): Promise<MetaWebhookValidation> {
  if (!secret) return { valid: false, reason: "missing_app_secret_env" };
  const provided = req.headers.get("x-hub-signature-256");
  if (!provided) return { valid: false, reason: "missing_signature_header" };
  const expected = await computeMetaSignature(secret, rawBody);
  if (!timingSafeEqual(provided, expected)) return { valid: false, reason: "invalid_signature" };
  return { valid: true };
}

// ── computeMetaSignature ─────────────────────────────────────────────────────

describe("HMAC — computeMetaSignature", () => {
  it("gera sha256 hex prefixado com 'sha256='", async () => {
    const sig = await computeMetaSignature("secret123", "hello world");
    expect(sig.startsWith("sha256=")).toBe(true);
    expect(sig.length).toBe(7 + 64); // sha256= (7) + 64 hex chars
  });

  it("é determinístico — mesma key+body = mesma sig", async () => {
    const a = await computeMetaSignature("k", "body");
    const b = await computeMetaSignature("k", "body");
    expect(a).toBe(b);
  });

  it("body diferente produz sig diferente", async () => {
    const a = await computeMetaSignature("k", "body1");
    const b = await computeMetaSignature("k", "body2");
    expect(a).not.toBe(b);
  });

  it("secret diferente produz sig diferente", async () => {
    const a = await computeMetaSignature("secret-A", "body");
    const b = await computeMetaSignature("secret-B", "body");
    expect(a).not.toBe(b);
  });
});

// ── timingSafeEqual ──────────────────────────────────────────────────────────

describe("HMAC — timingSafeEqual", () => {
  it("strings iguais retornam true", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("", "")).toBe(true);
    expect(timingSafeEqual("sha256=abcdef1234567890", "sha256=abcdef1234567890")).toBe(true);
  });

  it("strings diferentes retornam false", () => {
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "ab")).toBe(false);
    expect(timingSafeEqual("ab", "abc")).toBe(false);
    expect(timingSafeEqual("abc", "")).toBe(false);
  });

  it("strings de comprimentos diferentes sempre retornam false (sem short-circuit)", () => {
    expect(timingSafeEqual("a", "aa")).toBe(false);
    expect(timingSafeEqual("abcdefghij", "a")).toBe(false);
  });
});

// ── verifyMetaWebhook ────────────────────────────────────────────────────────

describe("HMAC — verifyMetaWebhook", () => {
  it("rejeita quando appSecret é undefined", async () => {
    const req = new Request("https://x.com", { method: "POST" });
    const result = await verifyMetaWebhook(req, "{}", undefined);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("missing_app_secret_env");
  });

  it("rejeita quando header x-hub-signature-256 está ausente", async () => {
    const req = new Request("https://x.com", { method: "POST" });
    const result = await verifyMetaWebhook(req, "{}", "mysecret");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("missing_signature_header");
  });

  it("rejeita signature inválida (deadbeef)", async () => {
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "x-hub-signature-256": "sha256=deadbeef" },
    });
    const result = await verifyMetaWebhook(req, "{}", "mysecret");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("invalid_signature");
  });

  it("aceita signature válida end-to-end", async () => {
    const body = JSON.stringify({ event: "leadgen", id: "123" });
    const sig = await computeMetaSignature("mysecret", body);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "x-hub-signature-256": sig },
    });
    const result = await verifyMetaWebhook(req, body, "mysecret");
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("rejeita quando secret é diferente do usado para assinar", async () => {
    const body = "{}";
    const sig = await computeMetaSignature("secret-A", body);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "x-hub-signature-256": sig },
    });
    const result = await verifyMetaWebhook(req, body, "secret-B");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("invalid_signature");
  });

  it("rejeita corpo adulterado (mesmo secret, body diferente)", async () => {
    const originalBody = JSON.stringify({ event: "leadgen" });
    const tamperedBody = JSON.stringify({ event: "leadgen", admin: true });
    const sig = await computeMetaSignature("mysecret", originalBody);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "x-hub-signature-256": sig },
    });
    const result = await verifyMetaWebhook(req, tamperedBody, "mysecret");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("invalid_signature");
  });
});
