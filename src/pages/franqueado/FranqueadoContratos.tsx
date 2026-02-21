import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/KpiCard";
import { FileSignature, DollarSign, Clock, Download, ArrowLeft } from "lucide-react";
import { getFranqueadoContratos, FranqueadoContrato } from "@/data/franqueadoData";

const statusColors: Record<string, string> = {
  ativo: "bg-green-500/20 text-green-400 border-green-400/30",
  pendente: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  encerrado: "bg-muted text-muted-foreground border-muted-foreground/30",
};

export default function FranqueadoContratos() {
  const [contratos] = useState(() => getFranqueadoContratos());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = contratos.find(c => c.id === selectedId);
  const ativos = contratos.filter(c => c.status === "ativo").length;
  const valorTotal = contratos.filter(c => c.status === "ativo").reduce((s, c) => s + c.valor, 0);

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title={`Contrato ${selected.id}`} subtitle={selected.clienteNome}
          actions={<Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>}
        />
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{selected.clienteNome}</p></div>
              <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold text-primary">R$ {selected.valor.toLocaleString()}/mês</p></div>
              <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-semibold">{selected.tipo}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge className={statusColors[selected.status]}>{selected.status}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Início</p><p className="font-semibold">{selected.inicioEm}</p></div>
              <div><p className="text-xs text-muted-foreground">Término</p><p className="font-semibold">{selected.fimEm}</p></div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button size="sm"><Download className="w-4 h-4 mr-1" /> Download</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Meus Contratos" subtitle="Contratos de clientes da unidade" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Contratos Ativos" value={String(ativos)} icon={FileSignature} delay={0} />
        <KpiCard label="Receita Recorrente" value={`R$ ${valorTotal.toLocaleString()}`} icon={DollarSign} delay={1} variant="accent" />
        <KpiCard label="Pendentes" value={String(contratos.filter(c => c.status === "pendente").length)} icon={Clock} delay={2} />
      </div>

      <Card className="glass-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Término</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contratos.map(c => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedId(c.id)}>
                <TableCell className="font-medium">{c.id}</TableCell>
                <TableCell>{c.clienteNome}</TableCell>
                <TableCell className="font-semibold">R$ {c.valor.toLocaleString()}</TableCell>
                <TableCell>{c.tipo}</TableCell>
                <TableCell><Badge className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{c.inicioEm}</TableCell>
                <TableCell className="text-muted-foreground">{c.fimEm}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
