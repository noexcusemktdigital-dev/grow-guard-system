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
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Usuários Ativos", value: totalUsers, icon: Users, color: "text-blue-600" },
          { label: "Conclusão Média", value: `${avgCompletion}%`, icon: TrendingUp, color: "text-emerald-600" },
          { label: "Nota Média", value: "76%", icon: Trophy, color: "text-orange-600" },
          { label: "Certificados", value: totalCerts, icon: Award, color: "text-yellow-600" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Franchise table */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Progresso por Franquia</h3>
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
                <TableRow key={f.franchiseId}>
                  <TableCell className="font-medium">{f.franchiseName}</TableCell>
                  <TableCell>{f.usersCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={f.avgCompletion} className="h-1.5 w-20" />
                      <span className="text-xs">{f.avgCompletion}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{f.quizzesPassed}</TableCell>
                  <TableCell>{f.certificates}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Alertas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-4 border-l-4 border-l-orange-500 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">3 usuários inativos há mais de 7 dias</p>
              <p className="text-xs text-muted-foreground">Franquia Rio de Janeiro</p>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-destructive flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
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
