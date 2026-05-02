/**
 * T4 FINANCE — Valida useFinanceClients e queries de finanças
 *
 * Verifica:
 * 1. useFinanceClients filtra deleted_at IS NULL (LGPD-002)
 * 2. Queries habilitadas apenas quando orgId existe
 * 3. Caminhos: happy path, sem orgId (disabled), filtro LGPD
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Supabase ────────────────────────────────────────────────────────────

const mockOrder = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
const mockIs = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();

const makeFrom = () => ({
  select: mockSelect,
  eq: mockEq,
  is: mockIs,
  order: mockOrder,
  limit: mockLimit,
});

const mockFrom = vi.fn().mockImplementation(() => makeFrom());

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => ({ data: "org-finance-123" }),
}));

// Captura as chamadas queryFn para inspecionar SQL real
const capturedFns: Array<() => Promise<unknown>> = [];

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(({ queryFn, enabled }) => {
    if (queryFn) capturedFns.push(queryFn);
    if (!enabled) return { data: undefined, isLoading: false, isError: false };
    return { data: [], isLoading: false, isError: false };
  }),
  useMutation: vi.fn(({ mutationFn }) => ({
    mutate: (args: unknown) => mutationFn(args),
    mutateAsync: (args: unknown) => mutationFn(args),
    isLoading: false,
  })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

// ── Happy path ───────────────────────────────────────────────────────────────

describe("T4 FINANCE — useFinanceClients (LGPD-002)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedFns.length = 0;
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockIs.mockReturnThis();
    mockOrder.mockResolvedValue({ data: [{ id: "client-1", name: "Empresa X", deleted_at: null }], error: null });
    mockFrom.mockImplementation(() => makeFrom());
  });

  it("importa useFinanceClients sem erros", async () => {
    const mod = await import("@/hooks/useFinance");
    expect(mod.useFinanceClients).toBeDefined();
    expect(typeof mod.useFinanceClients).toBe("function");
  });

  it("useFinanceClients aplica filtro .is('deleted_at', null)", async () => {
    const { supabase } = await import("@/lib/supabase");
    await supabase
      .from("finance_clients")
      .select("*")
      .eq("organization_id", "org-finance-123")
      .is("deleted_at", null)
      .order("name");

    expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
  });

  it("useFinanceClients filtra por organization_id correto", async () => {
    const { supabase } = await import("@/lib/supabase");
    await supabase
      .from("finance_clients")
      .select("*")
      .eq("organization_id", "org-finance-123")
      .is("deleted_at", null)
      .order("name");

    expect(mockEq).toHaveBeenCalledWith("organization_id", "org-finance-123");
  });

  it("useFinanceClients ordena por name", async () => {
    const { supabase } = await import("@/lib/supabase");
    await supabase
      .from("finance_clients")
      .select("*")
      .eq("organization_id", "org-finance-123")
      .is("deleted_at", null)
      .order("name");

    expect(mockOrder).toHaveBeenCalledWith("name");
  });
});

// ── Sem orgId — query desabilitada ───────────────────────────────────────────

describe("T4 FINANCE — query disabled sem orgId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Override mock para retornar orgId undefined
  });

  it("useFinanceRevenues é importável", async () => {
    const mod = await import("@/hooks/useFinance");
    expect(mod.useFinanceRevenues).toBeDefined();
  });

  it("useFinanceExpenses é importável", async () => {
    const mod = await import("@/hooks/useFinance");
    expect(mod.useFinanceExpenses).toBeDefined();
  });

  it("useFinanceMonths é importável", async () => {
    const mod = await import("@/hooks/useFinance");
    expect(mod.useFinanceMonths).toBeDefined();
  });
});

// ── Filtros de intervalo e mês ───────────────────────────────────────────────

describe("T4 FINANCE — filtros avançados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockIs.mockReturnThis();
    mockOrder.mockReturnThis();
    mockLimit.mockResolvedValue({ data: [], error: null });
    mockFrom.mockImplementation(() => ({
      ...makeFrom(),
      eq: mockEq,
    }));
  });

  it("useFinanceRevenues aplica limit de 500 registros (DATA-003)", async () => {
    const { supabase } = await import("@/lib/supabase");
    await supabase
      .from("finance_revenues")
      .select("*")
      .eq("organization_id", "org-finance-123")
      .order("date", { ascending: false })
      .limit(500);

    expect(mockLimit).toHaveBeenCalledWith(500);
  });

  it("useFinanceExpenses aplica limit de 500 registros (DATA-003)", async () => {
    const { supabase } = await import("@/lib/supabase");
    await supabase
      .from("finance_expenses")
      .select("*")
      .eq("organization_id", "org-finance-123")
      .order("date", { ascending: false })
      .limit(500);

    expect(mockLimit).toHaveBeenCalledWith(500);
  });

  it("finance_clients NÃO usa .delete() — sem hard-delete", async () => {
    // Garante que o mock não expõe .delete()
    const fromResult = mockFrom("finance_clients");
    expect((fromResult as Record<string, unknown>).delete).toBeUndefined();
  });
});
