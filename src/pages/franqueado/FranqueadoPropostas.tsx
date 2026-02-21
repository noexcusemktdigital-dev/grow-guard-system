import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileText, Send, Download, ArrowLeft, FileCheck2 } from "lucide-react";
import { getFranqueadoPropostas, FranqueadoProposta } from "@/data/franqueadoData";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  rascunho: "text-muted-foreground border-muted-foreground/30",
  enviada: "text-blue-400 border-blue-400/30",
  aceita: "text-green-400 border-green-400/30",
  recusada: "text-red-400 border-red-400/30",
};

export default function FranqueadoPropostas() {
  const navigate = useNavigate();
  const [propostas] = useState(() => getFranqueadoPropostas());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProposta, setDialogProposta] = useState<FranqueadoProposta | null>(null);

  const selected = propostas.find(p => p.id === selectedId);

  function openConvertDialog(proposta: FranqueadoProposta) {
    setDialogProposta(proposta);
    setDialogOpen(true);
  }

  function handleConverterContrato() {
    if (!dialogProposta) return;
    setDialogOpen(false);
    toast.success("Contrato ativado com sucesso!");
    navigate("/franqueado/contratos?novo=CT-novo");
  }

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
              <div><p className="text-xs text-muted-foreground">Valor Base</p><p className="font-semibold text-primary">R$ {selected.valor.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Excedente</p><p className="font-semibold">{selected.valorExcedente ? `R$ ${selected.valorExcedente.toLocaleString()}` : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={statusColors[selected.status]}>{selected.status}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-semibold">{selected.tipo || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Válida até</p><p className="font-semibold">{selected.validaAte}</p></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Serviços</p>
              <div className="flex flex-wrap gap-2">{selected.servicos.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-border flex-wrap">
              <Button size="sm"><Download className="w-4 h-4 mr-1" /> Exportar PDF</Button>
              {selected.status === "rascunho" && <Button size="sm" variant="outline"><Send className="w-4 h-4 mr-1" /> Enviar</Button>}
              {selected.status === "aceita" && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openConvertDialog(selected)}>
                  <FileCheck2 className="w-4 h-4 mr-1" /> Converter em Contrato
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog Converter */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Converter em Contrato</DialogTitle>
              <DialogDescription>Confirme os dados para criar o contrato automaticamente.</DialogDescription>
            </DialogHeader>
            {dialogProposta && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{dialogProposta.clienteNome}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor Base</p><p className="font-semibold">R$ {dialogProposta.valor.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Excedente</p><p className="font-semibold">{dialogProposta.valorExcedente ? `R$ ${dialogProposta.valorExcedente.toLocaleString()}` : "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-semibold">{dialogProposta.tipo || "Recorrente"}</p></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleConverterContrato}>
                <FileCheck2 className="w-4 h-4 mr-1" /> Criar Contrato
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><FileText className="w-4 h-4" /></Button>
                  {p.status === "aceita" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400" onClick={(e) => { e.stopPropagation(); openConvertDialog(p); }} title="Converter em Contrato">
                      <FileCheck2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog Converter (from table) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Converter em Contrato</DialogTitle>
            <DialogDescription>Confirme os dados para criar o contrato automaticamente.</DialogDescription>
          </DialogHeader>
          {dialogProposta && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{dialogProposta.clienteNome}</p></div>
              <div><p className="text-xs text-muted-foreground">Valor Base</p><p className="font-semibold">R$ {dialogProposta.valor.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Excedente</p><p className="font-semibold">{dialogProposta.valorExcedente ? `R$ ${dialogProposta.valorExcedente.toLocaleString()}` : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-semibold">{dialogProposta.tipo || "Recorrente"}</p></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleConverterContrato}>
              <FileCheck2 className="w-4 h-4 mr-1" /> Criar Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
