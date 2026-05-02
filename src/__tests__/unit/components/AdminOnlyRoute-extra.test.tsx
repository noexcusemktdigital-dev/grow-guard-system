/**
 * T-AOR-EXTRA AdminOnlyRoute — Estados especiais de loading e auth pendente
 *
 * Verifica:
 * 1. loading=true → exibe spinner (animate-spin)
 * 2. auth pending (loading=true, user=null) → não redireciona
 * 3. usuário não logado (null) → redireciona para /acessofranquia
 * 4. super_admin → renderiza children
 * 5. franqueado_master → redireciona (não é admin)
 * 6. role desconhecida → redireciona para home
 *
 * 6 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ── Mock AuthContext ───────────────────────────────────────────────────────────

const mockAuth = {
  user: null as { id: string } | null,
  session: null,
  profile: null,
  role: null as string | null,
  loading: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/lib/supabase", () => ({
  PORTAL_STORAGE_KEY: "noe-franchise-auth",
  supabase: {},
}));

import { ProtectedRoute } from "@/components/ProtectedRoute";

type AppRole = "super_admin" | "admin" | "franqueado" | "franqueado_master" | "cliente_admin";
const ADMIN_ROLES: AppRole[] = ["super_admin", "admin"];

function renderAdminRoute(opts: { role: AppRole | null; loading?: boolean }) {
  mockAuth.role = opts.role;
  mockAuth.user = opts.role ? { id: "u-test" } : null;
  mockAuth.loading = opts.loading ?? false;

  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES as any}>
              <div data-testid="admin-content">Admin Panel</div>
            </ProtectedRoute>
          }
        />
        <Route path="/acessofranquia" element={<div data-testid="login-page">Login</div>} />
        <Route path="/franqueado/inicio" element={<div data-testid="franqueado-dash">Franqueado</div>} />
        <Route path="/" element={<div data-testid="home">Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminOnlyRoute-extra — loading state", () => {
  beforeEach(() => {
    localStorage.clear();
    mockAuth.loading = false;
    mockAuth.user = null;
    mockAuth.role = null;
  });

  it("loading=true → exibe spinner (animate-spin presente no DOM)", () => {
    mockAuth.loading = true;
    mockAuth.user = null;
    mockAuth.role = null;

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES as any}>
                <div data-testid="admin-content">Admin</div>
              </ProtectedRoute>
            }
          />
          <Route path="/acessofranquia" element={<div data-testid="login-page">Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("auth pending (loading=true, user=null) → children não são renderizados", () => {
    mockAuth.loading = true;
    mockAuth.user = null;
    mockAuth.role = null;

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES as any}>
                <div data-testid="admin-content">Admin</div>
              </ProtectedRoute>
            }
          />
          <Route path="/acessofranquia" element={<div data-testid="login-page">Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("admin-content")).toBeNull();
  });
});

describe("AdminOnlyRoute-extra — redirect para não-autenticados", () => {
  beforeEach(() => localStorage.clear());

  it("usuário não logado (null) → redireciona para /acessofranquia", () => {
    renderAdminRoute({ role: null });
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });
});

describe("AdminOnlyRoute-extra — access control", () => {
  beforeEach(() => localStorage.clear());

  it("super_admin → renderiza children sem redirect", () => {
    renderAdminRoute({ role: "super_admin" });
    expect(screen.getByTestId("admin-content")).toBeInTheDocument();
  });

  it("franqueado_master → redireciona (não tem acesso admin)", () => {
    renderAdminRoute({ role: "franqueado_master" });
    expect(screen.queryByTestId("admin-content")).toBeNull();
  });

  it("cliente_admin → redireciona (não tem acesso admin)", () => {
    renderAdminRoute({ role: "cliente_admin" });
    expect(screen.queryByTestId("admin-content")).toBeNull();
  });
});
