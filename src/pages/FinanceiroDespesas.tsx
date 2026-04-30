// @ts-nocheck
import { useState } from "react";
import { formatBRL } from "@/lib/formatting";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceExpenses, useFinanceMutations } from "@/hooks/useFinance";
import { useToast } from "@/hooks/use-toast";

const allCategorias = ["Pessoas", "Plataformas", "Estrutura", "Empréstimos", "Investimentos", "Eventos", "Treinamentos", "Impostos"];
const today = () => new Date().toISOString().split("T")[0];

export default function FinanceiroDespesas() {
  const { toast } = useToast();
  const { data: expenses, isLoading } = useFinanceExpenses();
  const { createExpense } = useFinanceMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("Plataformas");
  const [isRecurring, setIsRecurring] = useState(false);
  const [date, setDate] = useState(today());

  const total = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const fixed = (expenses ?? []).filter(e => e.is_recurring).reduce((s, e) => s + Number(e.amount), 0);

  const handleSave = () => {
    if (!desc.trim()) { toast({ title: "Informe a descrição", variant: "destructive" }); return; }
    createExpense.mutate({ description: desc, amount, category, is_recurring: isRecurring, date });
    setDialogOpen(false);
    setDesc(""); setAmount(0); setDate(today());
    toast({ title: "Despesa adicionada" });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-header-title">Despesas</h1><p className="text-sm text-muted-foreground mt-1">Logbook CRUD — Gestão completa de custos</p></div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Nova Despesa</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total do Mês" value={formatBRL(total)} />
        <KpiCard label="Despesas Fixas" value={formatBRL(fixed)} />
        <KpiCard label="Despesas Variáveis" value={formatBRL(total - fixed)} />
        <KpiCard label="Lançamentos" value={String((expenses ?? []).length)} />
      </div>

      {(expenses ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhuma despesa registrada</h3>
          <p className="text-sm text-muted-foreground mb-4">Adicione sua primeira despesa.</p>
          <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Nova Despesa</Button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Categoria</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Valor</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {expenses?.map(e => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-3 px-4 font-medium">{e.description}</td>
                  <td className="py-3 px-4"><span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{e.category || "—"}</span></td>
                  <td className="py-3 px-4 text-right">{formatBRL(Number(e.amount))}</td>
                  <td className="py-3 px-4 text-center text-xs text-muted-foreground">{e.is_recurring ? "Fixa" : "Variável"}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${e.status === "paid" ? "bg-emerald-500/15 text-emerald-500" : "bg-yellow-500/15 text-yellow-500"}`}>{e.status === "paid" ? "Pago" : "Previsto"}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{(e as unknown as { date?: string }).date ? new Date((e as unknown as { date?: string }).date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Despesa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div><Label>Valor (R$)</Label><NumericInput value={amount ?? null} onChange={v => setAmount(v ?? 0)} prefix="R$ " decimals={2} /></div>
            <div><Label>Data</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{allCategorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isRecurring} onChange={() => setIsRecurring(!isRecurring)} className="rounded" />
              <span className="text-sm">Recorrente (Fixa)</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
