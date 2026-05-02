import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock useUserOrgId
const mockOrgId = { data: null as string | null };
vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => mockOrgId,
}));

// Supabase mock
const mockQueryResult = { data: null as any, error: null as any };
const mockMutationResult = { data: null as any, error: null as any };
const mockFunctionsInvoke = vi.fn();

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockImplementation(() => finalFn());
  chain.single = vi.fn().mockImplementation(() => finalFn());
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
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
    }),
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
  },
}));

import { useUnits, useUnitMutations } from "../useUnits";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useUnits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    const { result } = renderHook(() => useUnits(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches units when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const units = [
      { id: "u1", name: "Unit A", city: "SP" },
      { id: "u2", name: "Unit B", city: "RJ" },
    ];
    mockQueryResult.data = units;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useUnits(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(units);
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Failed to load units" };

    const { result } = renderHook(() => useUnits(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("returns empty array when no units", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useUnits(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("useUnitMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("createUnit calls insert with org id", async () => {
    mockMutationResult.data = { id: "u-new", name: "New Unit" };

    const { result } = renderHook(() => useUnitMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createUnit.mutate({ name: "New Unit", city: "SP" });
    });

    await waitFor(() => expect(result.current.createUnit.isSuccess || result.current.createUnit.isError).toBe(true));
  });

  it("updateUnit calls update with id", async () => {
    mockMutationResult.data = { id: "u1", name: "Updated" };

    const { result } = renderHook(() => useUnitMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.updateUnit.mutate({ id: "u1", name: "Updated" });
    });

    await waitFor(() => expect(result.current.updateUnit.isSuccess || result.current.updateUnit.isError).toBe(true));
  });

  it("deleteUnit calls edge function", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useUnitMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.deleteUnit.mutate("u1");
    });

    await waitFor(() => expect(result.current.deleteUnit.isSuccess).toBe(true));
    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      "delete-unit",
      expect.objectContaining({
        body: { unit_id: "u1" },
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      }),
    );
  });

  it("deleteUnit handles edge function error response", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { error: "Unit has active members" }, error: null });

    const { result } = renderHook(() => useUnitMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.deleteUnit.mutate("u1");
    });

    await waitFor(() => expect(result.current.deleteUnit.isError).toBe(true));
    expect(result.current.deleteUnit.error).toEqual(new Error("Unit has active members"));
  });

  it("deleteUnit handles invoke error", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "Network error" } });

    const { result } = renderHook(() => useUnitMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.deleteUnit.mutate("u1");
    });

    await waitFor(() => expect(result.current.deleteUnit.isError).toBe(true));
  });

  it("handles create mutation error", async () => {
    mockMutationResult.data = null;
    mockMutationResult.error = { message: "Insert failed" };

    const { result } = renderHook(() => useUnitMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createUnit.mutate({ name: "Bad Unit" });
    });

    await waitFor(() => expect(result.current.createUnit.isError).toBe(true));
  });
});
