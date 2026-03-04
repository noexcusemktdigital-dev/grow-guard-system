import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OnboardingEtapas } from "../OnboardingEtapas";
import type { ChecklistItem } from "@/types/onboarding";

const mockChecklist: ChecklistItem[] = [
  { id: "1", phase: "Pré-Implantação", descricao: "Definir responsável", concluido: false },
  { id: "2", phase: "Pré-Implantação", descricao: "Alinhar expectativas", concluido: true, data: "2024-01-15" },
  { id: "3", phase: "Estruturação", descricao: "Configurar CRM", concluido: false },
  { id: "4", phase: "Estruturação", descricao: "Importar contatos", concluido: false },
  { id: "5", phase: "Primeiros Movimentos", descricao: "Primeira campanha", concluido: false },
  { id: "6", phase: "Consolidação", descricao: "Revisar métricas", concluido: false },
];

describe("OnboardingEtapas", () => {
  it("renders all 4 phases", () => {
    render(<OnboardingEtapas checklist={mockChecklist} onChange={vi.fn()} />);
    expect(screen.getByText("Pré-Implantação")).toBeInTheDocument();
    expect(screen.getByText("Estruturação")).toBeInTheDocument();
    expect(screen.getByText("Primeiros Movimentos")).toBeInTheDocument();
    expect(screen.getByText("Consolidação")).toBeInTheDocument();
  });

  it("renders checklist items", () => {
    render(<OnboardingEtapas checklist={mockChecklist} onChange={vi.fn()} />);
    expect(screen.getByText("Definir responsável")).toBeInTheDocument();
    expect(screen.getByText("Configurar CRM")).toBeInTheDocument();
  });

  it("shows phase counts", () => {
    render(<OnboardingEtapas checklist={mockChecklist} onChange={vi.fn()} />);
    expect(screen.getByText("1/2")).toBeInTheDocument(); // Pré-Implantação: 1 done / 2 total
    expect(screen.getByText("0/2")).toBeInTheDocument(); // Estruturação: 0/2
  });

  it("calls onChange when checkbox toggled", () => {
    const onChange = vi.fn();
    render(<OnboardingEtapas checklist={mockChecklist} onChange={onChange} />);
    
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // Toggle first unchecked item
    
    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0];
    const toggledItem = updated.find((i: ChecklistItem) => i.id === "1");
    expect(toggledItem.concluido).toBe(true);
    expect(toggledItem.data).toBeDefined();
  });

  it("shows 'Completa' badge when all items in phase are done", () => {
    const allDone: ChecklistItem[] = [
      { id: "1", phase: "Consolidação", descricao: "Item 1", concluido: true, data: "2024-01-01" },
      { id: "2", phase: "Consolidação", descricao: "Item 2", concluido: true, data: "2024-01-02" },
      // Need items for other phases or they won't render
      { id: "3", phase: "Pré-Implantação", descricao: "Item 3", concluido: false },
      { id: "4", phase: "Estruturação", descricao: "Item 4", concluido: false },
      { id: "5", phase: "Primeiros Movimentos", descricao: "Item 5", concluido: false },
    ];
    render(<OnboardingEtapas checklist={allDone} onChange={vi.fn()} />);
    expect(screen.getByText("Completa")).toBeInTheDocument();
  });
});
