import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/KpiCard";
import { Progress } from "@/components/ui/progress";
import { BookOpen, PlayCircle, Clock, Award, Trophy, Star, Flame, Target, Zap, Medal } from "lucide-react";
import { computeModuleProgress, type DbModule, type DbLesson, type DbProgress, type DbQuizAttempt, type DbCertificate } from "@/hooks/useAcademy";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";

interface TrophyDef {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  unlocked: boolean;
}

interface Props {
  modules: DbModule[];
  lessons: DbLesson[];
  progress: DbProgress[];
  certificates: DbCertificate[];
  quizAttempts: DbQuizAttempt[];
}

export function AcademyEvolution({ modules, lessons, progress, certificates, quizAttempts }: Props) {
  const completedLessons = lessons.filter((l) => progress.some((p) => p.lesson_id === l.id && p.completed_at));
  const completedModules = modules.filter((m) => computeModuleProgress(m.id, lessons, progress) === 100);
  const totalHours = Math.round(completedLessons.reduce((s, l) => s + (l.duration_minutes || 0), 0) / 60);

  // Streak calculation
  const streak = useMemo(() => {
    const completedDates = new Set(
      progress.filter((p) => p.completed_at).map((p) => format(new Date(p.completed_at!), "yyyy-MM-dd"))
    );
    let count = 0;
    let day = startOfDay(new Date());
    while (completedDates.has(format(day, "yyyy-MM-dd"))) {
      count++;
      day = subDays(day, 1);
    }
    return count;
  }, [progress]);

  // Chart data - last 30 days
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      const count = progress.filter((p) => p.completed_at && format(new Date(p.completed_at), "yyyy-MM-dd") === dateStr).length;
      return { date: format(d, "dd/MM"), aulas: count };
    });
  }, [progress]);

  // Trophies
  const trophies: TrophyDef[] = [
    { id: "first", icon: Star, title: "Primeiro Passo", description: "Completou a 1ª aula", unlocked: completedLessons.length >= 1 },
    { id: "dedicated", icon: Flame, title: "Estudante Dedicado", description: "Completou 10 aulas", unlocked: completedLessons.length >= 10 },
    { id: "module", icon: Target, title: "Módulo Completo", description: "Terminou o 1º módulo", unlocked: completedModules.length >= 1 },
    { id: "master", icon: Zap, title: "Mestre", description: "Completou 5 módulos", unlocked: completedModules.length >= 5 },
    { id: "passed", icon: Medal, title: "Aprovado", description: "Passou na 1ª prova", unlocked: quizAttempts.some((a) => a.passed) },
    { id: "perfect", icon: Trophy, title: "Nota Máxima", description: "100% em alguma prova", unlocked: quizAttempts.some((a) => a.score === 100) },
    { id: "cert", icon: Award, title: "Certificado", description: "Obteve o 1º certificado", unlocked: certificates.length >= 1 },
    { id: "collector", icon: Trophy, title: "Colecionador", description: "Obteve 3+ certificados", unlocked: certificates.length >= 3 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Módulos Concluídos" value={`${completedModules.length}/${modules.length}`} icon={BookOpen} delay={0} />
        <KpiCard label="Aulas Concluídas" value={String(completedLessons.length)} icon={PlayCircle} delay={1} />
        <KpiCard label="Horas Estudadas" value={`${totalHours}h`} icon={Clock} delay={2} />
        <KpiCard label="Certificados" value={String(certificates.length)} icon={Award} delay={3} />
        <KpiCard label="Sequência" value={`${streak} dias`} icon={Flame} delay={4} variant="accent" />
      </div>

      {/* Progress chart */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold mb-4">Progresso nos últimos 30 dias</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="aulasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="aulas" stroke="hsl(var(--primary))" fill="url(#aulasGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* In-progress modules */}
      {modules.filter((m) => {
        const p = computeModuleProgress(m.id, lessons, progress);
        return p > 0 && p < 100;
      }).length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-bold">Módulos em andamento</h3>
            {modules
              .filter((m) => { const p = computeModuleProgress(m.id, lessons, progress); return p > 0 && p < 100; })
              .map((m) => {
                const p = computeModuleProgress(m.id, lessons, progress);
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{m.title}</p>
                      <Progress value={p} className="h-1.5 mt-1" />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{p}%</span>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Trophies */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold mb-4">Troféus</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {trophies.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.id}
                  className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all
                    ${t.unlocked ? "bg-primary/5 border-primary/20" : "opacity-40 border-border"}`}
                >
                  <Icon className={`w-8 h-8 mb-2 ${t.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-[11px] font-bold">{t.title}</p>
                  <p className="text-[9px] text-muted-foreground">{t.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
