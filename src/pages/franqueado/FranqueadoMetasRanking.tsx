import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Star, Medal, TrendingUp, Lock, Award, Flame, Zap, Crown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ptBR } from "date-fns/locale";

const classificationConfig = {
  elite: { label: "Elite", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: Crown },
  ouro: { label: "Ouro", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Award },
  prata: { label: "Prata", color: "bg-slate-400/15 text-slate-300 border-slate-400/30", icon: Medal },
  bronze: { label: "Bronze", color: "bg-orange-700/15 text-orange-400 border-orange-700/30", icon: Star },
};

interface TrophyItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  unlocked: boolean;
  unlockedAt?: string;
}

const trophies: TrophyItem[] = [
  { id: "first_sale", title: "Primeira Venda", description: "Feche seu primeiro contrato", icon: Star, unlocked: false },
  { id: "streak_3", title: "Hat-trick", description: "3 metas batidas consecutivas", icon: Flame, unlocked: false },
  { id: "top_revenue", title: "Top Faturamento", description: "Alcance R$ 50.000 em um mês", icon: TrendingUp, unlocked: false },
  { id: "speed_close", title: "Fechamento Relâmpago", description: "Feche um contrato em menos de 7 dias", icon: Zap, unlocked: false },
  { id: "elite_status", title: "Status Elite", description: "Alcance a classificação Elite", icon: Crown, unlocked: false },
  { id: "consistency", title: "Consistência", description: "Bata a meta por 6 meses seguidos", icon: Award, unlocked: false },
];

export default function FranqueadoMetasRanking() {
  const currentMonth = format(new Date(), "MMMM yyyy", { locale: ptBR });
  const classification = "prata" as keyof typeof classificationConfig;
  const config = classificationConfig[classification];
  const ClassIcon = config.icon;

  // Mock monthly goals for the unit (would come from parent org via RPC)
  const monthlyGoals = [
    { label: "Faturamento", current: 32000, target: 50000, unit: "R$" },
    { label: "Novos Contratos", current: 4, target: 8, unit: "" },
    { label: "Leads Gerados", current: 22, target: 30, unit: "" },
  ];

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
          <div className="grid gap-4 md:grid-cols-3">
            {monthlyGoals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
              const reached = pct >= 100;
              return (
                <Card key={goal.label} className={`border transition-colors ${reached ? "border-green-500/30 bg-green-500/5" : "border-border"}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                      {goal.label}
                      {reached && <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px]">Atingida ✓</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold">
                        {goal.unit === "R$" ? `R$ ${goal.current.toLocaleString("pt-BR")}` : goal.current}
                      </span>
                      <span className="text-sm text-muted-foreground mb-0.5">
                        / {goal.unit === "R$" ? `R$ ${goal.target.toLocaleString("pt-BR")}` : goal.target}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">{pct}%</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="trofeus" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Desbloqueie troféus ao atingir marcos importantes. Continue evoluindo!
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trophies.map((trophy) => {
              const Icon = trophy.icon;
              return (
                <Card
                  key={trophy.id}
                  className={`border transition-all ${
                    trophy.unlocked
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-border opacity-60"
                  }`}
                >
                  <CardContent className="pt-5 flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        trophy.unlocked
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {trophy.unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{trophy.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{trophy.description}</p>
                      {trophy.unlocked && trophy.unlockedAt && (
                        <p className="text-[10px] text-yellow-400 mt-1">Desbloqueado em {trophy.unlockedAt}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
