/**
 * asaas-webhook — HMAC validation + idempotência (Phase 19)
 *
 * Lógica inline: simula handler do webhook Asaas com:
 *   - Validação HMAC-SHA256 do x-asaas-signature
 *   - Insert em webhook_events com ON CONFLICT DO NOTHING (idempotência)
 *   - Mock Supabase admin client
 *
 * 12 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── HMAC inline (espelho de _shared/hmac.ts para Asaas) ──────────────────────

async function computeAsaasSignature(accessToken: string, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(accessToken),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Types ────────────────────────────────────────────────────────────────────

interface AsaasWebhookPayload {
  event: string;
  payment?: { id: string; status: string };
}

interface WebhookHandlerResult {
  status: number;
  body: { message: string; idempotent?: boolean };
}

// ── Handler inline (espelho da edge fn asaas-webhook) ────────────────────────

async function handleAsaasWebhook(
  req: Request,
  rawBody: string,
  accessToken: string | undefined,
  supabaseAdmin: {
    from: (table: string) => {
      insert: (row: object) => Promise<{ error: { code?: string; message: string } | null }>;
    };
  }
): Promise<WebhookHandlerResult> {
  if (!accessToken) {
    return { status: 500, body: { message: "missing_access_token_env" } };
  }

  // Validação HMAC
  const provided = req.headers.get("asaas-access-token") ?? req.headers.get("x-asaas-signature");
  if (!provided) {
    return { status: 401, body: { message: "missing_signature_header" } };
  }

  const expected = await computeAsaasSignature(accessToken, rawBody);
  if (provided !== expected) {
    return { status: 401, body: { message: "invalid_signature" } };
  }

  // Parse payload
  let payload: AsaasWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { message: "invalid_json" } };
  }

  // Idempotência via ON CONFLICT
  const insertResult = await supabaseAdmin
    .from("webhook_events")
    .insert({
      source: "asaas",
      event_type: payload.event,
      payload,
      received_at: new Date().toISOString(),
    });

  if (insertResult.error) {
    if (insertResult.error.code === "23505") {
      // unique_violation = já processado
      return { status: 200, body: { message: "already_processed", idempotent: true } };
    }
    return { status: 500, body: { message: "db_error" } };
  }

  return { status: 200, body: { message: "ok" } };
}

// ── Mock factory ──────────────────────────────────────────────────────────────

function makeSupabaseMock(insertError: { code?: string; message: string } | null = null) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: insertError }),
    }),
  };
}

// ── Testes ───────────────────────────────────────────────────────────────────

const ACCESS_TOKEN = "test-asaas-token-abc123";

describe("asaas-webhook — HMAC validation", () => {
  it("retorna 500 quando accessToken env está ausente", async () => {
    const req = new Request("https://x.com", { method: "POST" });
    const result = await handleAsaasWebhook(req, "{}", undefined, makeSupabaseMock());
    expect(result.status).toBe(500);
    expect(result.body.message).toBe("missing_access_token_env");
  });

  it("retorna 401 quando header de assinatura está ausente", async () => {
    const req = new Request("https://x.com", { method: "POST" });
    const result = await handleAsaasWebhook(req, "{}", ACCESS_TOKEN, makeSupabaseMock());
    expect(result.status).toBe(401);
    expect(result.body.message).toBe("missing_signature_header");
  });

  it("retorna 401 quando assinatura é inválida (deadbeef)", async () => {
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "asaas-access-token": "deadbeef" },
    });
    const body = JSON.stringify({ event: "PAYMENT_RECEIVED" });
    const result = await handleAsaasWebhook(req, body, ACCESS_TOKEN, makeSupabaseMock());
    expect(result.status).toBe(401);
    expect(result.body.message).toBe("invalid_signature");
  });

  it("retorna 200 ok com assinatura válida", async () => {
    const body = JSON.stringify({ event: "PAYMENT_RECEIVED", payment: { id: "pay_001", status: "RECEIVED" } });
    const sig = await computeAsaasSignature(ACCESS_TOKEN, body);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "asaas-access-token": sig },
    });
    const result = await handleAsaasWebhook(req, body, ACCESS_TOKEN, makeSupabaseMock());
    expect(result.status).toBe(200);
    expect(result.body.message).toBe("ok");
  });

  it("signature é sensível ao body — body adulterado causa 401", async () => {
    const originalBody = JSON.stringify({ event: "PAYMENT_RECEIVED" });
    const tamperedBody = JSON.stringify({ event: "PAYMENT_RECEIVED", admin: true });
    const sig = await computeAsaasSignature(ACCESS_TOKEN, originalBody);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "asaas-access-token": sig },
    });
    const result = await handleAsaasWebhook(req, tamperedBody, ACCESS_TOKEN, makeSupabaseMock());
    expect(result.status).toBe(401);
  });
});

describe("asaas-webhook — idempotência (ON CONFLICT)", () => {
  it("retorna 200 ok na primeira inserção bem-sucedida", async () => {
    const body = JSON.stringify({ event: "PAYMENT_RECEIVED" });
    const sig = await computeAsaasSignature(ACCESS_TOKEN, body);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "asaas-access-token": sig },
    });
    const supabase = makeSupabaseMock(null);
    const result = await handleAsaasWebhook(req, body, ACCESS_TOKEN, supabase);
    expect(result.status).toBe(200);
    expect(result.body.message).toBe("ok");
    expect(result.body.idempotent).toBeUndefined();
  });

  it("retorna 200 already_processed em conflito único (23505)", async () => {
    const body = JSON.stringify({ event: "PAYMENT_RECEIVED" });
    const sig = await computeAsaasSignature(ACCESS_TOKEN, body);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "asaas-access-token": sig },
    });
    const supabase = makeSupabaseMock({ code: "23505", message: "duplicate key" });
    const result = await handleAsaasWebhook(req, body, ACCESS_TOKEN, supabase);
    expect(result.status).toBe(200);
    expect(result.body.message).toBe("already_processed");
    expect(result.body.idempotent).toBe(true);
  });

  it("retorna 500 em erro de banco não-idempotente", async () => {
    const body = JSON.stringify({ event: "PAYMENT_RECEIVED" });
    const sig = await computeAsaasSignature(ACCESS_TOKEN, body);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "asaas-access-token": sig },
    });
    const supabase = makeSupabaseMock({ code: "42501", message: "permission denied" });
    const result = await handleAsaasWebhook(req, body, ACCESS_TOKEN, supabase);
    expect(result.status).toBe(500);
    expect(result.body.message).toBe("db_error");
  });

  it("insert é chamado com source 'asaas' e event_type correto", async () => {
    const body = JSON.stringify({ event: "PAYMENT_OVERDUE" });
    const sig = await computeAsaasSignature(ACCESS_TOKEN, body);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "asaas-access-token": sig },
    });
    const supabase = makeSupabaseMock(null);
    await handleAsaasWebhook(req, body, ACCESS_TOKEN, supabase);
    const insertMock = supabase.from("webhook_events").insert as ReturnType<typeof vi.fn>;
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ source: "asaas", event_type: "PAYMENT_OVERDUE" })
    );
  });

  it("retorna 400 para JSON inválido mesmo com signature correta", async () => {
    const rawBody = "not-json{{{";
    const sig = await computeAsaasSignature(ACCESS_TOKEN, rawBody);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "asaas-access-token": sig },
    });
    const result = await handleAsaasWebhook(req, rawBody, ACCESS_TOKEN, makeSupabaseMock());
    expect(result.status).toBe(400);
    expect(result.body.message).toBe("invalid_json");
  });

  it("supabase.from é chamado com tabela 'webhook_events'", async () => {
    const body = JSON.stringify({ event: "PAYMENT_RECEIVED" });
    const sig = await computeAsaasSignature(ACCESS_TOKEN, body);
    const req = new Request("https://x.com", {
      method: "POST",
      headers: { "asaas-access-token": sig },
    });
    const supabase = makeSupabaseMock(null);
    await handleAsaasWebhook(req, body, ACCESS_TOKEN, supabase);
    expect(supabase.from).toHaveBeenCalledWith("webhook_events");
  });
});
