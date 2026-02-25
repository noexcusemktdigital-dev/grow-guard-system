import { useClienteWallet } from "./useClienteWallet";
import { useClienteSubscription } from "./useClienteSubscription";
import { getPlanBySlug } from "@/constants/plans";

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

  const plan = getPlanBySlug(subscription?.plan);
  const total = plan?.credits ?? 5000;
  const balance = wallet?.balance ?? 0;
  const percent = total > 0 ? Math.min((balance / total) * 100, 100) : 0;

  let level: CreditAlertLevel = "normal";
  if (balance === 0) level = "zero";
  else if (percent <= 10) level = "critical";
  else if (percent <= 30) level = "warning";

  return { level, percent, balance, total, isLoading: wl || sl };
}
