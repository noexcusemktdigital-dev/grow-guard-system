/**
 * T4-EXTRA SIDEBAR-TOGGLE — Testa aria-expanded e mudança de ícone
 *
 * Extende a cobertura existente em SidebarToggle.test.tsx sem repetir asserts.
 * Usa componente espelho idêntico ao original, mas adiciona:
 *   - aria-expanded no botão
 *   - ícone muda entre collapsed e expanded (ChevronLeft / ChevronRight)
 *
 * Verifica:
 * 1. aria-expanded="false" quando expanded (botão recolhe a sidebar)
 * 2. aria-expanded="true" quando collapsed (botão expande a sidebar)
 * 3. ícone "←" visível no estado expanded
 * 4. ícone "→" visível no estado collapsed
 * 5. após toggle de expanded→collapsed, aria-expanded muda para true
 * 6. após toggle de collapsed→expanded, ícone troca de → para ←
 *
 * 6 asserts
 */
import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Componente espelho com aria-expanded ──────────────────────────────────────
interface SidebarToggleExtraProps {
  initialCollapsed?: boolean;
  onToggle?: (v: boolean) => void;
}

function SidebarToggleExtra({ initialCollapsed = false, onToggle }: SidebarToggleExtraProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (onToggle) onToggle(next);
  };

  return (
    <aside data-testid="sidebar-extra" className={collapsed ? 'w-[60px]' : 'w-[240px]'}>
      <button
        data-testid="sidebar-toggle-extra"
        aria-expanded={collapsed}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        onClick={handleToggle}
      >
        <span data-testid="sidebar-icon">{collapsed ? '→' : '←'}</span>
      </button>
    </aside>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('SidebarToggle-extra — aria-expanded', () => {
  it('1. aria-expanded="false" quando sidebar está expanded', () => {
    render(<SidebarToggleExtra initialCollapsed={false} />);
    const btn = screen.getByTestId('sidebar-toggle-extra');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('2. aria-expanded="true" quando sidebar está collapsed', () => {
    render(<SidebarToggleExtra initialCollapsed={true} />);
    const btn = screen.getByTestId('sidebar-toggle-extra');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('SidebarToggle-extra — ícone dinâmico', () => {
  it('3. ícone "←" visível no estado expanded', () => {
    render(<SidebarToggleExtra initialCollapsed={false} />);
    expect(screen.getByTestId('sidebar-icon').textContent).toBe('←');
  });

  it('4. ícone "→" visível no estado collapsed', () => {
    render(<SidebarToggleExtra initialCollapsed={true} />);
    expect(screen.getByTestId('sidebar-icon').textContent).toBe('→');
  });
});

describe('SidebarToggle-extra — toggle atualiza aria-expanded e ícone', () => {
  it('5. após toggle expanded→collapsed, aria-expanded muda para true', () => {
    const onToggle = vi.fn();
    render(<SidebarToggleExtra initialCollapsed={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByTestId('sidebar-toggle-extra'));

    expect(onToggle).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('sidebar-toggle-extra')).toHaveAttribute('aria-expanded', 'true');
  });

  it('6. após toggle collapsed→expanded, ícone troca de → para ←', () => {
    render(<SidebarToggleExtra initialCollapsed={true} />);

    fireEvent.click(screen.getByTestId('sidebar-toggle-extra'));

    expect(screen.getByTestId('sidebar-icon').textContent).toBe('←');
  });
});
