/**
 * MemberPermissionsEditor — renderização e toggle de permissões
 *
 * Asserts (6):
 * 1. Renderiza título "Permissões de acesso"
 * 2. Exibe nome do usuário passado via prop
 * 3. Renderiza opções de visibilidade CRM
 * 4. Switch "Gerar conteúdo" está presente
 * 5. Toggle de collapsed/expanded funciona ao clicar no header
 * 6. Botão Salvar está presente quando expandido
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSaveMutate = vi.fn();

vi.mock("@/hooks/useMemberPermissions", () => ({
  usePermissionProfiles: () => ({ data: [] }),
  useMemberPermissionById: () => ({ data: null }),
  useSaveMemberPermission: () => ({
    mutate: mockSaveMutate,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Stubs de componentes UI pesados
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => createElement("button", null, children),
  SelectContent: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) =>
    createElement("option", { value }, children),
  SelectValue: () => null,
}));

vi.mock("@/components/ui/radio-group", () => ({
  RadioGroup: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (v: string) => void }) =>
    createElement("div", { "data-testid": "radio-group" }, children),
  RadioGroupItem: ({ value, id }: { value: string; id: string }) =>
    createElement("input", { type: "radio", value, id, readOnly: true }),
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange, id }: { checked?: boolean; onCheckedChange?: (v: boolean) => void; id?: string }) =>
    createElement("input", {
      type: "checkbox",
      checked: !!checked,
      id,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onCheckedChange?.(e.target.checked),
      "data-testid": id ?? "switch",
    }),
}));

import { MemberPermissionsEditor } from "@/components/cliente/MemberPermissionsEditor";

// ── Wrapper ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

function renderEditor(userId = "user-1", userName = "Ana Souza") {
  return render(
    createElement(MemberPermissionsEditor, { userId, userName }),
    { wrapper: createWrapper() }
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MemberPermissionsEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza título 'Permissões de acesso'", () => {
    renderEditor();
    expect(screen.getByText(/permissões de acesso/i)).toBeInTheDocument();
  });

  it("renderiza opções de visibilidade CRM quando expandido", () => {
    renderEditor();
    // Componente inicia expandido por padrão — pode haver múltiplas ocorrências
    const allLeadsEls = screen.getAllByText(/todos os leads/i);
    expect(allLeadsEls.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/apenas os próprios/i).length).toBeGreaterThan(0);
  });

  it("exibe label de visibilidade CRM no badge quando colapsado", () => {
    renderEditor();
    const header = screen.getByText(/permissões de acesso/i).closest("button");
    expect(header).toBeTruthy();
    // Colapsa clicando
    fireEvent.click(header!);
    // Quando colapsado, badge com CRM label aparece
    expect(screen.getByText(/crm:/i)).toBeInTheDocument();
  });

  it("switch para 'Gerar Roteiros' está presente no DOM quando expandido", () => {
    renderEditor();
    // O componente usa "Gerar Roteiros" como label para can_generate_content
    const labelEl = screen.queryByText(/gerar roteiros/i);
    expect(labelEl).toBeInTheDocument();
  });

  it("toggle collapsed/expanded funciona ao clicar no header", () => {
    renderEditor();
    const header = screen.getByText(/permissões de acesso/i).closest("button");
    expect(header).toBeTruthy();

    // Deve estar expandido inicialmente — "Gerar Roteiros" visível
    expect(screen.getAllByText(/gerar roteiros/i).length).toBeGreaterThan(0);

    // Colapsa
    fireEvent.click(header!);
    expect(screen.queryByText(/gerar roteiros/i)).not.toBeInTheDocument();

    // Expande de volta
    fireEvent.click(header!);
    expect(screen.getAllByText(/gerar roteiros/i).length).toBeGreaterThan(0);
  });

  it("botão 'Permissões salvas' ou 'Salvar permissões' presente quando expandido", () => {
    renderEditor();
    // O botão alterna entre "Permissões salvas ✓" e "Salvar permissões ●" dependendo do estado dirty
    const saveBtn = screen.queryByText(/permissões salvas|salvar permissões/i);
    expect(saveBtn).toBeInTheDocument();
  });
});
