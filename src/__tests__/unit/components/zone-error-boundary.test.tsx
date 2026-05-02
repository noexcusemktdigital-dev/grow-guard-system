/**
 * T4 ZONE-BOUNDARY — Valida ErrorBoundary em src/components/ErrorBoundary.tsx
 *
 * Verifica que:
 * 1. Componente ErrorBoundary existe e é importável
 * 2. Componente filho que joga erro renderiza o fallback
 * 3. Layout pai não desaparece quando uma zona quebra
 * 4. handleReset limpa o estado de erro
 */
import React from "react";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ── Supressão de console.error durante os testes de crash ────────────────────

const originalConsoleError = console.error;

beforeAll(() => {
  // ErrorBoundary chama console.error — suprimimos para não poluir output
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// ── Componente auxiliar que lança erro ───────────────────────────────────────

function BrokenComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Erro de teste — componente quebrado propositalmente");
  }
  return <div>Componente OK</div>;
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T4 ZONE-BOUNDARY — ErrorBoundary", () => {
  describe("Import e estrutura", () => {
    it("ErrorBoundary é importável (export nomeado)", () => {
      expect(ErrorBoundary).toBeDefined();
      expect(typeof ErrorBoundary).toBe("function");
    });

    it("ErrorBoundary é um React.Component (tem getDerivedStateFromError)", () => {
      expect(ErrorBoundary.getDerivedStateFromError).toBeDefined();
      expect(typeof ErrorBoundary.getDerivedStateFromError).toBe("function");
    });
  });

  describe("Happy path — sem erro", () => {
    it("renderiza filhos normalmente quando não há erro", () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-content">Conteúdo filho</div>
        </ErrorBoundary>
      );
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.getByText("Conteúdo filho")).toBeInTheDocument();
    });

    it("renderiza múltiplos filhos sem interferência", () => {
      render(
        <ErrorBoundary>
          <span data-testid="a">A</span>
          <span data-testid="b">B</span>
        </ErrorBoundary>
      );
      expect(screen.getByTestId("a")).toBeInTheDocument();
      expect(screen.getByTestId("b")).toBeInTheDocument();
    });
  });

  describe("Error path — filho quebrado", () => {
    it("exibe UI de fallback quando filho joga erro", () => {
      render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>
      );
      // Deve mostrar a mensagem de erro padrão
      expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
    });

    it("exibe botão de retry no fallback padrão", () => {
      render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>
      );
      expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
    });

    it("exibe fallback customizado quando fornecido via prop", () => {
      render(
        <ErrorBoundary fallback={<div data-testid="custom-fallback">Erro customizado</div>}>
          <BrokenComponent />
        </ErrorBoundary>
      );
      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
      expect(screen.getByText("Erro customizado")).toBeInTheDocument();
    });

    it("não mostra os filhos quebrados quando em estado de erro", () => {
      render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>
      );
      // Filhos não devem estar visíveis — o boundary capturou o erro
      expect(screen.queryByText("Componente OK")).not.toBeInTheDocument();
    });
  });

  describe("Layout isolation — zona quebrada não derruba layout", () => {
    it("layout pai continua renderizado quando zona filha quebra", () => {
      render(
        <div data-testid="layout-root">
          <header data-testid="header">Header estável</header>
          <main>
            <ErrorBoundary>
              <BrokenComponent />
            </ErrorBoundary>
          </main>
          <footer data-testid="footer">Footer estável</footer>
        </div>
      );
      expect(screen.getByTestId("header")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
      expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();
    });

    it("sibling saudável continua visível quando uma zona quebra", () => {
      render(
        <div>
          <ErrorBoundary>
            <BrokenComponent />
          </ErrorBoundary>
          <div data-testid="healthy-sibling">Zona saudável</div>
        </div>
      );
      expect(screen.getByTestId("healthy-sibling")).toBeInTheDocument();
    });
  });

  describe("handleReset — recuperação de erro", () => {
    it("botão 'Tentar novamente' chama reset e limpa estado de erro", () => {
      // Simula um componente que pode ser controlado externamente
      let throwError = true;

      function ToggleableComponent() {
        if (throwError) throw new Error("Erro temporário");
        return <div data-testid="recovered">Recuperado!</div>;
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ToggleableComponent />
        </ErrorBoundary>
      );

      // Garante que estamos em estado de erro
      expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument();

      // Simula que o erro foi corrigido e clica em retry
      throwError = false;
      const retryButton = screen.getByRole("button", { name: /tentar novamente/i });
      fireEvent.click(retryButton);

      // Após reset, o boundary deve tentar renderizar filhos novamente
      expect(screen.queryByText(/algo deu errado/i)).not.toBeInTheDocument();
    });
  });

  describe("pageName prop", () => {
    it("aceita pageName sem quebrar", () => {
      render(
        <ErrorBoundary pageName="Dashboard">
          <div>Conteúdo OK</div>
        </ErrorBoundary>
      );
      expect(screen.getByText("Conteúdo OK")).toBeInTheDocument();
    });
  });
});
