/**
 * T-CTM CrmTagsManager — Valida renderização e mutações de tags do CRM
 *
 * Verifica:
 * 1. Renderiza lista de tags com nome e contagem de leads
 * 2. Exibe estado vazio quando não há tags
 * 3. Botão "Nova Tag" abre formulário de criação
 * 4. Cria tag ao preencher nome e clicar em Criar
 * 5. Exibe estado de carregamento enquanto query está pendente
 * 6. Botão Excluir chama deleteTag.mutate com nome da tag
 * 7. Formulário de criação cancela corretamente com botão ✕
 * 8. Badge exibe plural correto (leads vs lead)
 *
 * 8 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// ── Hoisted mocks (evita "Cannot access before initialization") ───────────────
const { mockSelectCtm, mockEqCtm, mockUpdateCtm, mockContainsCtm, mockFromCtm } = vi.hoisted(() => {
  const mockSelectCtm = vi.fn().mockReturnThis();
  const mockEqCtm = vi.fn().mockReturnThis();
  const mockUpdateCtm = vi.fn().mockReturnThis();
  const mockContainsCtm = vi.fn().mockResolvedValue({ data: [], error: null });
  const mockFromCtm = vi.fn().mockReturnValue({
    select: mockSelectCtm,
    update: mockUpdateCtm,
    eq: mockEqCtm,
    contains: mockContainsCtm,
  });
  return { mockSelectCtm, mockEqCtm, mockUpdateCtm, mockContainsCtm, mockFromCtm };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFromCtm },
}));

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => ({ data: "org-test-123" }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// ── Tags de exemplo ───────────────────────────────────────────────────────────
const mockTags = [
  { name: "VIP", count: 3 },
  { name: "Urgente", count: 1 },
];

// ── Mock react-query ──────────────────────────────────────────────────────────
const mockMutate = vi.fn();
const mockDeleteMutate = vi.fn();

let mockTagsData: typeof mockTags | undefined = mockTags;
let mockIsLoading = false;

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: mockTagsData,
    isLoading: mockIsLoading,
  })),
  useMutation: vi.fn(({ onSuccess }) => ({
    mutate: (args: unknown) => {
      mockMutate(args);
      if (onSuccess) onSuccess(args);
    },
    mutateAsync: (args: unknown) => {
      mockMutate(args);
      return Promise.resolve(args);
    },
    isPending: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  })),
}));

import { CrmTagsManager } from "@/components/crm/CrmTagsManager";

describe("CrmTagsManager — renderização da lista", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTagsData = mockTags;
    mockIsLoading = false;
  });

  it("renderiza lista de tags com nomes corretos", () => {
    render(<CrmTagsManager />);
    expect(screen.getByText("VIP")).toBeInTheDocument();
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("exibe badge com contagem de leads (plural correto)", () => {
    render(<CrmTagsManager />);
    // 3 leads → "3 leads"; 1 lead → "1 lead"
    expect(screen.getByText("3 leads")).toBeInTheDocument();
    expect(screen.getByText("1 lead")).toBeInTheDocument();
  });

  it("exibe estado vazio quando não há tags", () => {
    mockTagsData = [];
    render(<CrmTagsManager />);
    expect(screen.getByText("Nenhuma tag criada ainda.")).toBeInTheDocument();
  });

  it("exibe loading enquanto isLoading=true", () => {
    mockIsLoading = true;
    mockTagsData = undefined;
    render(<CrmTagsManager />);
    expect(screen.getByText("Carregando tags...")).toBeInTheDocument();
  });
});

describe("CrmTagsManager — criação de tag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTagsData = mockTags;
    mockIsLoading = false;
  });

  it("botão 'Nova Tag' exibe formulário de criação", () => {
    render(<CrmTagsManager />);
    const btn = screen.getByRole("button", { name: /nova tag/i });
    fireEvent.click(btn);
    expect(screen.getByPlaceholderText("Nome da tag...")).toBeInTheDocument();
  });

  it("cria tag ao preencher nome e clicar em Criar", async () => {
    render(<CrmTagsManager />);
    fireEvent.click(screen.getByRole("button", { name: /nova tag/i }));

    const input = screen.getByPlaceholderText("Nome da tag...");
    fireEvent.change(input, { target: { value: "Nova Tag Teste" } });
    fireEvent.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith("Nova Tag Teste");
    });
  });

  it("botão ✕ cancela criação e oculta formulário", () => {
    render(<CrmTagsManager />);
    fireEvent.click(screen.getByRole("button", { name: /nova tag/i }));

    const cancelBtn = screen.getByRole("button", { name: "✕" });
    fireEvent.click(cancelBtn);

    expect(screen.queryByPlaceholderText("Nome da tag...")).not.toBeInTheDocument();
  });
});

describe("CrmTagsManager — exclusão de tag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTagsData = mockTags;
    mockIsLoading = false;
    // Mock window.confirm → true
    vi.stubGlobal("confirm", () => true);
  });

  it("clique em Excluir chama mutate com nome da tag", async () => {
    render(<CrmTagsManager />);

    // Botões de excluir ficam visíveis no hover (opacity-0/group-hover)
    // Usamos aria-label para localizar
    const deleteButtons = screen.getAllByRole("button", { name: /excluir tag/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith("VIP");
    });
  });
});
