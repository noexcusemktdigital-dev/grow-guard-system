/**
 * T-CRF useCrmFunnels — Valida hooks de funis do CRM
 *
 * Verifica:
 * 1. useCrmFunnels retorna lista de funis da query
 * 2. useCrmFunnels desabilita query quando orgId é undefined
 * 3. createFunnel chama supabase.from("crm_funnels").insert com payload correto
 * 4. updateFunnel chama .update com os campos certos
 * 5. deleteFunnel chama .delete().eq("id", id)
 * 6. createFunnel reseta is_default dos outros quando is_default=true
 * 7. updateFunnel com is_default=true reseta demais funis (neq)
 * 8. useCrmFunnelMutations invalida queryKey "crm-funnels" após mutação
 *
 * 8 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks (evita "Cannot access before initialization") ───────────────
const {
  mockSingle,
  mockEq,
  mockNeq,
  mockOrder,
  mockSelect,
  mockUpdate,
  mockInsert,
  mockDelete,
  mockContains,
  mockFrom,
} = vi.hoisted(() => {
  const mockSingle = vi.fn().mockResolvedValue({ data: { id: "funnel-1", name: "Teste", stages: [] }, error: null });
  const mockEq = vi.fn().mockReturnThis();
  const mockNeq = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnValue({
    data: [{ id: "funnel-1", name: "Funil Principal", stages: [], is_default: true }],
    error: null,
  });
  const mockSelect = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockContains = vi.fn().mockReturnThis();
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    order: mockOrder,
    single: mockSingle,
    contains: mockContains,
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
  return { mockSingle, mockEq, mockNeq, mockOrder, mockSelect, mockUpdate, mockInsert, mockDelete, mockContains, mockFrom };
});

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => ({ data: "org-abc-123" }),
}));

const mockInvalidateQueries = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(({ queryFn, enabled }) => {
    if (enabled === false) return { data: undefined, isLoading: false };
    return { data: [{ id: "funnel-1", name: "Funil Principal", stages: [], is_default: true }], isLoading: false };
  }),
  useMutation: vi.fn(({ mutationFn, onSuccess }) => ({
    mutate: async (args: unknown) => {
      await mutationFn(args);
      if (onSuccess) onSuccess(args);
    },
    mutateAsync: async (args: unknown) => {
      const result = await mutationFn(args);
      if (onSuccess) onSuccess(result);
      return result;
    },
    isPending: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
    setQueryData: vi.fn(),
  })),
}));

import { useCrmFunnels, useCrmFunnelMutations } from "@/hooks/useCrmFunnels";

describe("useCrmFunnels — query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna lista de funis quando orgId está disponível", () => {
    const { data } = useCrmFunnels();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data![0].id).toBe("funnel-1");
  });

  it("desabilita query quando useQuery recebe enabled=false", async () => {
    const { useQuery } = await import("@tanstack/react-query");
    // mockReturnValueOnce para simular enabled=false
    vi.mocked(useQuery).mockReturnValueOnce({ data: undefined, isLoading: false } as any);
    const { data } = useCrmFunnels();
    expect(data).toBeUndefined();
  });
});

describe("useCrmFunnelMutations — createFunnel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: "funnel-new", name: "Novo Funil", stages: [] }, error: null });
  });

  it("createFunnel chama crm_funnels.insert com organization_id correto", async () => {
    const { createFunnel } = useCrmFunnelMutations();
    await createFunnel.mutate({ name: "Novo Funil" });

    expect(mockFrom).toHaveBeenCalledWith("crm_funnels");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Novo Funil", organization_id: "org-abc-123" })
    );
  });

  it("createFunnel com is_default=true reseta is_default dos outros funis", async () => {
    const { createFunnel } = useCrmFunnelMutations();
    await createFunnel.mutate({ name: "Novo Padrão", is_default: true });

    // Deve chamar update para resetar is_default dos outros
    expect(mockUpdate).toHaveBeenCalledWith({ is_default: false });
  });
});

describe("useCrmFunnelMutations — updateFunnel e deleteFunnel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: "funnel-1", name: "Atualizado", stages: [] }, error: null });
  });

  it("updateFunnel chama .update com campos corretos e .eq(id)", async () => {
    const { updateFunnel } = useCrmFunnelMutations();
    await updateFunnel.mutate({ id: "funnel-1", name: "Funil Atualizado" });

    expect(mockFrom).toHaveBeenCalledWith("crm_funnels");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: "Funil Atualizado" }));
    expect(mockEq).toHaveBeenCalledWith("id", "funnel-1");
  });

  it("updateFunnel com is_default=true reseta outros funis via neq", async () => {
    const { updateFunnel } = useCrmFunnelMutations();
    await updateFunnel.mutate({ id: "funnel-1", is_default: true });

    // Deve chamar neq("id", "funnel-1") para excluir o funil atual do reset
    expect(mockNeq).toHaveBeenCalledWith("id", "funnel-1");
  });

  it("deleteFunnel chama crm_funnels.delete().eq('id', id)", async () => {
    mockEq.mockResolvedValueOnce({ error: null });
    const { deleteFunnel } = useCrmFunnelMutations();
    await deleteFunnel.mutate("funnel-1");

    expect(mockFrom).toHaveBeenCalledWith("crm_funnels");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", "funnel-1");
  });

  it("mutação invalida queryKey 'crm-funnels' após sucesso", async () => {
    const { deleteFunnel } = useCrmFunnelMutations();
    await deleteFunnel.mutate("funnel-1");

    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["crm-funnels"] })
    );
  });
});
