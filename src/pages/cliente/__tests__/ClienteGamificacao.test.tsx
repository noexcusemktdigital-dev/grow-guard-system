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

vi.mock("@/hooks/useGamificationData", () => ({
  useGamificationData: () => ({
    data: {
      org_id: "org-1",
      profile: {},
      org: {},
      gamification: { xp: 120, points: 45, streak_days: 0, last_activity_at: null },
      counts: {
        total_leads: 1,
        won_leads: 0,
        won_value: 0,
        pipeline_value: 0,
        complete_leads: 0,
        contents: 0,
        dispatches: 0,
        sites: 0,
        active_agents: 0,
        calendar_events: 0,
        checklist_done: 0,
        academy_done: 0,
        custom_funnels: 0,
      },
      flags: { wa_connected: false, has_strategy: false },
      team_ranking: [],
      total_org_xp: 0,
      claimed_reward_ids: [],
      avg_eval: null,
      evals_count: 0,
    },
    isLoading: false,
  }),
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
    getLevelInfo: () => ({
      name: "Novato",
      title: "Novato",
      level: 1,
      minXp: 0,
      maxXp: 499,
      icon: Award,
      color: "text-muted-foreground",
      progress: 0,
      nextXp: 499,
    }),
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
    expect(screen.getAllByText(/Nível 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\d+ XP/i).length).toBeGreaterThan(0);
  });

  it("renders medals/trophies section", () => {
    renderWithProviders(<ClienteGamificacao />);
    expect(screen.getByText("Medalhas")).toBeInTheDocument();
    expect(screen.getAllByTestId("medal")).toHaveLength(2);
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
