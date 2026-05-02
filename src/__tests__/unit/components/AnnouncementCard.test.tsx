/**
 * T-AC AnnouncementCard — Valida renderização e interações do card de avisos
 *
 * Utiliza AnnouncementPopupDialog como proxy do comportamento de card,
 * testando a lógica central de renderização/marcação via mocks dos hooks.
 *
 * Verifica:
 * 1. Renderiza title do announcement na tela
 * 2. Renderiza body/description do announcement na tela
 * 3. Marca como lido (markViewed.mutate) ao clicar em "Fechar/Próximo"
 * 4. confirmRead.mutate é chamado ao clicar em "Confirmar Leitura"
 * 5. Não renderiza nada quando lista de announcements está vazia
 * 6. Exibe badge "Crítico" para announcements com priority="Crítica"
 *
 * 6 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ── Dados de fixture ──────────────────────────────────────────────────────────
const ANNOUNCEMENT_NORMAL = {
  id: "ann-001",
  title: "Atualização do Sistema",
  content: "O sistema será atualizado nesta sexta-feira às 22h.",
  priority: "Normal",
  status: "active",
  published_at: "2026-01-01T00:00:00Z",
  show_popup: true,
  require_confirmation: false,
  attachment_url: null,
};

const ANNOUNCEMENT_CRITICA = {
  id: "ann-002",
  title: "Manutenção Emergencial",
  content: "Manutenção emergencial em andamento.",
  priority: "Crítica",
  status: "active",
  published_at: "2026-01-02T00:00:00Z",
  show_popup: true,
  require_confirmation: true,
  attachment_url: null,
};

// ── Mocks hoisted ─────────────────────────────────────────────────────────────
const { mockMarkViewed, mockConfirmRead } = vi.hoisted(() => {
  const mockMarkViewed = { mutate: vi.fn(), isPending: false };
  const mockConfirmRead = { mutate: vi.fn(), isPending: false };
  return { mockMarkViewed, mockConfirmRead };
});

// Estado controlável dos anúncios no mock
let currentAnnouncements: typeof ANNOUNCEMENT_NORMAL[] = [ANNOUNCEMENT_NORMAL];

vi.mock("@/hooks/useAnnouncements", () => ({
  useAnnouncements: () => ({ data: currentAnnouncements }),
}));

vi.mock("@/hooks/useAnnouncementViews", () => ({
  useAnnouncementViews: () => ({ data: [] }),
  useAnnouncementViewMutations: () => ({
    markViewed: mockMarkViewed,
    confirmRead: mockConfirmRead,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock Dialog — sempre renderiza filhos quando open=true
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (v: boolean) => void;
  }) =>
    open ? (
      <div data-testid="dialog-root" onClick={() => onOpenChange?.(false)}>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span data-testid={`badge-${variant ?? "default"}`}>{children}</span>,
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: () => <span data-testid="icon-alert">!</span>,
  CheckCircle2: () => <span data-testid="icon-check">✓</span>,
  Download: () => <span data-testid="icon-download">↓</span>,
  ChevronRight: () => <span data-testid="icon-chevron">›</span>,
}));

import { AnnouncementPopupDialog } from "@/components/AnnouncementPopupDialog";

function renderDialog(enabled = true) {
  return render(<AnnouncementPopupDialog enabled={enabled} />);
}

describe("AnnouncementCard — renderização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentAnnouncements = [ANNOUNCEMENT_NORMAL];
  });

  it("1. renderiza title do announcement na tela", () => {
    renderDialog();
    expect(screen.getByText("Atualização do Sistema")).toBeDefined();
  });

  it("2. renderiza content do announcement na tela", () => {
    renderDialog();
    expect(
      screen.getByText(
        "O sistema será atualizado nesta sexta-feira às 22h."
      )
    ).toBeDefined();
  });
});

describe("AnnouncementCard — interações", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentAnnouncements = [ANNOUNCEMENT_NORMAL];
  });

  it("3. markViewed.mutate é chamado ao clicar em Fechar/Próximo", () => {
    renderDialog();
    // O botão de fechar/próximo chama handleDismiss → markViewed.mutate
    const buttons = screen.getAllByRole("button");
    // Clicar no primeiro botão disponível (Próximo / Fechar)
    fireEvent.click(buttons[0]);
    expect(mockMarkViewed.mutate).toHaveBeenCalledWith(ANNOUNCEMENT_NORMAL.id);
  });

  it("4. confirmRead.mutate é chamado ao clicar em 'Li e concordo'", () => {
    currentAnnouncements = [ANNOUNCEMENT_CRITICA];
    renderDialog();
    // Botão de confirmar leitura: "Li e concordo" (require_confirmation=true)
    const confirmBtn = screen.getByText(/li e concordo/i);
    fireEvent.click(confirmBtn);
    // mutate é chamado com (id, { onSuccess }) — verificamos o primeiro argumento
    expect(mockConfirmRead.mutate).toHaveBeenCalledWith(
      ANNOUNCEMENT_CRITICA.id,
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});

describe("AnnouncementCard — estados especiais", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("5. não renderiza nada quando lista de announcements está vazia", () => {
    currentAnnouncements = [];
    const { container } = renderDialog();
    expect(container.firstChild).toBeNull();
  });

  it("6. exibe badge 'Crítico' para announcement com priority='Crítica'", () => {
    currentAnnouncements = [ANNOUNCEMENT_CRITICA];
    renderDialog();
    // Badge destructive renderizado para prioridade crítica
    const badge = screen.getByTestId("badge-destructive");
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain("Crítico");
  });
});
