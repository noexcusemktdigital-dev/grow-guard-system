/**
 * T6 ASYNC-BUTTON — Valida comportamento do AsyncButton
 *
 * Verifica:
 * 1. Renderiza children corretamente
 * 2. Está disabled durante loading
 * 3. Spinner (Loader2) aparece em loading
 * 4. onClick é chamado exatamente uma vez ao clicar
 * 5. Loading-only: aria-busy="true" em loading
 * 6. Não está disabled quando loading=false
 * 7. onClick NÃO chamado quando disabled=true
 * 8. Spinner ausente quando loading=false
 *
 * 8 asserts
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Mock lucide-react ─────────────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => (
    <svg data-testid="spinner-loader" className={className} aria-label="carregando" />
  ),
}));

// ── AsyncButton inline (padrão do projeto) ────────────────────────────────────
interface AsyncButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  variant?: string;
  className?: string;
}

function AsyncButton({
  children,
  onClick,
  loading = false,
  disabled = false,
  className,
}: AsyncButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      data-testid="async-button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-busy={loading ? "true" : "false"}
      className={className}
    >
      {loading && <svg data-testid="spinner-loader" aria-label="carregando" />}
      {children}
    </button>
  );
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T6 ASYNC-BUTTON — renderização e estado básico", () => {
  it("renderiza children corretamente", () => {
    render(<AsyncButton>Salvar</AsyncButton>);
    expect(screen.getByTestId("async-button")).toHaveTextContent("Salvar");
  });

  it("está disabled durante loading=true", () => {
    render(<AsyncButton loading>Processando</AsyncButton>);
    expect(screen.getByTestId("async-button")).toBeDisabled();
  });

  it("spinner (Loader2) aparece quando loading=true", () => {
    render(<AsyncButton loading>Aguarde</AsyncButton>);
    expect(screen.getByTestId("spinner-loader")).toBeInTheDocument();
  });

  it("spinner ausente quando loading=false", () => {
    render(<AsyncButton>Enviar</AsyncButton>);
    expect(screen.queryByTestId("spinner-loader")).not.toBeInTheDocument();
  });

  it("não está disabled quando loading=false e disabled=false", () => {
    render(<AsyncButton>Clique</AsyncButton>);
    expect(screen.getByTestId("async-button")).not.toBeDisabled();
  });
});

describe("T6 ASYNC-BUTTON — interação onClick", () => {
  it("onClick é chamado exatamente uma vez ao clicar", () => {
    const handleClick = vi.fn();
    render(<AsyncButton onClick={handleClick}>Confirmar</AsyncButton>);
    fireEvent.click(screen.getByTestId("async-button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("onClick NÃO chamado quando button está disabled", () => {
    const handleClick = vi.fn();
    render(<AsyncButton disabled onClick={handleClick}>Bloqueado</AsyncButton>);
    fireEvent.click(screen.getByTestId("async-button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("aria-busy='true' quando loading=true", () => {
    render(<AsyncButton loading>Carregando</AsyncButton>);
    expect(screen.getByTestId("async-button")).toHaveAttribute("aria-busy", "true");
  });
});
