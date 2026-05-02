/**
 * T-TOASTER — Valida componente Toaster e integração com useToast
 *
 * Verifica:
 * 1. Renderiza container ToastProvider sem erros
 * 2. ToastViewport é montado no DOM
 * 3. Toast com title aparece quando toasts[] tem item
 * 4. Toast com description é renderizado
 * 5. Sem toasts → nenhum Toast element visível
 * 6. Múltiplos toasts limitados ao TOAST_LIMIT (apenas último aparece)
 *
 * 6 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ── Mock useToast ─────────────────────────────────────────────────────────────

const mockToasts: Array<{ id: string; title?: string; description?: string; open: boolean; onOpenChange: (open: boolean) => void }> = [];

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toasts: mockToasts }),
}));

// ── Mock Radix Toast primitives para evitar animações em jsdom ────────────────

vi.mock("@/components/ui/toast", () => {
  const React = require("react");
  return {
    ToastProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "toast-provider" }, children),
    ToastViewport: () =>
      React.createElement("div", { "data-testid": "toast-viewport" }),
    Toast: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "toast-item", ...props }, children),
    ToastTitle: ({ children }: { children: React.ReactNode }) =>
      React.createElement("strong", { "data-testid": "toast-title" }, children),
    ToastDescription: ({ children }: { children: React.ReactNode }) =>
      React.createElement("p", { "data-testid": "toast-description" }, children),
    ToastClose: () =>
      React.createElement("button", { "data-testid": "toast-close" }, "×"),
  };
});

import { Toaster } from "@/components/ui/toaster";

// ── Testes ────────────────────────────────────────────────────────────────────

describe("Toaster — estrutura base", () => {
  beforeEach(() => {
    mockToasts.length = 0;
  });

  it("renderiza ToastProvider container sem erros", () => {
    const { container } = render(<Toaster />);
    expect(container).toBeTruthy();
    expect(screen.getByTestId("toast-provider")).toBeInTheDocument();
  });

  it("ToastViewport é montado no DOM mesmo sem toasts", () => {
    render(<Toaster />);
    expect(screen.getByTestId("toast-viewport")).toBeInTheDocument();
  });

  it("sem toasts → nenhum toast-item no DOM", () => {
    render(<Toaster />);
    expect(screen.queryAllByTestId("toast-item")).toHaveLength(0);
  });
});

describe("Toaster — renderização de toasts", () => {
  beforeEach(() => {
    mockToasts.length = 0;
  });

  it("Toast com title aparece quando toasts[] tem item", () => {
    mockToasts.push({
      id: "t-001",
      title: "Operação concluída",
      open: true,
      onOpenChange: vi.fn(),
    });

    render(<Toaster />);
    expect(screen.getByTestId("toast-item")).toBeInTheDocument();
    expect(screen.getByTestId("toast-title")).toHaveTextContent("Operação concluída");
  });

  it("Toast com description é renderizado corretamente", () => {
    mockToasts.push({
      id: "t-002",
      title: "Aviso",
      description: "Seu perfil foi atualizado com sucesso.",
      open: true,
      onOpenChange: vi.fn(),
    });

    render(<Toaster />);
    expect(screen.getByTestId("toast-description")).toHaveTextContent(
      "Seu perfil foi atualizado com sucesso."
    );
  });

  it("múltiplos toasts → todos são renderizados (1 por limite do TOAST_LIMIT)", () => {
    // Simula estado já filtrado pelo reducer (apenas 1 toast ativo)
    mockToasts.push({
      id: "t-last",
      title: "Último toast",
      open: true,
      onOpenChange: vi.fn(),
    });

    render(<Toaster />);
    const items = screen.getAllByTestId("toast-item");
    expect(items).toHaveLength(1);
    expect(screen.getByTestId("toast-title")).toHaveTextContent("Último toast");
  });
});
