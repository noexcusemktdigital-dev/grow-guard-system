import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, Users, Building2 } from "lucide-react";
import { goalTypeConfig, formatBRL, type Goal, type GoalType } from "@/types/metas";
import { mockGoals, getRankingForMonth, getAllFranchises } from "@/mocks/metasRankingData";

const MONTH = "2026-02";

export default function MetasGoals() {
  const [goals] = useState<Goal[]>(mockGoals);
  const ranking = getRankingForMonth(MONTH);
  const allF = getAllFranchises().filter(f => f.status === "Ativo");

  function getGoalProgress(goal: Goal): { current: number; percent: number } {
    if (goal.type === "revenue") {
      if (goal.appliesTo === "unit" && goal.unitId) {
        const f = ranking.find(r => r.franchiseId === goal.unitId);
        const current = f?.revenue ?? 0;
        return { current, percent: goal.targetValue > 0 ? (current / goal.targetValue) * 100 : 0 };
      }
      const total = ranking.reduce((s, r) => s + r.revenue, 0);
      return { current: total, percent: goal.targetValue > 0 ? (total / goal.targetValue) * 100 : 0 };
    }
    if (goal.type === "contracts") {
      const total = ranking.reduce((s, r) => s + r.contracts, 0);
      return { current: total, percent: goal.targetValue > 0 ? (total / goal.targetValue) * 100 : 0 };
    }
    // For franchise/saas/custom, use mock progress
    const mockProgress = Math.random() * 80 + 10;
    return { current: Math.floor(goal.targetValue * mockProgress / 100), percent: mockProgress };
  }

  function getStatusColor(percent: number) {
    if (percent >= 100) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
    if (percent >= 50) return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    return "bg-red-500/10 text-red-600 border-red-500/30";
  }

  function getStatusLabel(percent: number) {
    if (percent >= 100) return "Batida ✓";
    if (percent >= 50) return "Em andamento";
    return "Abaixo";
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Metas Ativas</h3>
          <p className="text-sm text-muted-foreground">Fevereiro 2026 · {goals.length} metas configuradas</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Nova Meta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Nova Meta</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input placeholder="Ex: Meta Faturamento Março" /></div>
              <div><Label>Tipo</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(goalTypeConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor Alvo</Label><Input type="number" placeholder="80000" /></div>
                <div><Label>Peso (1-5)</Label><Input type="number" placeholder="3" min={1} max={5} /></div>
              </div>
              <div><Label>Aplica a</Label>
                <Select><SelectTrigger><SelectValue placeholder="Toda a rede" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda a rede</SelectItem>
                    {allF.map(f => <SelectItem key={f.id} value={f.id}>{f.nomeUnidade}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Premiação</Label><Textarea placeholder="Descreva a premiação..." /></div>
              <Button className="w-full">Criar Meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {goals.map(goal => {
          const config = goalTypeConfig[goal.type];
          const Icon = config.icon;
          const { current, percent } = getGoalProgress(goal);
          const clamped = Math.min(percent, 100);

          return (
            <Card key={goal.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${percent >= 100 ? "from-emerald-400 to-emerald-600" : percent >= 50 ? "from-amber-400 to-amber-600" : "from-red-400 to-red-600"}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-secondary`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{goal.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{config.label}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          {goal.appliesTo === "all" ? <><Users className="w-3 h-3" /> Toda rede</> : <><Building2 className="w-3 h-3" /> Unidade</>}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${getStatusColor(percent)}`} variant="outline">
                    {getStatusLabel(percent)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-bold">{clamped.toFixed(0)}%</span>
                  </div>
                  <Progress value={clamped} className="h-2.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Atual: {goal.type === "revenue" ? formatBRL(current) : current}</span>
                    <span>Meta: {goal.type === "revenue" ? formatBRL(goal.targetValue) : goal.targetValue}</span>
                  </div>
                </div>

                {goal.rewardDescription && (
                  <div className="mt-3 p-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
                    🏆 {goal.rewardDescription}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                  <span>Peso: {"⭐".repeat(goal.weight)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
