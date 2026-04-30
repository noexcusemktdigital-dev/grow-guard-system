// @ts-nocheck
import { createContext, useContext, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { useHasActiveStrategy } from "@/hooks/useMarketingStrategy";
import { useAuth } from "@/contexts/AuthContext";
import { getEffectiveLimits } from "@/constants/plans";

type GateReason = "trial_expired" | "trial_limited" | "no_credits" | "no_gps_approved" | "admin_only" | "module_locked" | "payment_blocked" | null;

interface FeatureGateContextType {
  isTrialExpired: boolean;
  hasNoCredits: boolean;
  hasApprovedGPS: boolean;
  hasAiAgent: boolean;
  hasWhatsApp: boolean;
  hasDispatches: boolean;
  isPaymentBlocked: boolean;
  getGateReason: (feature: string) => GateReason;
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
  "/cliente/gps-negocio",
  "/cliente/plano-vendas",
  "/cliente/plano-marketing",
  "/cliente/checklist",
  "/cliente/gamificacao",
  "/cliente/avaliacoes",
  "/cliente/integracoes",
];

// Routes that require credits (IA-powered features)
const CREDIT_REQUIRED = [
  "/cliente/agentes-ia",
  "/cliente/conteudos",
  "/cliente/sites",
  "/cliente/disparos",
  "/cliente/postagem",
  "/cliente/redes-sociais",
  "/cliente/trafego-pago",
];

// Routes that require GPS do Negócio to be approved
const GPS_REQUIRED = [
  "/cliente/crm",
  "/cliente/chat",
  "/cliente/agentes-ia",
  "/cliente/scripts",
  "/cliente/disparos",
  "/cliente/dashboard",
  "/cliente/conteudos",
  "/cliente/postagem",
  "/cliente/redes-sociais",
  "/cliente/sites",
  "/cliente/trafego-pago",
];

// Routes blocked for cliente_user (admin only)
const ADMIN_ONLY_ROUTES = [
  "/cliente/disparos",
  "/cliente/dashboard",
  "/cliente/trafego-pago",
  "/cliente/integracoes",
  "/cliente/plano-creditos",
];

export function FeatureGateProvider({ children }: { children: ReactNode }) {
  const [simulateTrialExpired, setSimulateTrialExpired] = useState(false);
  const [simulateNoCredits, setSimulateNoCredits] = useState(false);
  const { role } = useAuth();

  const { data: subscription, isLoading: isLoadingSub } = useClienteSubscription();
  const { data: wallet, isLoading: isLoadingWallet } = useClienteWallet();
  const { hasStrategy: hasApprovedGPS, isLoading: isLoadingStrategy } = useHasActiveStrategy();
  const isTrial = subscription?.status === "trial";

  const planId = subscription?.plan as string | null;
  const limits = getEffectiveLimits(planId, isTrial);

  const isTrialExpired =
    simulateTrialExpired ||
    (subscription?.status === "trial" &&
      !!subscription?.expires_at &&
      new Date(subscription.expires_at) < new Date());

  const hasNoCredits =
    simulateNoCredits || (wallet ? wallet.balance <= 0 : false);

  const isDataLoading = isLoadingSub || isLoadingWallet || isLoadingStrategy;

  const isClienteUser = role === "cliente_user";

  const getGateReason = (feature: string): GateReason => {
    if (ALWAYS_ACCESSIBLE.some((r) => feature.startsWith(r))) return null;

    // Don't gate anything while data is still loading to prevent flash
    if (isDataLoading) return null;

    // Admin-only check
    if (isClienteUser && ADMIN_ONLY_ROUTES.some((r) => feature.startsWith(r)))
      return "admin_only";

    if (isTrialExpired) return "trial_expired";

    if (!hasApprovedGPS && GPS_REQUIRED.some((r) => feature.startsWith(r)))
      return "no_gps_approved";

    if (hasNoCredits && CREDIT_REQUIRED.some((r) => feature.startsWith(r)))
      return "no_credits";

    return null;
  };

  return (
    <FeatureGateContext.Provider
      value={{
        isTrialExpired,
        hasNoCredits,
        hasApprovedGPS,
        hasAiAgent: limits.hasAiAgent,
        hasWhatsApp: limits.hasWhatsApp,
        hasDispatches: limits.hasDispatches,
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

const DEFAULT_GATE: FeatureGateContextType = {
  isTrialExpired: false,
  hasNoCredits: false,
  hasApprovedGPS: false,
  hasAiAgent: false,
  hasWhatsApp: false,
  hasDispatches: false,
  getGateReason: () => null,
  simulateTrialExpired: false,
  setSimulateTrialExpired: () => {},
  simulateNoCredits: false,
  setSimulateNoCredits: () => {},
};

export function useFeatureGate() {
  const ctx = useContext(FeatureGateContext);
  return ctx ?? DEFAULT_GATE;
}
