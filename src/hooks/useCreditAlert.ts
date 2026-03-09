import { useClienteWallet } from "./useClienteWallet";
import { useClienteSubscription } from "./useClienteSubscription";
import { getEffectiveLimits } from "@/constants/plans";

export type CreditAlertLevel = "normal" | "warning" | "critical" | "zero";

export interface CreditAlertData {
  level: CreditAlertLevel;
  percent: number;
  balance: number;
  total: number;
  isLoading: boolean;
}

export function useCreditAlert(): CreditAlertData {
  const { data: wallet, isLoading: wl } = useClienteWallet();
  const { data: subscription, isLoading: sl } = useClienteSubscription();

  const isTrial = subscription?.status === "trial";

  const planId = (subscription as any)?.plan as string | null;
  const limits = getEffectiveLimits(planId, isTrial);
  const total = limits.totalCredits || 1000;
  const balance = wallet?.balance ?? 0;
  const percent = total > 0 ? Math.min((balance / total) * 100, 100) : 0;

  let level: CreditAlertLevel = "normal";
  if (balance === 0) level = "zero";
  else if (percent <= 10) level = "critical";
  else if (percent <= 30) level = "warning";

  return { level, percent, balance, total, isLoading: wl || sl };
}
