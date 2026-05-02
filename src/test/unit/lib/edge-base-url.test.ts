import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---- helpers to isolate the module per test ----
let invokeSpy: ReturnType<typeof vi.fn>;

function setupMock(supabaseUrl: string | undefined) {
  invokeSpy = vi.fn().mockResolvedValue({ data: { ok: true }, error: null });

  vi.doMock("@/lib/supabase", () => ({
    supabase: {
      functions: {
        invoke: invokeSpy,
      },
    },
  }));

  if (supabaseUrl !== undefined) {
    vi.stubEnv("VITE_SUPABASE_URL", supabaseUrl);
  } else {
    vi.stubEnv("VITE_SUPABASE_URL", "");
  }
}

describe("invokeEdge — base URL derivation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("calls supabase.functions.invoke with the given function name", async () => {
    setupMock("https://zjcildbqshysaoszlsss.supabase.co");
    const { invokeEdge } = await import("@/lib/edge");

    await invokeEdge("my-fn", { body: { x: 1 } });

    expect(invokeSpy).toHaveBeenCalledOnce();
    expect(invokeSpy.mock.calls[0][0]).toBe("my-fn");
  });

  it("injects x-request-id header on every call", async () => {
    setupMock("https://zjcildbqshysaoszlsss.supabase.co");
    const { invokeEdge } = await import("@/lib/edge");

    const result = await invokeEdge("fn-a");

    const calledHeaders = invokeSpy.mock.calls[0][1].headers as Record<string, string>;
    expect(calledHeaders["x-request-id"]).toBeTruthy();
    expect(result.requestId).toBe(calledHeaders["x-request-id"]);
  });

  it("merges caller-supplied headers with x-request-id", async () => {
    setupMock("https://zjcildbqshysaoszlsss.supabase.co");
    const { invokeEdge } = await import("@/lib/edge");

    await invokeEdge("fn-b", { headers: { Authorization: "Bearer tok" } });

    const calledHeaders = invokeSpy.mock.calls[0][1].headers as Record<string, string>;
    expect(calledHeaders["Authorization"]).toBe("Bearer tok");
    expect(calledHeaders["x-request-id"]).toBeTruthy();
  });

  it("returns data and null error on success", async () => {
    setupMock("https://zjcildbqshysaoszlsss.supabase.co");
    const { invokeEdge } = await import("@/lib/edge");

    const result = await invokeEdge<{ ok: boolean }>("fn-c");

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ ok: true });
    expect(result.attempts).toBe(1);
  });

  it("returns error and null data when supabase returns an error", async () => {
    vi.resetModules();
    invokeSpy = vi.fn().mockResolvedValue({ data: null, error: new Error("edge down") });
    vi.doMock("@/lib/supabase", () => ({
      supabase: { functions: { invoke: invokeSpy } },
    }));

    const { invokeEdge } = await import("@/lib/edge");

    const result = await invokeEdge("fn-fail", { retries: 0 });

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe("edge down");
  });

  it("passes through method option to supabase.functions.invoke", async () => {
    setupMock("https://zjcildbqshysaoszlsss.supabase.co");
    const { invokeEdge } = await import("@/lib/edge");

    await invokeEdge("fn-get", { method: "GET" });

    const calledOptions = invokeSpy.mock.calls[0][1];
    expect(calledOptions.method).toBe("GET");
  });
});
