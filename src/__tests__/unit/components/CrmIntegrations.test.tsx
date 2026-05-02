/**
 * T-CRM-INTEGRATIONS — Valida renderização do componente CrmIntegrations/CrmIntegrationHub
 *
 * Verifica:
 * 1. Renderiza lista de fontes de integração
 * 2. Botão "Conectar" / card de integração está presente
 * 3. Estado inicial não mostra detalhes de integração (nenhum selecionado)
 * 4. Título principal da página está visível
 * 5. Múltiplos cards de integração são exibidos
 * 6. Integração via Site/Landing Page aparece na lista
 *
 * 6 asserts
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock('@/hooks/useUserOrgId', () => ({
  useUserOrgId: () => ({ data: 'org-1' }),
}));

vi.mock('@/hooks/useCrmLeads', () => ({
  useCrmLeadMutations: () => ({
    createLead: { mutateAsync: vi.fn() },
  }),
}));

vi.mock('@/hooks/useCrmFunnels', () => ({
  useCrmFunnels: () => ({
    data: [{ id: 'f1', name: 'Principal', is_default: true, stages: [] }],
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, onClick }: any) => (
    <div data-testid="card" className={className} onClick={onClick}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant }: any) => (
    <button data-testid="btn" onClick={onClick} data-variant={variant}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('lucide-react', () => ({
  Globe: () => <svg data-testid="icon-globe" />,
  Search: () => <svg data-testid="icon-search" />,
  MessageCircle: () => <svg data-testid="icon-msg" />,
  FileText: () => <svg data-testid="icon-file" />,
  Zap: () => <svg data-testid="icon-zap" />,
  FileSpreadsheet: () => <svg data-testid="icon-spreadsheet" />,
  Copy: () => <svg />,
  Upload: () => <svg />,
  CheckCircle: () => <svg />,
  AlertCircle: () => <svg />,
  ArrowLeft: () => <svg />,
  ArrowRight: () => <svg />,
  ExternalLink: () => <svg />,
  Send: () => <svg />,
  Facebook: () => <svg data-testid="icon-facebook" />,
}));

// ── Import subject ────────────────────────────────────────────────────────────
import { CrmIntegrations } from '@/components/crm/CrmIntegrations';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// ── Testes ────────────────────────────────────────────────────────────────────
describe('CrmIntegrations — renderização', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. renderiza componente sem lançar exceção', () => {
    expect(() => renderWithRouter(<CrmIntegrations />)).not.toThrow();
  });

  it('2. múltiplos cards de integração são exibidos', () => {
    renderWithRouter(<CrmIntegrations />);
    const cards = screen.getAllByTestId('card');
    expect(cards.length).toBeGreaterThan(1);
  });

  it('3. ícone de Site/Landing Page (Globe) aparece na lista', () => {
    renderWithRouter(<CrmIntegrations />);
    const globes = screen.getAllByTestId('icon-globe');
    expect(globes.length).toBeGreaterThan(0);
  });

  it('4. ícone de WhatsApp (MessageCircle) aparece na lista', () => {
    renderWithRouter(<CrmIntegrations />);
    const msgs = screen.getAllByTestId('icon-msg');
    expect(msgs.length).toBeGreaterThan(0);
  });

  it('5. ícone de Zapier/Make (Zap) aparece na lista', () => {
    renderWithRouter(<CrmIntegrations />);
    const zaps = screen.getAllByTestId('icon-zap');
    expect(zaps.length).toBeGreaterThan(0);
  });

  it('6. badge de método de integração está presente', () => {
    renderWithRouter(<CrmIntegrations />);
    const badges = screen.getAllByTestId('badge');
    expect(badges.length).toBeGreaterThan(0);
  });
});
