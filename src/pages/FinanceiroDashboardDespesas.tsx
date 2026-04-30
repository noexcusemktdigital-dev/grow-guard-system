// @ts-nocheck
import { useState, useMemo } from "react";
import { formatBRL } from "@/lib/formatting";
import { Inbox, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type ExpenseRow, expCategories } from "./FinanceiroDashboardTypes";

export interface DespesasTabProps {
  expenses: ExpenseRow[] | undefined;
  selectedMonth: string;
  createExpense: { mutate: (data: Record<string, unknown>) => void };
  updateExpense: { mutate: (data: Record<string, unknown>) => void };
  deleteExpense: { mutate: (id: string) => void };
  toast: (opts: { title: string; variant?: string }) => void;
}

export function DespesasTab({ expenses, selectedMonth, createExpense, updateExpense, deleteExpense, toast }: DespesasTabProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [expDialog, setExpDialog] = useState(false);
  const [editingExp, setEditingExp] = useState<ExpenseRow | null>(null);
  const [expForm, setExpForm] = useState({ description: "", amount: 0, category: "Plataformas", status: "pending", is_recurring: false, date: "" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = (expenses ?? []).filter((e: ExpenseRow) => selectedMonth === "all" || (e.date || "").startsWith(selectedMonth));
    if (search) list = list.filter((e: ExpenseRow) => e.description?.toLowerCase().includes(search.toLowerCase()));
    if (filterCategory !== "all") list = list.filter((e: ExpenseRow) => e.category === filterCategory);
    if (filterStatus !== "all") list = list.filter((e: ExpenseRow) => e.status === filterStatus);
    if (filterType !== "all") list = list.filter((e: ExpenseRow) => filterType === "recurring" ? e.is_recurring : !e.is_recurring);
    return list;
  }, [expenses, selectedMonth, search, filterCategory, filterStatus, filterType]);

  const openNewExp = () => { setEditingExp(null); setExpForm({ description: "", amount: 0, category: "Plataformas", status: "pending", is_recurring: false, date: "" }); setExpDialog(true); };
  const openEditExp = (e: ExpenseRow) => { setEditingExp(e); setExpForm({ description: e.description, amount: Number(e.amount), category: e.category || "Plataformas", status: e.status || "pending", is_recurring: !!e.is_recurring, date: e.date || "" }); setExpDialog(true); };

  const saveExp = () => {
    if (!expForm.description.trim()) { toast({ title: "Informe a descrição", variant: "destructive" }); return; }
    if (editingExp) { updateExpense.mutate({ id: editingExp.id, ...expForm }); toast({ title: "Despesa atualizada" }); }
    else { createExpense.mutate(expForm); toast({ title: "Despesa adicionada" }); }
    setExpDialog(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteExpense.mutate(deleteTarget);
    toast({ title: "Despesa excluída" });
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar despesa..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar despesa" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {expCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="pending">Previsto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="recurring">Fixa</SelectItem>
            <SelectItem value="variable">Variável</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={openNewExp} className="gap-2"><Plus className="w-4 h-4" /> Nova Despesa</Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Inbox className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma despesa encontrada.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">Descrição</th>
              <th className="text-left py-3 px-4 font-medium">Categoria</th>
              <th className="text-right py-3 px-4 font-medium">Valor</th>
              <th className="text-center py-3 px-4 font-medium">Tipo</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">Data</th>
              <th className="text-center py-3 px-4 font-medium">Ações</th>
            </tr></thead>
            <tbody>
              {filtered.map((e: ExpenseRow) => (
                <tr key={e.id} className="border-b hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{e.description}</td>
                  <td className="py-3 px-4"><Badge variant="secondary" className="text-[10px]">{e.category || "—"}</Badge></td>
                  <td className="py-3 px-4 text-right text-destructive font-medium">-{formatBRL(Number(e.amount))}</td>
                  <td className="py-3 px-4 text-center text-xs text-muted-foreground">{e.is_recurring ? "Fixa" : "Variável"}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${e.status === "paid" ? "bg-emerald-500/15 text-emerald-500" : "bg-yellow-500/15 text-yellow-500"}`}>
                      {e.status === "paid" ? "Pago" : "Previsto"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{e.date ? new Date(e.date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditExp(e)} aria-label="Editar"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(e.id)} aria-label="Excluir"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expense Dialog */}
      <Dialog open={expDialog} onOpenChange={setExpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingExp ? "Editar Despesa" : "Nova Despesa"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição *</Label><Input value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Valor (R$)</Label><NumericInput value={expForm.amount ?? null} onChange={v => setExpForm(f => ({ ...f, amount: v ?? 0 }))} prefix="R$ " decimals={2} /></div>
            <div><Label>Data</Label><Input type="date" value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>Categoria</Label>
              <Select value={expForm.category} onValueChange={v => setExpForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{expCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={expForm.status} onValueChange={v => setExpForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Previsto</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={expForm.is_recurring} onChange={() => setExpForm(f => ({ ...f, is_recurring: !f.is_recurring }))} className="rounded" />
              <span className="text-sm">Recorrente (Fixa)</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpDialog(false)}>Cancelar</Button>
            <Button onClick={saveExp}>{editingExp ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir esta despesa?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
