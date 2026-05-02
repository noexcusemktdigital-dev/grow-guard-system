/**
 * T-EB ERRORBOUNDARY-EXTRA — Cobertura adicional do ErrorBoundary
 *
 * Verifica:
 * 1. Captura erro dos children e não propaga para o DOM raiz
 * 2. Renderiza fallback customizado via prop quando há erro
 * 3. Não captura (não ativa fallback) quando children não lançam erro
 * 4. Fallback padrão exibe mensagem de erro amigável
 * 5. children com múltiplos elementos renderiza normalmente sem erro
 * 6. ErrorBoundary aninhado isola erro apenas na zona interna
 *
 * 6 asserts
 */
import React from "react";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ── Suprimir console.error durante testes de crash ────────────────────────────
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

// ── Componentes auxiliares ────────────────────────────────────────────────────
function ThrowingChild({ message = "Erro intencional" }: { message?: string }) {
  throw new Error(message);
}

function SafeChild({ label = "Filho saudável" }: { label?: string }) {
  return <div data-testid="safe-child">{label}</div>;
}

// ── Testes ────────────────────────────────────────────────────────────────────
describe("ErrorBoundary — cobertura extra", () => {
  it("captura erro do children sem propagar para fora do boundary", () => {
    // Se o erro propagasse, o render lançaria — o test falharia
    expect(() =>
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      )
    ).not.toThrow();
  });

  it("renderiza fallback customizado via prop quando filho lança erro", () => {
    render(
      <ErrorBoundary fallback={<p data-testid="fb-custom">Fallback customizado aqui</p>}>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("fb-custom")).toBeInTheDocument();
    expect(screen.getByText("Fallback customizado aqui")).toBeInTheDocument();
  });

  it("não ativa fallback quando children não lançam erro", () => {
    render(
      <ErrorBoundary fallback={<p data-testid="fb-should-not-render">Não deve aparecer</p>}>
        <SafeChild label="Tudo certo" />
      </ErrorBoundary>
    );
    expect(screen.queryByTestId("fb-should-not-render")).not.toBeInTheDocument();
    expect(screen.getByText("Tudo certo")).toBeInTheDocument();
  });

  it("fallback padrão exibe mensagem de erro amigável ao usuário", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    // O fallback padrão deve ter texto amigável (não o stack trace bruto)
    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
  });

  it("múltiplos children saudáveis renderizam normalmente", () => {
    render(
      <ErrorBoundary>
        <SafeChild label="A" />
        <SafeChild label="B" />
        <SafeChild label="C" />
      </ErrorBoundary>
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("ErrorBoundary aninhado isola erro apenas na zona interna", () => {
    render(
      <div data-testid="outer-layout">
        <ErrorBoundary>
          <div data-testid="outer-zone">Zona externa OK</div>
          <ErrorBoundary fallback={<span data-testid="inner-fallback">Zona interna falhou</span>}>
            <ThrowingChild />
          </ErrorBoundary>
        </ErrorBoundary>
      </div>
    );
    // A zona externa continua visível
    expect(screen.getByTestId("outer-zone")).toBeInTheDocument();
    // O fallback interno é exibido
    expect(screen.getByTestId("inner-fallback")).toBeInTheDocument();
    // O layout raiz não desapareceu
    expect(screen.getByTestId("outer-layout")).toBeInTheDocument();
  });
});
