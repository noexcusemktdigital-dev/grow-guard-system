import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock AuthContext
const mockAuthValue = {
  user: null as any,
  session: null,
  profile: null,
  role: null as any,
  loading: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthValue,
}));

import { ProtectedRoute } from "../ProtectedRoute";

function renderRoute(path: string, allowedRoles?: any[]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/acessofranquia" element={<div>Login Page</div>} />
        <Route path="/franqueadora/dashboard" element={<div>Franqueadora Dashboard</div>} />
        <Route path="/franqueado/dashboard" element={<div>Franqueado Dashboard</div>} />
        <Route path="/cliente/inicio" element={<div>Cliente Inicio</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockAuthValue.user = null;
    mockAuthValue.role = null;
    mockAuthValue.loading = false;
  });

  it("shows loader when loading", () => {
    mockAuthValue.loading = true;
    renderRoute("/test");
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("redirects to login when no user", () => {
    renderRoute("/test");
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders children when user has allowed role", () => {
    mockAuthValue.user = { id: "u1" };
    mockAuthValue.role = "admin";
    renderRoute("/test", ["admin", "super_admin"]);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects admin to franqueadora dashboard when role not allowed", () => {
    mockAuthValue.user = { id: "u1" };
    mockAuthValue.role = "admin";
    renderRoute("/test", ["franqueado"]);
    expect(screen.getByText("Franqueadora Dashboard")).toBeInTheDocument();
  });

  it("redirects franqueado to franqueado dashboard when role not allowed", () => {
    mockAuthValue.user = { id: "u1" };
    mockAuthValue.role = "franqueado";
    renderRoute("/test", ["admin"]);
    expect(screen.getByText("Franqueado Dashboard")).toBeInTheDocument();
  });

  it("redirects cliente to cliente inicio when role not allowed", () => {
    mockAuthValue.user = { id: "u1" };
    mockAuthValue.role = "cliente_admin";
    renderRoute("/test", ["admin"]);
    expect(screen.getByText("Cliente Inicio")).toBeInTheDocument();
  });

  it("renders children when no allowedRoles specified", () => {
    mockAuthValue.user = { id: "u1" };
    mockAuthValue.role = "franqueado";
    renderRoute("/test");
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
