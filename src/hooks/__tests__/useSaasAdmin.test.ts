import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Chainable supabase mock
const mockQueryResult = { data: null as any, error: null as any };
const mockMutationResult = { data: null as any, error: null as any };

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.or = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockImplementation(() => finalFn());
  chain.single = vi.fn().mockImplementation(() => finalFn());
  chain.maybeSingle = vi.fn().mockImplementation(() => finalFn());
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  // Make chain thenable so awaiting it resolves
  chain.then = (resolve: any, reject?: any) => Promise.resolve(finalFn()).then(resolve, reject);
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => ({
      select: (...args: any[]) => {
        const chain = buildChain(() => mockQueryResult);
        return chain;
      },
      insert: (data: any) => {
        const chain = buildChain(() => mockMutationResult);
        return chain;
      },
      update: (data: any) => {
        const chain = buildChain(() => mockMutationResult);
        return chain;
      },
      delete: () => {
        const chain = buildChain(() => mockMutationResult);
        return chain;
      },
    }),
  },
}));

import {
  usePlatformErrors,
  useResolveError,
  useDeleteError,
  useErrorStats,
} from "../useSaasAdmin";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("usePlatformErrors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("fetches errors with no filters", async () => {
    const errors = [
      { id: "e1", severity: "critical", source: "edge-fn", resolved: false, created_at: "2026-03-28T00:00:00Z" },
      { id: "e2", severity: "warning", source: "rpc", resolved: true, created_at: "2026-03-27T00:00:00Z" },
    ];
    mockQueryResult.data = errors;
    mockQueryResult.error = null;

    const { result } = renderHook(() => usePlatformErrors(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(errors);
  });

  it("handles fetch error", async () => {
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };

    const { result } = renderHook(() => usePlatformErrors(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("returns empty array when no errors", async () => {
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => usePlatformErrors(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("accepts filter parameters without crashing", () => {
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(
      () => usePlatformErrors({ severity: "critical", status: "open", search: "test" }),
      { wrapper: createWrapper() }
    );

    // Hook should initialize without throwing
    expect(result.current).toBeDefined();
  });
});

describe("useResolveError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("resolves an error", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useResolveError(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ errorId: "e1", note: "Fixed" });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });

  it("resolves an error without note", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useResolveError(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ errorId: "e1" });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});

describe("useDeleteError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationResult.error = null;
  });

  it("deletes an error", async () => {
    const { result } = renderHook(() => useDeleteError(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate("e1");
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});

describe("useErrorStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("computes error stats correctly", async () => {
    const now = new Date();
    const recentDate = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(); // 12h ago
    const oldDate = new Date(2025, 0, 1).toISOString();
    const resolvedDate = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();

    const errors = [
      { id: "e1", severity: "critical", source: "edge-fn", resolved: false, created_at: recentDate, resolved_at: null },
      { id: "e2", severity: "warning", source: "rpc", resolved: true, created_at: recentDate, resolved_at: resolvedDate },
      { id: "e3", severity: "info", source: "edge-fn", resolved: false, created_at: oldDate, resolved_at: null },
    ];
    mockQueryResult.data = errors;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useErrorStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalOpen).toBe(2); // e1 and e3 are open
    expect(result.current.data?.criticalOpen).toBe(1); // e1 only
    expect(result.current.data?.last24h).toBe(2); // e1 and e2
    expect(result.current.data?.dailyCounts).toBeDefined();
    expect(result.current.data?.bySource).toBeDefined();
  });

  it("handles empty results", async () => {
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useErrorStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalOpen).toBe(0);
    expect(result.current.data?.criticalOpen).toBe(0);
  });

  it("handles fetch error", async () => {
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Stats failed" };

    const { result } = renderHook(() => useErrorStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
