/**
 * T-AOR ADMIN-ONLY-ROUTE — Valida proteção de rotas por roles admin/super_admin
 *
 * Verifica:
 * 1. super_admin → renderiza children
 * 2. admin → renderiza children
 * 3. franqueado → redirect /franqueado/inicio
 * 4. cliente_admin → redirect /cliente/inicio
 * 5. loading=true → exibe spinner (não redireciona)
 * 6. sem user (null) → redirect para /acessofranquia
 *
 * 6 asserts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ── Mock AuthContext ───────────────────────────────────────────────────────────
const mockAuth = {
  user: null as any,
  session: null,
  profile: null,
  role: null as any,
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

// Importa ProtectedRoute como substituto de AdminOnlyRoute
// (mesmo componente, passando allowedRoles=["super_admin","admin"])
import { ProtectedRoute } from "@/components/ProtectedRoute";

type AppRole = "super_admin" | "admin" | "franqueado" | "franqueado_master" | "cliente_admin" | "cliente_user";

const ADMIN_ROLES: AppRole[] = ["super_admin", "admin"];

function renderAdminRoute(opts: { role: AppRole | null; loading?: boolean }) {
  mockAuth.role = opts.role;
  mockAuth.user = opts.role ? { id: "u-test" } : null;
  mockAuth.loading = opts.loading ?? false;

  return render(
    <MemoryRouter initialEntries={["/franqueadora/admin-painel"]}>
      <Routes>
        <Route
          path="/franqueadora/admin-painel"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES as any}>
              <div data-testid="admin-children">Painel Admin</div>
            </ProtectedRoute>
          }
        />
        <Route path="/acessofranquia" element={<div data-testid="login-franquia">Login Franquia</div>} />
        <Route path="/franqueadora/inicio" element={<div data-testid="dash-franqueadora">Dashboard Franqueadora</div>} />
        <Route path="/franqueado/inicio" element={<div data-testid="dash-franqueado">Dashboard Franqueado</div>} />
        <Route path="/cliente/inicio" element={<div data-testid="dash-cliente">Dashboard Cliente</div>} />
        <Route path="/" element={<div data-testid="home">Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ADMIN-ONLY-ROUTE — roles com acesso permitido", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("super_admin → renderiza children", () => {
    renderAdminRoute({ role: "super_admin" });
    expect(screen.getByTestId("admin-children")).toBeInTheDocument();
  });

  it("admin → renderiza children", () => {
    renderAdminRoute({ role: "admin" });
    expect(screen.getByTestId("admin-children")).toBeInTheDocument();
  });
});

describe("ADMIN-ONLY-ROUTE — roles sem acesso (redirect)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("franqueado → redireciona para /franqueado/inicio", () => {
    renderAdminRoute({ role: "franqueado" });
    expect(screen.getByTestId("dash-franqueado")).toBeInTheDocument();
  });

  it("cliente_admin → redireciona para /cliente/inicio", () => {
    renderAdminRoute({ role: "cliente_admin" });
    expect(screen.getByTestId("dash-cliente")).toBeInTheDocument();
  });
});

describe("ADMIN-ONLY-ROUTE — estados especiais", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loading=true → exibe spinner (animate-spin presente)", () => {
    mockAuth.loading = true;
    mockAuth.user = null;
    mockAuth.role = null;
    render(
      <MemoryRouter initialEntries={["/franqueadora/admin-painel"]}>
        <Routes>
          <Route
            path="/franqueadora/admin-painel"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES as any}>
                <div data-testid="admin-children">Painel Admin</div>
              </ProtectedRoute>
            }
          />
          <Route path="/acessofranquia" element={<div data-testid="login">Login</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("sem user (null) → redireciona para /acessofranquia", () => {
    renderAdminRoute({ role: null });
    expect(screen.getByTestId("login-franquia")).toBeInTheDocument();
  });
});
