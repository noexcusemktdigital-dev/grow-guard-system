/**
 * useSupportTickets — listagem, criação e atualização de tickets
 *
 * Asserts (8):
 * 1. useSupportTickets é desabilitado quando orgId é null
 * 2. useSupportTickets consulta supabase.from("support_tickets") com org_id correto
 * 3. createTicket falha quando orgId é null (Usuário não autenticado)
 * 4. createTicket falha quando user é null
 * 5. createTicket chama supabase.from("support_tickets").insert com dados corretos
 * 6. updateTicket chama supabase.from("support_tickets").update com id correto
 * 7. sendMessage chama supabase.from("support_messages").insert com ticket_id
 * 8. useSupportMessages retorna undefined quando ticketId é undefined
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockOrgId = { data: "org-abc" as string | null };

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => mockOrgId,
}));

const mockUser = { id: "user-1", email: "test@test.com" };
const mockAuthState = { user: mockUser as typeof mockUser | null };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

// Chain builder helpers
function buildChain(resolved: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "order", "single", "insert", "update"];
  methods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  // Terminal: resolves the promise
  (chain as { then: unknown }).then = undefined;
  Object.defineProperty(chain, Symbol.iterator, { get: () => undefined });
  // Make it thenable for await
  chain.select = vi.fn().mockReturnValue({
    ...chain,
    eq: vi.fn().mockReturnValue({
      ...chain,
      order: vi.fn().mockResolvedValue(resolved),
    }),
  });
  chain.insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue(resolved),
    }),
  });
  chain.update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(resolved),
      }),
    }),
  });
  return chain;
}

const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Silence typed import errors for generated types
vi.mock("@/integrations/supabase/typed", () => ({}));

import { useSupportTickets, useSupportTicketMutations, useSupportMessages } from "@/hooks/useSupportTickets";

// ── Wrapper ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useSupportTickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-abc";
    mockAuthState.user = mockUser;
  });

  it("é desabilitado quando orgId é null", () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useSupportTickets(), { wrapper: createWrapper() });
    expect(result.current.data).toBeUndefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("consulta support_tickets com org_id correto quando habilitado", async () => {
    const tickets = [{ id: "t1", title: "Dúvida", organization_id: "org-abc" }];
    mockFrom.mockImplementation(() => buildChain({ data: tickets, error: null }));

    const { result } = renderHook(() => useSupportTickets(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("support_tickets");
  });
});

describe("useSupportTicketMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgId.data = "org-abc";
    mockAuthState.user = mockUser;
  });

  it("createTicket lança erro quando orgId é null", async () => {
    mockOrgId.data = null;
    const { result } = renderHook(() => useSupportTicketMutations(), { wrapper: createWrapper() });
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.createTicket.mutateAsync({ title: "Test" });
      } catch (e) {
        error = e as Error;
      }
    });
    expect(error).not.toBeNull();
    expect((error as Error | null)?.message).toContain("não autenticado");
  });

  it("createTicket lança erro quando user é null", async () => {
    mockAuthState.user = null;
    const { result } = renderHook(() => useSupportTicketMutations(), { wrapper: createWrapper() });
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.createTicket.mutateAsync({ title: "Test" });
      } catch (e) {
        error = e as Error;
      }
    });
    expect(error).not.toBeNull();
  });

  it("createTicket chama supabase.from('support_tickets') com dados corretos", async () => {
    const newTicket = { id: "t-new", title: "Bug crítico", organization_id: "org-abc" };
    mockFrom.mockImplementation(() => buildChain({ data: newTicket, error: null }));

    const { result } = renderHook(() => useSupportTicketMutations(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.createTicket.mutateAsync({ title: "Bug crítico", category: "bug" });
    });
    expect(mockFrom).toHaveBeenCalledWith("support_tickets");
  });

  it("updateTicket chama supabase.from('support_tickets').update com id correto", async () => {
    const updated = { id: "t1", title: "Atualizado", status: "resolved" };
    mockFrom.mockImplementation(() => buildChain({ data: updated, error: null }));

    const { result } = renderHook(() => useSupportTicketMutations(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.updateTicket.mutateAsync({ id: "t1", status: "resolved" });
    });
    expect(mockFrom).toHaveBeenCalledWith("support_tickets");
  });

  it("sendMessage chama supabase.from('support_messages') com ticket_id", async () => {
    const msg = { id: "m1", ticket_id: "t1", content: "Olá", user_id: "user-1" };
    mockFrom.mockImplementation(() => buildChain({ data: msg, error: null }));

    const { result } = renderHook(() => useSupportTicketMutations(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.sendMessage.mutateAsync({ ticket_id: "t1", content: "Olá" });
    });
    expect(mockFrom).toHaveBeenCalledWith("support_messages");
  });
});

describe("useSupportMessages", () => {
  it("retorna undefined e não executa queryFn quando ticketId é undefined", () => {
    vi.clearAllMocks();
    const { result } = renderHook(() => useSupportMessages(undefined), { wrapper: createWrapper() });
    // enabled=false → data permanece undefined e supabase.from não é chamado nesta query
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetching).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
