// @ts-nocheck
// Metas/Ranking types and constants
import {
  Shield, TrendingUp, Star, Crown, Gem, DollarSign,
  FileText, Building2, Monitor, Target,
} from "lucide-react";

export type GoalType = "revenue" | "contracts" | "franchise" | "saas" | "custom";
export type GoalAppliesTo = "all" | "unit";
export type FranchiseLevel = "Iniciante" | "Crescimento" | "Ouro" | "Elite" | "Platinum";
export type CampaignStatus = "active" | "upcoming" | "finished";

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetValue: number;
  month: string;
  appliesTo: GoalAppliesTo;
  unitId?: string;
  weight: number;
  rewardDescription: string;
}

export interface FranchiseScore {
  franchiseId: string;
  franchiseName: string;
  month: string;
  revenue: number;
  contracts: number;
  points: number;
  goalPercent: number;
  growthPercent: number;
  level: FranchiseLevel;
  levelProgress: number;
}

export interface Campaign {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  goalType: GoalType;
  targetValue: number;
  rewardDescription: string;
  status: CampaignStatus;
  winnerId?: string;
  winnerName?: string;
}

export interface PointsConfig {
  revenuePerThousand: number;
  contractPoints: number;
  franchiseSalePoints: number;
  goalBonusPoints: number;
}

export interface LevelThreshold {
  level: FranchiseLevel;
  minPoints: number;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

// Config
export const pointsConfig: PointsConfig = {
  revenuePerThousand: 10,
  contractPoints: 50,
  franchiseSalePoints: 500,
  goalBonusPoints: 200,
};

export const levelThresholds: LevelThreshold[] = [
  { level: "Iniciante", minPoints: 0, icon: Shield, color: "text-muted-foreground", gradient: "from-gray-400 to-gray-500" },
  { level: "Crescimento", minPoints: 500, icon: TrendingUp, color: "text-blue-500", gradient: "from-blue-400 to-blue-600" },
  { level: "Ouro", minPoints: 1500, icon: Star, color: "text-amber-500", gradient: "from-amber-400 to-amber-600" },
  { level: "Elite", minPoints: 3000, icon: Crown, color: "text-purple-500", gradient: "from-purple-400 to-purple-600" },
  { level: "Platinum", minPoints: 6000, icon: Gem, color: "text-cyan-400", gradient: "from-cyan-300 to-teal-500" },
];

export const goalTypeConfig: Record<GoalType, { label: string; icon: React.ElementType; color: string }> = {
  revenue: { label: "Faturamento", icon: DollarSign, color: "text-emerald-500" },
  contracts: { label: "Contratos", icon: FileText, color: "text-blue-500" },
  franchise: { label: "Franquias", icon: Building2, color: "text-purple-500" },
  saas: { label: "SaaS", icon: Monitor, color: "text-cyan-500" },
  custom: { label: "Personalizada", icon: Target, color: "text-amber-500" },
};

// Helpers
export function getFranchiseLevel(totalPoints: number): { level: FranchiseLevel; threshold: LevelThreshold; progress: number } {
  let current = levelThresholds[0];
  for (const t of levelThresholds) {
    if (totalPoints >= t.minPoints) current = t;
  }
  const idx = levelThresholds.indexOf(current);
  const next = levelThresholds[idx + 1];
  const progress = next
    ? ((totalPoints - current.minPoints) / (next.minPoints - current.minPoints)) * 100
    : 100;
  return { level: current.level, threshold: current, progress: Math.min(progress, 100) };
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
