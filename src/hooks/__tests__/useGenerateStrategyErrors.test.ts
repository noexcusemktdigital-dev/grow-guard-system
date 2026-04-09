/**
 * Isolated tests for useGenerateStrategy error paths.
 * Must be in a separate file to avoid cross-test contamination from shared mock state
 * in useMarketingStrategy.test.ts (particularly mockGetSession leaking between tests).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Hoisted mocks
const mockGetSession = vi.fn();
const mockFunctionsInvoke = vi.fn();
const mockOrgId = { data: null as string | null };

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => mockOrgId,
}));

vi.mock("@/lib/supabase", () => ({
  PORTAL_STORAGE_KEY: "noe-saas-auth",
  supabase: {
    from: () => ({}),
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

vi.mock("@/lib/edgeFunctionError", () => ({
  extractEdgeFunctionError: (error: unknown) =>
    Promise.resolve(error instanceof Error ? error : new Error(String((error as any)?.message || error))),
}));

import { useGenerateStrategy } from "../useMarketingStrategy";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useGenerateStrategy error paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
  });

  it("handles edge function error (non-2xx response)", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "AI error" } });

    const { result } = renderHook(() => useGenerateStrategy(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ answers: {}, organization_id: "org-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("handles data-level error from edge function body", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: { error: "Rate limited" }, error: null });

    const { result } = renderHook(() => useGenerateStrategy(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ answers: {}, organization_id: "org-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
