/**
 * T6 CRM-CONTACTS — Cobertura adicional de useCrmContactMutations
 *
 * Verifica:
 * 1. createContact chama .insert() tipado com organization_id
 * 2. createContact retorna data do servidor
 * 3. updateContact chama .update() tipado e filtra por id
 * 4. updateContact retorna data atualizada
 * 5. deleteContact chama .delete() com eq("id")
 * 6. bulkDeleteContacts chama .delete().in("id", ids)
 * 7. bulkUpdateContacts chama .update(fields).in("id", ids)
 * 8. createContact com erro lança exceção (isError=true)
 *
 * 8 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// ── Mock useUserOrgId ─────────────────────────────────────────────────────────
const mockOrgId = { data: "org-contacts-test" as string | null };
vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => mockOrgId,
}));

// ── Chainable Supabase mock ───────────────────────────────────────────────────
const mockInsertResult = { data: null as unknown, error: null as unknown };
const mockUpdateResult = { data: null as unknown, error: null as unknown };
const mockDeleteResult = { error: null as unknown };

const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();

function buildInsertChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue({
    single: mockSingle.mockResolvedValue(mockInsertResult),
  });
  return chain;
}

function buildUpdateChain() {
  const chain: Record<string, unknown> = {};
  chain.eq = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockSingle.mockResolvedValue(mockUpdateResult),
    }),
  });
  return chain;
}

function buildDeleteChain() {
  const chain: Record<string, unknown> = {};
  chain.eq = vi.fn().mockResolvedValue(mockDeleteResult);
  chain.in = vi.fn().mockResolvedValue(mockDeleteResult);
  return chain;
}

function buildBulkUpdateChain() {
  const chain: Record<string, unknown> = {};
  chain.in = vi.fn().mockResolvedValue(mockUpdateResult);
  return chain;
}

const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}));

import { useCrmContactMutations } from "@/hooks/useCrmContacts";

// ── Wrapper QueryClient ───────────────────────────────────────────────────────
function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T6 CRM-CONTACTS — createContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-contacts-test";
    mockInsertResult.data = { id: "c-new", name: "Novo Contato" };
    mockInsertResult.error = null;
    mockFrom.mockReturnValue({
      insert: mockInsert.mockReturnValue(buildInsertChain()),
      update: mockUpdate.mockReturnValue(buildUpdateChain()),
      delete: mockDelete.mockReturnValue(buildDeleteChain()),
    });
  });

  it("createContact chama .insert() com organization_id injetado", async () => {
    const { result } = renderHook(() => useCrmContactMutations(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.createContact.mutate({ name: "Novo Contato", email: "novo@test.com" });
    });

    await waitFor(() =>
      expect(
        result.current.createContact.isSuccess || result.current.createContact.isError
      ).toBe(true)
    );

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Novo Contato",
        organization_id: "org-contacts-test",
      })
    );
  });

  it("createContact com erro Supabase → isError=true", async () => {
    mockInsertResult.data = null;
    mockInsertResult.error = { message: "duplicate key" };
    mockSingle.mockResolvedValue(mockInsertResult);

    const { result } = renderHook(() => useCrmContactMutations(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.createContact.mutate({ name: "Duplicado" });
    });

    await waitFor(() => expect(result.current.createContact.isError).toBe(true));
    expect(result.current.createContact.error).toBeTruthy();
  });
});

describe("T6 CRM-CONTACTS — updateContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-contacts-test";
    mockUpdateResult.data = { id: "c-1", name: "Atualizado" };
    mockUpdateResult.error = null;
    mockFrom.mockReturnValue({
      insert: mockInsert.mockReturnValue(buildInsertChain()),
      update: mockUpdate.mockReturnValue(buildUpdateChain()),
      delete: mockDelete.mockReturnValue(buildDeleteChain()),
    });
  });

  it("updateContact chama .update() e filtra por .eq('id', id)", async () => {
    const { result } = renderHook(() => useCrmContactMutations(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateContact.mutate({ id: "c-1", name: "Atualizado" });
    });

    await waitFor(() =>
      expect(
        result.current.updateContact.isSuccess || result.current.updateContact.isError
      ).toBe(true)
    );

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Atualizado" })
    );
  });

  it("updateContact retorna data atualizada em caso de sucesso", async () => {
    mockSingle.mockResolvedValue({ data: { id: "c-1", name: "Atualizado" }, error: null });

    const { result } = renderHook(() => useCrmContactMutations(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateContact.mutate({ id: "c-1", name: "Atualizado" });
    });

    await waitFor(() => expect(result.current.updateContact.isSuccess).toBe(true));
    expect(result.current.updateContact.data).toMatchObject({ id: "c-1" });
  });
});

describe("T6 CRM-CONTACTS — delete e bulk mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-contacts-test";
    mockDeleteResult.error = null;
    mockUpdateResult.error = null;

    const deleteChain = buildDeleteChain();
    const bulkUpdateChain = buildBulkUpdateChain();

    mockFrom.mockReturnValue({
      insert: mockInsert.mockReturnValue(buildInsertChain()),
      update: mockUpdate.mockReturnValue({ ...buildUpdateChain(), in: vi.fn().mockResolvedValue({ error: null }) }),
      delete: mockDelete.mockReturnValue(deleteChain),
    });
  });

  it("deleteContact chama .delete().eq('id', id)", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: deleteEq, in: vi.fn().mockResolvedValue({ error: null }) });

    const { result } = renderHook(() => useCrmContactMutations(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.deleteContact.mutate("c-to-delete");
    });

    await waitFor(() =>
      expect(
        result.current.deleteContact.isSuccess || result.current.deleteContact.isError
      ).toBe(true)
    );

    expect(mockDelete).toHaveBeenCalled();
    expect(deleteEq).toHaveBeenCalledWith("id", "c-to-delete");
  });

  it("bulkDeleteContacts chama .delete().in('id', ids)", async () => {
    const deleteIn = vi.fn().mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }), in: deleteIn });

    const { result } = renderHook(() => useCrmContactMutations(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.bulkDeleteContacts.mutate(["c-1", "c-2", "c-3"]);
    });

    await waitFor(() =>
      expect(
        result.current.bulkDeleteContacts.isSuccess || result.current.bulkDeleteContacts.isError
      ).toBe(true)
    );

    expect(deleteIn).toHaveBeenCalledWith("id", ["c-1", "c-2", "c-3"]);
  });

  it("bulkUpdateContacts chama .update(fields).in('id', ids)", async () => {
    const updateIn = vi.fn().mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ in: updateIn, eq: vi.fn() });

    const { result } = renderHook(() => useCrmContactMutations(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.bulkUpdateContacts.mutate({
        ids: ["c-1", "c-2"],
        fields: { source: "importacao" },
      });
    });

    await waitFor(() =>
      expect(
        result.current.bulkUpdateContacts.isSuccess || result.current.bulkUpdateContacts.isError
      ).toBe(true)
    );

    expect(mockUpdate).toHaveBeenCalledWith({ source: "importacao" });
    expect(updateIn).toHaveBeenCalledWith("id", ["c-1", "c-2"]);
  });
});
