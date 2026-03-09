import { createContext, useContext, useState, ReactNode } from "react";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { useHasActiveStrategy } from "@/hooks/useMarketingStrategy";
import { useSalesPlanCompleted } from "@/hooks/useSalesPlan";
import { useAuth } from "@/contexts/AuthContext";
import { getEffectiveLimits } from "@/constants/plans";

type GateReason = "trial_expired" | "trial_limited" | "no_credits" | "no_sales_plan" | "no_marketing_strategy" | "admin_only" | "module_locked" | null;

interface FeatureGateContextType {
  isTrialExpired: boolean;
  hasNoCredits: boolean;
  salesPlanCompleted: boolean;
  hasActiveStrategy: boolean;
  hasSalesModule: boolean;
  hasMarketingModule: boolean;
  /** Check if a specific route/feature is gated */
  getGateReason: (feature: string) => GateReason;
  /** For demo: toggle states */
  simulateTrialExpired: boolean;
  setSimulateTrialExpired: (v: boolean) => void;
  simulateNoCredits: boolean;
  setSimulateNoCredits: (v: boolean) => void;
}

const FeatureGateContext = createContext<FeatureGateContextType | null>(null);

// Routes always accessible (never gated)
const ALWAYS_ACCESSIBLE = [
  "/cliente/inicio",
  "/cliente/plano-creditos",
  "/cliente/configuracoes",
  "/cliente/plano-vendas",
  "/cliente/checklist",
  "/cliente/gamificacao",
  "/cliente/plano-marketing",
  "/cliente/avaliacoes",
  "/cliente/integracoes",
];

// Routes that require credits (IA-powered features)
const CREDIT_REQUIRED = [
  "/cliente/agentes-ia",
  "/cliente/conteudos",
  "/cliente/sites",
  "/cliente/disparos",
  "/cliente/redes-sociais",
  "/cliente/trafego-pago",
];

// Routes that require sales plan to be completed
const SALES_PLAN_REQUIRED = [
  "/cliente/crm",
  "/cliente/chat",
  "/cliente/agentes-ia",
  "/cliente/scripts",
  "/cliente/disparos",
  "/cliente/dashboard",
];

// Routes that require marketing strategy to be completed
const MARKETING_STRATEGY_REQUIRED = [
  "/cliente/conteudos",
  "/cliente/redes-sociais",
  "/cliente/sites",
  "/cliente/trafego-pago",
];

// Routes blocked for trial users (upgrade required)
const TRIAL_BLOCKED = [
  "/cliente/sites",
  "/cliente/trafego-pago",
  "/cliente/disparos",
];

// Routes blocked for cliente_user (admin only)
const ADMIN_ONLY_ROUTES = [
  "/cliente/disparos",
  "/cliente/dashboard",
  "/cliente/trafego-pago",
  "/cliente/integracoes",
  "/cliente/plano-creditos",
];

// Routes belonging to Sales module
const SALES_MODULE_ROUTES = [
  "/cliente/crm",
  "/cliente/chat",
  "/cliente/agentes-ia",
  "/cliente/scripts",
  "/cliente/disparos",
  "/cliente/plano-vendas",
  "/cliente/dashboard",
];

// Routes belonging to Marketing module
const MARKETING_MODULE_ROUTES = [
  "/cliente/conteudos",
  "/cliente/redes-sociais",
  "/cliente/sites",
  "/cliente/trafego-pago",
  "/cliente/plano-marketing",
];

export function FeatureGateProvider({ children }: { children: ReactNode }) {
  const [simulateTrialExpired, setSimulateTrialExpired] = useState(false);
  const [simulateNoCredits, setSimulateNoCredits] = useState(false);
  const { role } = useAuth();

  const { data: subscription } = useClienteSubscription();
  const { data: wallet } = useClienteWallet();
  const hasActiveStrategy = useHasActiveStrategy();
  const isTrial = subscription?.status === "trial";

  const salesPlan = (subscription as any)?.sales_plan as string | null;
  const marketingPlan = (subscription as any)?.marketing_plan as string | null;
  const limits = getEffectiveLimits(salesPlan, marketingPlan, isTrial);

  const isTrialExpired =
    simulateTrialExpired ||
    (subscription?.status === "trial" &&
      !!subscription?.expires_at &&
      new Date(subscription.expires_at) < new Date());

  const hasNoCredits =
    simulateNoCredits || (wallet ? wallet.balance <= 0 : false);

  const { completed: salesPlanCompleted } = useSalesPlanCompleted();

  const isClienteUser = role === "cliente_user";

  const getGateReason = (feature: string): GateReason => {
    if (ALWAYS_ACCESSIBLE.some((r) => feature.startsWith(r))) return null;

    // Admin-only check
    if (isClienteUser && ADMIN_ONLY_ROUTES.some((r) => feature.startsWith(r)))
      return "admin_only";

    if (isTrialExpired) return "trial_expired";

    // Trial-limited features
    if (isTrial && TRIAL_BLOCKED.some((r) => feature.startsWith(r)))
      return "trial_limited";

    // Module lock: block Sales tools if no sales module (and not trial)
    if (!isTrial && !limits.hasSalesModule && SALES_MODULE_ROUTES.some((r) => feature.startsWith(r)))
      return "module_locked";

    // Module lock: block Marketing tools if no marketing module (and not trial)
    if (!isTrial && !limits.hasMarketingModule && MARKETING_MODULE_ROUTES.some((r) => feature.startsWith(r)))
      return "module_locked";

    if (!salesPlanCompleted && SALES_PLAN_REQUIRED.some((r) => feature.startsWith(r)))
      return "no_sales_plan";

    if (!hasActiveStrategy && MARKETING_STRATEGY_REQUIRED.some((r) => feature.startsWith(r)))
      return "no_marketing_strategy";

    if (hasNoCredits && CREDIT_REQUIRED.some((r) => feature.startsWith(r)))
      return "no_credits";

    return null;
  };

  return (
    <FeatureGateContext.Provider
      value={{
        isTrialExpired,
        hasNoCredits,
        salesPlanCompleted,
        hasActiveStrategy,
        hasSalesModule: limits.hasSalesModule,
        hasMarketingModule: limits.hasMarketingModule,
        getGateReason,
        simulateTrialExpired,
        setSimulateTrialExpired,
        simulateNoCredits,
        setSimulateNoCredits,
      }}
    >
      {children}
    </FeatureGateContext.Provider>
  );
}

export function useFeatureGate() {
  const ctx = useContext(FeatureGateContext);
  if (!ctx) throw new Error("useFeatureGate must be inside FeatureGateProvider");
  return ctx;
}
