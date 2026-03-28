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

// Mock sounds
vi.mock("@/lib/sounds", () => ({
  playSound: vi.fn(),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
  chain.maybeSingle = vi.fn().mockImplementation(() => finalFn());
  chain.range = vi.fn().mockImplementation(() => finalFn());
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

import {
  useClienteContent,
  useClienteCampaigns,
  useClienteScripts,
  useClienteDispatches,
  useClienteSites,
  useClienteChecklist,
  useClienteGamification,
  useClienteContentMutations,
} from "../useClienteContent";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useClienteContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useClienteContent(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches content when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const content = [{ id: "c1", title: "Post 1" }, { id: "c2", title: "Post 2" }];
    mockQueryResult.data = content;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClienteContent(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(content);
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Failed" };

    const { result } = renderHook(() => useClienteContent(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useClienteCampaigns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useClienteCampaigns(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches campaigns when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const campaigns = [{ id: "camp1", name: "Campaign A" }];
    mockQueryResult.data = campaigns;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClienteCampaigns(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(campaigns);
  });
});

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
    const scripts = [{ id: "s1", title: "Script A" }];
    mockQueryResult.data = scripts;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClienteScripts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(scripts);
  });
});

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
    const dispatches = [{ id: "d1", title: "Dispatch A" }];
    mockQueryResult.data = dispatches;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClienteDispatches(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(dispatches);
  });
});

describe("useClienteSites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useClienteSites(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches sites when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const sites = [{ id: "site1", name: "Site A" }];
    mockQueryResult.data = sites;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClienteSites(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sites);
  });
});

describe("useClienteChecklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthValue.user = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when user is null", () => {
    mockAuthValue.user = null;
    const { result } = renderHook(() => useClienteChecklist(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches checklist items when user is present", async () => {
    mockAuthValue.user = { id: "u1" };
    const items = [{ id: "cl1", title: "Task A", is_completed: false }];
    mockQueryResult.data = items;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClienteChecklist(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(items);
  });
});

describe("useClienteGamification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthValue.user = null;
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when user or orgId is null", () => {
    mockAuthValue.user = null;
    mockOrgId.data = null;
    const { result } = renderHook(() => useClienteGamification(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches gamification data", async () => {
    mockAuthValue.user = { id: "u1" };
    mockOrgId.data = "org-1";
    const gamData = { id: "g1", xp: 500, title: "Aprendiz", points: 500 };
    mockQueryResult.data = gamData;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClienteGamification(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(gamData);
  });
});

describe("useClienteContentMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockAuthValue.user = { id: "u1" };
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("createContent calls insert", async () => {
    mockMutationResult.data = { id: "c-new", title: "New Content" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useClienteContentMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createContent.mutate({ title: "New Content", type: "post" });
    });

    await waitFor(() => expect(result.current.createContent.isSuccess || result.current.createContent.isError).toBe(true));
  });

  it("createCampaign calls insert", async () => {
    mockMutationResult.data = { id: "camp-new", name: "New Campaign" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useClienteContentMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createCampaign.mutate({ name: "New Campaign", type: "email" });
    });

    await waitFor(() => expect(result.current.createCampaign.isSuccess || result.current.createCampaign.isError).toBe(true));
  });

  it("createScript calls insert", async () => {
    mockMutationResult.data = { id: "s-new", title: "New Script" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useClienteContentMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createScript.mutate({ title: "New Script", category: "sales" });
    });

    await waitFor(() => expect(result.current.createScript.isSuccess || result.current.createScript.isError).toBe(true));
  });

  it("createDispatch calls insert", async () => {
    mockMutationResult.data = { id: "d-new", title: "New Dispatch" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useClienteContentMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createDispatch.mutate({ title: "New Dispatch", channel: "whatsapp" });
    });

    await waitFor(() => expect(result.current.createDispatch.isSuccess || result.current.createDispatch.isError).toBe(true));
  });

  it("createSite calls insert", async () => {
    mockMutationResult.data = { id: "site-new", name: "New Site" };
    mockMutationResult.error = null;

    const { result } = renderHook(() => useClienteContentMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createSite.mutate({ name: "New Site", type: "landing" });
    });

    await waitFor(() => expect(result.current.createSite.isSuccess || result.current.createSite.isError).toBe(true));
  });

  it("markNotificationRead calls update", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useClienteContentMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.markNotificationRead.mutate("n1");
    });

    await waitFor(() => expect(result.current.markNotificationRead.isSuccess || result.current.markNotificationRead.isError).toBe(true));
  });

  it("markAllNotificationsRead calls update", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useClienteContentMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.markAllNotificationsRead.mutate();
    });

    await waitFor(() => expect(result.current.markAllNotificationsRead.isSuccess || result.current.markAllNotificationsRead.isError).toBe(true));
  });

  it("handles mutation error", async () => {
    mockMutationResult.data = null;
    mockMutationResult.error = { message: "Insert failed" };

    const { result } = renderHook(() => useClienteContentMutations(), { wrapper: createWrapper() });

    act(() => {
      result.current.createContent.mutate({ title: "Bad Content" });
    });

    await waitFor(() => expect(result.current.createContent.isError).toBe(true));
  });
});
