import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock hooks
const mockMutate = vi.fn();
vi.mock("@/hooks/useCrmLeads", () => ({
  useCrmLeadMutations: () => ({
    createLead: { mutate: mockMutate },
  }),
}));

vi.mock("@/hooks/useCrmContacts", () => ({
  useCrmContacts: () => ({ data: [] }),
}));

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

import { CrmNewLeadDialog } from "../CrmNewLeadDialog";

function renderDialog(open = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <CrmNewLeadDialog open={open} onOpenChange={vi.fn()} defaultStage="novo" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe("CrmNewLeadDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders form fields when open", () => {
    renderDialog();
    expect(screen.getByText("Novo Lead")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nome do lead")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("(00) 00000-0000")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("email@exemplo.com")).toBeInTheDocument();
  });

  it("shows error toast when submitting without name", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /criar lead/i }));
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Informe o nome do lead",
      variant: "destructive",
    }));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("calls createLead.mutate with correct data", async () => {
    renderDialog();

    fireEvent.change(screen.getByPlaceholderText("Nome do lead"), { target: { value: "Lead Teste" } });
    fireEvent.change(screen.getByPlaceholderText("(00) 00000-0000"), { target: { value: "11999999999" } });
    fireEvent.change(screen.getByPlaceholderText("email@exemplo.com"), { target: { value: "lead@test.com" } });

    fireEvent.click(screen.getByRole("button", { name: /criar lead/i }));

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
      name: "Lead Teste",
      phone: "11999999999",
      email: "lead@test.com",
      stage: "novo",
    }));
  });

  it("does not render when closed", () => {
    renderDialog(false);
    expect(screen.queryByText("Novo Lead")).not.toBeInTheDocument();
  });
});
