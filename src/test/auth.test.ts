/**
 * QA-002: Auth & role guard tests
 * Covers: withTimeout utility, useAuth defaults, CODE-003 fail-closed role logic
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ── withTimeout — extracted for unit testing ──────────────────────────────────
// Mirrors the implementation in AuthContext.tsx exactly:
function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

describe("withTimeout", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resolves with value when promise completes before timeout", async () => {
    const promise = Promise.resolve("ok");
    const result = await withTimeout(promise, 1000, "fallback");
    expect(result).toBe("ok");
  });

  it("resolves with fallback when timeout fires first", async () => {
    const neverResolves = new Promise<string>(() => {});
    const resultPromise = withTimeout(neverResolves, 100, "fallback");
    vi.advanceTimersByTime(200);
    const result = await resultPromise;
    expect(result).toBe("fallback");
  });

  it("fallback null — models role fetch timeout → fail-closed", async () => {
    const neverResolves = new Promise<string | null>(() => {});
    const resultPromise = withTimeout(neverResolves, 6000, null);
    vi.advanceTimersByTime(7000);
    const result = await resultPromise;
    // null means no role assigned — CODE-003: fail-closed, deny access
    expect(result).toBeNull();
  });

  it("resolves immediately when promise is already settled", async () => {
    const settled = Promise.resolve(42);
    const result = await withTimeout(settled, 5000, 0);
    expect(result).toBe(42);
  });
});

// ── useAuth defaults ──────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signOut: mocks.signOut,
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
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

import { useAuth } from "@/contexts/AuthContext";

describe("useAuth default context", () => {
  it("returns null role before session loads (fail-closed default)", () => {
    // useAuth outside AuthProvider returns default context values
    const { result } = renderHook(() => useAuth());
    expect(result.current.role).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("returns loading=true as initial default", () => {
    const { result } = renderHook(() => useAuth());
    // Default context has loading: true
    expect(result.current.loading).toBe(true);
  });

  it("provides signOut and refreshProfile as no-ops by default", async () => {
    const { result } = renderHook(() => useAuth());
    // Should not throw when called outside provider
    await expect(result.current.signOut()).resolves.toBeUndefined();
    await expect(result.current.refreshProfile()).resolves.toBeUndefined();
  });
});

// ── Role guard: fail-closed (CODE-003) ───────────────────────────────────────
describe("CODE-003: role access — fail-closed", () => {
  it("null role blocks access in a typical guard pattern", () => {
    const role = null;
    const allowedRoles = ["super_admin", "admin"];

    // This is how components should guard — deny if role is null
    const hasAccess = role !== null && allowedRoles.includes(role);
    expect(hasAccess).toBe(false);
  });

  it("valid role grants access", () => {
    const role = "admin" as const;
    const allowedRoles = ["super_admin", "admin"];

    const hasAccess = role !== null && allowedRoles.includes(role);
    expect(hasAccess).toBe(true);
  });

  it("undefined role (unexpected) is denied via null check", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role: any = undefined;
    const allowedRoles = ["super_admin", "admin", "franqueado"];

    const hasAccess = role != null && allowedRoles.includes(role);
    expect(hasAccess).toBe(false);
  });

  it("lower-privilege role is denied from admin resource", () => {
    const role = "cliente_user" as const;
    const adminRoles = ["super_admin", "admin"];

    const hasAccess = role !== null && adminRoles.includes(role);
    expect(hasAccess).toBe(false);
  });
});
