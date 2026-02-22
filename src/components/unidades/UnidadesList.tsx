import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Unidade, UnidadeStatus } from "@/types/unidades";
import { mockUnidadeUsers } from "@/data/unidadesData";

interface UnidadesListProps {
  unidades: Unidade[];
  onSelect: (id: string) => void;
  onAdd: (unidade: Unidade) => void;
}

const statusColors: Record<UnidadeStatus, string> = {
  Ativa: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Suspensa: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Encerrada: "bg-red-500/10 text-red-500 border-red-500/20",
};

const emptyUnidade: Omit<Unidade, "id"> = {
  nome: "", cidade: "", estado: "", responsavel: "", email: "", telefone: "",
  dataInicio: new Date().toISOString().slice(0, 10), status: "Ativa", observacoes: "",
  repassePercent: 20, royaltiesPercent: 1, mensalidadeSistema: 250, sistemaAtivo: true, observacoesFinanceiras: "",
};

export function UnidadesList({ unidades, onSelect, onAdd }: UnidadesListProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyUnidade);
  const { toast } = useToast();

  const handleSave = () => {
    if (!form.nome || !form.cidade || !form.estado || !form.responsavel) {
      toast({ title: "Preencha os campos obrigatórios", description: "Nome, Cidade, Estado e Responsável são obrigatórios.", variant: "destructive" });
      return;
    }
    onAdd({ ...form, id: `u${Date.now()}` });
    setForm(emptyUnidade);
    setOpen(false);
    toast({ title: "Unidade criada com sucesso!" });
  };

  const activeUsersCount = (unidadeId: string) =>
    mockUnidadeUsers.filter(u => u.unidadeId === unidadeId && u.status === "Ativo").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Unidade
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead>Cidade / Estado</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Usuários</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unidades.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell>{u.cidade} / {u.estado}</TableCell>
                <TableCell>{u.responsavel}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[u.status]}>{u.status}</Badge>
                </TableCell>
                <TableCell className="text-center">{activeUsersCount(u.id)}</TableCell>
                <TableCell>{new Date(u.dataInicio).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onSelect(u.id)}>Gerenciar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Unidade</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Responsável *</Label><Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Cidade *</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Estado *</Label><Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as UnidadeStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Suspensa">Suspensa</SelectItem>
                    <SelectItem value="Encerrada">Encerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Data de Início</Label><Input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Criar Unidade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
