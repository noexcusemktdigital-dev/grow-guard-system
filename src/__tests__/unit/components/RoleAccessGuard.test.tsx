/**
 * T8 ROLE-ACCESS-GUARD — Valida proteção de rotas por role
 *
 * Verifica:
 * 1. Role permitido (cliente_admin) → renderiza children
 * 2. Role bloqueado (cliente_user) em rota admin-only → redirect /cliente/inicio
 * 3. Role bloqueado (cliente_user) em rota de disparos → redirect
 * 4. Role cliente_user em rota permitida → renderiza children
 * 5. super_admin → acesso total (renderiza children)
 * 6. Loading auth context → renderiza sem redirect (canAccessRoute retorna true por default)
 * 7. admin em rota bloqueada para user → renderiza (admin tem full access)
 * 8. cliente_user em /cliente/gps-negocio (read_only) → renderiza (não blocked)
 *
 * 8 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ── Mock AuthContext ───────────────────────────────────────────────────────────
const mockAuth = {
  user: null as any,
  role: null as any,
  loading: false,
  session: null,
  profile: null,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

import { RoleAccessGuard } from "@/components/RoleAccessGuard";

// ── Helper de render ──────────────────────────────────────────────────────────
function renderGuard(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <RoleAccessGuard>
              <div data-testid="guarded-content">Conteúdo Guardado</div>
            </RoleAccessGuard>
          }
        />
        <Route path="/cliente/inicio" element={<div data-testid="cliente-inicio">Início Cliente</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T8 ROLE-ACCESS-GUARD — acesso permitido", () => {
  beforeEach(() => {
    mockAuth.loading = false;
  });

  it("cliente_admin → renderiza children (full access)", () => {
    mockAuth.role = "cliente_admin";
    renderGuard("/cliente/disparos");
    expect(screen.getByTestId("guarded-content")).toBeInTheDocument();
  });

  it("super_admin → renderiza children em rota admin-only", () => {
    mockAuth.role = "super_admin";
    renderGuard("/cliente/dashboard");
    expect(screen.getByTestId("guarded-content")).toBeInTheDocument();
  });

  it("admin → renderiza children em rota restrita", () => {
    mockAuth.role = "admin";
    renderGuard("/cliente/trafego-pago");
    expect(screen.getByTestId("guarded-content")).toBeInTheDocument();
  });

  it("cliente_user em rota não restrita → renderiza children", () => {
    mockAuth.role = "cliente_user";
    renderGuard("/cliente/agenda");
    expect(screen.getByTestId("guarded-content")).toBeInTheDocument();
  });

  it("cliente_user em /cliente/gps-negocio (read_only) → renderiza (não blocked)", () => {
    mockAuth.role = "cliente_user";
    renderGuard("/cliente/gps-negocio");
    expect(screen.getByTestId("guarded-content")).toBeInTheDocument();
  });
});

describe("T8 ROLE-ACCESS-GUARD — acesso bloqueado", () => {
  beforeEach(() => {
    mockAuth.loading = false;
  });

  it("cliente_user em /cliente/disparos → redirect para /cliente/inicio", () => {
    mockAuth.role = "cliente_user";
    renderGuard("/cliente/disparos");
    expect(screen.getByTestId("cliente-inicio")).toBeInTheDocument();
  });

  it("cliente_user em /cliente/dashboard → redirect para /cliente/inicio", () => {
    mockAuth.role = "cliente_user";
    renderGuard("/cliente/dashboard");
    expect(screen.getByTestId("cliente-inicio")).toBeInTheDocument();
  });

  it("cliente_user em /cliente/integracoes → redirect para /cliente/inicio", () => {
    mockAuth.role = "cliente_user";
    renderGuard("/cliente/integracoes");
    expect(screen.getByTestId("cliente-inicio")).toBeInTheDocument();
  });
});
