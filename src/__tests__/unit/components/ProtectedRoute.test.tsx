/**
 * T7 PROTECTED-ROUTE — Valida comportamento de roteamento protegido
 *
 * Verifica:
 * 1. Sem user → redirect para /acessofranquia
 * 2. Com user e role permitido → renderiza children
 * 3. loading=true → exibe skeleton/spinner
 * 4. Role não permitido (admin → rota franqueado) → redirect para franqueadora
 * 5. Role não permitido (franqueado → rota admin) → redirect para franqueado
 * 6. Sem allowedRoles → renderiza sempre que autenticado
 * 7. Path /cliente sem user → redirect para /
 * 8. Rota com role correto e sem restrição adicional → renderiza children
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

import { ProtectedRoute } from "@/components/ProtectedRoute";

// ── Helper de render ──────────────────────────────────────────────────────────
function renderProtected(
  path: string,
  options: { allowedRoles?: string[]; initialEntry?: string } = {}
) {
  const entry = options.initialEntry ?? path;
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path={path}
          element={
            <ProtectedRoute allowedRoles={options.allowedRoles as any}>
              <div data-testid="children">Conteúdo Protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<div data-testid="login-cliente">Login Cliente</div>} />
        <Route path="/acessofranquia" element={<div data-testid="login-page">Login Franquia</div>} />
        <Route path="/franqueadora/inicio" element={<div data-testid="dash-franqueadora">Dashboard Franqueadora</div>} />
        <Route path="/franqueado/inicio" element={<div data-testid="dash-franqueado">Dashboard Franqueado</div>} />
        <Route path="/cliente/inicio" element={<div data-testid="dash-cliente">Dashboard Cliente</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T7 PROTECTED-ROUTE — sem usuário autenticado", () => {
  beforeEach(() => {
    mockAuth.user = null;
    mockAuth.role = null;
    mockAuth.loading = false;
    localStorage.clear();
  });

  it("sem user em rota /franqueadora → redirect para /acessofranquia", () => {
    renderProtected("/franqueadora/inicio");
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("sem user em rota /cliente → redirect para /", () => {
    renderProtected("/cliente/inicio");
    expect(screen.getByTestId("login-cliente")).toBeInTheDocument();
  });
});

describe("T7 PROTECTED-ROUTE — loading state", () => {
  beforeEach(() => {
    mockAuth.user = null;
    mockAuth.role = null;
    localStorage.clear();
  });

  it("loading=true → exibe spinner (animate-spin)", () => {
    mockAuth.loading = true;
    renderProtected("/franqueadora/inicio");
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });
});

describe("T7 PROTECTED-ROUTE — com usuário autenticado", () => {
  beforeEach(() => {
    mockAuth.loading = false;
    localStorage.clear();
  });

  it("user com role permitido → renderiza children", () => {
    mockAuth.user = { id: "u1" };
    mockAuth.role = "admin";
    renderProtected("/franqueadora/inicio", { allowedRoles: ["admin", "super_admin"] });
    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("user sem allowedRoles → renderiza children sempre que autenticado", () => {
    mockAuth.user = { id: "u2" };
    mockAuth.role = "franqueado";
    renderProtected("/franqueadora/inicio");
    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("admin tentando acessar rota exclusiva de franqueado → redirect franqueadora", () => {
    mockAuth.user = { id: "u3" };
    mockAuth.role = "admin";
    // Admin tenta acessar rota só para franqueado: redirect para /franqueadora/inicio
    // Usamos uma rota distinta como ponto de entrada para evitar conflito
    render(
      <MemoryRouter initialEntries={["/restrito"]}>
        <Routes>
          <Route
            path="/restrito"
            element={
              <ProtectedRoute allowedRoles={["franqueado"] as any}>
                <div data-testid="children">Protegido</div>
              </ProtectedRoute>
            }
          />
          <Route path="/franqueadora/inicio" element={<div data-testid="dash-franqueadora">Dashboard Franqueadora</div>} />
          <Route path="/franqueado/inicio" element={<div data-testid="dash-franqueado">Dashboard Franqueado</div>} />
          <Route path="/acessofranquia" element={<div data-testid="login-page">Login</div>} />
          <Route path="/cliente/inicio" element={<div data-testid="dash-cliente">Cliente</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("dash-franqueadora")).toBeInTheDocument();
  });

  it("franqueado tentando acessar rota de admin → redirect franqueado", () => {
    mockAuth.user = { id: "u4" };
    mockAuth.role = "franqueado";
    renderProtected("/franqueadora/inicio", { allowedRoles: ["admin", "super_admin"] });
    expect(screen.getByTestId("dash-franqueado")).toBeInTheDocument();
  });

  it("cliente_admin fora de rota permitida → redirect cliente inicio", () => {
    mockAuth.user = { id: "u5" };
    mockAuth.role = "cliente_admin";
    renderProtected("/franqueadora/inicio", { allowedRoles: ["admin"] });
    expect(screen.getByTestId("dash-cliente")).toBeInTheDocument();
  });
});
