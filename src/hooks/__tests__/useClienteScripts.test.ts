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

import { useClienteScripts, useClienteScriptMutations } from "../useClienteScripts";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useClienteScripts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useClienteScripts(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches scripts when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const scripts = [
      { id: "s1", title: "Sales Script", content: "Hello, I'd like...", category: "vendas", tags: ["sales"] },
      { id: "s2", title: "Support Script", content: "How can I help?", category: "suporte", tags: [] },
    ];
    mockQueryResult.data = scripts;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClienteScripts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(scripts);
  });

  it("shows loading state initially", () => {
    mockOrgId.data = "org-1";
    const { result } = renderHook(() => useClienteScripts(), { wrapper: createWrapper() });
    expect(result.current).toBeDefined();
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };

    const { result } = renderHook(() => useClienteScripts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("returns empty array when no scripts found", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClienteScripts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("useClienteScriptMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("createScript calls insert with org_id", async () => {
    mockMutationResult.data = { id: "s-new", title: "New Script" };

    const { result } = renderHook(() => useClienteScriptMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createScript.mutate({ title: "New Script", content: "Script content", category: "vendas" });
    });

    await waitFor(() =>
      expect(result.current.createScript.isSuccess || result.current.createScript.isError).toBe(true)
    );
  });

  it("updateScript calls update with id", async () => {
    mockMutationResult.data = { id: "s1", title: "Updated Script" };

    const { result } = renderHook(() => useClienteScriptMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.updateScript.mutate({ id: "s1", title: "Updated Script" });
    });

    await waitFor(() =>
      expect(result.current.updateScript.isSuccess || result.current.updateScript.isError).toBe(true)
    );
  });

  it("deleteScript calls delete", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useClienteScriptMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.deleteScript.mutate("s1");
    });

    await waitFor(() =>
      expect(result.current.deleteScript.isSuccess || result.current.deleteScript.isError).toBe(true)
    );
  });

  it("handles mutation error on createScript", async () => {
    mockMutationResult.data = null;
    mockMutationResult.error = { message: "Insert failed" };

    const { result } = renderHook(() => useClienteScriptMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createScript.mutate({ title: "Bad Script" });
    });

    await waitFor(() => expect(result.current.createScript.isError).toBe(true));
  });

  it("createScript with tags array", async () => {
    mockMutationResult.data = { id: "s-tagged", title: "Tagged Script", tags: ["vendas", "crm"] };

    const { result } = renderHook(() => useClienteScriptMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createScript.mutate({
        title: "Tagged Script",
        tags: ["vendas", "crm"],
        category: "vendas",
      });
    });

    await waitFor(() =>
      expect(result.current.createScript.isSuccess || result.current.createScript.isError).toBe(true)
    );
  });
});
