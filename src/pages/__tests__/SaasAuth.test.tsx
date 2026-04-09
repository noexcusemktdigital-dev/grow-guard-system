import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockInvoke = vi.fn();
const mockRpc = vi.fn().mockResolvedValue({ data: [] });

vi.mock("@/lib/supabase", () => ({
  PORTAL_STORAGE_KEY: "noe-saas-auth",
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
vi.mock("@/components/ui/tabs", () => {
  const { useState } = require("react");
  function StatefulTabs({ children, defaultValue }: any) {
    return <div data-default={defaultValue}>{children}</div>;
  }
  return {
    Tabs: ({ children, defaultValue, onValueChange }: any) => <div>{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children, value, className, ...props }: any) => (
      <button type="button" role="tab" className={className} {...props}>{children}</button>
    ),
    TabsContent: ({ children, value }: any) => <div data-tab={value}>{children}</div>,
  };
});
vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    />
  ),
}));

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
    expect(screen.getAllByLabelText("Email").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("Senha").length).toBeGreaterThanOrEqual(1);
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

    const emailInputs = screen.getAllByLabelText("Email");
    const senhaInputs = screen.getAllByLabelText("Senha");
    fireEvent.change(emailInputs[0], { target: { value: "user@test.com" } });
    fireEvent.change(senhaInputs[0], { target: { value: "pass123" } });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ email: "user@test.com", password: "pass123" });
    });
  });

  it("shows error toast on login failure", async () => {
    mockSignIn.mockResolvedValue({ data: { user: null }, error: { message: "Invalid" } });
    renderSaas();

    const emailInputs = screen.getAllByLabelText("Email");
    const senhaInputs = screen.getAllByLabelText("Senha");
    fireEvent.change(emailInputs[0], { target: { value: "bad@test.com" } });
    fireEvent.change(senhaInputs[0], { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Credenciais inválidas. Verifique seu email e senha.");
    });
  });

  it("shows email not confirmed error", async () => {
    mockSignIn.mockResolvedValue({ data: { user: null }, error: { message: "Email not confirmed" } });
    renderSaas();

    const emailInputs = screen.getAllByLabelText("Email");
    const senhaInputs = screen.getAllByLabelText("Senha");
    fireEvent.change(emailInputs[0], { target: { value: "unverified@test.com" } });
    fireEvent.change(senhaInputs[0], { target: { value: "pass123" } });
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

  it("shows existing account state when signup returns email_exists error", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "email_exists" },
      error: null,
    });

    renderSaas();

    const nomeInput = screen.getByLabelText("Nome completo");
    expect(nomeInput).toBeInTheDocument();

    fireEvent.change(nomeInput, { target: { value: "Teste Cliente" } });
    const emailInputs = screen.getAllByLabelText("Email");
    const senhaInputs = screen.getAllByLabelText("Senha");
    fireEvent.change(emailInputs[emailInputs.length - 1], { target: { value: "existente@test.com" } });
    fireEvent.change(senhaInputs[senhaInputs.length - 1], { target: { value: "Senha123!" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(nomeInput.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Este email já possui cadastro. Reenviamos a confirmação se a conta ainda não foi ativada.");
    });

    expect(screen.getByText("Este email já está cadastrado")).toBeInTheDocument();
    expect(screen.getByText(/já possui cadastro/i)).toBeInTheDocument();
  });
});
