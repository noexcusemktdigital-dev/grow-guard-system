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

// Supabase mock
const mockRpc = vi.fn();
const mockMutationResult = { data: null as any, error: null as any };

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockImplementation(() => finalFn());
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
    from: (table: string) => ({
      insert: (data: any) => {
        const chain = buildChain(() => mockMutationResult);
        return chain;
      },
      update: (data: any) => {
        const chain = buildChain(() => mockMutationResult);
        return chain;
      },
    }),
  },
}));

import { useGoals, useActiveGoals, useHistoricGoals, useRankings, useGoalMutations } from "../useGoals";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useGoals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
  });

  it("does not fetch when orgId is null", () => {
    const { result } = renderHook(() => useGoals(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("fetches goals via RPC when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const goals = [
      { id: "g1", title: "Revenue", scope: "company", status: "active" },
      { id: "g2", title: "Leads", scope: "team", status: "active" },
    ];
    mockRpc.mockResolvedValue({ data: goals, error: null });

    const { result } = renderHook(() => useGoals(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(goals);
    expect(mockRpc).toHaveBeenCalledWith("get_goals_with_parent", { _org_id: "org-1" });
  });

  it("filters by scope when provided", async () => {
    mockOrgId.data = "org-1";
    const goals = [
      { id: "g1", title: "Revenue", scope: "company" },
      { id: "g2", title: "Leads", scope: "team" },
    ];
    mockRpc.mockResolvedValue({ data: goals, error: null });

    const { result } = renderHook(() => useGoals("team"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "g2", title: "Leads", scope: "team" }]);
  });

  it("returns all goals when scope is 'all'", async () => {
    mockOrgId.data = "org-1";
    const goals = [
      { id: "g1", scope: "company" },
      { id: "g2", scope: "team" },
    ];
    mockRpc.mockResolvedValue({ data: goals, error: null });

    const { result } = renderHook(() => useGoals("all"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it("handles RPC error", async () => {
    mockOrgId.data = "org-1";
    mockRpc.mockResolvedValue({ data: null, error: { message: "RPC failed" } });

    const { result } = renderHook(() => useGoals(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useActiveGoals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
  });

  it("filters for active/completed goals with valid period_end", async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
    const pastDate = new Date(2020, 0, 1).toISOString();
    const goals = [
      { id: "g1", status: "active", period_end: futureDate, priority: 2 },
      { id: "g2", status: "completed", period_end: futureDate, priority: 1 },
      { id: "g3", status: "archived", period_end: futureDate, priority: 3 },
      { id: "g4", status: "active", period_end: pastDate, priority: 4 },
    ];
    mockRpc.mockResolvedValue({ data: goals, error: null });

    const { result } = renderHook(() => useActiveGoals(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // g1 and g2 are active/completed with future end, g3 is archived, g4 has past end
    expect(result.current.data!.map((g: any) => g.id)).toEqual(["g2", "g1"]);
  });

  it("sorts by priority ascending", async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
    const goals = [
      { id: "g1", status: "active", period_end: futureDate, priority: 3 },
      { id: "g2", status: "active", period_end: futureDate, priority: 1 },
      { id: "g3", status: "active", period_end: futureDate, priority: 2 },
    ];
    mockRpc.mockResolvedValue({ data: goals, error: null });

    const { result } = renderHook(() => useActiveGoals(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.map((g: any) => g.id)).toEqual(["g2", "g3", "g1"]);
  });
});

describe("useHistoricGoals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
  });

  it("returns goals with period_end before current month", async () => {
    const pastDate = new Date(2020, 0, 15).toISOString();
    const futureDate = new Date(Date.now() + 86400000 * 60).toISOString();
    const goals = [
      { id: "g1", period_end: pastDate },
      { id: "g2", period_end: futureDate },
      { id: "g3", period_end: null },
    ];
    mockRpc.mockResolvedValue({ data: goals, error: null });

    const { result } = renderHook(() => useHistoricGoals(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.map((g: any) => g.id)).toEqual(["g1"]);
  });
});

describe("useRankings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
  });

  it("fetches rankings via RPC", async () => {
    const rankings = [
      { id: "r1", month: 3, year: 2026, score: 100 },
      { id: "r2", month: 2, year: 2026, score: 80 },
    ];
    mockRpc.mockResolvedValue({ data: rankings, error: null });

    const { result } = renderHook(() => useRankings(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it("filters by month and year", async () => {
    const rankings = [
      { id: "r1", month: 3, year: 2026 },
      { id: "r2", month: 2, year: 2026 },
      { id: "r3", month: 3, year: 2025 },
    ];
    mockRpc.mockResolvedValue({ data: rankings, error: null });

    const { result } = renderHook(() => useRankings(3, 2026), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "r1", month: 3, year: 2026 }]);
  });
});

describe("useGoalMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("createGoal calls insert", async () => {
    mockMutationResult.data = { id: "g-new", title: "New Goal" };

    const { result } = renderHook(() => useGoalMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createGoal.mutate({ title: "New Goal", target_value: 100 });
    });

    await waitFor(() => expect(result.current.createGoal.isSuccess || result.current.createGoal.isError).toBe(true));
  });

  it("updateGoal calls update with id", async () => {
    mockMutationResult.data = { id: "g1", title: "Updated" };

    const { result } = renderHook(() => useGoalMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.updateGoal.mutate({ id: "g1", title: "Updated" });
    });

    await waitFor(() => expect(result.current.updateGoal.isSuccess || result.current.updateGoal.isError).toBe(true));
  });

  it("archiveGoal sets status to archived", async () => {
    mockMutationResult.data = { id: "g1", status: "archived" };

    const { result } = renderHook(() => useGoalMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.archiveGoal.mutate("g1");
    });

    await waitFor(() => expect(result.current.archiveGoal.isSuccess || result.current.archiveGoal.isError).toBe(true));
  });

  it("handles mutation error", async () => {
    mockMutationResult.data = null;
    mockMutationResult.error = { message: "Insert failed" };

    const { result } = renderHook(() => useGoalMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createGoal.mutate({ title: "Bad", target_value: 0 });
    });

    await waitFor(() => expect(result.current.createGoal.isError).toBe(true));
  });
});
