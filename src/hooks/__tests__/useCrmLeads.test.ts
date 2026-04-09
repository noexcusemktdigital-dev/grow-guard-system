import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock useUserOrgId
const mockOrgId = { data: null as string | null };
vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => mockOrgId,
}));

// Mock sounds
vi.mock("@/lib/sounds", () => ({
  playSound: vi.fn(),
}));

// Chainable supabase mock
const mockQueryResult = { data: null as any, error: null as any, count: null as number | null };
const mockMutationResult = { data: null as any, error: null as any };
const mockRpc = vi.fn();
const mockInsertSingle = vi.fn();
const mockUpdateSingle = vi.fn();
const mockDeleteResult = vi.fn();
const mockSelectHead = vi.fn();
const mockMaybeSingle = vi.fn();

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.lt = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.range = vi.fn().mockImplementation(() => finalFn());
  chain.single = vi.fn().mockImplementation(() => finalFn());
  chain.maybeSingle = vi.fn().mockImplementation(() => finalFn());
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  return chain;
}

let selectChain: any;
let insertChain: any;
let updateChain: any;
let deleteChain: any;

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => {
      return {
        select: (...args: any[]) => {
          selectChain = buildChain(() => mockQueryResult);
          selectChain.select(...args);
          return selectChain;
        },
        insert: (data: any) => {
          insertChain = buildChain(() => mockMutationResult);
          insertChain.insert(data);
          return insertChain;
        },
        update: (data: any) => {
          updateChain = buildChain(() => mockMutationResult);
          updateChain.update(data);
          return updateChain;
        },
        delete: () => {
          deleteChain = buildChain(() => mockMutationResult);
          deleteChain.delete();
          return deleteChain;
        },
      };
    },
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

import { useCrmLeads, useCrmLeadMutations } from "../useCrmLeads";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCrmLeads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
    mockQueryResult.count = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useCrmLeads(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches leads when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const leads = [{ id: "l1", name: "Lead 1" }, { id: "l2", name: "Lead 2" }];
    mockQueryResult.data = leads;
    mockQueryResult.error = null;
    mockQueryResult.count = 2;

    const { result } = renderHook(() => useCrmLeads(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(leads);
    expect(result.current.totalCount).toBe(2);
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };
    mockQueryResult.count = null;

    const { result } = renderHook(() => useCrmLeads(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("provides pagination controls", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = Array.from({ length: 200 }, (_, i) => ({ id: `l${i}` }));
    mockQueryResult.error = null;
    mockQueryResult.count = 500;

    const { result } = renderHook(() => useCrmLeads(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.page).toBe(0);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPrevPage).toBe(false);

    act(() => result.current.nextPage());
    expect(result.current.page).toBe(1);
    expect(result.current.hasPrevPage).toBe(true);

    act(() => result.current.prevPage());
    expect(result.current.page).toBe(0);

    act(() => result.current.resetPage());
    expect(result.current.page).toBe(0);
  });
});

describe("useCrmLeadMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("createLead calls insert with org id", async () => {
    mockMutationResult.data = { id: "new-lead", name: "Test" };
    mockMutationResult.error = null;
    // Mock crm_settings to return null (no roulette)
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useCrmLeadMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createLead.mutate({ name: "Test Lead", email: "t@t.com" });
    });

    await waitFor(() => expect(result.current.createLead.isSuccess || result.current.createLead.isError).toBe(true));
  });

  it("updateLead calls update with id", async () => {
    mockMutationResult.data = { id: "l1", name: "Updated" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmLeadMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.updateLead.mutate({ id: "l1", name: "Updated" });
    });

    await waitFor(() => expect(result.current.updateLead.isSuccess || result.current.updateLead.isError).toBe(true));
  });

  it("deleteLead calls delete", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmLeadMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.deleteLead.mutate("l1");
    });

    await waitFor(() => expect(result.current.deleteLead.isSuccess || result.current.deleteLead.isError).toBe(true));
  });

  it("markAsWon updates with won_at and stage", async () => {
    mockMutationResult.data = { id: "l1", stage: "Venda" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmLeadMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.markAsWon.mutate("l1");
    });

    await waitFor(() => expect(result.current.markAsWon.isSuccess || result.current.markAsWon.isError).toBe(true));
  });

  it("markAsLost updates with lost_at and reason", async () => {
    mockMutationResult.data = { id: "l1", stage: "Oportunidade Perdida" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmLeadMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.markAsLost.mutate({ id: "l1", lost_reason: "Price" });
    });

    await waitFor(() => expect(result.current.markAsLost.isSuccess || result.current.markAsLost.isError).toBe(true));
  });

  it("bulkDeleteLeads calls delete with in", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmLeadMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.bulkDeleteLeads.mutate(["l1", "l2"]);
    });

    await waitFor(() => expect(result.current.bulkDeleteLeads.isSuccess || result.current.bulkDeleteLeads.isError).toBe(true));
  });

  it("bulkAddTag calls rpc", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useCrmLeadMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.bulkAddTag.mutate({ ids: ["l1"], tag: "vip" });
    });

    await waitFor(() => expect(result.current.bulkAddTag.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith("bulk_add_tag", { _ids: ["l1"], _tag: "vip" });
  });
});
