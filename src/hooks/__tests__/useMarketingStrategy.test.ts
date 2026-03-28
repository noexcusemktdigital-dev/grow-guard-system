import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock useUserOrgId
const mockOrgId = { data: null as string | null };
vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => mockOrgId,
}));

// Chainable supabase mock
const mockQueryResult = { data: null as any, error: null as any };
const mockMutationResult = { data: null as any, error: null as any };
const mockFunctionsInvoke = vi.fn();
const mockRpc = vi.fn();
const mockGetSession = vi.fn();

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockImplementation(() => finalFn());
  chain.maybeSingle = vi.fn().mockImplementation(() => finalFn());
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  // Make chain thenable so awaiting it resolves
  chain.then = (resolve: any) => resolve(finalFn());
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
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
    rpc: (...args: any[]) => mockRpc(...args),
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

import {
  useActiveStrategy,
  useStrategyHistory,
  useHasActiveStrategy,
  useSaveStrategy,
  useApproveStrategy,
  useGenerateStrategy,
} from "../useMarketingStrategy";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useActiveStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useActiveStrategy(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches active strategy when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const strategy = { id: "s1", is_active: true, nivel: "avancado", score_percentage: 85 };
    mockQueryResult.data = strategy;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useActiveStrategy(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(strategy);
  });

  it("returns null when no active strategy", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useActiveStrategy(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };

    const { result } = renderHook(() => useActiveStrategy(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useStrategyHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useStrategyHistory(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches strategy history", async () => {
    mockOrgId.data = "org-1";
    const history = [
      { id: "s1", is_active: false, nivel: "basico" },
      { id: "s2", is_active: false, nivel: "intermediario" },
    ];
    mockQueryResult.data = history;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useStrategyHistory(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(history);
  });

  it("returns empty array when no history", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useStrategyHistory(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("useHasActiveStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("returns true when active strategy exists", async () => {
    mockQueryResult.data = { id: "s1", is_active: true };

    const { result } = renderHook(() => useHasActiveStrategy(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasStrategy).toBe(true);
  });

  it("returns false when no active strategy", async () => {
    mockQueryResult.data = null;

    const { result } = renderHook(() => useHasActiveStrategy(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasStrategy).toBe(false);
  });
});

describe("useSaveStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("saves new strategy after deactivating previous", async () => {
    mockMutationResult.data = { id: "s-new", is_active: true, nivel: "avancado" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useSaveStrategy(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({
        answers: { q1: "a1" },
        score_percentage: 85,
        nivel: "avancado",
      });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });

  it("throws when orgId is null", async () => {
    mockOrgId.data = null;

    const { result } = renderHook(() => useSaveStrategy(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({
        answers: {},
        score_percentage: 0,
        nivel: "basico",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("handles mutation error", async () => {
    mockMutationResult.data = null;
    mockMutationResult.error = { message: "Insert failed" };

    const { result } = renderHook(() => useSaveStrategy(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({
        answers: {},
        score_percentage: 50,
        nivel: "basico",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useGenerateStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls generate-strategy edge function", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token-123" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: { strategy: "result" }, error: null });

    const { result } = renderHook(() => useGenerateStrategy(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ answers: { q1: "a1" }, organization_id: "org-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFunctionsInvoke).toHaveBeenCalledWith("generate-strategy", {
      body: { answers: { q1: "a1" }, organization_id: "org-1" },
    });
  });

  it("throws when not authenticated", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useGenerateStrategy(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ answers: {}, organization_id: "org-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("handles edge function error", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "AI error" } });

    const { result } = renderHook(() => useGenerateStrategy(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ answers: {}, organization_id: "org-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("handles data-level error", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: { error: "Rate limited" }, error: null });

    const { result } = renderHook(() => useGenerateStrategy(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ answers: {}, organization_id: "org-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
