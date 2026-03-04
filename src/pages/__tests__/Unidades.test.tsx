import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/helpers";
import Unidades from "../Unidades";

// Mock hooks
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/hooks/useUnits", () => ({
  useUnits: () => ({ data: [], isLoading: false }),
  useUnitMutations: () => ({
    createUnit: { mutateAsync: vi.fn() },
    updateUnit: { mutateAsync: vi.fn() },
  }),
}));

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => ({ data: "org-test-123" }),
}));

const mockInvoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: any[]) => mockInvoke(...args) },
  },
}));

describe("Unidades — Wizard de Provisionamento", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({ data: { temp_password: "Temp@123" }, error: null });
  });

  it("renderiza lista vazia com botão Nova Unidade", () => {
    renderWithProviders(<Unidades />);
    expect(screen.getByText("Nenhuma unidade cadastrada")).toBeInTheDocument();
    expect(screen.getAllByText(/Nova Unidade/i).length).toBeGreaterThan(0);
  });

  it("abre wizard no passo 1 ao clicar Nova Unidade", async () => {
    renderWithProviders(<Unidades />);
    // Click the button inside the empty state
    const buttons = screen.getAllByText(/Nova Unidade/i);
    await user.click(buttons[0]);
    expect(screen.getByText(/Passo 1 de 3/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Unidade Centro/i)).toBeInTheDocument();
  });

  it("valida nome obrigatório no passo 1", async () => {
    renderWithProviders(<Unidades />);
    await user.click(screen.getAllByText(/Nova Unidade/i)[0]);
    await user.click(screen.getByText("Próximo"));
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Informe o nome da unidade", variant: "destructive" })
    );
  });

  it("avança para passo 2 com nome preenchido", async () => {
    renderWithProviders(<Unidades />);
    await user.click(screen.getAllByText(/Nova Unidade/i)[0]);
    await user.type(screen.getByPlaceholderText(/Unidade Centro/i), "Unidade Teste");
    await user.click(screen.getByText("Próximo"));
    expect(screen.getByText(/Passo 2 de 3/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nome completo")).toBeInTheDocument();
  });

  it("valida nome e email obrigatórios no passo 2", async () => {
    renderWithProviders(<Unidades />);
    await user.click(screen.getAllByText(/Nova Unidade/i)[0]);
    await user.type(screen.getByPlaceholderText(/Unidade Centro/i), "Unidade Teste");
    await user.click(screen.getByText("Próximo"));
    // Now on step 2, click next without filling
    await user.click(screen.getByText("Próximo"));
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Informe nome e email do responsável", variant: "destructive" })
    );
  });

  it("avança para passo 3 com dados do responsável preenchidos", async () => {
    renderWithProviders(<Unidades />);
    await user.click(screen.getAllByText(/Nova Unidade/i)[0]);
    await user.type(screen.getByPlaceholderText(/Unidade Centro/i), "Unidade Teste");
    await user.click(screen.getByText("Próximo"));
    await user.type(screen.getByPlaceholderText("Nome completo"), "João Silva");
    await user.type(screen.getByPlaceholderText("email@exemplo.com"), "joao@teste.com");
    await user.click(screen.getByText("Próximo"));
    expect(screen.getByText(/Passo 3 de 3/)).toBeInTheDocument();
    expect(screen.getByText(/Royalties/i)).toBeInTheDocument();
  });

  it("chama provision-unit ao finalizar", async () => {
    renderWithProviders(<Unidades />);
    await user.click(screen.getAllByText(/Nova Unidade/i)[0]);
    // Step 1
    await user.type(screen.getByPlaceholderText(/Unidade Centro/i), "Unidade Teste");
    await user.click(screen.getByText("Próximo"));
    // Step 2
    await user.type(screen.getByPlaceholderText("Nome completo"), "João Silva");
    await user.type(screen.getByPlaceholderText("email@exemplo.com"), "joao@teste.com");
    await user.click(screen.getByText("Próximo"));
    // Step 3 — click create
    await user.click(screen.getByText("Criar Unidade"));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("provision-unit", {
        body: expect.objectContaining({
          unit_name: "Unidade Teste",
          manager_name: "João Silva",
          manager_email: "joao@teste.com",
          parent_org_id: "org-test-123",
        }),
      });
    });
  });

  it("mostra tela de sucesso com credenciais temporárias", async () => {
    renderWithProviders(<Unidades />);
    await user.click(screen.getAllByText(/Nova Unidade/i)[0]);
    await user.type(screen.getByPlaceholderText(/Unidade Centro/i), "Unidade X");
    await user.click(screen.getByText("Próximo"));
    await user.type(screen.getByPlaceholderText("Nome completo"), "Maria");
    await user.type(screen.getByPlaceholderText("email@exemplo.com"), "maria@x.com");
    await user.click(screen.getByText("Próximo"));
    await user.click(screen.getByText("Criar Unidade"));

    await waitFor(() => {
      expect(screen.getByText("Unidade Criada!")).toBeInTheDocument();
    });
    expect(screen.getByText("Temp@123")).toBeInTheDocument();
    expect(screen.getByText("maria@x.com")).toBeInTheDocument();
  });
});
