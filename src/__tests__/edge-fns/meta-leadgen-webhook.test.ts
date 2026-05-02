/**
 * meta-leadgen-webhook — GET hub.verify_token + POST HMAC validation (Phase 19)
 *
 * Lógica inline: simula handler da edge fn meta-leadgen-webhook com:
 *   - GET challenge: verifica hub.verify_token
 *   - POST: valida x-hub-signature-256 (HMAC-SHA256 via crypto.subtle)
 *   - 401 para signature ausente ou inválida
 *
 * 10 asserts
 */
import { describe, it, expect, vi } from "vitest";

// ── HMAC inline (espelho de _shared/hmac.ts para Meta) ───────────────────────

async function computeMetaSignature(appSecret: string, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
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

// ── Handler inline ────────────────────────────────────────────────────────────

interface HandlerEnv {
  verifyToken?: string;
  appSecret?: string;
}

interface HandlerResult {
  status: number;
  body: string | object;
}

async function handleMetaLeadgenWebhook(
  req: Request,
  rawBody: string,
  env: HandlerEnv
): Promise<HandlerResult> {
  const url = new URL(req.url);

  // GET — hub verification
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (!env.verifyToken) return { status: 500, body: "missing_verify_token_env" };
    if (mode !== "subscribe") return { status: 400, body: "invalid_mode" };
    if (token !== env.verifyToken) return { status: 403, body: "invalid_verify_token" };
    if (!challenge) return { status: 400, body: "missing_challenge" };

    return { status: 200, body: challenge };
  }

  // POST — lead event
  if (req.method === "POST") {
    if (!env.appSecret) return { status: 500, body: "missing_app_secret_env" };

    const provided = req.headers.get("x-hub-signature-256");
    if (!provided) return { status: 401, body: { error: "missing_signature_header" } };

    const expected = await computeMetaSignature(env.appSecret, rawBody);
    if (provided !== expected) return { status: 401, body: { error: "invalid_signature" } };

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { status: 400, body: { error: "invalid_json" } };
    }

    return { status: 200, body: { message: "lead_received", payload } };
  }

  return { status: 405, body: "method_not_allowed" };
}

// ── Testes: GET hub verification ─────────────────────────────────────────────

describe("meta-leadgen-webhook — GET hub.verify_token", () => {
  const BASE_URL = "https://fn.supabase.co/meta-leadgen-webhook";

  it("retorna challenge quando token e mode são válidos", async () => {
    const url = `${BASE_URL}?hub.mode=subscribe&hub.verify_token=mysecret&hub.challenge=abc123`;
    const req = new Request(url, { method: "GET" });
    const result = await handleMetaLeadgenWebhook(req, "", { verifyToken: "mysecret" });
    expect(result.status).toBe(200);
    expect(result.body).toBe("abc123");
  });

  it("retorna 403 quando verify_token não confere", async () => {
    const url = `${BASE_URL}?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc`;
    const req = new Request(url, { method: "GET" });
    const result = await handleMetaLeadgenWebhook(req, "", { verifyToken: "correct" });
    expect(result.status).toBe(403);
  });

  it("retorna 400 quando hub.mode não é subscribe", async () => {
    const url = `${BASE_URL}?hub.mode=unsubscribe&hub.verify_token=mysecret&hub.challenge=abc`;
    const req = new Request(url, { method: "GET" });
    const result = await handleMetaLeadgenWebhook(req, "", { verifyToken: "mysecret" });
    expect(result.status).toBe(400);
    expect(result.body).toBe("invalid_mode");
  });
});

// ── Testes: POST signature validation ────────────────────────────────────────

describe("meta-leadgen-webhook — POST HMAC validation", () => {
  const APP_SECRET = "meta-app-secret-xyz";

  it("retorna 401 quando x-hub-signature-256 está ausente", async () => {
    const req = new Request("https://x.com", { method: "POST" });
    const result = await handleMetaLeadgenWebhook(req, "{}", { appSecret: APP_SECRET });
    expect(result.status).toBe(401);
    expect((result.body as { error: string }).error).toBe("missing_signature_header");
  });

  it("retorna 401 quando signature é inválida", async () => {
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "x-hub-signature-256": "sha256=deadbeef" },
    });
    const result = await handleMetaLeadgenWebhook(req, "{}", { appSecret: APP_SECRET });
    expect(result.status).toBe(401);
    expect((result.body as { error: string }).error).toBe("invalid_signature");
  });

  it("retorna 200 com signature válida", async () => {
    const body = JSON.stringify({ object: "page", entry: [{ id: "123" }] });
    const sig = await computeMetaSignature(APP_SECRET, body);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "x-hub-signature-256": sig },
    });
    const result = await handleMetaLeadgenWebhook(req, body, { appSecret: APP_SECRET });
    expect(result.status).toBe(200);
    expect((result.body as { message: string }).message).toBe("lead_received");
  });

  it("retorna 401 quando body foi alterado após assinatura (tamper detection)", async () => {
    const originalBody = JSON.stringify({ object: "page" });
    const tamperedBody = JSON.stringify({ object: "page", injected: true });
    const sig = await computeMetaSignature(APP_SECRET, originalBody);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "x-hub-signature-256": sig },
    });
    const result = await handleMetaLeadgenWebhook(req, tamperedBody, { appSecret: APP_SECRET });
    expect(result.status).toBe(401);
  });

  it("crypto.subtle está disponível e produz assinatura determinística", async () => {
    const body = "test-body";
    const sig1 = await computeMetaSignature(APP_SECRET, body);
    const sig2 = await computeMetaSignature(APP_SECRET, body);
    expect(sig1).toBe(sig2);
    expect(sig1.startsWith("sha256=")).toBe(true);
  });

  it("retorna 405 para método não suportado", async () => {
    const req = new Request("https://x.com", { method: "DELETE" });
    const result = await handleMetaLeadgenWebhook(req, "", {});
    expect(result.status).toBe(405);
  });
});
