import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Send, Download, ArrowLeft, Trash2 } from "lucide-react";
import { getFranqueadoPropostas, FranqueadoProposta } from "@/data/franqueadoData";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  rascunho: "text-muted-foreground border-muted-foreground/30",
  enviada: "text-blue-400 border-blue-400/30",
  aceita: "text-green-400 border-green-400/30",
  recusada: "text-red-400 border-red-400/30",
};

export default function FranqueadoPropostas() {
  const [propostas, setPropostas] = useState(() => getFranqueadoPropostas());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = propostas.find(p => p.id === selectedId);

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title={`Proposta ${selected.id}`} subtitle={selected.clienteNome}
          actions={<Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>}
        />
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{selected.clienteNome}</p></div>
              <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold text-primary">R$ {selected.valor.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={statusColors[selected.status]}>{selected.status}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Válida até</p><p className="font-semibold">{selected.validaAte}</p></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Serviços</p>
              <div className="flex flex-wrap gap-2">{selected.servicos.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button size="sm"><Download className="w-4 h-4 mr-1" /> Exportar PDF</Button>
              {selected.status === "rascunho" && <Button size="sm" variant="outline"><Send className="w-4 h-4 mr-1" /> Enviar</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Gerador de Propostas" subtitle="Crie, edite e envie propostas comerciais"
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Proposta</Button>}
      />
      <Card className="glass-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead>Válida até</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {propostas.map(p => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedId(p.id)}>
                <TableCell className="font-medium">{p.id}</TableCell>
                <TableCell>{p.clienteNome}</TableCell>
                <TableCell className="font-semibold">R$ {p.valor.toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[p.status]}>{p.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{p.criadaEm}</TableCell>
                <TableCell className="text-muted-foreground">{p.validaAte}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><FileText className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
