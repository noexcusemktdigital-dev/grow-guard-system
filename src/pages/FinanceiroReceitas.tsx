import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceRevenues, useFinanceMutations } from "@/hooks/useFinance";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroReceitas() {
  const { toast } = useToast();
  const { data: revenues, isLoading } = useFinanceRevenues();
  const { createRevenue } = useFinanceMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("Assessoria");
  const [status, setStatus] = useState("pending");

  const total = (revenues ?? []).reduce((s, r) => s + Number(r.amount), 0);

  const handleSave = () => {
    if (!desc.trim()) { toast({ title: "Informe a descrição", variant: "destructive" }); return; }
    createRevenue.mutate({ description: desc, amount, category, status });
    setDialogOpen(false);
    setDesc(""); setAmount(0);
    toast({ title: "Receita adicionada" });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-header-title">Receitas</h1><p className="text-sm text-muted-foreground mt-1">Logbook por produto</p></div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Nova Receita</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total de Receitas" value={formatBRL(total)} trend="up" />
        <KpiCard label="Qtd. Lançamentos" value={String((revenues ?? []).length)} />
        <KpiCard label="Ticket Médio" value={formatBRL((revenues ?? []).length > 0 ? total / revenues!.length : 0)} />
      </div>

      {(revenues ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhuma receita registrada</h3>
          <p className="text-sm text-muted-foreground mb-4">Adicione sua primeira receita.</p>
          <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Nova Receita</Button>
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
              </tr>
            </thead>
            <tbody>
              {revenues!.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-3 px-4 font-medium">{r.description}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.category || "—"}</td>
                  <td className="py-3 px-4 text-right">{formatBRL(Number(r.amount))}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${r.status === "paid" ? "bg-emerald-500/15 text-emerald-500" : "bg-yellow-500/15 text-yellow-500"}`}>{r.status === "paid" ? "Recebido" : "Pendente"}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{r.date ? new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Receita</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} /></div>
            <div><Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Assessoria">Assessoria</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="Sistema">Sistema</SelectItem>
                  <SelectItem value="Franquia">Venda de Franquia</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
