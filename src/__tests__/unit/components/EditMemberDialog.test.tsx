/**
 * T-EDIT-MEMBER-DIALOG — Valida EditMemberDialog
 *
 * Verifica:
 * 1. Não renderiza quando open=false
 * 2. Renderiza quando open=true
 * 3. Campos pré-preenchidos com dados do member
 * 4. Botão salvar está presente
 * 5. Botão cancelar chama onOpenChange(false)
 * 6. Componente monta sem erros quando member é null
 *
 * 6 asserts
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase", () => ({ supabase: {} }));
vi.mock("@/lib/edge", () => ({
  invokeEdge: vi.fn().mockResolvedValue({ data: null, error: null }),
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/components/cliente/MemberPermissionsEditor", () => ({
  MemberPermissionsEditor: () => <div data-testid="perms-editor" />,
}));
vi.mock("@/components/cliente/ModuleAccessEditor", () => ({
  ModuleAccessEditor: () => <div data-testid="module-editor" />,
}));
vi.mock("lucide-react", () => ({
  Trash2: () => <svg data-testid="trash-icon" />,
}));

// Stubs leves para componentes UI do shadcn/ui
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));
vi.mock("@/components/ui/label", () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h3>{children}</h3>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
}));

import { EditMemberDialog } from "@/components/EditMemberDialog";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const member = {
  user_id: "user-1",
  full_name: "Maria Souza",
  job_title: "Gerente",
  role: "franqueado",
};

const roleOptions = [
  { value: "franqueado", label: "Franqueado" },
  { value: "colaborador", label: "Colaborador" },
];

function renderDialog(props: Partial<Parameters<typeof EditMemberDialog>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    member,
    organizationId: "org-1",
    roleOptions,
  };
  return render(<EditMemberDialog {...defaults} {...props} />);
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("EditMemberDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não renderiza quando open=false", () => {
    renderDialog({ open: false });
    expect(screen.queryByTestId("dialog")).toBeNull();
  });

  it("renderiza quando open=true", () => {
    renderDialog({ open: true });
    expect(screen.getByTestId("dialog")).toBeTruthy();
  });

  it("campo full_name está pré-preenchido com dados do member", () => {
    renderDialog();
    const inputs = screen.getAllByDisplayValue("Maria Souza");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("botão salvar presente", () => {
    renderDialog();
    expect(screen.getByText(/salvar/i)).toBeTruthy();
  });

  it("botão cancelar no footer chama onOpenChange(false)", () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });
    // Há dois botões "Cancelar": AlertDialog (índice 0) e footer (índice 1)
    const cancelButtons = screen.getAllByText(/cancelar/i);
    // O botão do footer (último) é quem chama onOpenChange(false)
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("monta sem erros quando member é null", () => {
    expect(() => renderDialog({ member: null })).not.toThrow();
  });
});
