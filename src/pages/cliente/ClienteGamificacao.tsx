import { Trophy, Medal, Star, Target, Coins, Timer, Smartphone, BarChart3, Award, TrendingUp, Users, Zap } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useClienteGamification } from "@/hooks/useClienteContent";
import { useCrmLeads } from "@/hooks/useClienteCrm";
import { useAuth } from "@/contexts/AuthContext";

const medalIcons: Record<string, React.ElementType> = {
  lead: Target, sales: Coins, streak: Timer, social: Smartphone, crm: BarChart3, closer: Trophy,
};

const defaultMedals = [
  { id: "1", name: "Primeiro Lead", emoji: "lead", description: "Captou o primeiro lead", unlocked: false },
  { id: "2", name: "Vendedor Nato", emoji: "sales", description: "10 vendas fechadas", unlocked: false },
  { id: "3", name: "Maratonista", emoji: "streak", description: "30 dias seguidos de checklist completo", unlocked: false },
  { id: "4", name: "Influencer", emoji: "social", description: "50 posts publicados", unlocked: false },
  { id: "5", name: "Mestre do CRM", emoji: "crm", description: "100 leads gerenciados", unlocked: false },
  { id: "6", name: "Top Closer", emoji: "closer", description: "R$ 100k em vendas", unlocked: false },
];

export default function ClienteGamificacao() {
  const { user } = useAuth();
  const { data: gamification, isLoading } = useClienteGamification();
  const { data: leads } = useCrmLeads();

  // Compute stats from real CRM data
  const myLeads = leads?.filter(l => l.assigned_to === user?.id) ?? [];
  const totalLeads = myLeads.length;
  const wonLeads = myLeads.filter(l => !!l.won_at).length;
  const lostLeads = myLeads.filter(l => !!l.lost_at).length;
  const pipelineValue = myLeads.filter(l => !l.won_at && !l.lost_at).reduce((acc, l) => acc + Number(l.value || 0), 0);
  const wonValue = myLeads.filter(l => !!l.won_at).reduce((acc, l) => acc + Number(l.value || 0), 0);

  // Compute points from real data
  const crmPoints = (totalLeads * 10) + (wonLeads * 50);
  const dbPoints = gamification?.points ?? 0;
  const points = Math.max(crmPoints, dbPoints);
  const level = gamification?.level ?? Math.max(1, Math.floor(points / 500) + 1);
  const streakDays = gamification?.streak_days ?? 0;
  const badges = (gamification?.badges as typeof defaultMedals) ?? defaultMedals;

  // Auto-unlock badges based on real data
  const medals = (badges.length > 0 ? badges : defaultMedals).map(m => {
    if (m.emoji === "lead" && totalLeads >= 1) return { ...m, unlocked: true };
    if (m.emoji === "sales" && wonLeads >= 10) return { ...m, unlocked: true };
    if (m.emoji === "streak" && streakDays >= 30) return { ...m, unlocked: true };
    if (m.emoji === "crm" && totalLeads >= 100) return { ...m, unlocked: true };
    if (m.emoji === "closer" && wonValue >= 100000) return { ...m, unlocked: true };
    return m;
  });

  const nextLevel = (level + 1) * 500;
  const progressToNext = Math.min(Math.round((points / nextLevel) * 100), 100);
  const unlockedCount = medals.filter(m => m.unlocked).length;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader title="Gamificação" subtitle="Seus pontos, medalhas e ranking" icon={<Trophy className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader title="Gamificação" subtitle="Seus pontos, medalhas e ranking" icon={<Trophy className="w-5 h-5 text-primary" />} />

      {/* Points & Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="py-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pontuação Total</p>
            <p className="text-5xl font-black text-primary">{points.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">pontos acumulados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Nível {level}</p>
                <p className="text-lg font-bold">Nível {level}</p>
              </div>
              <Star className="w-8 h-8 text-primary/40" />
            </div>
            <Progress value={progressToNext} className="h-3 mb-2" />
            <p className="text-xs text-muted-foreground">{points} / {nextLevel} para o próximo nível</p>
            {streakDays > 0 && (
              <p className="text-xs text-amber-500 mt-2 font-medium">🔥 {streakDays} dias de sequência</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Avaliações - CRM Stats */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Avaliações</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <Target className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{totalLeads}</p>
              <p className="text-[10px] text-muted-foreground">Leads Criados</p>
              <p className="text-[9px] text-primary mt-0.5">+{totalLeads * 10} pts</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <Coins className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{wonLeads}</p>
              <p className="text-[10px] text-muted-foreground">Leads Ganhos</p>
              <p className="text-[9px] text-emerald-500 mt-0.5">+{wonLeads * 50} pts</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">R$ {(wonValue / 1000).toFixed(0)}k</p>
              <p className="text-[10px] text-muted-foreground">Vendas Fechadas</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">R$ {(pipelineValue / 1000).toFixed(0)}k</p>
              <p className="text-[10px] text-muted-foreground">Pipeline Ativo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medals */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Medalhas</CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px]">{unlockedCount}/{medals.length} conquistadas</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {medals.map((m: any) => {
              const MedalIcon = medalIcons[m.emoji] || Award;
              return (
                <div key={m.id} className={`p-4 rounded-xl border text-center transition-all duration-200 ${m.unlocked ? "bg-muted/30 hover:bg-muted/50" : "opacity-30 grayscale"}`}>
                  <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <MedalIcon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs font-semibold mt-1">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground">{m.description}</p>
                  {m.unlocked && <Badge variant="secondary" className="text-[9px] mt-2">Conquistada</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
