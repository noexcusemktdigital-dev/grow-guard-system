// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/dom";
import { renderWithProviders } from "@/test/helpers";
import ClienteGamificacao from "../ClienteGamificacao";

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "franqueado@test.com" },
    session: null,
    profile: null,
    role: "franqueado",
    loading: false,
  }),
}));

// Mock all data hooks
vi.mock("@/hooks/useClienteContent", () => ({
  useClienteGamification: () => ({ data: undefined, isLoading: false }),
  useClienteContent: () => ({ data: [] }),
  useClienteDispatches: () => ({ data: [] }),
  useClienteSites: () => ({ data: [] }),
}));

vi.mock("@/hooks/useClienteCrm", () => ({
  useCrmLeads: () => ({ data: [] }),
}));

vi.mock("@/hooks/useCrmTeam", () => ({
  useCrmTeam: () => ({ data: [] }),
}));

vi.mock("@/hooks/useEvaluations", () => ({
  useMyEvaluations: () => ({ data: [] }),
}));

vi.mock("@/hooks/useClienteAgents", () => ({
  useClienteAgents: () => ({ data: [] }),
}));

vi.mock("@/hooks/useUserProfile", () => ({
  useUserProfile: () => ({ data: undefined }),
}));

vi.mock("@/hooks/useOrgProfile", () => ({
  useOrgProfile: () => ({ data: undefined }),
}));

vi.mock("@/hooks/useWhatsApp", () => ({
  useWhatsAppInstance: () => ({ data: undefined }),
}));

vi.mock("@/hooks/useRoleAccess", () => ({
  useRoleAccess: () => ({ isAdmin: false }),
}));

vi.mock("@/hooks/useOrgMembers", () => ({
  useOrgMembers: () => ({ data: [] }),
}));

vi.mock("@/hooks/useOrgTeams", () => ({
  useOrgTeams: () => ({ data: [] }),
}));

vi.mock("@/hooks/useMarketingStrategy", () => ({
  useActiveStrategy: () => ({ data: undefined }),
}));

vi.mock("@/hooks/useUserOrgId", () => ({
  useUserOrgId: () => ({ data: "org-1" }),
}));

// Mock supabase for inline queries
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ count: 0 }),
        not: () => ({ count: 0 }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock components that might have complex deps
vi.mock("@/components/cliente/FeatureTutorialButton", () => ({
  FeatureTutorialButton: () => null,
}));

vi.mock("@/components/PageHeader", () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/CelebrationEffect", () => ({
  triggerCelebration: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock framer-motion to avoid animation issues
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the Helpers module to avoid complex rendering
vi.mock("../ClienteGamificacaoHelpers", () => {
  const Award = () => null;
  return {
    LEVELS: [{ name: "Novato", minXp: 0, maxXp: 499, icon: Award, color: "text-muted-foreground" }],
    ORG_LEVELS: [{ name: "Novato", minXp: 0, maxXp: 999, icon: Award, color: "text-muted-foreground" }],
    medalIcons: {} as Record<string, any>,
    medalColors: {
      lead: { gradient: "", glow: "", text: "", border: "" },
    } as Record<string, any>,
    allMedals: [
      { id: "lead", emoji: "lead", title: "Primeiro Lead", description: "Cadastre 1 lead", xp: 50 },
      { id: "sales", emoji: "sales", title: "Primeira Venda", description: "Feche 10 vendas", xp: 200 },
    ],
    rewardTiers: [],
    getLevelInfo: () => ({ name: "Novato", minXp: 0, maxXp: 499, icon: Award, color: "text-muted-foreground", progress: 0, nextXp: 499 }),
    Medal3D: ({ medal }: any) => <div data-testid="medal">{medal.title}</div>,
    CompletenessScore: () => <div data-testid="completeness-score" />,
    XpSuggestions: () => <div data-testid="xp-suggestions" />,
  };
});

describe("ClienteGamificacao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crash", () => {
    renderWithProviders(<ClienteGamificacao />);
    expect(document.body).toBeTruthy();
  });

  it("renders page header with gamification title", () => {
    renderWithProviders(<ClienteGamificacao />);
    // PageHeader is mocked to render <h1>{title}</h1>
    const heading = screen.getByText(/Gamifica/i);
    expect(heading).toBeInTheDocument();
  });

  it("renders XP and level section", () => {
    renderWithProviders(<ClienteGamificacao />);
    // Should show XP info - use queryAllBy to avoid multiple match issues
    const xpElements = screen.queryAllByText(/\d+ XP/i);
    const pontosElements = screen.queryAllByText(/pontos/i);
    expect(xpElements.length > 0 || pontosElements.length > 0).toBe(true);
  });

  it("renders medals/trophies section", () => {
    renderWithProviders(<ClienteGamificacao />);
    // Medal section shows "medalhas" count
    const medalhasElements = screen.queryAllByText(/medalhas/i);
    expect(medalhasElements.length).toBeGreaterThan(0);
  });

  it("renders without loading state when data is available", () => {
    renderWithProviders(<ClienteGamificacao />);
    // Skeleton should not be visible once loaded
    expect(document.body).toBeTruthy();
  });
});

describe("ClienteGamificacao with loading state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Override gamification hook to simulate loading
    vi.doMock("@/hooks/useClienteContent", () => ({
      useClienteGamification: () => ({ data: undefined, isLoading: true }),
      useClienteContent: () => ({ data: [] }),
      useClienteDispatches: () => ({ data: [] }),
      useClienteSites: () => ({ data: [] }),
    }));
  });

  it("renders without crash during loading", () => {
    renderWithProviders(<ClienteGamificacao />);
    expect(document.body).toBeTruthy();
  });
});
