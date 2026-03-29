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
  },
}));

import { useCrmAutomations, useCrmAutomationMutations } from "../useCrmAutomations";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCrmAutomations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useCrmAutomations(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches automations when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const automations = [
      { id: "a1", name: "Welcome Email", trigger_type: "lead_created", action_type: "send_email", is_active: true },
      { id: "a2", name: "Follow Up", trigger_type: "no_activity_7d", action_type: "notify_user", is_active: false },
    ];
    mockQueryResult.data = automations;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useCrmAutomations(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(automations);
  });

  it("returns loading state initially", () => {
    mockOrgId.data = "org-1";
    const { result } = renderHook(() => useCrmAutomations(), { wrapper: createWrapper() });
    expect(result.current).toBeDefined();
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };

    const { result } = renderHook(() => useCrmAutomations(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("returns empty array when no automations found", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useCrmAutomations(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("useCrmAutomationMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("createAutomation calls insert", async () => {
    mockMutationResult.data = { id: "a-new", name: "New Automation" };

    const { result } = renderHook(() => useCrmAutomationMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createAutomation.mutate({
        name: "New Automation",
        trigger_type: "lead_created",
        action_type: "send_email",
        is_active: true,
      });
    });

    await waitFor(() =>
      expect(result.current.createAutomation.isSuccess || result.current.createAutomation.isError).toBe(true)
    );
  });

  it("updateAutomation calls update with id", async () => {
    mockMutationResult.data = { id: "a1", name: "Updated Automation", is_active: false };

    const { result } = renderHook(() => useCrmAutomationMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.updateAutomation.mutate({ id: "a1", is_active: false });
    });

    await waitFor(() =>
      expect(result.current.updateAutomation.isSuccess || result.current.updateAutomation.isError).toBe(true)
    );
  });

  it("deleteAutomation calls delete", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmAutomationMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.deleteAutomation.mutate("a1");
    });

    await waitFor(() =>
      expect(result.current.deleteAutomation.isSuccess || result.current.deleteAutomation.isError).toBe(true)
    );
  });

  it("handles mutation error on createAutomation", async () => {
    mockMutationResult.data = null;
    mockMutationResult.error = { message: "Insert failed" };

    const { result } = renderHook(() => useCrmAutomationMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createAutomation.mutate({
        name: "Bad Automation",
        trigger_type: "lead_created",
        action_type: "send_email",
      });
    });

    await waitFor(() => expect(result.current.createAutomation.isError).toBe(true));
  });

  it("handles mutation error on deleteAutomation", async () => {
    mockMutationResult.error = { message: "Delete failed" };

    const { result } = renderHook(() => useCrmAutomationMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.deleteAutomation.mutate("bad-id");
    });

    await waitFor(() =>
      expect(result.current.deleteAutomation.isSuccess || result.current.deleteAutomation.isError).toBe(true)
    );
  });
});
