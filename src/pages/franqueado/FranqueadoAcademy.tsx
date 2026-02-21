import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, PlayCircle, Award, BookOpen, ChevronRight } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";

const trilhas = [
  { id: "1", nome: "Comercial", modulos: 8, concluidos: 5, icone: "💼" },
  { id: "2", nome: "Estratégia", modulos: 6, concluidos: 2, icone: "🎯" },
  { id: "3", nome: "Institucional", modulos: 4, concluidos: 4, icone: "🏢" },
  { id: "4", nome: "Produtos", modulos: 10, concluidos: 3, icone: "📦" },
];

const certificados = [
  { id: "1", trilha: "Institucional", data: "2026-01-15", codigo: "CERT-2026-001" },
];

export default function FranqueadoAcademy() {
  const totalModulos = trilhas.reduce((s, t) => s + t.modulos, 0);
  const totalConcluidos = trilhas.reduce((s, t) => s + t.concluidos, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Academy & Treinos" subtitle="Trilhas de aprendizado e certificações" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Trilhas" value={String(trilhas.length)} icon={BookOpen} delay={0} />
        <KpiCard label="Módulos Concluídos" value={`${totalConcluidos}/${totalModulos}`} icon={PlayCircle} delay={1} />
        <KpiCard label="Progresso Geral" value={`${Math.round((totalConcluidos / totalModulos) * 100)}%`} icon={GraduationCap} delay={2} variant="accent" />
        <KpiCard label="Certificados" value={String(certificados.length)} icon={Award} delay={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trilhas.map(t => {
          const progresso = (t.concluidos / t.modulos) * 100;
          return (
            <Card key={t.id} className="glass-card hover-lift cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.icone}</span>
                    <div>
                      <h3 className="text-sm font-bold">{t.nome}</h3>
                      <p className="text-xs text-muted-foreground">{t.modulos} módulos</p>
                    </div>
                  </div>
                  {progresso === 100 ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-400/30">Concluída</Badge>
                  ) : (
                    <Badge variant="secondary">{t.concluidos}/{t.modulos}</Badge>
                  )}
                </div>
                <Progress value={progresso} className="h-2 mb-2" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{Math.round(progresso)}% concluído</span>
                  <Button variant="ghost" size="sm" className="text-xs group-hover:text-primary transition-colors">
                    Continuar <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {certificados.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" /> Meus Certificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {certificados.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                  <div>
                    <p className="text-sm font-medium">Trilha {c.trilha}</p>
                    <p className="text-xs text-muted-foreground">Concluído em {c.data} · {c.codigo}</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Certificado</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
