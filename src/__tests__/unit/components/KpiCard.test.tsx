/**
 * T-KC KPICARD — Valida renderização e badges do KpiCard
 *
 * Verifica:
 * 1. Renderiza label corretamente
 * 2. Renderiza value corretamente
 * 3. Renderiza sublabel quando fornecido
 * 4. Badge trend "up" exibe ícone correto (TrendingUp)
 * 5. Badge trend "down" exibe ícone correto (TrendingDown)
 * 6. Não renderiza badge quando trend não é passado
 *
 * 6 asserts
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "@/components/KpiCard";

// Suprimir warnings do lucide-react em ambiente jsdom
vi.mock("lucide-react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("lucide-react")>();
  return {
    ...mod,
    TrendingUp: ({ className }: { className?: string }) => (
      <svg data-testid="icon-trending-up" className={className} />
    ),
    TrendingDown: ({ className }: { className?: string }) => (
      <svg data-testid="icon-trending-down" className={className} />
    ),
    Minus: ({ className }: { className?: string }) => (
      <svg data-testid="icon-minus" className={className} />
    ),
  };
});

describe("KpiCard — renderização", () => {
  it("renderiza o label corretamente", () => {
    render(<KpiCard label="Receita Total" value="R$ 10.000" />);
    expect(screen.getByText("Receita Total")).toBeInTheDocument();
  });

  it("renderiza o value corretamente", () => {
    render(<KpiCard label="Propostas" value="42" />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renderiza sublabel quando fornecido", () => {
    render(<KpiCard label="MRR" value="R$ 5.000" sublabel="+12% vs mês anterior" />);
    expect(screen.getByText("+12% vs mês anterior")).toBeInTheDocument();
  });

  it("exibe ícone TrendingUp quando trend='up'", () => {
    render(<KpiCard label="Crescimento" value="15%" trend="up" />);
    expect(screen.getByTestId("icon-trending-up")).toBeInTheDocument();
  });

  it("exibe ícone TrendingDown quando trend='down'", () => {
    render(<KpiCard label="Churn" value="3%" trend="down" />);
    expect(screen.getByTestId("icon-trending-down")).toBeInTheDocument();
  });

  it("não renderiza ícone de trend quando prop não é passada", () => {
    render(<KpiCard label="Contratos" value="100" />);
    expect(screen.queryByTestId("icon-trending-up")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-trending-down")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-minus")).not.toBeInTheDocument();
  });
});
