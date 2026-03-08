import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Star, Medal, TrendingUp, Lock, Award, Flame, Zap, Crown, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useActiveGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useTrophyProgress, type TrophyId } from "@/hooks/useTrophyProgress";

const classificationConfig = {
  elite: { label: "Elite", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: Crown },
  ouro: { label: "Ouro", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Award },
  prata: { label: "Prata", color: "bg-slate-400/15 text-slate-300 border-slate-400/30", icon: Medal },
  bronze: { label: "Bronze", color: "bg-orange-700/15 text-orange-400 border-orange-700/30", icon: Star },
};

interface TrophyItem {
  id: TrophyId;
  title: string;
  description: string;
  icon: React.ElementType;
}

const trophyDefs: TrophyItem[] = [
  { id: "first_sale", title: "Primeira Venda", description: "Feche seu primeiro contrato", icon: Star },
  { id: "hat_trick", title: "Hat-trick", description: "Conquiste seus 3 primeiros clientes", icon: Flame },
  { id: "top_revenue", title: "Top Faturamento", description: "Alcance R$ 20.000 em um mês", icon: TrendingUp },
  { id: "speed_close", title: "Fechamento Relâmpago", description: "Feche um contrato em menos de 7 dias", icon: Zap },
  { id: "first_goal", title: "Primeira Meta Batida", description: "Atinja sua primeira meta mensal", icon: Target },
  { id: "ten_clients", title: "10 Clientes Ativos", description: "Alcance 10 clientes ativos na carteira", icon: Users },
];

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FranqueadoMetasRanking() {
  const currentMonth = format(new Date(), "MMMM yyyy", { locale: ptBR });
  const classification = "prata" as keyof typeof classificationConfig;
  const config = classificationConfig[classification];
  const ClassIcon = config.icon;

  const { data: goals, isLoading: loadingGoals } = useActiveGoals();
  const activeGoals = (goals ?? []).filter((g: any) => g.status === "active");
  const { data: goalProgress, isLoading: loadingProgress } = useGoalProgress(activeGoals.length > 0 ? activeGoals : undefined);
  const { data: trophies, isLoading: loadingTrophies } = useTrophyProgress(goalProgress ?? undefined);

  const isLoading = loadingGoals || loadingProgress;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metas & Ranking"
        subtitle={`Acompanhe suas metas e conquistas — ${currentMonth}`}
      />

      {/* Classification Badge */}
      <Card className="border-sidebar-border bg-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${config.color}`}>
              <ClassIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Classificação da sua unidade</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-sm font-semibold ${config.color}`}>
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">Definida pela Matriz</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metas" className="gap-1.5">
            <Target className="w-4 h-4" />
            Metas do Mês
          </TabsTrigger>
          <TabsTrigger value="trofeus" className="gap-1.5">
            <Trophy className="w-4 h-4" />
            Troféus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metas" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : activeGoals.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Nenhuma meta definida para este período.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {activeGoals.map((goal: any) => {
                const gp = goalProgress?.[goal.id];
                const currentValue = gp?.currentValue ?? 0;
                const pct = gp ? Math.min(100, Math.round(gp.percent)) : 0;
                const reached = pct >= 100;
                const metricLabel = goal.title || goal.type || goal.metric || "Meta";
                const isMonetary = ["revenue", "faturamento", "avg_ticket"].includes(goal.metric || goal.type);

                return (
                  <Card key={goal.id} className={`border transition-colors ${reached ? "border-green-500/30 bg-green-500/5" : "border-border"}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                        {metricLabel}
                        {reached && <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px]">Atingida ✓</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-bold">
                          {isMonetary ? formatBRL(currentValue) : currentValue}
                        </span>
                        <span className="text-sm text-muted-foreground mb-0.5">
                          / {isMonetary ? formatBRL(goal.target_value) : goal.target_value}
                        </span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex justify-between">
                        <p className="text-xs text-muted-foreground">{pct}%</p>
                        {gp && gp.daysLeft > 0 && (
                          <p className="text-xs text-muted-foreground">{gp.daysLeft}d restantes</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trofeus" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Desbloqueie troféus ao atingir marcos importantes. Continue evoluindo!
          </p>
          {loadingTrophies ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trophyDefs.map((trophy) => {
                const Icon = trophy.icon;
                const status = trophies?.[trophy.id];
                const unlocked = status?.unlocked ?? false;
                return (
                  <Card
                    key={trophy.id}
                    className={`border transition-all ${
                      unlocked
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : "border-border opacity-60"
                    }`}
                  >
                    <CardContent className="pt-5 flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          unlocked
                            ? "bg-yellow-500/15 text-yellow-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{trophy.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{trophy.description}</p>
                        {unlocked && status?.unlockedAt && (
                          <p className="text-[10px] text-yellow-400 mt-1">Desbloqueado em {status.unlockedAt}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
