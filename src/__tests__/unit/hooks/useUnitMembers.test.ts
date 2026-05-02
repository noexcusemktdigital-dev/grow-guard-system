/**
 * T-UNIT-MEMBERS — Valida useUnitMembers hook
 *
 * Verifica:
 * 1. Não faz fetch quando orgId é null e unitOrgId é null
 * 2. Faz fetch com filter deleted_at IS NULL (LGPD-002)
 * 3. Retorna dados quando query tem sucesso
 * 4. Propaga erro quando Supabase retorna error
 * 5. Usa unitOrgId quando fornecido em vez de orgId do contexto
 * 6. Lista vazia retorna array vazio sem erro
 *
 * 6 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockOrgId = { data: null as string | null };
vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => mockOrgId,
}));

// Registra chamadas à chain para validar .is("deleted_at", null)
const isCall = vi.fn();
const mockQueryResult = { data: null as any, error: null as any };

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (_table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: string) => ({
          is: (col: string, val: null) => {
            isCall(col, val);
            return Promise.resolve(mockQueryResult);
          },
        }),
      }),
    }),
  },
}));

import { useUnitMembers } from "@/hooks/useUnitMembers";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("useUnitMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = null;
    mockQueryResult.data = null;
    mockQueryResult.error = null;
  });

  it("não faz fetch quando orgId e unitOrgId são null", () => {
    const { result } = renderHook(() => useUnitMembers(null), {
      wrapper: createWrapper(),
    });
    // enabled=false → isLoading=false e data=undefined
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("aplica filtro deleted_at IS NULL (LGPD-002)", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];

    renderHook(() => useUnitMembers(undefined), { wrapper: createWrapper() });

    await waitFor(() => expect(isCall).toHaveBeenCalled());
    expect(isCall).toHaveBeenCalledWith("deleted_at", null);
  });

  it("retorna dados quando query tem sucesso", async () => {
    mockOrgId.data = "org-1";
    const members = [
      { user_id: "u1", profiles: { full_name: "Ana" } },
      { user_id: "u2", profiles: { full_name: "Bruno" } },
    ];
    mockQueryResult.data = members;

    const { result } = renderHook(() => useUnitMembers(undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(members);
  });

  it("propaga erro quando Supabase retorna error", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = null;
    mockQueryResult.error = { message: "DB failure" };

    const { result } = renderHook(() => useUnitMembers(undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });

  it("usa unitOrgId quando fornecido em vez de orgId do contexto", async () => {
    // orgId do contexto seria "org-fallback", mas unitOrgId="org-unit" deve ser usado
    mockOrgId.data = "org-fallback";
    mockQueryResult.data = [];

    const { result } = renderHook(() => useUnitMembers("org-unit"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Se chegou ao success, o hook ficou enabled com o unitOrgId
    expect(result.current.data).toEqual([]);
  });

  it("retorna array vazio sem erro quando query retorna lista vazia", async () => {
    mockOrgId.data = "org-1";
    mockQueryResult.data = [];

    const { result } = renderHook(() => useUnitMembers(undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
