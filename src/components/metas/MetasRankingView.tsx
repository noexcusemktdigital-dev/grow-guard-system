import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Trophy } from "lucide-react";
import {
  getRankingForMonth, levelThresholds, formatBRL, calculateTotalPoints, getFranchiseLevel,
  type FranchiseScore,
} from "@/data/metasRankingData";

export default function MetasRankingView() {
  const [month] = useState("2026-02");
  const ranking = getRankingForMonth(month);
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeights = ["h-32", "h-44", "h-28"];
  const podiumColors = [
    "from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700",
    "from-amber-300 to-amber-500 dark:from-amber-500 dark:to-amber-700",
    "from-orange-300 to-orange-500 dark:from-orange-600 dark:to-orange-800",
  ];
  const medalEmoji = ["🥈", "🥇", "🥉"];
  const podiumPositions = [2, 1, 3];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Podium */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Ranking do Mês — Fevereiro 2026
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-center gap-4 pt-8 pb-4">
            {podiumOrder.map((f, i) => {
              if (!f) return null;
              const totalPts = calculateTotalPoints(f.franchiseId);
              const { threshold } = getFranchiseLevel(totalPts);
              const LvlIcon = threshold.icon;
              return (
                <div key={f.franchiseId} className="flex flex-col items-center" style={{ animationDelay: `${i * 150}ms` }}>
                  <span className="text-3xl mb-2">{medalEmoji[i]}</span>
                  <div className="text-center mb-2">
                    <p className="font-bold text-sm">{f.franchiseName.replace("Franquia ", "")}</p>
                    <p className="text-xl font-black">{f.points} pts</p>
                    <div className="flex items-center gap-1 justify-center mt-1">
                      <LvlIcon className={`w-3.5 h-3.5 ${threshold.color}`} />
                      <span className="text-xs text-muted-foreground">{f.level}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatBRL(f.revenue)}</p>
                  </div>
                  <div className={`w-24 ${podiumHeights[i]} rounded-t-xl bg-gradient-to-t ${podiumColors[i]} flex items-center justify-center`}>
                    <span className="text-3xl font-black text-white/80">{podiumPositions[i]}º</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Full ranking table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ranking Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ranking.map((f, i) => {
                const totalPts = calculateTotalPoints(f.franchiseId);
                const { threshold } = getFranchiseLevel(totalPts);
                const LvlIcon = threshold.icon;
                return (
                  <div key={f.franchiseId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i < 3 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{f.franchiseName}</p>
                        <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                          <LvlIcon className={`w-3 h-3 ${threshold.color}`} />
                          {f.level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{formatBRL(f.revenue)}</span>
                        <div className="flex-1 max-w-[120px]">
                          <Progress value={Math.min(f.goalPercent, 100)} className="h-1.5" />
                        </div>
                        <span className="text-xs font-medium">{f.goalPercent.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{f.points} pts</p>
                      <p className={`text-xs flex items-center gap-0.5 justify-end ${f.growthPercent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {f.growthPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(f.growthPercent).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Levels sidebar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Níveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {levelThresholds.map((lvl) => {
              const Icon = lvl.icon;
              const franchisesAtLevel = ranking.filter(r => r.level === lvl.level);
              return (
                <div key={lvl.level} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${lvl.gradient}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{lvl.level}</p>
                    <p className="text-xs text-muted-foreground">{lvl.minPoints}+ pts</p>
                  </div>
                  {franchisesAtLevel.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">{franchisesAtLevel.length}</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
