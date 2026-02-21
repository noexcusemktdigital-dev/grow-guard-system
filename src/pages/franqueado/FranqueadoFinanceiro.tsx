import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { Users, DollarSign, ArrowRightLeft, Receipt, Download, FileSpreadsheet } from "lucide-react";
import { getFranqueadoFinanceiro } from "@/data/franqueadoData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const meses = [
  { mes: "Fevereiro 2026", receita: 38500, repasse: 7700, royalties: 385, sistema: 250, status: "aberto" },
  { mes: "Janeiro 2026", receita: 34200, repasse: 6840, royalties: 342, sistema: 250, status: "fechado" },
  { mes: "Dezembro 2025", receita: 41000, repasse: 8200, royalties: 410, sistema: 250, status: "fechado" },
  { mes: "Novembro 2025", receita: 36800, repasse: 7360, royalties: 368, sistema: 250, status: "fechado" },
];

export default function FranqueadoFinanceiro() {
  const fin = getFranqueadoFinanceiro();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Financeiro Unidade" subtitle="Acompanhamento financeiro da sua unidade" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Clientes Ativos" value={String(fin.clientesAtivos)} icon={Users} delay={0} />
        <KpiCard label="Receita do Mês" value={`R$ ${fin.receitaMes.toLocaleString()}`} icon={DollarSign} delay={1} variant="accent" />
        <KpiCard label="Repasse (20%)" value={`R$ ${fin.repasse.toLocaleString()}`} icon={ArrowRightLeft} delay={2} />
        <KpiCard label="Royalties (1%)" value={`R$ ${fin.royalties.toLocaleString()}`} icon={Receipt} delay={3} />
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">DRE Mensal</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead>Receita</TableHead>
              <TableHead>Repasse</TableHead>
              <TableHead>Royalties</TableHead>
              <TableHead>Sistema</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meses.map(m => (
              <TableRow key={m.mes} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{m.mes}</TableCell>
                <TableCell className="font-semibold">R$ {m.receita.toLocaleString()}</TableCell>
                <TableCell className="text-red-400">R$ {m.repasse.toLocaleString()}</TableCell>
                <TableCell>R$ {m.royalties.toLocaleString()}</TableCell>
                <TableCell>R$ {m.sistema.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={m.status === "aberto" ? "secondary" : "outline"}>
                    {m.status === "aberto" ? "Aberto" : "Fechado"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
