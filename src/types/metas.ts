// Metas/Ranking types and constants (extracted from metasRankingData.ts)
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

// Mock data (placeholder until fully backed by database)
export const mockGoals: Goal[] = [
  { id: "g1", name: "Faturamento Rede Fev/26", type: "revenue", targetValue: 80000, month: "2026-02", appliesTo: "all", weight: 3, rewardDescription: "Destaque no ranking + bônus" },
  { id: "g2", name: "Novos Contratos Fev/26", type: "contracts", targetValue: 10, month: "2026-02", appliesTo: "all", weight: 2, rewardDescription: "Troféu virtual" },
  { id: "g3", name: "Meta SaaS Fev/26", type: "saas", targetValue: 5, month: "2026-02", appliesTo: "all", weight: 2, rewardDescription: "Desconto royalties 5%" },
  { id: "g4", name: "Venda Franquia Q1/26", type: "franchise", targetValue: 2, month: "2026-02", appliesTo: "all", weight: 5, rewardDescription: "Prêmio R$5.000" },
  { id: "g5", name: "Meta Individual SP Centro", type: "revenue", targetValue: 25000, month: "2026-02", appliesTo: "unit", unitId: "f1", weight: 3, rewardDescription: "Curso gratuito" },
];

export const mockCampaigns: Campaign[] = [
  { id: "camp1", name: "Desafio Fevereiro – Foco Assessoria", periodStart: "2026-02-01", periodEnd: "2026-02-28", goalType: "revenue", targetValue: 50000, rewardDescription: "1º lugar: R$2.000 + destaque na rede.", status: "active" },
  { id: "camp2", name: "Sprint Janeiro – Novos Contratos", periodStart: "2026-01-01", periodEnd: "2026-01-31", goalType: "contracts", targetValue: 8, rewardDescription: "Troféu virtual + menção no comunicado mensal", status: "finished", winnerId: "f1", winnerName: "Franquia São Paulo Centro" },
];

// Franchise data
interface MockFranqueado { id: string; nomeUnidade: string; status: string; }

const allFranchisesList: MockFranqueado[] = [
  { id: "f1", nomeUnidade: "Franquia São Paulo Centro", status: "Ativo" },
  { id: "f2", nomeUnidade: "Franquia Rio de Janeiro", status: "Ativo" },
  { id: "f3", nomeUnidade: "Franquia Curitiba", status: "Ativo" },
  { id: "f4", nomeUnidade: "Franquia Ribeirão Preto", status: "Ativo" },
];

export function getAllFranchises() { return allFranchisesList; }

const franchiseRevenueData: Record<string, Record<string, number>> = {
  "f1": { "2025-09": 18000, "2025-10": 19500, "2025-11": 21000, "2025-12": 22500, "2026-01": 24000, "2026-02": 26800 },
  "f2": { "2025-09": 12000, "2025-10": 13200, "2025-11": 14000, "2025-12": 15800, "2026-01": 16500, "2026-02": 18200 },
  "f3": { "2025-09": 9000, "2025-10": 10500, "2025-11": 11800, "2025-12": 13000, "2026-01": 14200, "2026-02": 15600 },
  "f4": { "2025-09": 7500, "2025-10": 8000, "2025-11": 9200, "2025-12": 10100, "2026-01": 11000, "2026-02": 12400 },
};

const franchiseContractsData: Record<string, Record<string, number>> = {
  "f1": { "2025-09": 2, "2025-10": 3, "2025-11": 2, "2025-12": 4, "2026-01": 3, "2026-02": 5 },
  "f2": { "2025-09": 1, "2025-10": 2, "2025-11": 3, "2025-12": 2, "2026-01": 2, "2026-02": 3 },
  "f3": { "2025-09": 1, "2025-10": 1, "2025-11": 2, "2025-12": 2, "2026-01": 3, "2026-02": 2 },
  "f4": { "2025-09": 0, "2025-10": 1, "2025-11": 1, "2025-12": 1, "2026-01": 2, "2026-02": 2 },
};

function getPrevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? y - 1 : y;
  return `${py}-${String(pm).padStart(2, "0")}`;
}

export function calculateFranchiseRevenue(franchiseId: string, month: string): number {
  return franchiseRevenueData[franchiseId]?.[month] ?? 0;
}

