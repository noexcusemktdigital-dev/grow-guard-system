/**
 * T-ANNOUNCE-POPUP — Valida AnnouncementPopupDialog
 *
 * Verifica:
 * 1. Renderiza com require_confirmation → exibe seção de confirmação obrigatória
 * 2. markViewed.mutate é chamado ao dispensar via botão "Entendi"
 * 3. show_popup=false → não renderiza o dialog (retorna null)
 * 4. Lista vazia de announcements → não renderiza nada
 * 5. Dialog mostra o título do comunicado
 * 6. Botão "Li e concordo" presente quando require_confirmation=true
 *
 * 6 asserts
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── State controlado pelos testes via closures ─────────────────────────────────
let mockAnnouncements: any[] = [];
const markViewedMutate = vi.fn();
const confirmReadMutate = vi.fn();

// ── Mocks (factory-style, usam closure sobre variáveis acima) ──────────────────

vi.mock('@/hooks/useAnnouncements', () => ({
  useAnnouncements: () => ({ data: mockAnnouncements }),
}));

vi.mock('@/hooks/useAnnouncementViews', () => ({
  useAnnouncementViews: () => ({ data: [] }),
  useAnnouncementViewMutations: () => ({
    markViewed: { mutate: markViewedMutate, isPending: false },
    confirmRead: { mutate: confirmReadMutate, isPending: false },
  }),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <svg data-testid="alert-triangle" />,
  CheckCircle2: () => <svg data-testid="check-circle" />,
  Download: () => <svg data-testid="download-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right" />,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { AnnouncementPopupDialog } from '@/components/AnnouncementPopupDialog';

// ── Factory helper ─────────────────────────────────────────────────────────────
function makeAnnouncement(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ann-1',
    title: 'Comunicado de Teste',
    content: 'Conteúdo do comunicado.',
    priority: 'Normal',
    status: 'active',
    published_at: '2026-01-01T00:00:00.000Z',
    show_popup: true,
    require_confirmation: false,
    ...overrides,
  };
}

// ── Testes ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AnnouncementPopupDialog — require_confirmation', () => {
  it('exibe seção de confirmação obrigatória quando require_confirmation=true', () => {
    mockAnnouncements = [makeAnnouncement({ require_confirmation: true })];
    render(<AnnouncementPopupDialog />);
    expect(screen.getByText(/Confirmação obrigatória/i)).toBeInTheDocument();
  });

  it('exibe botão "Li e concordo" quando require_confirmation=true', () => {
    mockAnnouncements = [makeAnnouncement({ require_confirmation: true })];
    render(<AnnouncementPopupDialog />);
    expect(screen.getByText(/Li e concordo/i)).toBeInTheDocument();
  });
});

describe('AnnouncementPopupDialog — markViewed', () => {
  it('markViewed.mutate é chamado ao clicar "Entendi"', () => {
    markViewedMutate.mockClear();
    mockAnnouncements = [makeAnnouncement({ require_confirmation: false })];
    render(<AnnouncementPopupDialog />);
    const btn = screen.getByText('Entendi');
    fireEvent.click(btn);
    expect(markViewedMutate).toHaveBeenCalledWith('ann-1');
  });
});

describe('AnnouncementPopupDialog — show_popup=false', () => {
  it('não renderiza o dialog quando show_popup=false', () => {
    mockAnnouncements = [makeAnnouncement({ show_popup: false })];
    render(<AnnouncementPopupDialog />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('não renderiza nada quando lista de announcements está vazia', () => {
    mockAnnouncements = [];
    const { container } = render(<AnnouncementPopupDialog />);
    expect(container.firstChild).toBeNull();
  });
});

describe('AnnouncementPopupDialog — título do comunicado', () => {
  it('exibe o título do comunicado no dialog', () => {
    mockAnnouncements = [makeAnnouncement({ title: 'Aviso Urgente da Rede' })];
    render(<AnnouncementPopupDialog />);
    expect(screen.getByText('Aviso Urgente da Rede')).toBeInTheDocument();
  });
});
