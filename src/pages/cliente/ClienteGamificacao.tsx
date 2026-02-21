import { Trophy, Medal, Star, Target, Coins, Timer, Smartphone, BarChart3, Award } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getGamificacaoData } from "@/data/clienteData";

const medalIcons: Record<string, React.ElementType> = {
  lead: Target,
  sales: Coins,
  streak: Timer,
  social: Smartphone,
  crm: BarChart3,
  closer: Trophy,
};

export default function ClienteGamificacao() {
  const data = getGamificacaoData();
  const progressToNext = Math.round((data.points / data.nextLevel) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader title="Gamificação" subtitle="Seus pontos, medalhas e ranking" icon={<Trophy className="w-5 h-5 text-primary" />} />

      {/* Points & Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="py-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pontuação Total</p>
            <p className="text-5xl font-black text-primary">{data.points.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">pontos acumulados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Nível {data.level}</p>
                <p className="text-lg font-bold">{data.levelName}</p>
              </div>
              <Star className="w-8 h-8 text-primary/40" />
            </div>
            <Progress value={progressToNext} className="h-3 mb-2" />
            <p className="text-xs text-muted-foreground">{data.points} / {data.nextLevel} para o próximo nível</p>
          </CardContent>
        </Card>
      </div>

      {/* Medals */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Medal className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Medalhas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.medals.map(m => {
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

      {/* Ranking */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Ranking da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.ranking.map(r => (
              <div key={r.position} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${r.name === "Você" ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/30"}`}>
                <span className={`text-lg font-black w-8 text-center ${r.position <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                  {r.position}º
                </span>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{r.avatar}</div>
                <span className="text-sm font-medium flex-1">{r.name}</span>
                <span className="text-sm font-bold">{r.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
