import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { BrowserRouter } from "react-router-dom";

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockInvoke = vi.fn();
const mockRpc = vi.fn().mockResolvedValue({ data: [] });

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignIn(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      resend: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: () => ({ update: () => ({ eq: vi.fn().mockResolvedValue({}) }) }),
    functions: { invoke: (...args: any[]) => mockInvoke(...args) },
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

vi.mock("@/lib/portalRoleGuard", () => ({
  validatePortalAccess: vi.fn().mockResolvedValue({ allowed: true }),
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
    mockSignIn.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    renderSaas();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@test.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "pass123" } });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ email: "user@test.com", password: "pass123" });
    });
  });

  it("shows error toast on login failure", async () => {
    mockSignIn.mockResolvedValue({ data: { user: null }, error: { message: "Invalid" } });
    renderSaas();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "bad@test.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Credenciais inválidas. Verifique seu email e senha.");
    });
  });

  it("shows email not confirmed error", async () => {
    mockSignIn.mockResolvedValue({ data: { user: null }, error: { message: "Email not confirmed" } });
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

  it("shows existing account state and resends confirmation when signup returns obfuscated existing user", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "u-existing", identities: [] } },
      error: null,
    });

    renderSaas();

    fireEvent.click(screen.getByRole("tab", { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Teste Cliente" } });
    fireEvent.change(screen.getByLabelText("Email", { selector: "#signup-email" }), { target: { value: "existente@test.com" } });
    fireEvent.change(screen.getByLabelText("Senha", { selector: "#signup-password" }), { target: { value: "Senha123!" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(screen.getByLabelText("Nome completo").closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Este email já possui cadastro. Reenviamos a confirmação se a conta ainda não foi ativada.");
    });

    expect(screen.getByText("Este email já está cadastrado")).toBeInTheDocument();
    expect(screen.getByText(/já possui cadastro/i)).toBeInTheDocument();
  });
});
