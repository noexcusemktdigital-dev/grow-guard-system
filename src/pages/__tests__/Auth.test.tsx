import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { BrowserRouter } from "react-router-dom";

// Mock supabase (Auth imports from @/lib/supabase)
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockInvoke = vi.fn();

vi.mock("@/lib/supabase", () => ({
  PORTAL_STORAGE_KEY: "noe-franchise-auth",
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignIn(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
    },
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ data: [{ role: "franqueado" }] }),
      }),
    }),
  },
}));

// Mock portalRoleGuard
vi.mock("@/lib/portalRoleGuard", () => ({
  validatePortalAccess: vi.fn().mockResolvedValue({ allowed: true }),
}));

// Mock sonner
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
  },
}));

// Mock image import
vi.mock("@/assets/NOE3.png", () => ({ default: "logo.png" }));

import Auth from "../Auth";

function renderAuth() {
  return render(
    <BrowserRouter>
      <Auth />
    </BrowserRouter>
  );
}

describe("Auth (Franqueadora/Franqueado login)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  });

  it("renders email and password fields", () => {
    renderAuth();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
  });

  it("renders login button", () => {
    renderAuth();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("submits login with credentials", async () => {
    renderAuth();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "admin@test.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ email: "admin@test.com", password: "password123" });
    });
  });

  it("shows error toast on login failure", async () => {
    mockSignIn.mockResolvedValue({ data: { user: null }, error: { message: "Invalid" } });
    renderAuth();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "bad@test.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Credenciais inválidas. Verifique seu email e senha.");
    });
  });

  it("switches to forgot password mode", () => {
    renderAuth();
    fireEvent.click(screen.getByText("Esqueci minha senha"));
    expect(screen.getByText("Recuperar senha")).toBeInTheDocument();
  });

  it("submits forgot password form", async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
    renderAuth();

    fireEvent.click(screen.getByText("Esqueci minha senha"));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar link/i }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("request-password-reset", expect.objectContaining({
        body: { email: "user@test.com", portal: "franchise" },
      }));
    });
  });
});
