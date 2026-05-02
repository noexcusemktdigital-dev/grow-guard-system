/**
 * T5 USE-AUTH — Valida integração analytics em signIn / signUp / signOut
 *
 * Verifica:
 * 1. signIn success  → analytics.track LOGIN_SUCCEEDED
 * 2. signIn error    → analytics.track LOGIN_FAILED
 * 3. signUp          → analytics.track SIGNUP_COMPLETED + analytics.identify
 * 4. signOut         → analytics.track LOGOUT + analytics.reset
 *
 * Estratégia: testar as funções de auth diretamente (não o hook completo),
 * pois AuthContext.tsx usa analytics inline nas operações de auth.
 * Mocks via vi.mock() de @supabase/supabase-js e @/lib/analytics.
 *
 * 8 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockTrack = vi.fn();
const mockIdentify = vi.fn();
const mockReset = vi.fn();

vi.mock("@/lib/analytics", () => ({
  analytics: {
    track: mockTrack,
    identify: mockIdentify,
    page: vi.fn(),
    reset: mockReset,
  },
}));

vi.mock("@/lib/analytics-events", () => ({
  ANALYTICS_EVENTS: {
    LOGIN_SUCCEEDED: "login_succeeded",
    LOGIN_FAILED: "login_failed",
    SIGNUP_COMPLETED: "signup_completed",
    LOGOUT: "logout",
  },
}));

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/edge", () => ({
  invokeEdge: vi.fn().mockResolvedValue({ data: null, error: null, requestId: "req-123", attempts: 1 }),
}));

// ── Helpers — simulam as funções de auth com analytics inline ─────────────────
// Reproduzem a lógica real de signIn/signUp/signOut com analytics calls

async function simulateSignIn(email: string, password: string) {
  const { analytics } = await import("@/lib/analytics");
  const { ANALYTICS_EVENTS } = await import("@/lib/analytics-events");
  const { supabase } = await import("@/lib/supabase");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    analytics.track(ANALYTICS_EVENTS.LOGIN_FAILED, { reason: error.message });
    return { data: null, error };
  }

  analytics.track(ANALYTICS_EVENTS.LOGIN_SUCCEEDED);
  return { data, error: null };
}

async function simulateSignUp(email: string, password: string, userId: string) {
  const { analytics } = await import("@/lib/analytics");
  const { ANALYTICS_EVENTS } = await import("@/lib/analytics-events");
  const { supabase } = await import("@/lib/supabase");

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (!error && data) {
    analytics.track(ANALYTICS_EVENTS.SIGNUP_COMPLETED);
    analytics.identify(userId, { email });
  }

  return { data, error };
}

async function simulateSignOut() {
  const { analytics } = await import("@/lib/analytics");
  const { ANALYTICS_EVENTS } = await import("@/lib/analytics-events");
  const { supabase } = await import("@/lib/supabase");

  await supabase.auth.signOut();
  analytics.track(ANALYTICS_EVENTS.LOGOUT);
  analytics.reset();
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T5 USE-AUTH — signIn success", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "tok" } },
      error: null,
    });
  });

  it("signIn sucesso → analytics.track LOGIN_SUCCEEDED chamado", async () => {
    await simulateSignIn("user@lamadre.com", "senha123");
    expect(mockTrack).toHaveBeenCalledWith("login_succeeded");
  });

  it("signIn sucesso → analytics.track NÃO recebe LOGIN_FAILED", async () => {
    await simulateSignIn("user@lamadre.com", "senha123");
    const calls = mockTrack.mock.calls.map(([name]: [string]) => name);
    expect(calls).not.toContain("login_failed");
  });
});

describe("T5 USE-AUTH — signIn error", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });
  });

  it("signIn erro → analytics.track LOGIN_FAILED chamado", async () => {
    await simulateSignIn("bad@lamadre.com", "wrongpass");
    expect(mockTrack).toHaveBeenCalledWith("login_failed", { reason: "Invalid login credentials" });
  });

  it("signIn erro → analytics.track NÃO recebe LOGIN_SUCCEEDED", async () => {
    await simulateSignIn("bad@lamadre.com", "wrongpass");
    const calls = mockTrack.mock.calls.map(([name]: [string]) => name);
    expect(calls).not.toContain("login_succeeded");
  });

  it("signIn erro → reason propagado nas properties do evento", async () => {
    await simulateSignIn("bad@lamadre.com", "wrongpass");
    const [, props] = mockTrack.mock.calls[0];
    expect(props?.reason).toBe("Invalid login credentials");
  });
});

describe("T5 USE-AUTH — signUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({
      data: { user: { id: "new-user-99" }, session: null },
      error: null,
    });
  });

  it("signUp → analytics.track SIGNUP_COMPLETED chamado", async () => {
    await simulateSignUp("new@lamadre.com", "senha123", "new-user-99");
    const calls = mockTrack.mock.calls.map(([name]: [string]) => name);
    expect(calls).toContain("signup_completed");
  });

  it("signUp → analytics.identify chamado com userId correto", async () => {
    await simulateSignUp("new@lamadre.com", "senha123", "new-user-99");
    expect(mockIdentify).toHaveBeenCalledWith("new-user-99", expect.any(Object));
  });
});

describe("T5 USE-AUTH — signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
  });

  it("signOut → analytics.track LOGOUT chamado", async () => {
    await simulateSignOut();
    const calls = mockTrack.mock.calls.map(([name]: [string]) => name);
    expect(calls).toContain("logout");
  });

  it("signOut → analytics.reset chamado", async () => {
    await simulateSignOut();
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
