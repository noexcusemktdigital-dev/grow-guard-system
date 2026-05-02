/**
 * T-CCE USECRMCONTACTS-EXTRA — Cobertura adicional: bulkUpdate, bulkDelete, search filter
 *
 * Verifica:
 * 1. bulkUpdateContacts chama .update(fields).in("id", ids)
 * 2. bulkUpdateContacts retorna sem erro em caso de sucesso
 * 3. bulkDeleteContacts chama .delete().in("id", ids)
 * 4. bulkDeleteContacts propaga erro quando Supabase retorna erro
 * 5. useCrmContacts com search aplica filtro .or() na query
 * 6. useCrmContacts sem search não aplica filtro .or()
 *
 * 6 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const {
  mockInResult,
  mockIn,
  mockUpdate,
  mockDelete,
  mockFrom,
  mockOrgId,
  mockSelect,
  mockOrder,
  mockRange,
  mockOr,
} = vi.hoisted(() => ({
  mockOrgId: { data: "org-extra-test" as string | null },
  mockInResult: { error: null as unknown },
  mockIn: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockOrder: vi.fn(),
  mockRange: vi.fn(),
  mockOr: vi.fn(),
}));

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => mockOrgId,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

// ── Testes de mutações bulk ───────────────────────────────────────────────────
describe("useCrmContactMutations — bulk operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInResult.error = null;

    // Chain: .from().update(fields).in(...)
    mockIn.mockResolvedValue(mockInResult);
    mockUpdate.mockReturnValue({ in: mockIn });
    // Chain: .from().delete().in(...)
    mockDelete.mockReturnValue({ in: mockIn });
    mockFrom.mockReturnValue({ update: mockUpdate, delete: mockDelete });
  });

  it("bulkUpdateContacts chama .update(fields).in('id', ids)", async () => {
    const { useCrmContactMutations } = await import("@/hooks/useCrmContacts");
    const { result } = renderHook(() => useCrmContactMutations(), {
      wrapper: makeWrapper(),
    });

    const ids = ["id-1", "id-2", "id-3"];
    const fields = { tags: ["vip"] };

    await act(async () => {
      await result.current.bulkUpdateContacts.mutateAsync({ ids, fields });
    });

    expect(mockUpdate).toHaveBeenCalledWith(fields);
    expect(mockIn).toHaveBeenCalledWith("id", ids);
  });

  it("bulkUpdateContacts resolve sem erro quando Supabase não retorna erro", async () => {
    const { useCrmContactMutations } = await import("@/hooks/useCrmContacts");
    const { result } = renderHook(() => useCrmContactMutations(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.bulkUpdateContacts.mutateAsync({ ids: ["x"], fields: { company: "Acme" } })
      ).resolves.toBeUndefined();
    });
  });

  it("bulkDeleteContacts chama .delete().in('id', ids)", async () => {
    const { useCrmContactMutations } = await import("@/hooks/useCrmContacts");
    const { result } = renderHook(() => useCrmContactMutations(), {
      wrapper: makeWrapper(),
    });

    const ids = ["del-1", "del-2"];

    await act(async () => {
      await result.current.bulkDeleteContacts.mutateAsync(ids);
    });

    expect(mockDelete).toHaveBeenCalled();
    expect(mockIn).toHaveBeenCalledWith("id", ids);
  });

  it("bulkDeleteContacts propaga erro quando Supabase retorna error", async () => {
    mockInResult.error = new Error("Falha ao deletar em lote");
    mockIn.mockResolvedValue(mockInResult);

    const { useCrmContactMutations } = await import("@/hooks/useCrmContacts");
    const { result } = renderHook(() => useCrmContactMutations(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.bulkDeleteContacts.mutateAsync(["id-err"])
      ).rejects.toThrow("Falha ao deletar em lote");
    });
  });
});

// ── Testes de search filter ───────────────────────────────────────────────────
describe("useCrmContacts — search filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const resolvedQuery = { data: [], error: null, count: 0 };
    mockOr.mockReturnValue(resolvedQuery);
    mockRange.mockReturnValue({ or: mockOr, ...resolvedQuery });
    mockOrder.mockReturnValue({ range: mockRange });
    mockSelect.mockReturnValue({ eq: vi.fn().mockReturnValue({ order: mockOrder }) });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it("aplica filtro .or() quando search é fornecido", async () => {
    const { useCrmContacts } = await import("@/hooks/useCrmContacts");
    const { result } = renderHook(() => useCrmContacts("joao"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));

    // Verifica que or foi chamado com ilike nos campos esperados
    expect(mockOr).toHaveBeenCalledWith(
      expect.stringMatching(/ilike.*joao/i)
    );
  });

  it("não chama .or() quando search não é fornecido", async () => {
    const { useCrmContacts } = await import("@/hooks/useCrmContacts");
    mockRange.mockReturnValue({ data: [], error: null, count: 0 });

    const { result } = renderHook(() => useCrmContacts(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));

    expect(mockOr).not.toHaveBeenCalled();
  });
});
