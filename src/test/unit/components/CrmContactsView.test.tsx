import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// ---- Mocks ----

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => ({ data: "org-test" }),
}));

const mockContacts = [
  {
    id: "c1", name: "Alice Silva", email: "alice@test.com", phone: "11999", company: "ACME",
    position: "CEO", tags: ["vip"], source: "web", organization_id: "org-test",
    document: null, address: null, birth_date: null, notes: null, custom_fields: {},
    created_at: "2026-01-01", updated_at: "2026-01-01",
  },
  {
    id: "c2", name: "Bob Costa", email: "bob@test.com", phone: "11888", company: "Omega",
    position: "CTO", tags: [], source: "referral", organization_id: "org-test",
    document: null, address: null, birth_date: null, notes: null, custom_fields: {},
    created_at: "2026-01-02", updated_at: "2026-01-02",
  },
  {
    id: "c3", name: "Carol Dutra", email: "carol@test.com", phone: null, company: null,
    position: null, tags: ["prospect"], source: null, organization_id: "org-test",
    document: null, address: null, birth_date: null, notes: null, custom_fields: {},
    created_at: "2026-01-03", updated_at: "2026-01-03",
  },
];

vi.mock("@/hooks/useCrmContacts", () => ({
  useCrmContacts: () => ({
    // The component does `const allContacts = contacts || []`
    data: mockContacts,
    isLoading: false,
  }),
  useCrmContactMutations: () => ({
    createContact: { mutate: vi.fn(), isPending: false },
    updateContact: { mutate: vi.fn(), isPending: false },
    deleteContact: { mutate: vi.fn(), isPending: false },
    bulkUpdateContacts: { mutate: vi.fn(), isPending: false },
    bulkDeleteContacts: { mutate: vi.fn(), isPending: false },
  }),
}));

vi.mock("@/hooks/useClienteCrm", () => ({
  useCrmLeads: () => ({ data: [] }),
  useCrmLeadMutations: () => ({ createLead: { mutate: vi.fn() } }),
}));

vi.mock("@/hooks/useCrmFunnels", () => ({
  useCrmFunnels: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/crm/CrmCsvImportDialog", () => ({
  CrmCsvImportDialog: () => null,
}));

vi.mock("@/components/crm/CrmContactsViewBulkBar", () => ({
  CrmContactsViewBulkBar: () => null,
}));

vi.mock("@/components/crm/CrmContactsViewFilters", () => ({
  CrmContactsViewFilters: () => null,
}));

// Capture what CrmContactsViewList receives so we can assert on it
let lastListProps: any = null;

vi.mock("@/components/crm/CrmContactsViewList", () => ({
  CrmContactsViewList: (props: any) => {
    lastListProps = props;
    return (
      <div data-testid="contacts-list">
        {(props.paginatedContacts ?? []).map((c: any) => (
          <div key={c.id} data-testid={`contact-${c.id}`}>
            <span>{c.name}</span>
            <input
              type="checkbox"
              data-testid={`check-${c.id}`}
              checked={props.selectedIds?.has(c.id) ?? false}
              onChange={() => props.onToggleOne?.(c.id)}
            />
          </div>
        ))}
        <button data-testid="select-all-btn" onClick={props.onToggleAll}>Select All</button>
      </div>
    );
  },
}));

vi.mock("@/components/crm/CrmContactsViewDialogs", () => ({
  CrmContactsViewDialogs: () => null,
}));

import { CrmContactsView } from "@/components/crm/CrmContactsView";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

function renderView(props = {}) {
  lastListProps = null;
  return render(createElement(CrmContactsView, props), { wrapper: createWrapper() });
}

describe("CrmContactsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastListProps = null;
  });

  it("renders the contacts list container", () => {
    renderView();
    expect(screen.getByTestId("contacts-list")).toBeInTheDocument();
  });

  it("passes all mock contacts down to the list via paginatedContacts", () => {
    renderView();
    expect(screen.getByTestId("contact-c1")).toBeInTheDocument();
    expect(screen.getByTestId("contact-c2")).toBeInTheDocument();
    expect(screen.getByTestId("contact-c3")).toBeInTheDocument();
  });

  it("renders contact names inside the list", () => {
    renderView();
    expect(screen.getByText("Alice Silva")).toBeInTheDocument();
    expect(screen.getByText("Bob Costa")).toBeInTheDocument();
    expect(screen.getByText("Carol Dutra")).toBeInTheDocument();
  });

  it("starts with no contacts selected (all checkboxes unchecked)", () => {
    renderView();
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach(cb => expect(cb).not.toBeChecked());
  });

  it("toggles a single contact selection when its checkbox is clicked", () => {
    renderView();
    const checkbox = screen.getByTestId("check-c1");
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(screen.getByTestId("check-c1")).toBeChecked();
  });

  it("selects all contacts when select-all button is clicked", () => {
    renderView();
    fireEvent.click(screen.getByTestId("select-all-btn"));
    expect(screen.getByTestId("check-c1")).toBeChecked();
    expect(screen.getByTestId("check-c2")).toBeChecked();
    expect(screen.getByTestId("check-c3")).toBeChecked();
  });

  it("passes onToggleAll callback to the list component", () => {
    renderView();
    expect(typeof lastListProps?.onToggleAll).toBe("function");
  });

  it("renders without crashing when optional props are provided", () => {
    renderView({ onBackToPipeline: vi.fn(), onCreateLeadFromContact: vi.fn() });
    expect(screen.getByTestId("contacts-list")).toBeInTheDocument();
  });
});
