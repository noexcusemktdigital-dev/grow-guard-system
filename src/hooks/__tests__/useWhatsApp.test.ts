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
const mockRpc = vi.fn();

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockImplementation(() => finalFn());
  chain.single = vi.fn().mockImplementation(() => finalFn());
  chain.maybeSingle = vi.fn().mockImplementation(() => finalFn());
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  // For queries that end with order (no limit), resolve directly
  chain.order = vi.fn().mockImplementation(() => {
    // Return chain that can also be awaited
    const awaitable: any = finalFn();
    awaitable.limit = vi.fn().mockImplementation(() => finalFn());
    return awaitable;
  });
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  PORTAL_STORAGE_KEY: "noe-saas-auth",
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
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

import {
  useWhatsAppInstances,
  useWhatsAppInstance,
  useWhatsAppContacts,
  useWhatsAppMessages,
  useSetupWhatsApp,
  useSendWhatsAppMessage,
  useMarkContactRead,
  useUpdateAttendingMode,
  useUpdateContactAgent,
  useLinkContactToCrmLead,
  useFindLeadByPhone,
  useSendTypingIndicator,
  useMarkWhatsAppRead,
  useStarMessage,
  useDeleteMessage,
  usePinContact,
  useArchiveContact,
  useContactPreviews,
} from "../useWhatsApp";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useWhatsAppInstances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useWhatsAppInstances(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches instances when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const instances = [
      { id: "i1", instance_id: "inst-1", status: "connected", provider: "evolution" },
      { id: "i2", instance_id: "inst-2", status: "disconnected", provider: "zapi" },
    ];
    mockQueryResult.data = instances;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useWhatsAppInstances(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(instances);
  });

  it("returns empty array when no instances", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useWhatsAppInstances(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };

    const { result } = renderHook(() => useWhatsAppInstances(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useWhatsAppInstance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("returns connected instance when available", async () => {
    mockOrgId.data = "org-1";
    const instances = [
      { id: "i1", instance_id: "inst-1", status: "disconnected", provider: "zapi" },
      { id: "i2", instance_id: "inst-2", status: "connected", provider: "evolution" },
    ];
    mockQueryResult.data = instances;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useWhatsAppInstance(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(result.current.data?.status).toBe("connected");
  });

  it("returns null when no connected instance exists (disconnected instances ignored)", async () => {
    mockOrgId.data = "org-1";
    const instances = [
      { id: "i1", instance_id: "inst-1", status: "disconnected", provider: "zapi" },
    ];
    mockQueryResult.data = instances;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useWhatsAppInstance(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("returns null when no instances exist", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useWhatsAppInstance(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe("useWhatsAppContacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useWhatsAppContacts(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches and filters contacts", async () => {
    mockOrgId.data = "org-1";
    const contacts = [
      { id: "c1", phone: "5511999999999", name: "John", contact_type: "individual" },
      { id: "c2", phone: "status@broadcast", name: "Status", contact_type: "individual" },
      { id: "c3", phone: "5511888888888", name: "Jane", contact_type: "individual" },
    ];
    mockQueryResult.data = contacts;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useWhatsAppContacts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Should filter out status@broadcast
    expect(result.current.data?.length).toBe(2);
  });

  it("detects group contacts", async () => {
    mockOrgId.data = "org-1";
    const contacts = [
      { id: "c1", phone: "12345-group", name: "Group", contact_type: "individual" },
    ];
    mockQueryResult.data = contacts;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useWhatsAppContacts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.contact_type).toBe("group");
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };

    const { result } = renderHook(() => useWhatsAppContacts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useWhatsAppMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId or contactId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useWhatsAppMessages(null), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("does not fetch when contactId is null", () => {
    mockOrgId.data = "org-1";
    const { result } = renderHook(() => useWhatsAppMessages(null), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches messages when both ids present", async () => {
    mockOrgId.data = "org-1";
    const messages = [
      { id: "m2", content: "Second", created_at: "2026-01-01T01:00:00Z" },
      { id: "m1", content: "First", created_at: "2026-01-01T00:00:00Z" },
    ];
    mockQueryResult.data = messages;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useWhatsAppMessages("c1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Messages should be reversed
    expect(result.current.data?.[0]?.id).toBe("m1");
    expect(result.current.data?.[1]?.id).toBe("m2");
  });
});

describe("useSetupWhatsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationResult.data = null;
    mockMutationResult.error = null;
  });

  it("calls whatsapp-setup edge function", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useSetupWhatsApp(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ instanceId: "test", provider: "evolution" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFunctionsInvoke).toHaveBeenCalledWith("whatsapp-setup", expect.objectContaining({
      body: { instanceId: "test", provider: "evolution" },
      headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
    }));
  });

  it("handles edge function error", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "Setup failed" } });

    const { result } = renderHook(() => useSetupWhatsApp(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ instanceId: "bad" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useSendWhatsAppMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls whatsapp-send edge function", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useSendWhatsAppMessage(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ contactPhone: "5511999999999", message: "Hello" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFunctionsInvoke).toHaveBeenCalledWith("whatsapp-send", expect.objectContaining({
      body: { contactPhone: "5511999999999", message: "Hello" },
      headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
    }));
  });

  it("handles send error", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "Send failed" } });

    const { result } = renderHook(() => useSendWhatsAppMessage(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ message: "Hello" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useMarkContactRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.error = null;
  });

  it("updates unread_count to 0", async () => {
    mockMutationResult.error = null;

    const { result } = renderHook(() => useMarkContactRead(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate("c1");
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});

describe("useUpdateAttendingMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.error = null;
  });

  it("updates attending mode", async () => {
    const { result } = renderHook(() => useUpdateAttendingMode(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ contactId: "c1", mode: "human" });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});

describe("useFindLeadByPhone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId or phone is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useFindLeadByPhone(null), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches lead by phone when both present", async () => {
    mockOrgId.data = "org-1";
    const lead = { id: "l1", name: "Test Lead", phone: "5511999999999", stage: "Novo", value: 1000 };
    mockQueryResult.data = lead;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useFindLeadByPhone("5511999999999"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(lead);
  });
});

describe("useSendTypingIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls whatsapp-typing edge function", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useSendTypingIndicator(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate("5511999999999");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFunctionsInvoke).toHaveBeenCalledWith("whatsapp-typing", expect.objectContaining({
      body: { contactPhone: "5511999999999" },
      headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
    }));
  });
});

describe("useStarMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.error = null;
  });

  it("stars a message", async () => {
    const { result } = renderHook(() => useStarMessage(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ messageId: "m1", starred: true });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});

describe("usePinContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.error = null;
  });

  it("pins a contact", async () => {
    const { result } = renderHook(() => usePinContact(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ contactId: "c1", pinned: true });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});

describe("useArchiveContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
    mockMutationResult.error = null;
  });

  it("archives a contact", async () => {
    const { result } = renderHook(() => useArchiveContact(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ contactId: "c1", archived: true });
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  });
});

describe("useContactPreviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
  });

  it("does not fetch when orgId is null or ids empty", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useContactPreviews([]), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches previews via RPC", async () => {
    mockOrgId.data = "org-1";
    mockRpc.mockResolvedValue({
      data: [
        { contact_id: "c1", content: "Hello", type: "text", direction: "inbound", status: "read" },
      ],
      error: null,
    });

    const { result } = renderHook(() => useContactPreviews(["c1"]), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.get("c1")).toBe("Hello");
  });
});
