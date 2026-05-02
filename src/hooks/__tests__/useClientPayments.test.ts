import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock useUserOrgId
const mockOrgId = { data: null as string | null };
vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => mockOrgId,
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock date-fns (used internally)
vi.mock("date-fns", () => ({
  startOfMonth: (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1),
  endOfMonth: (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0),
  format: (d: Date, fmt: string) => d.toISOString().split("T")[0],
}));

// Chainable supabase mock
const mockQueryResult = { data: null as any, error: null as any };
const mockMutationResult = { data: null as any, error: null as any };
const mockFunctionsInvoke = vi.fn();
const mockGetSession = vi.fn();

function buildChain(finalFn: () => any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockImplementation(() => finalFn());
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  // Make chain thenable so awaiting it resolves
  chain.then = (resolve: any) => resolve(finalFn());
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
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

import {
  useClientPayments,
  useAllClientPayments,
  useChargeClient,
  useAsaasNetworkPayments,
  useManagePayment,
} from "../useClientPayments";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useClientPayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("does not fetch when orgId is null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useClientPayments(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
  });

  it("fetches payments when orgId is present", async () => {
    mockOrgId.data = "org-1";
    const payments = [
      { id: "p1", amount: 100, status: "paid", month: "2026-03" },
      { id: "p2", amount: 200, status: "pending", month: "2026-03" },
    ];
    mockQueryResult.data = payments;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClientPayments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(payments);
  });

  it("filters by month when provided", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [{ id: "p1", month: "2026-03" }];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClientPayments("2026-03"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("returns empty array when no payments", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useClientPayments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("handles fetch error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "Query failed" };

    const { result } = renderHook(() => useClientPayments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useAllClientPayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("fetches all payments (no org filter)", async () => {
    const payments = [
      { id: "p1", amount: 100 },
      { id: "p2", amount: 200 },
    ];
    mockQueryResult.data = payments;
    mockQueryResult.error = null;

    const { result } = renderHook(() => useAllClientPayments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(payments);
  });

  it("returns empty array when no payments", async () => {
    mockQueryResult.data = [];
    mockQueryResult.error = null;

    const { result } = renderHook(() => useAllClientPayments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("useChargeClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-1";
  });

  it("calls asaas-charge-client edge function", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token-123" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useChargeClient(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ contract_id: "ct-1", billing_type: "PIX" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      "asaas-charge-client",
      expect.objectContaining({
        body: { organization_id: "org-1", contract_id: "ct-1", billing_type: "PIX" },
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      }),
    );
  });

  it("throws when session is null", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useChargeClient(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ contract_id: "ct-1", billing_type: "PIX" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("handles edge function error", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "Charge failed" } });

    const { result } = renderHook(() => useChargeClient(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ contract_id: "ct-1", billing_type: "PIX" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("handles data-level error", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: { error: "already_paid" }, error: null });

    const { result } = renderHook(() => useChargeClient(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ contract_id: "ct-1", billing_type: "PIX" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("uses custom organization_id when provided", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useChargeClient(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ contract_id: "ct-1", billing_type: "PIX", organization_id: "custom-org" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      "asaas-charge-client",
      expect.objectContaining({
        body: { organization_id: "custom-org", contract_id: "ct-1", billing_type: "PIX" },
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      }),
    );
  });
});

describe("useAsaasNetworkPayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches network payments via edge function", async () => {
    const payments = [
      { id: "ap1", value: 100, status: "RECEIVED" },
      { id: "ap2", value: 200, status: "PENDING" },
    ];
    mockFunctionsInvoke.mockResolvedValue({ data: { payments }, error: null });

    const { result } = renderHook(() => useAsaasNetworkPayments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(payments);
  });

  it("handles edge function error", async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "Network error" } });

    const { result } = renderHook(() => useAsaasNetworkPayments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useManagePayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels a payment", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useManagePayment(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ action: "cancel", payment_id: "pay-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      "asaas-manage-payment",
      expect.objectContaining({
        body: { action: "cancel", payment_id: "pay-1" },
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      }),
    );
  });

  it("updates a payment", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useManagePayment(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ action: "update", payment_id: "pay-1", value: 150 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("throws when session is null", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useManagePayment(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ action: "cancel", payment_id: "pay-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("handles edge function error", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "Failed" } });

    const { result } = renderHook(() => useManagePayment(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ action: "cancel", payment_id: "pay-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
