import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockInvoke = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignIn(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      resend: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    },
    from: () => ({ update: () => ({ eq: vi.fn().mockResolvedValue({}) }) }),
    functions: { invoke: (...args: any[]) => mockInvoke(...args) },
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) } },
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
  },
}));

vi.mock("@/assets/NOE3.png", () => ({ default: "logo.png" }));
vi.mock("@/components/SaasBrandingPanel", () => ({ default: () => <div data-testid="branding" /> }));

import SaasAuth from "../SaasAuth";

function renderSaas() {
  return render(
    <BrowserRouter>
      <SaasAuth />
    </BrowserRouter>
  );
}

describe("SaasAuth (Cliente SaaS)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders login tab by default with email and password", () => {
    renderSaas();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
  });

  it("renders both tab triggers", () => {
    renderSaas();
    expect(screen.getByRole("tab", { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /criar conta/i })).toBeInTheDocument();
  });

  it("shows 7 dias grátis badge", () => {
    renderSaas();
    expect(screen.getByText("7 dias grátis")).toBeInTheDocument();
  });

  it("login calls signInWithPassword", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    renderSaas();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@test.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "pass123" } });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ email: "user@test.com", password: "pass123" });
    });
  });

  it("shows error toast on login failure", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Invalid" } });
    renderSaas();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "bad@test.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Credenciais inválidas. Verifique seu email e senha.");
    });
  });

  it("shows email not confirmed error", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Email not confirmed" } });
    renderSaas();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "unverified@test.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "pass123" } });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Confirme seu email antes de entrar. Verifique sua caixa de entrada.");
    });
  });

  it("switches to forgot password mode", () => {
    renderSaas();
    fireEvent.click(screen.getByText("Esqueci minha senha"));
    expect(screen.getByText("Recuperar senha")).toBeInTheDocument();
  });
});
