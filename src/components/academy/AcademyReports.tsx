import { Users, TrendingUp, Trophy, Award, AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useAcademyReports } from "@/hooks/useAcademyReports";

export function AcademyReports() {
  const { data: reports, isLoading } = useAcademyReports();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const franchiseReports = reports ?? [];
  const totalUsers = franchiseReports.reduce((sum, f) => sum + Number(f.users_count), 0);
  const avgCompletion = franchiseReports.length
    ? Math.round(franchiseReports.reduce((sum, f) => sum + Number(f.avg_completion), 0) / franchiseReports.length)
    : 0;
  const totalCerts = franchiseReports.reduce((sum, f) => sum + Number(f.certificates_count), 0);
  const totalQuizzes = franchiseReports.reduce((sum, f) => sum + Number(f.quizzes_passed), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Usuários Ativos", value: totalUsers, icon: Users, gradient: "from-blue-500/15 to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-500/20" },
          { label: "Conclusão Média", value: `${avgCompletion}%`, icon: TrendingUp, gradient: "from-emerald-500/15 to-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-500/20" },
          { label: "Provas Aprovadas", value: totalQuizzes, icon: Trophy, gradient: "from-orange-500/15 to-orange-500/5", iconColor: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-500/20" },
          { label: "Certificados", value: totalCerts, icon: Award, gradient: "from-yellow-500/15 to-yellow-500/5", iconColor: "text-yellow-600 dark:text-yellow-400", iconBg: "bg-yellow-500/20" },
        ].map((kpi) => (
          <Card key={kpi.label} className={`p-4 bg-gradient-to-br ${kpi.gradient} border-0`}>
            <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center mb-3`}>
              <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <span className="text-xs text-muted-foreground">{kpi.label}</span>
          </Card>
        ))}
      </div>

      {/* Franchise table */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Progresso por Franquia</h3>
        {franchiseReports.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Nenhuma unidade encontrada na rede.
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Franquia</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Conclusão</TableHead>
                    <TableHead>Provas</TableHead>
                    <TableHead>Certificados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {franchiseReports.map((f) => (
                    <TableRow key={f.unit_id} className="hover:bg-accent/30">
                      <TableCell className="font-medium">{f.unit_name}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{f.users_count}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5 min-w-[120px]">
                          <Progress value={Number(f.avg_completion)} className="h-2 flex-1" />
                          <span className="text-xs font-medium w-10 text-right">{f.avg_completion}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{f.quizzes_passed}</TableCell>
                      <TableCell className="font-medium">{f.certificates_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Alerts */}
      {franchiseReports.some(f => Number(f.avg_completion) < 30) && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Alertas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {franchiseReports
              .filter(f => Number(f.avg_completion) < 30)
              .map(f => (
                <Card key={f.unit_id} className="p-4 border-l-4 border-l-orange-500 bg-orange-500/5 flex items-center gap-3 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Conclusão abaixo de 30%</p>
                    <p className="text-xs text-muted-foreground">{f.unit_name} — {f.avg_completion}%</p>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
