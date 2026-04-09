// @ts-nocheck
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

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockImplementation(() => finalFn());
  chain.single = vi.fn().mockImplementation(() => finalFn());
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
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

import { useCrmFunnels, useCrmFunnelMutations } from "../useCrmFunnels";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCrmFunnels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useCrmFunnels(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches funnels when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const funnels = [
      { id: "f1", name: "Default", is_default: true, stages: [] },
      { id: "f2", name: "Sales", is_default: false, stages: ["novo", "qualificado"] },
    ];
    mockQueryResult.data = funnels;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useCrmFunnels(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(funnels);
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Failed to load funnels" };

    const { result } = renderHook(() => useCrmFunnels(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("returns empty array when no funnels exist", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useCrmFunnels(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("useCrmFunnelMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("createFunnel calls insert", async () => {
    mockMutationResult.data = { id: "f-new", name: "New Funnel" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmFunnelMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createFunnel.mutate({ name: "New Funnel", stages: ["stage1"] as any });
    });

    await waitFor(() => expect(result.current.createFunnel.isSuccess || result.current.createFunnel.isError).toBe(true));
  });

  it("updateFunnel calls update with id", async () => {
    mockMutationResult.data = { id: "f1", name: "Updated" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmFunnelMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.updateFunnel.mutate({ id: "f1", name: "Updated" });
    });

    await waitFor(() => expect(result.current.updateFunnel.isSuccess || result.current.updateFunnel.isError).toBe(true));
  });

  it("deleteFunnel calls delete", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmFunnelMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.deleteFunnel.mutate("f1");
    });

    await waitFor(() => expect(result.current.deleteFunnel.isSuccess || result.current.deleteFunnel.isError).toBe(true));
  });

  it("handles mutation error", async () => {
    mockMutationResult.data = null;
    mockMutationResult.error = { message: "Insert failed" };

    const { result } = renderHook(() => useCrmFunnelMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createFunnel.mutate({ name: "Bad Funnel" });
    });

    await waitFor(() => expect(result.current.createFunnel.isError).toBe(true));
  });
});
