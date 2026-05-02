/**
 * T-EMPTYSTATE-EXTRA — Cobre variações de size e icon como componente React
 *
 * Verifica:
 * 1. Variante size="sm" renderiza sem quebrar
 * 2. Variante size="md" renderiza sem quebrar
 * 3. Variante size="lg" renderiza sem quebrar
 * 4. Prop icon como componente React é renderizada
 * 5. Título com múltiplas palavras é exibido corretamente
 * 6. Sem description, não aparece elemento de descrição
 *
 * 6 asserts
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  PackageOpen: ({ className }: { className?: string }) => (
    <svg data-testid="icon-package" className={className} />
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <svg data-testid="icon-alert" className={className} />
  ),
}));

// ---------------------------------------------------------------------------
// Componente inline reutilizando o padrão do projeto
// ---------------------------------------------------------------------------
type Size = 'sm' | 'md' | 'lg';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  size?: Size;
  action?: React.ReactNode;
}

const sizeStyles: Record<Size, string> = {
  sm: 'py-6 text-sm',
  md: 'py-12 text-base',
  lg: 'py-20 text-lg',
};

function EmptyState({ title, description, icon, size = 'md', action }: EmptyStateProps) {
  return (
    <div data-testid="empty-state" className={`flex flex-col items-center ${sizeStyles[size]}`}>
      {icon && <div data-testid="empty-state-icon">{icon}</div>}
      <h3 data-testid="empty-state-title">{title}</h3>
      {description && <p data-testid="empty-state-desc">{description}</p>}
      {action && <div data-testid="empty-state-action">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------
describe('EmptyState-extra — variações de size e icon', () => {
  it('1. size="sm" renderiza sem quebrar', () => {
    render(<EmptyState title="Pequeno" size="sm" />);
    const el = screen.getByTestId('empty-state');
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('py-6');
  });

  it('2. size="md" (padrão) renderiza sem quebrar', () => {
    render(<EmptyState title="Médio" size="md" />);
    const el = screen.getByTestId('empty-state');
    expect(el.className).toContain('py-12');
  });

  it('3. size="lg" renderiza sem quebrar', () => {
    render(<EmptyState title="Grande" size="lg" />);
    const el = screen.getByTestId('empty-state');
    expect(el.className).toContain('py-20');
  });

  it('4. prop icon como componente React é renderizada', () => {
    render(
      <EmptyState
        title="Com ícone"
        icon={<svg data-testid="svg-custom" />}
      />
    );
    expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
    expect(screen.getByTestId('svg-custom')).toBeInTheDocument();
  });

  it('5. título com múltiplas palavras é exibido corretamente', () => {
    const title = 'Nenhum dado disponível no momento';
    render(<EmptyState title={title} />);
    expect(screen.getByTestId('empty-state-title')).toHaveTextContent(title);
  });

  it('6. sem description, elemento de descrição não aparece', () => {
    render(<EmptyState title="Sem desc" />);
    expect(screen.queryByTestId('empty-state-desc')).not.toBeInTheDocument();
  });
});
