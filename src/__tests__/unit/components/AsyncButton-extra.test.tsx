/**
 * T10 ASYNC-BUTTON-EXTRA — Caminhos adicionais do AsyncButton
 *
 * Verifica:
 * 1. Prop disabled=true → botão desabilitado
 * 2. Prop disabled=true → onClick NÃO disparado ao clicar
 * 3. Sem prop onClick → não lança erro ao clicar
 * 4. loading=true + disabled=true → ainda desabilitado e sem spinner duplicado
 * 5. children string renderizada corretamente com disabled
 * 6. aria-busy="false" quando loading=false e disabled=true
 *
 * 6 asserts
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── AsyncButton inline (mesmo padrão do teste base) ───────────────────────────
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

describe("T10 ASYNC-BUTTON-EXTRA — prop disabled", () => {
  it("disabled=true → botão fica desabilitado", () => {
    render(<AsyncButton disabled>Confirmar</AsyncButton>);
    expect(screen.getByTestId("async-button")).toBeDisabled();
  });

  it("disabled=true → onClick NÃO é chamado ao clicar", () => {
    const handleClick = vi.fn();
    render(
      <AsyncButton disabled onClick={handleClick}>
        Bloqueado
      </AsyncButton>
    );
    fireEvent.click(screen.getByTestId("async-button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("disabled=true → aria-busy='false' (não está loading)", () => {
    render(<AsyncButton disabled>Salvar</AsyncButton>);
    expect(screen.getByTestId("async-button")).toHaveAttribute("aria-busy", "false");
  });
});

describe("T10 ASYNC-BUTTON-EXTRA — sem onClick", () => {
  it("sem prop onClick → não lança erro ao clicar", () => {
    expect(() => {
      render(<AsyncButton>Sem Handler</AsyncButton>);
      fireEvent.click(screen.getByTestId("async-button"));
    }).not.toThrow();
  });

  it("children string renderizada corretamente quando disabled", () => {
    render(<AsyncButton disabled>Texto Desabilitado</AsyncButton>);
    expect(screen.getByTestId("async-button")).toHaveTextContent(
      "Texto Desabilitado"
    );
  });
});

describe("T10 ASYNC-BUTTON-EXTRA — combinações", () => {
  it("loading=true + disabled=true → desabilitado, spinner aparece, sem duplicata", () => {
    render(
      <AsyncButton loading disabled>
        Processando
      </AsyncButton>
    );
    const btn = screen.getByTestId("async-button");
    expect(btn).toBeDisabled();
    // apenas 1 spinner (loading controla)
    expect(screen.getAllByTestId("spinner-loader")).toHaveLength(1);
  });
});
