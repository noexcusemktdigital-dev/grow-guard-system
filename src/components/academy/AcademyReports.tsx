import { Users, TrendingUp, Trophy, Award, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { mockFranchiseReports } from "@/data/academyData";

export function AcademyReports() {
  const totalUsers = mockFranchiseReports.reduce((sum, f) => sum + f.usersCount, 0);
  const avgCompletion = Math.round(mockFranchiseReports.reduce((sum, f) => sum + f.avgCompletion, 0) / mockFranchiseReports.length);
  const totalCerts = mockFranchiseReports.reduce((sum, f) => sum + f.certificates, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI cards — vibrant */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Usuários Ativos", value: totalUsers, icon: Users, gradient: "from-blue-500/15 to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-500/20" },
          { label: "Conclusão Média", value: `${avgCompletion}%`, icon: TrendingUp, gradient: "from-emerald-500/15 to-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-500/20" },
          { label: "Nota Média", value: "76%", icon: Trophy, gradient: "from-orange-500/15 to-orange-500/5", iconColor: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-500/20" },
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

      {/* Franchise table with visual bars */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Progresso por Franquia</h3>
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
                {mockFranchiseReports.map((f) => (
                  <TableRow key={f.franchiseId} className="hover:bg-accent/30">
                    <TableCell className="font-medium">{f.franchiseName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{f.usersCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5 min-w-[120px]">
                        <Progress value={f.avgCompletion} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-10 text-right">{f.avgCompletion}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{f.quizzesPassed}</TableCell>
                    <TableCell className="font-medium">{f.certificates}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Alertas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-500/5 flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium">3 usuários inativos há mais de 7 dias</p>
              <p className="text-xs text-muted-foreground">Franquia Rio de Janeiro</p>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-destructive bg-destructive/5 flex items-center gap-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium">2 reprovações repetidas</p>
              <p className="text-xs text-muted-foreground">Módulo: Técnicas de Venda</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
