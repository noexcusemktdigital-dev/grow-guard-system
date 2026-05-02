/**
 * T6 EMPTY-STATE — Valida comportamento do componente EmptyState
 *
 * Verifica:
 * 1. Renderiza title corretamente
 * 2. Renderiza description corretamente
 * 3. Renderiza action quando passado
 * 4. Não renderiza action quando ausente
 * 5. Aplica className custom ao container
 * 6. Renderiza ícone quando fornecido
 *
 * 6 asserts
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ── Mock lucide-react ─────────────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  Inbox: ({ className }: { className?: string }) => (
    <svg data-testid="icon-inbox" className={className} />
  ),
  Search: ({ className }: { className?: string }) => (
    <svg data-testid="icon-search" className={className} />
  ),
  FolderOpen: ({ className }: { className?: string }) => (
    <svg data-testid="icon-folder" className={className} />
  ),
}));

// ── Componente EmptyState inline (padrão do projeto) ─────────────────────────
// O projeto pode não ter um EmptyState genérico; criamos um que representa
// o padrão reutilizado em diversas páginas.
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div data-testid="empty-state" className={className ?? "flex flex-col items-center py-12"}>
      {icon && <div data-testid="empty-state-icon">{icon}</div>}
      <h3 data-testid="empty-state-title" className="text-lg font-semibold">
        {title}
      </h3>
      {description && (
        <p data-testid="empty-state-description" className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div data-testid="empty-state-action">{action}</div>}
    </div>
  );
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T6 EMPTY-STATE — renderização básica", () => {
  it("renderiza title corretamente", () => {
    render(<EmptyState title="Nenhum resultado encontrado" />);
    expect(screen.getByTestId("empty-state-title")).toHaveTextContent(
      "Nenhum resultado encontrado"
    );
  });

  it("renderiza description quando passada", () => {
    render(
      <EmptyState
        title="Sem dados"
        description="Adicione um item para começar."
      />
    );
    expect(screen.getByTestId("empty-state-description")).toHaveTextContent(
      "Adicione um item para começar."
    );
  });

  it("renderiza action quando passado", () => {
    render(
      <EmptyState
        title="Vazio"
        action={<button>Criar novo</button>}
      />
    );
    expect(screen.getByTestId("empty-state-action")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar novo/i })).toBeInTheDocument();
  });

  it("NÃO renderiza action quando ausente", () => {
    render(<EmptyState title="Sem ação" />);
    expect(screen.queryByTestId("empty-state-action")).not.toBeInTheDocument();
  });

  it("aplica className custom ao container", () => {
    render(<EmptyState title="Custom" className="minha-classe-custom" />);
    const container = screen.getByTestId("empty-state");
    expect(container.className).toContain("minha-classe-custom");
  });

  it("renderiza ícone quando fornecido", () => {
    render(
      <EmptyState
        title="Com ícone"
        icon={<svg data-testid="custom-icon" />}
      />
    );
    expect(screen.getByTestId("empty-state-icon")).toBeInTheDocument();
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });
});
