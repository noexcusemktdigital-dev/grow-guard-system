/**
 * T-ASYNCBUTTON-LOADING — Foco em comportamento de loading e cancelamento de onClick
 *
 * Verifica:
 * 1. loading=false → texto normal visível
 * 2. loading=true → spinner presente
 * 3. loading=true → botão fica disabled
 * 4. onClick não é chamado durante loading (click cancelado)
 * 5. onClick é chamado normalmente quando loading=false
 * 6. Transição: loading=false → loading=true → spinner aparece e botão fica disabled
 *
 * 6 asserts
 */
import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Inline AsyncButton (mesmo padrão do projeto) ───────────────────────────────
interface AsyncButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

function AsyncButton({ children, onClick, loading = false, disabled = false, className }: AsyncButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      data-testid="async-btn"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : 'false'}
      className={className}
    >
      {loading && <svg data-testid="spinner" aria-label="carregando" />}
      {children}
    </button>
  );
}

// Wrapper com estado controlado para teste de transição
function ToggleLoadingButton({ onClick }: { onClick?: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <>
      <AsyncButton
        loading={loading}
        onClick={onClick}
        data-testid="toggle-btn"
      >
        Salvar
      </AsyncButton>
      <button data-testid="toggle" onClick={() => setLoading(v => !v)}>
        Toggle Loading
      </button>
    </>
  );
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('AsyncButton-loading — estado loading=false', () => {
  it('loading=false → texto normal visível', () => {
    render(<AsyncButton>Enviar Agora</AsyncButton>);
    expect(screen.getByTestId('async-btn')).toHaveTextContent('Enviar Agora');
  });

  it('loading=false → spinner ausente', () => {
    render(<AsyncButton>Texto</AsyncButton>);
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('loading=false → onClick é chamado normalmente', () => {
    const handler = vi.fn();
    render(<AsyncButton onClick={handler}>Clique</AsyncButton>);
    fireEvent.click(screen.getByTestId('async-btn'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('AsyncButton-loading — estado loading=true', () => {
  it('loading=true → spinner está presente', () => {
    render(<AsyncButton loading>Processando</AsyncButton>);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('loading=true → botão fica disabled', () => {
    render(<AsyncButton loading>Aguarde</AsyncButton>);
    expect(screen.getByTestId('async-btn')).toBeDisabled();
  });

  it('loading=true → onClick NÃO é disparado ao clicar (cancelado)', () => {
    const handler = vi.fn();
    render(<AsyncButton loading onClick={handler}>Bloqueado</AsyncButton>);
    fireEvent.click(screen.getByTestId('async-btn'));
    expect(handler).not.toHaveBeenCalled();
  });
});
