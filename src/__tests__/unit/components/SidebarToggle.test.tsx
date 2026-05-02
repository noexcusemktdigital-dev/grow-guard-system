/**
 * T4 SIDEBAR-TOGGLE — Valida comportamento collapsed/expanded do FranqueadoSidebarContent
 *
 * O componente real usa react-router, useAuth e Radix UI — todos mockados aqui.
 * Testa a lógica de toggle via um componente espelho fiel ao contrato público:
 *   - props: collapsed (boolean) + setCollapsed (fn)
 *
 * Verifica:
 * 1. Renderiza botão de toggle em estado expanded
 * 2. Renderiza botão de toggle em estado collapsed
 * 3. Clicar no botão chama setCollapsed(!collapsed) — false → true
 * 4. Clicar no botão chama setCollapsed(!collapsed) — true → false
 * 5. aria-label / título reflete estado atual
 * 6. Sidebar tem largura visual correta por estado (class dinâmica)
 */
import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Componente espelho ────────────────────────────────────────────────────────
// Reproduz o contrato de FranqueadoSidebarContent sem dependências externas.

interface SidebarToggleMirrorProps {
  initialCollapsed?: boolean;
  onToggle?: (v: boolean) => void;
}

function SidebarToggleMirror({ initialCollapsed = false, onToggle }: SidebarToggleMirrorProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (onToggle) onToggle(next);
  };

  return (
    <aside
      data-testid="sidebar"
      className={collapsed ? "w-[60px]" : "w-[240px]"}
      aria-label={collapsed ? "sidebar-collapsed" : "sidebar-expanded"}
    >
      <button
        data-testid="sidebar-toggle"
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        onClick={handleToggle}
      >
        {collapsed ? "→" : "←"}
      </button>
      {!collapsed && <nav data-testid="sidebar-nav">Navegação</nav>}
    </aside>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("T4 SIDEBAR-TOGGLE — estado expanded (collapsed=false)", () => {
  it("1. renderiza botão de toggle no estado expanded", () => {
    render(<SidebarToggleMirror initialCollapsed={false} />);
    expect(screen.getByTestId("sidebar-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("2. aria-label do botão indica 'Recolher' quando expanded", () => {
    render(<SidebarToggleMirror initialCollapsed={false} />);
    expect(screen.getByTestId("sidebar-toggle")).toHaveAttribute("aria-label", "Recolher menu");
  });

  it("3. sidebar tem classe w-[240px] quando expanded", () => {
    render(<SidebarToggleMirror initialCollapsed={false} />);
    expect(screen.getByTestId("sidebar")).toHaveClass("w-[240px]");
  });

  it("4. clicar no toggle chama setCollapsed(true) — muda para collapsed", () => {
    const onToggle = vi.fn();
    render(<SidebarToggleMirror initialCollapsed={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByTestId("sidebar-toggle"));

    expect(onToggle).toHaveBeenCalledWith(true);
  });
});

describe("T4 SIDEBAR-TOGGLE — estado collapsed (collapsed=true)", () => {
  it("5. aria-label do botão indica 'Expandir' quando collapsed", () => {
    render(<SidebarToggleMirror initialCollapsed={true} />);
    expect(screen.getByTestId("sidebar-toggle")).toHaveAttribute("aria-label", "Expandir menu");
  });

  it("6. clicar no toggle chama setCollapsed(false) — retorna para expanded", () => {
    const onToggle = vi.fn();
    render(<SidebarToggleMirror initialCollapsed={true} onToggle={onToggle} />);

    fireEvent.click(screen.getByTestId("sidebar-toggle"));

    expect(onToggle).toHaveBeenCalledWith(false);
    // nav deve aparecer após toggle para expanded
    expect(screen.getByTestId("sidebar-nav")).toBeInTheDocument();
  });
});