export function calculateFranchiseContracts(franchiseId: string, month: string): number {
  return franchiseContractsData[franchiseId]?.[month] ?? 0;
}

export function calculatePoints(franchiseId: string, month: string): number {
  const revenue = calculateFranchiseRevenue(franchiseId, month);
  const contracts = calculateFranchiseContracts(franchiseId, month);
  let points = 0;
  points += Math.floor(revenue / 1000) * pointsConfig.revenuePerThousand;
  points += contracts * pointsConfig.contractPoints;
  const revenueGoal = mockGoals.find(g => g.type === "revenue" && g.appliesTo === "all" && g.month === month);
  if (revenueGoal) {
    const perUnit = revenueGoal.targetValue / getAllFranchises().length;
    if (revenue >= perUnit) points += pointsConfig.goalBonusPoints;
  }
  return points;
}

export function calculateTotalPoints(franchiseId: string): number {
  const months = ["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"];
  return months.reduce((sum, m) => sum + calculatePoints(franchiseId, m), 0);
}

export function getRankingForMonth(month: string): FranchiseScore[] {
  const allF = getAllFranchises().filter(f => f.status === "Ativo");
  const prevMonth = getPrevMonth(month);
  return allF.map(f => {
    const revenue = calculateFranchiseRevenue(f.id, month);
    const contracts = calculateFranchiseContracts(f.id, month);
    const points = calculatePoints(f.id, month);
    const totalPts = calculateTotalPoints(f.id);
    const { level, progress } = getFranchiseLevel(totalPts);
    const revenueGoal = mockGoals.find(g => g.type === "revenue" && g.month === month && (g.appliesTo === "all" || g.unitId === f.id));
    const perUnitTarget = revenueGoal ? (revenueGoal.appliesTo === "all" ? revenueGoal.targetValue / allF.length : revenueGoal.targetValue) : revenue;
    const goalPercent = perUnitTarget > 0 ? (revenue / perUnitTarget) * 100 : 0;
    const prevRevenue = calculateFranchiseRevenue(f.id, prevMonth);
    const growthPercent = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    return { franchiseId: f.id, franchiseName: f.nomeUnidade, month, revenue, contracts, points, goalPercent, growthPercent, level, levelProgress: progress };
  }).sort((a, b) => b.points - a.points);
}

export function getNetworkTotals(month: string) {
  const ranking = getRankingForMonth(month);
  const totalRevenue = ranking.reduce((s, r) => s + r.revenue, 0);
  const totalContracts = ranking.reduce((s, r) => s + r.contracts, 0);
  const revenueGoal = mockGoals.find(g => g.type === "revenue" && g.appliesTo === "all" && g.month === month);
  const targetRevenue = revenueGoal?.targetValue ?? 80000;
  const goalPercent = targetRevenue > 0 ? (totalRevenue / targetRevenue) * 100 : 0;
  return { totalRevenue, totalContracts, targetRevenue, goalPercent, financialRevenue: 73000, receitaPorProduto: { Assessoria: 42000, SaaS: 18000, Sistema: 8000, Franquia: 5000 } as Record<string, number>, ranking };
}

export function getEvolutionData(franchiseId?: string) {
  const months = [
    { key: "2025-09", label: "Set/25" }, { key: "2025-10", label: "Out/25" },
    { key: "2025-11", label: "Nov/25" }, { key: "2025-12", label: "Dez/25" },
    { key: "2026-01", label: "Jan/26" }, { key: "2026-02", label: "Fev/26" },
  ];
  const allF = getAllFranchises().filter(f => f.status === "Ativo");
  const franchises = franchiseId ? allF.filter(f => f.id === franchiseId) : allF;
  return months.map(m => {
    const entry: Record<string, any> = { mes: m.label };
    franchises.forEach(f => { entry[f.nomeUnidade] = calculateFranchiseRevenue(f.id, m.key); });
    entry.total = franchises.reduce((s, f) => s + calculateFranchiseRevenue(f.id, m.key), 0);
    return entry;
  });
}

export function getRevenueByProduct(_month: string) {
  const products = { Assessoria: 42000, SaaS: 18000, Sistema: 8000, Franquia: 5000 };
  const colors = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(217 91% 60%)", "hsl(280 67% 50%)"];
  return Object.entries(products).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));
}
