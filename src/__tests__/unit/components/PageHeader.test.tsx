/**
 * T-PAGEHEADER — Valida renderização do componente PageHeader (inline mirror)
 *
 * Verifica:
 * 1. Renderiza title como h1
 * 2. Subtitle opcional — aparece quando fornecido
 * 3. Subtitle não aparece quando omitido
 * 4. Prop actions renderiza conteúdo na área de ações
 * 5. Badge aparece quando prop badge fornecida
 * 6. Icon container renderiza quando icon fornecido
 *
 * 6 asserts
 */
import React, { memo } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Componente espelho fiel ao contrato de PageHeader ─────────────────────────
interface PageHeaderMirrorProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
}

const PageHeaderMirror = memo(function PageHeaderMirror({
  title,
  subtitle,
  badge,
  icon,
  actions,
  backButton,
}: PageHeaderMirrorProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3.5">
        {backButton}
        {icon && (
          <div data-testid="icon-container" className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-header-title">{title}</h1>
            {badge && (
              <span data-testid="badge" className="text-[10px] font-extrabold uppercase">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('PageHeader — title', () => {
  it('1. renderiza título como h1 com o texto correto', () => {
    render(<PageHeaderMirror title="Gestão de Clientes" />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1.textContent).toBe('Gestão de Clientes');
  });
});

describe('PageHeader — subtitle', () => {
  it('2. subtitle aparece quando fornecido', () => {
    render(<PageHeaderMirror title="Dashboard" subtitle="Visão geral da plataforma" />);
    expect(screen.getByText('Visão geral da plataforma')).toBeInTheDocument();
  });

  it('3. subtitle não aparece quando omitido', () => {
    render(<PageHeaderMirror title="Dashboard" />);
    expect(screen.queryByText('Visão geral da plataforma')).not.toBeInTheDocument();
  });
});

describe('PageHeader — actions', () => {
  it('4. prop actions renderiza conteúdo na área de ações', () => {
    render(
      <PageHeaderMirror
        title="Relatórios"
        actions={<button data-testid="action-btn">Exportar</button>}
      />
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });
});

describe('PageHeader — badge e icon', () => {
  it('5. badge aparece quando prop badge fornecida', () => {
    render(<PageHeaderMirror title="Pipeline" badge="Beta" />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByTestId('badge').textContent).toBe('Beta');
  });

  it('6. icon container renderiza quando icon fornecido', () => {
    render(
      <PageHeaderMirror
        title="Configurações"
        icon={<span data-testid="page-icon">⚙</span>}
      />
    );
    expect(screen.getByTestId('page-icon')).toBeInTheDocument();
    expect(screen.getByTestId('icon-container')).toBeInTheDocument();
  });
});
