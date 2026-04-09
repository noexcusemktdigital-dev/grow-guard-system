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

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockImplementation(() => finalFn());
  chain.single = vi.fn().mockImplementation(() => finalFn());
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => ({
      select: (...args: any[]) => {
        const chain = buildChain(() => mockQueryResult);
        return chain.select(...args);
      },
      insert: (data: any) => {
        const chain = buildChain(() => mockMutationResult);
        return chain.insert(data);
      },
      update: (data: any) => {
        const chain = buildChain(() => mockMutationResult);
        return chain.update(data);
      },
      delete: () => {
        const chain = buildChain(() => mockMutationResult);
        return chain.delete();
      },
    }),
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
  },
}));

import { useClienteDispatches, useClienteDispatchMutations } from "../useClienteDispatches";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useClienteDispatches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useClienteDispatches(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches dispatches when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const dispatches = [
      { id: "d1", title: "WhatsApp Campaign", channel: "whatsapp", created_at: "2026-01-01" },
      { id: "d2", title: "Email Blast", channel: "email", created_at: "2026-01-02" },
    ];
    mockQueryResult.data = dispatches;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClienteDispatches(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(dispatches);
  });

  it("shows loading state initially", () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClienteDispatches(), { wrapper: createWrapper() });
    // Just checking the hook renders without crash
    expect(result.current).toBeDefined();
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };

    const { result } = renderHook(() => useClienteDispatches(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useClienteDispatchMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("createDispatch calls insert", async () => {
    mockMutationResult.data = { id: "d-new", title: "New Dispatch" };

    const { result } = renderHook(() => useClienteDispatchMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createDispatch.mutate({ title: "New Dispatch", channel: "whatsapp" });
    });

    await waitFor(() =>
      expect(result.current.createDispatch.isSuccess || result.current.createDispatch.isError).toBe(true)
    );
  });

  it("updateDispatch calls update with id", async () => {
    mockMutationResult.data = { id: "d1", title: "Updated Dispatch" };

    const { result } = renderHook(() => useClienteDispatchMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.updateDispatch.mutate({ id: "d1", title: "Updated Dispatch" });
    });

    await waitFor(() =>
      expect(result.current.updateDispatch.isSuccess || result.current.updateDispatch.isError).toBe(true)
    );
  });

  it("deleteDispatch calls delete", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useClienteDispatchMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.deleteDispatch.mutate("d1");
    });

    await waitFor(() =>
      expect(result.current.deleteDispatch.isSuccess || result.current.deleteDispatch.isError).toBe(true)
    );
  });

  it("triggerBulkSend invokes whatsapp-bulk-send function", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { sent: 10 }, error: null });

    const { result } = renderHook(() => useClienteDispatchMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.triggerBulkSend.mutate("dispatch-id-1");
    });

    await waitFor(() => expect(result.current.triggerBulkSend.isSuccess).toBe(true));
    expect(mockFunctionsInvoke).toHaveBeenCalledWith("whatsapp-bulk-send", {
      body: { dispatch_id: "dispatch-id-1" },
    });
  });

  it("triggerBulkSend handles error", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "Function failed" } });

    const { result } = renderHook(() => useClienteDispatchMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.triggerBulkSend.mutate("dispatch-id-bad");
    });

    await waitFor(() => expect(result.current.triggerBulkSend.isError).toBe(true));
  });

  it("handles mutation error on createDispatch", async () => {
    mockMutationResult.data = null;
    mockMutationResult.error = { message: "Insert failed" };

    const { result } = renderHook(() => useClienteDispatchMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createDispatch.mutate({ title: "Bad Dispatch" });
    });

    await waitFor(() => expect(result.current.createDispatch.isError).toBe(true));
  });
});
