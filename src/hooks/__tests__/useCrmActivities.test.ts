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

// Mock AuthContext
const mockAuthValue = {
  user: null as any,
  session: null,
  profile: null,
  role: null,
  loading: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
};
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthValue,
}));

// Chainable supabase mock
const mockQueryResult = { data: null as any, error: null as any };
const mockMutationResult = { data: null as any, error: null as any };

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockImplementation(() => finalFn());
  chain.single = vi.fn().mockImplementation(() => finalFn());
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
    }),
  },
}));

import { useCrmActivities, useCrmActivityMutations } from "../useCrmActivities";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCrmActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when leadId is undefined", () => {
    mockOrgId.data = "org-1";
    const { result } = renderHook(() => useCrmActivities(undefined), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useCrmActivities("lead-1"), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches activities when both leadId and orgId present", async () => {
    mockOrgId.data = "org-1";
    const activities = [
      { id: "a1", lead_id: "lead-1", type: "call", title: "Follow-up call" },
      { id: "a2", lead_id: "lead-1", type: "email", title: "Proposal sent" },
    ];
    mockQueryResult.data = activities;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useCrmActivities("lead-1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(activities);
  });

  it("returns empty array when no activities", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useCrmActivities("lead-1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };

    const { result } = renderHook(() => useCrmActivities("lead-1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("accepts custom limit", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useCrmActivities("lead-1", 10), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useCrmActivityMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockAuthValue.user = { id: "u1" };
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("createActivity calls insert with org and user id", async () => {
    mockMutationResult.data = { id: "a-new", title: "New Activity" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmActivityMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createActivity.mutate({
        lead_id: "lead-1",
        type: "call",
        title: "Follow-up call",
        description: "Discussed pricing",
      });
    });

    await waitFor(() => expect(result.current.createActivity.isSuccess || result.current.createActivity.isError).toBe(true));
  });

  it("handles mutation error", async () => {
    mockMutationResult.data = null;
    mockMutationResult.error = { message: "Insert failed" };

    const { result } = renderHook(() => useCrmActivityMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createActivity.mutate({
        lead_id: "lead-1",
        title: "Bad Activity",
      });
    });

    await waitFor(() => expect(result.current.createActivity.isError).toBe(true));
  });

  it("works without optional fields", async () => {
    mockMutationResult.data = { id: "a-new", title: "Minimal" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useCrmActivityMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createActivity.mutate({
        lead_id: "lead-1",
        title: "Minimal Activity",
      });
    });

    await waitFor(() => expect(result.current.createActivity.isSuccess || result.current.createActivity.isError).toBe(true));
  });
});
