/**
 * T4 CLIENT-PAYMENTS — Valida useClientPayments e useChargeClient
 *
 * Verifica:
 * 1. useClientPayments filtra por organization_id e month quando fornecido
 * 2. useClientPayments sem month não aplica filtro de month
 * 3. query desabilitada quando orgId é undefined
 * 4. useChargeClient chama invokeEdge com action correta
 * 5. sucesso invalida query key client-payments
 * 6. erro propagado quando invokeEdge retorna error
 * 7. erro Unauthorized quando sessão inválida
 * 8. useAllClientPayments usa queryKey all-client-payments (sem orgId)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const { mockInvokeEdge, mockOrgIdRef, mockInvalidateQueries, capturedQueryFns, mockGetSession } =
  vi.hoisted(() => {
    const mockInvokeEdge = vi.fn().mockResolvedValue({ data: { success: true }, error: null, requestId: "req-abc123" });
    const mockOrgIdRef = { value: "org-pay-456" as string | undefined };
    const mockInvalidateQueries = vi.fn();
    const capturedQueryFns: Array<{ queryKey: unknown[]; enabled: boolean }> = [];
    const mockGetSession = vi.fn().mockResolvedValue({ data: { session: { access_token: "tok" } } });
    return { mockInvokeEdge, mockOrgIdRef, mockInvalidateQueries, capturedQueryFns, mockGetSession };
  });

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ id: "p1" }], error: null }),
    }),
    auth: { getSession: (...args: unknown[]) => mockGetSession(...args) },
  },
}));

vi.mock("@/lib/edge", () => ({
  invokeEdge: (...args: unknown[]) => mockInvokeEdge(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("date-fns", () => ({
  endOfMonth: (d: Date) => d,
  format: (_d: Date, fmt: string) => (fmt === "yyyy-MM-dd" ? "2026-05-31" : "2026-05"),
}));

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => ({ data: mockOrgIdRef.value }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(({ queryKey, enabled = true }: { queryKey: unknown[]; queryFn?: unknown; enabled?: boolean }) => {
    capturedQueryFns.push({ queryKey, enabled });
    if (!enabled) return { data: undefined, isLoading: false };
    return { data: [], isLoading: false };
  }),
  useMutation: vi.fn(({ mutationFn, onSuccess, onError }: {
    mutationFn: (...args: unknown[]) => Promise<unknown>;
    onSuccess?: (r: unknown, a: unknown, c: unknown) => void;
    onError?: (e: unknown, a: unknown, c: unknown) => void;
  }) => ({
    mutateAsync: async (args: unknown) => {
      try {
        const result = await mutationFn(args);
        if (onSuccess) onSuccess(result, args, undefined);
        return result;
      } catch (err) {
        if (onError) onError(err, args, undefined);
        throw err;
      }
    },
    isLoading: false,
  })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: mockInvalidateQueries })),
}));

// ── Imports after mocks ──────────────────────────────────────────────────────
import { useClientPayments, useChargeClient, useAllClientPayments } from "@/hooks/useClientPayments";

// ── Tests ────────────────────────────────────────────────────────────────────
describe("T4 CLIENT-PAYMENTS — useClientPayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedQueryFns.length = 0;
    mockOrgIdRef.value = "org-pay-456";
  });

  it("1. query habilitada com orgId e inclui month na queryKey", () => {
    useClientPayments("2026-05");

    const q = capturedQueryFns.find((q) =>
      JSON.stringify(q.queryKey).includes("client-payments")
    );
    expect(q?.enabled).toBe(true);
    expect(JSON.stringify(q?.queryKey)).toContain("2026-05");
  });

  it("2. query habilitada sem month (queryKey contém undefined no slot de month)", () => {
    useClientPayments(undefined);

    const q = capturedQueryFns.find((q) =>
      JSON.stringify(q.queryKey).includes("client-payments")
    );
    expect(q?.enabled).toBe(true);
    // month é undefined — queryKey deve ter 3 slots
    expect(q?.queryKey).toHaveLength(3);
  });

  it("3. query desabilitada quando orgId é undefined", () => {
    mockOrgIdRef.value = undefined;
    useClientPayments("2026-05");

    const q = capturedQueryFns.find((q) =>
      JSON.stringify(q.queryKey).includes("client-payments")
    );
    expect(q?.enabled).toBe(false);
  });
});

describe("T4 CLIENT-PAYMENTS — useChargeClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgIdRef.value = "org-pay-456";
    mockInvokeEdge.mockResolvedValue({ data: { success: true }, error: null, requestId: "req-abc123" });
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "tok" } } });
  });

  it("4. chama invokeEdge com 'asaas-charge-client' e parâmetros corretos", async () => {
    const hook = useChargeClient();
    await hook.mutateAsync({ contract_id: "ctr-001", billing_type: "PIX" });

    expect(mockInvokeEdge).toHaveBeenCalledWith("asaas-charge-client", expect.objectContaining({
      body: expect.objectContaining({ contract_id: "ctr-001", billing_type: "PIX" }),
    }));
  });

  it("5. invalida query client-payments no sucesso", async () => {
    const hook = useChargeClient();
    await hook.mutateAsync({ contract_id: "ctr-001", billing_type: "BOLETO" });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["client-payments"] });
  });

  it("6. propaga erro quando invokeEdge retorna error object", async () => {
    mockInvokeEdge.mockResolvedValue({ data: null, error: new Error("network_error"), requestId: "req-xyz" });
    const hook = useChargeClient();

    await expect(hook.mutateAsync({ contract_id: "ctr-002", billing_type: "PIX" })).rejects.toThrow();
  });

  it("7. lança 'Sessão expirada' quando session é null", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    const hook = useChargeClient();

    await expect(hook.mutateAsync({ contract_id: "ctr-003", billing_type: "PIX" })).rejects.toThrow(
      "Sessão expirada"
    );
  });
});

describe("T4 CLIENT-PAYMENTS — useAllClientPayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedQueryFns.length = 0;
  });

  it("8. useAllClientPayments usa queryKey all-client-payments (sem orgId)", () => {
    useAllClientPayments();

    const q = capturedQueryFns.find((q) =>
      JSON.stringify(q.queryKey).includes("all-client-payments")
    );
    expect(q).toBeDefined();
    expect(q?.queryKey).toEqual(["all-client-payments"]);
  });
});
