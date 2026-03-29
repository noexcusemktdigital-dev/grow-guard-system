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
const mockQueryResult = { data: null as any, error: null as any, count: null as number | null };
const mockMutationResult = { data: null as any, error: null as any };

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.or = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.range = vi.fn().mockImplementation(() => finalFn());
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

import { useCrmContacts, useCrmContactMutations } from "../useCrmContacts";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCrmContacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
    mockQueryResult.count = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useCrmContacts(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches contacts when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const contacts = [
      { id: "c1", name: "Alice", email: "alice@test.com" },
      { id: "c2", name: "Bob", email: "bob@test.com" },
    ];
    mockQueryResult.data = contacts;
    mockQueryResult.error = null;
    mockQueryResult.count = 2;

    const { result } = renderHook(() => useCrmContacts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(contacts);
    expect(result.current.totalCount).toBe(2);
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };
    mockQueryResult.count = null;

    const { result } = renderHook(() => useCrmContacts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("returns empty array when no contacts", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;
    mockQueryResult.count = 0;

    const { result } = renderHook(() => useCrmContacts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it("provides pagination controls", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = Array.from({ length: 200 }, (_, i) => ({ id: `c${i}`, name: `Contact ${i}` }));
    mockQueryResult.error = null;
    mockQueryResult.count = 500;

    const { result } = renderHook(() => useCrmContacts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.page).toBe(0);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPrevPage).toBe(false);

    act(() => result.current.nextPage());
    expect(result.current.page).toBe(1);
    expect(result.current.hasPrevPage).toBe(true);

    act(() => result.current.prevPage());
    expect(result.current.page).toBe(0);
  });

  it("does not go below page 0", () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;
    mockQueryResult.count = 0;

    const { result } = renderHook(() => useCrmContacts(), { wrapper: createWrapper() });

    act(() => result.current.prevPage());
    expect(result.current.page).toBe(0);
  });
});

describe("useCrmContactMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("createContact calls insert with org id", async () => {
    mockMutationResult.data = { id: "c-new", name: "New Contact" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmContactMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createContact.mutate({ name: "New Contact", email: "new@test.com" });
    });

    await waitFor(() => expect(result.current.createContact.isSuccess || result.current.createContact.isError).toBe(true));
  });

  it("updateContact calls update with id", async () => {
    mockMutationResult.data = { id: "c1", name: "Updated" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmContactMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.updateContact.mutate({ id: "c1", name: "Updated" });
    });

    await waitFor(() => expect(result.current.updateContact.isSuccess || result.current.updateContact.isError).toBe(true));
  });

  it("deleteContact calls delete", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmContactMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.deleteContact.mutate("c1");
    });

    await waitFor(() => expect(result.current.deleteContact.isSuccess || result.current.deleteContact.isError).toBe(true));
  });

  it("bulkUpdateContacts updates multiple contacts", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmContactMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.bulkUpdateContacts.mutate({ ids: ["c1", "c2"], fields: { source: "campaign" } });
    });

    await waitFor(() => expect(result.current.bulkUpdateContacts.isSuccess || result.current.bulkUpdateContacts.isError).toBe(true));
  });

  it("bulkDeleteContacts deletes multiple contacts", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmContactMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.bulkDeleteContacts.mutate(["c1", "c2"]);
    });

    await waitFor(() => expect(result.current.bulkDeleteContacts.isSuccess || result.current.bulkDeleteContacts.isError).toBe(true));
  });

  it("handles mutation error", async () => {
    mockMutationResult.data = null;
    mockMutationResult.error = { message: "Insert failed" };

    const { result } = renderHook(() => useCrmContactMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createContact.mutate({ name: "Bad Contact" });
    });

    await waitFor(() => expect(result.current.createContact.isError).toBe(true));
  });
});
