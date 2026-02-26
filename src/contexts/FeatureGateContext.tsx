import { createContext, useContext, useState, ReactNode } from "react";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { useHasActiveStrategy } from "@/hooks/useMarketingStrategy";

type GateReason = "trial_expired" | "no_credits" | "no_sales_plan" | "no_marketing_strategy" | null;

interface FeatureGateContextType {
  isTrialExpired: boolean;
  hasNoCredits: boolean;
  salesPlanCompleted: boolean;
  hasActiveStrategy: boolean;
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

export function FeatureGateProvider({ children }: { children: ReactNode }) {
  const [simulateTrialExpired, setSimulateTrialExpired] = useState(false);
  const [simulateNoCredits, setSimulateNoCredits] = useState(false);

  const { data: subscription } = useClienteSubscription();
  const { data: wallet } = useClienteWallet();
  const hasActiveStrategy = useHasActiveStrategy();

  const isTrialExpired =
    simulateTrialExpired ||
    (subscription?.status === "trial" &&
      !!subscription?.expires_at &&
      new Date(subscription.expires_at) < new Date());

  const hasNoCredits =
    simulateNoCredits || (wallet ? wallet.balance <= 0 : false);

  const salesPlanCompleted = (() => {
    try {
      const saved = localStorage.getItem("plano_vendas_data");
      if (!saved) return false;
      return Object.keys(JSON.parse(saved)).length > 5;
    } catch {
      return false;
    }
  })();

  const getGateReason = (feature: string): GateReason => {
    if (ALWAYS_ACCESSIBLE.some((r) => feature.startsWith(r))) return null;

    if (isTrialExpired) return "trial_expired";

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
