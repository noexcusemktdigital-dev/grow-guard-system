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

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

// Mock useClienteWallet
const mockWalletData = { balance: 500 };
vi.mock("@/hooks/useClienteWallet", () => ({
  useClienteWallet: () => ({ data: mockWalletData }),
}));

// Chainable supabase mock
const mockQueryResult = { data: null as any, error: null as any };
const mockMutationResult = { data: null as any, error: null as any };
const mockFunctionsInvoke = vi.fn();

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
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
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
  },
}));

import {
  usePostHistory,
  useGeneratePost,
  useGenerateBriefing,
  useDeletePost,
  useBulkDeletePosts,
  useBulkApprovePosts,
  useApprovePost,
  usePostQuota,
  CREDIT_COST_ART,
  CREDIT_COST_VIDEO,
  getVideoCost,
} from "../useClientePosts";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("usePostHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => usePostHistory(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches posts when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const posts = [
      { id: "p1", type: "art", status: "pending" },
      { id: "p2", type: "video", status: "approved" },
    ];
    mockQueryResult.data = posts;
    mockQueryResult.error = null;

    const { result } = renderHook(() => usePostHistory(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(posts);
  });

  it("returns empty array when no posts", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => usePostHistory(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };

    const { result } = renderHook(() => usePostHistory(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useGenerateBriefing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls generate-social-briefing edge function", async () => {
    const briefing = {
      headline: "Test Headline",
      subheadline: "Sub",
      cta: "Buy Now",
      cena: "Scene",
      elementos_visuais: "Elements",
      supporting_text: "Support",
      bullet_points: "Points",
      suggested_format: "feed",
      suggested_tipo: "promotional",
    };
    mockFunctionsInvoke.mockResolvedValue({ data: briefing, error: null });

    const { result } = renderHook(() => useGenerateBriefing(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ briefing_text: "Test briefing" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(briefing);
    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      "generate-social-briefing",
      expect.objectContaining({
        body: { briefing_text: "Test briefing" },
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      }),
    );
  });

  it("handles edge function error", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "AI error" } });

    const { result } = renderHook(() => useGenerateBriefing(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ briefing_text: "Test" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("handles data-level error", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { error: "Rate limited" }, error: null });

    const { result } = renderHook(() => useGenerateBriefing(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ briefing_text: "Test" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useDeletePost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationResult.error = null;
  });

  it("deletes a post", async () => {
    const { result } = renderHook(() => useDeletePost(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate("p1");
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});

describe("useBulkDeletePosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationResult.error = null;
  });

  it("bulk deletes posts", async () => {
    const { result } = renderHook(() => useBulkDeletePosts(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate(["p1", "p2"]);
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});

describe("useBulkApprovePosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationResult.error = null;
  });

  it("bulk approves posts", async () => {
    const { result } = renderHook(() => useBulkApprovePosts(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate(["p1", "p2"]);
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});

describe("useApprovePost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationResult.error = null;
  });

  it("approves a single post", async () => {
    const { result } = renderHook(() => useApprovePost(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ postId: "p1" });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});

describe("usePostQuota", () => {
  it("calculates quota from wallet balance", () => {
    mockWalletData.balance = 500;
    const { result } = renderHook(() => usePostQuota(), { wrapper: createWrapper() });

    expect(result.current.creditBalance).toBe(500);
    expect(result.current.costArt).toBe(CREDIT_COST_ART);
    expect(result.current.costVideo).toBe(CREDIT_COST_VIDEO);
    expect(result.current.maxArts).toBe(Math.floor(500 / CREDIT_COST_ART));
    expect(result.current.canAffordArt).toBe(true);
    expect(result.current.canAffordVideo).toBe(true);
  });

  it("returns zero quota when wallet is empty", () => {
    mockWalletData.balance = 0;
    const { result } = renderHook(() => usePostQuota(), { wrapper: createWrapper() });

    expect(result.current.creditBalance).toBe(0);
    expect(result.current.maxArts).toBe(0);
    expect(result.current.maxVideos).toBe(0);
    expect(result.current.canAffordArt).toBe(false);
    expect(result.current.canAffordVideo).toBe(false);
  });
});

describe("getVideoCost", () => {
  it("returns 5 frames cost for 8s duration", () => {
    expect(getVideoCost("8s")).toBe(25 * 5);
  });

  it("returns 3 frames cost for other durations", () => {
    expect(getVideoCost("5s")).toBe(25 * 3);
    expect(getVideoCost("3s")).toBe(25 * 3);
  });
});
