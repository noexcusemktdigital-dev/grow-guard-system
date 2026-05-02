/**
 * error-toast — reportError / reportEdgeError
 *
 * Asserts (8):
 * 1. reportError usa title custom no toast
 * 2. requestId aparece na description (truncado a 8 chars)
 * 3. console.error chamado quando console=true
 * 4. analytics.track recebe ERROR_DISPLAYED + categoria correta
 * 5. analytics.track não recebe PII (email bloqueado)
 * 6. requestId ausente → description sem "(id: ...)"
 * 7. reportEdgeError retorna sem chamar toast quando error é null
 * 8. reportEdgeError chama reportError quando error está presente
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockToastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }));

const mockTrack = vi.fn();
vi.mock("@/lib/analytics", () => ({ analytics: { track: (...a: unknown[]) => mockTrack(...a) } }));

vi.mock("@/lib/analytics-events", () => ({
  ANALYTICS_EVENTS: { ERROR_DISPLAYED: "error_displayed" },
}));

import { reportError, reportEdgeError } from "@/lib/error-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeErr(message: string, requestId?: string): Error & { requestId?: string } {
  const e = new Error(message) as Error & { requestId?: string };
  if (requestId) e.requestId = requestId;
  return e;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("reportError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usa title custom no toast", () => {
    reportError(new Error("algo falhou"), { title: "Falha ao salvar lead", console: false });
    expect(mockToastError).toHaveBeenCalledOnce();
    const [title] = mockToastError.mock.calls[0];
    expect(title).toBe("Falha ao salvar lead");
  });

  it("mostra requestId truncado a 8 chars na description", () => {
    const err = makeErr("timeout", "abcdef12345678901234");
    reportError(err, { title: "Erro", showRequestId: true, console: false });
    const [, opts] = mockToastError.mock.calls[0];
    expect(opts.description).toContain("(id: abcdef12");
    expect(opts.description).not.toContain("abcdef123456789012"); // truncado
  });

  it("chama console.error quando console=true", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    reportError(new Error("boom"), { category: "test_cat", console: true });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("test_cat");
    spy.mockRestore();
  });

  it("analytics.track recebe ERROR_DISPLAYED com category correto", () => {
    reportError(new Error("x"), { category: "lead_save", console: false });
    expect(mockTrack).toHaveBeenCalledOnce();
    const [eventName, props] = mockTrack.mock.calls[0];
    expect(eventName).toBe("error_displayed");
    expect(props.category).toBe("lead_save");
  });

  it("analytics.track não inclui PII (sem email, senha, token)", () => {
    reportError(new Error("x"), {
      category: "auth",
      console: false,
    });
    const [, props] = mockTrack.mock.calls[0];
    const keys = Object.keys(props);
    const piiKeys = ["email", "password", "token", "cpf", "phone"];
    piiKeys.forEach((k) => expect(keys).not.toContain(k));
  });

  it("sem requestId → description não contém '(id:'", () => {
    reportError(new Error("simples"), { showRequestId: true, console: false });
    const [, opts] = mockToastError.mock.calls[0];
    expect(opts.description).not.toContain("(id:");
  });
});

describe("reportEdgeError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna sem chamar toast quando error é null", () => {
    reportEdgeError({ error: null, requestId: "req-1" });
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("chama toast quando error está presente", () => {
    reportEdgeError(
      { error: new Error("edge falhou"), requestId: "req-xyz-99" },
      { title: "Erro de edge", console: false }
    );
    expect(mockToastError).toHaveBeenCalledOnce();
    const [title] = mockToastError.mock.calls[0];
    expect(title).toBe("Erro de edge");
  });
});
