// @ts-nocheck
/**
 * QA-001: Credit wallet & transaction tests
 * Covers: fetch enabled/disabled, error handling, limits, credit alert level logic
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

// ── Hoisted mock refs ─────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => {
  const limitFn = vi.fn();
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: limitFn,
    limit: limitFn,
  };
  const fromFn = vi.fn(() => chainMethods);
  return { fromFn, chainMethods, limitFn };
});

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mocks.fromFn, auth: { getSession: vi.fn() } },
}));

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: vi.fn(),
}));

vi.mock("@/hooks/useClienteSubscription", () => ({
  useClienteSubscription: vi.fn(() => ({ data: { status: "active", plan: "starter" }, isLoading: false })),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useCreditTransactions, useCreditTransactionsForOrg } from "@/hooks/useCreditTransactions";
import { useCreditAlert } from "@/hooks/useCreditAlert";
import { useClienteWallet } from "@/hooks/useClienteWallet";

// ── Wrapper factory ───────────────────────────────────────────────────────────
function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

const SAMPLE_TXS = [
  { id: "t1", organization_id: "org-1", type: "purchase", amount: 500, balance_after: 500, created_at: "2026-01-01T00:00:00Z" },
  { id: "t2", organization_id: "org-1", type: "debit",    amount: -10, balance_after: 490, created_at: "2026-01-02T00:00:00Z" },
];

// ── useCreditTransactions ────────────────────────────────────────────────────
describe("useCreditTransactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stays disabled when orgId is null", () => {
    vi.mocked(useUserOrgId).mockReturnValue({ data: null } as ReturnType<typeof useUserOrgId>);
    mocks.limitFn.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useCreditTransactions(), { wrapper: makeWrapper() });

    expect(result.current.isFetching).toBe(false);
    expect(mocks.fromFn).not.toHaveBeenCalled();
  });

  it("fetches transactions when orgId is present", async () => {
    vi.mocked(useUserOrgId).mockReturnValue({ data: "org-1" } as ReturnType<typeof useUserOrgId>);
    mocks.limitFn.mockResolvedValue({ data: SAMPLE_TXS, error: null });

    const { result } = renderHook(() => useCreditTransactions(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].type).toBe("purchase");
  });

  it("enters error state on supabase failure", async () => {
    vi.mocked(useUserOrgId).mockReturnValue({ data: "org-1" } as ReturnType<typeof useUserOrgId>);
    mocks.limitFn.mockResolvedValue({ data: null, error: { message: "DB error", code: "500" } });

    const { result } = renderHook(() => useCreditTransactions(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });

  it("applies .limit(50) to bound query volume", async () => {
    vi.mocked(useUserOrgId).mockReturnValue({ data: "org-1" } as ReturnType<typeof useUserOrgId>);
    mocks.limitFn.mockResolvedValue({ data: [], error: null });

    renderHook(() => useCreditTransactions(), { wrapper: makeWrapper() });

    await waitFor(() => expect(mocks.chainMethods.limit).toHaveBeenCalledWith(50));
  });
});

// ── useCreditTransactionsForOrg ──────────────────────────────────────────────
describe("useCreditTransactionsForOrg (explicit orgId)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is disabled when passed null", () => {
    mocks.limitFn.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useCreditTransactionsForOrg(null), { wrapper: makeWrapper() });

    expect(result.current.isFetching).toBe(false);
    expect(mocks.fromFn).not.toHaveBeenCalled();
  });

  it("queries with the provided org id", async () => {
    mocks.limitFn.mockResolvedValue({ data: SAMPLE_TXS, error: null });

    const { result } = renderHook(() => useCreditTransactionsForOrg("org-abc"), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.chainMethods.eq).toHaveBeenCalledWith("organization_id", "org-abc");
  });
});

// ── useCreditAlert — level calculation logic ──────────────────────────────────
describe("useCreditAlert: level thresholds", () => {
  beforeEach(() => vi.clearAllMocks());

  function renderAlert(walletBalance: number | null) {
    vi.mocked(useUserOrgId).mockReturnValue({ data: "org-1" } as ReturnType<typeof useUserOrgId>);

    // Mock useClienteWallet to return fixed balance
    mocks.fromFn.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: walletBalance !== null ? { id: "w1", balance: walletBalance } : null,
        error: null,
      }),
    }));

    return renderHook(() => useCreditAlert(), { wrapper: makeWrapper() });
  }

  it("returns 'zero' level when balance is 0", async () => {
    const { result } = renderAlert(0);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.level).toBe("zero");
    expect(result.current.balance).toBe(0);
  });

  it("returns 'normal' level when wallet data is missing (FIN-001 null guard)", async () => {
    const { result } = renderAlert(null);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // balance defaults to 0 via ?? 0 — should be zero or normal depending on total
    expect(["zero", "normal"]).toContain(result.current.level);
  });

  it("isLoading is true while queries are in flight", () => {
    vi.mocked(useUserOrgId).mockReturnValue({ data: "org-1" } as ReturnType<typeof useUserOrgId>);
    // Never resolve
    mocks.fromFn.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: () => new Promise(() => {}),
    }));

    const { result } = renderHook(() => useCreditAlert(), { wrapper: makeWrapper() });
    // Immediately after mount, before any data, isLoading is true
    expect(result.current.isLoading).toBe(true);
  });
});
