import { useState } from "react";
import { formatBRL } from "@/lib/formatting";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceRevenues, useFinanceMutations } from "@/hooks/useFinance";
import { useToast } from "@/hooks/use-toast";

const today = () => new Date().toISOString().split("T")[0];

export default function FinanceiroReceitas() {
  const { toast } = useToast();
  const { data: revenues, isLoading } = useFinanceRevenues();
  const { createRevenue, updateRevenue, deleteRevenue } = useFinanceMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("Assessoria");
  const [date, setDate] = useState(today());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const total = (revenues ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const paid = (revenues ?? []).filter(r => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);

  const openNew = () => {
    setEditingId(null);
    setDesc("");
    setAmount(0);
    setCategory("Assessoria");
    setDate(today());
    setDialogOpen(true);
  };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setDesc(r.description || "");
    setAmount(Number(r.amount));
    setCategory(r.category || "Assessoria");
    setDate(r.date || today());
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!desc.trim()) { toast({ title: "Informe a descrição", variant: "destructive" }); return; }
    if (editingId) {
      updateRevenue.mutate({ id: editingId, description: desc, amount, category, date });
      toast({ title: "Receita atualizada" });
    } else {
      createRevenue.mutate({ description: desc, amount, category, status: "pending", date });
      toast({ title: "Receita adicionada" });
    }
    setDialogOpen(false);
    setEditingId(null);
    setDesc(""); setAmount(0); setDate(today());
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteRevenue.mutate(deleteId);
    setDeleteId(null);
    toast({ title: "Receita excluída" });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Receitas da Matriz</h1>
          <p className="text-sm text-muted-foreground mt-1">Receitas manuais e contratos próprios da franqueadora</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Nova Receita</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total Receitas" value={formatBRL(total)} trend="up" />
        <KpiCard label="Recebido" value={formatBRL(paid)} />
        <KpiCard label="Lançamentos" value={String((revenues ?? []).length)} />
      </div>

      {(revenues ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhuma receita registrada</h3>
          <p className="text-sm text-muted-foreground mb-4">Adicione sua primeira receita da matriz.</p>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nova Receita</Button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Descrição</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Categoria</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Data</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {revenues?.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-3 px-4 font-medium">{r.description}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.category || "—"}</td>
                  <td className="py-3 px-4 text-right">{formatBRL(Number(r.amount))}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${r.status === "paid" ? "bg-emerald-500/15 text-emerald-500" : "bg-yellow-500/15 text-yellow-500"}`}>{r.status === "paid" ? "Recebido" : "Pendente"}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{r.date ? new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar Receita" : "Nova Receita"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} /></div>
            <div><Label>Data</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Assessoria">Assessoria</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="Franquia">Venda de Franquia</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
