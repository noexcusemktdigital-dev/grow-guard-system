import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, PlayCircle, BookOpen, Award, Inbox, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAcademyModules, useAcademyLessons } from "@/hooks/useAcademy";

export default function FranqueadoAcademy() {
  const { data: modules, isLoading } = useAcademyModules();
  const { data: lessons } = useAcademyLessons();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <div className="grid grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      </div>
    );
  }

  const published = (modules ?? []).filter(m => m.is_published);
  const totalLessons = (lessons ?? []).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Academy e Treinamentos" subtitle="Trilhas de aprendizado e certificações da rede" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Módulos Disponíveis" value={String(published.length)} icon={BookOpen} delay={0} />
        <KpiCard label="Total de Aulas" value={String(totalLessons)} icon={PlayCircle} delay={1} />
        <KpiCard label="Progresso Geral" value="0%" icon={GraduationCap} delay={2} variant="accent" />
        <KpiCard label="Certificados" value="0" icon={Award} delay={3} />
      </div>

      {published.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhum módulo disponível</p>
          <p className="text-xs text-muted-foreground mt-1">Quando a franqueadora publicar módulos, eles aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {published.map(mod => (
            <Card key={mod.id} className="glass-card hover-lift cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{mod.category || "Geral"}</Badge>
                  <Badge variant="secondary">{mod.difficulty || "Iniciante"}</Badge>
                </div>
                <h3 className="text-sm font-bold">{mod.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
                <Progress value={0} className="h-2 mt-3 mb-2" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">0% concluído</span>
                  <Button variant="ghost" size="sm" className="text-xs group-hover:text-primary transition-colors">
                    Iniciar <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
