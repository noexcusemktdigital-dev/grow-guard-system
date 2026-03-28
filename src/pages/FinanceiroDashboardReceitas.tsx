import { useState, useMemo } from "react";
import { formatBRL } from "@/lib/formatting";
import { Inbox, Plus, Pencil, Trash2, Search, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type RevenueRow, ASAAS_PAID_STATUSES, revCategories } from "./FinanceiroDashboardTypes";
import type { AsaasPayment } from "@/hooks/useClientPayments";

export interface ReceitasTabProps {
  asaasPayments: AsaasPayment[] | undefined;
  revenues: RevenueRow[] | undefined;
  selectedMonth: string;
  la: boolean;
  refetchAsaas: () => void;
  createRevenue: { mutate: (data: Record<string, unknown>) => void };
  updateRevenue: { mutate: (data: Record<string, unknown>) => void };
  deleteRevenue: { mutate: (id: string) => void };
  toast: (opts: { title: string; variant?: string }) => void;
}

export function ReceitasTab({ asaasPayments, revenues, selectedMonth, la, refetchAsaas, createRevenue, updateRevenue, deleteRevenue, toast }: ReceitasTabProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [revDialog, setRevDialog] = useState(false);
  const [editingRev, setEditingRev] = useState<RevenueRow | null>(null);
  const [revForm, setRevForm] = useState({ description: "", amount: 0, category: "Serviço", status: "pending", date: "", payment_method: "" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Unified list: Asaas + Manual
  type UnifiedEntry = { id: string; description: string; value: number; date: string; status: string; source: "asaas" | "manual"; billingType?: string; invoiceUrl?: string; bankSlipUrl?: string; orgName?: string; category?: string; rawStatus?: string };

  const unified = useMemo(() => {
    const asaasList: UnifiedEntry[] = ((asaasPayments ?? []) as AsaasPayment[]).map(p => ({
      id: p.id, description: p.description || p.orgName || "—", value: p.value,
      date: p.dueDate || p.paymentDate || "", status: ASAAS_PAID_STATUSES.includes(p.status) ? "paid" : p.status === "OVERDUE" ? "overdue" : "pending",
      source: "asaas" as const, billingType: p.billingType, invoiceUrl: p.invoiceUrl, bankSlipUrl: p.bankSlipUrl, orgName: p.orgName, rawStatus: p.status,
    }));
    const manualList: UnifiedEntry[] = ((revenues ?? []) as RevenueRow[]).map(r => ({
      id: r.id, description: r.description || "—", value: Number(r.amount),
      date: r.date || "", status: r.status || "pending",
      source: "manual" as const, category: r.category,
    }));
    let list = [...asaasList, ...manualList];
    if (selectedMonth !== "all") list = list.filter(e => e.date.startsWith(selectedMonth));
    if (search) list = list.filter(e => e.description.toLowerCase().includes(search.toLowerCase()) || (e.orgName || "").toLowerCase().includes(search.toLowerCase()));
    if (filterStatus !== "all") list = list.filter(e => e.status === filterStatus);
    if (filterSource !== "all") list = list.filter(e => e.source === filterSource);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [asaasPayments, revenues, selectedMonth, search, filterStatus, filterSource]);

  const totalPaid = useMemo(() => unified.filter(e => e.status === "paid").reduce((s, e) => s + e.value, 0), [unified]);
  const totalPending = useMemo(() => unified.filter(e => e.status === "pending").reduce((s, e) => s + e.value, 0), [unified]);
  const totalOverdue = useMemo(() => unified.filter(e => e.status === "overdue").reduce((s, e) => s + e.value, 0), [unified]);

  const openNewRev = () => { setEditingRev(null); setRevForm({ description: "", amount: 0, category: "Serviço", status: "pending", date: "", payment_method: "" }); setRevDialog(true); };
  const openEditRev = (r: RevenueRow) => { setEditingRev(r); setRevForm({ description: r.description, amount: Number(r.amount), category: r.category || "Serviço", status: r.status || "pending", date: r.date || "", payment_method: r.payment_method || "" }); setRevDialog(true); };

  const saveRev = () => {
    if (!revForm.description.trim()) { toast({ title: "Informe a descrição", variant: "destructive" }); return; }
    if (editingRev) { updateRevenue.mutate({ id: editingRev.id, ...revForm }); toast({ title: "Receita atualizada" }); }
    else { createRevenue.mutate(revForm); toast({ title: "Receita adicionada" }); }
    setRevDialog(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteRevenue.mutate(deleteTarget);
    toast({ title: "Receita excluída" });
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por descrição ou cliente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar por descrição ou cliente" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="paid">Recebido</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Origens</SelectItem>
            <SelectItem value="asaas">Asaas</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetchAsaas()} disabled={la}>
          <RefreshCw className={`w-4 h-4 ${la ? "animate-spin" : ""}`} /> Atualizar Asaas
        </Button>
        <Button size="sm" onClick={openNewRev} className="gap-2"><Plus className="w-4 h-4" /> Nova Receita</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Recebido</CardTitle></CardHeader><CardContent><span className="text-xl font-bold text-primary">{formatBRL(totalPaid)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pendente</CardTitle></CardHeader><CardContent><span className="text-xl font-bold text-muted-foreground">{formatBRL(totalPending)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Atrasadas</CardTitle></CardHeader><CardContent><span className="text-xl font-bold text-destructive">{formatBRL(totalOverdue)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Entradas</CardTitle></CardHeader><CardContent><span className="text-xl font-bold text-foreground">{unified.length}</span></CardContent></Card>
      </div>

      {unified.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Inbox className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma receita encontrada.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">Descrição</th>
              <th className="text-left py-3 px-4 font-medium">Origem</th>
              <th className="text-right py-3 px-4 font-medium">Valor</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">Data</th>
              <th className="text-center py-3 px-4 font-medium">Ações</th>
            </tr></thead>
            <tbody>
              {unified.map(entry => {
                const statusCls = entry.status === "paid" ? "bg-emerald-500/15 text-emerald-600" : entry.status === "overdue" ? "bg-destructive/15 text-destructive" : "bg-yellow-500/15 text-yellow-600";
                const statusLabel = entry.status === "paid" ? "Recebido" : entry.status === "overdue" ? "Vencido" : "Pendente";
                return (
                  <tr key={`${entry.source}-${entry.id}`} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="font-medium">{entry.description}</div>
                      {entry.orgName && <div className="text-xs text-muted-foreground">{entry.orgName}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={entry.source === "asaas" ? "default" : "secondary"} className="text-[10px]">
                        {entry.source === "asaas" ? (entry.billingType || "Asaas") : "Manual"}
                      </Badge>
                      {entry.category && <span className="text-[10px] text-muted-foreground ml-1">{entry.category}</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-primary font-medium">{formatBRL(entry.value)}</td>
                    <td className="py-3 px-4 text-center"><span className={`text-xs px-2 py-0.5 rounded ${statusCls}`}>{statusLabel}</span></td>
                    <td className="py-3 px-4 text-muted-foreground">{entry.date ? new Date(entry.date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {entry.source === "asaas" && (entry.invoiceUrl || entry.bankSlipUrl) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(entry.invoiceUrl || entry.bankSlipUrl!, "_blank")} aria-label="Abrir em nova aba"><ExternalLink className="w-3.5 h-3.5" /></Button>
                        )}
                        {entry.source === "manual" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                              const rev = (revenues ?? []).find((r: RevenueRow) => r.id === entry.id);
                              if (rev) openEditRev(rev);
                            }} aria-label="Editar"><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(entry.id)} aria-label="Excluir"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Revenue Dialog */}
      <Dialog open={revDialog} onOpenChange={setRevDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingRev ? "Editar Receita" : "Nova Receita"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição *</Label><Input value={revForm.description} onChange={e => setRevForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={revForm.amount} onChange={e => setRevForm(f => ({ ...f, amount: Number(e.target.value) }))} /></div>
            <div><Label>Data</Label><Input type="date" value={revForm.date} onChange={e => setRevForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>Categoria</Label>
              <Select value={revForm.category} onValueChange={v => setRevForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{revCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={revForm.status} onValueChange={v => setRevForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={saveRev}>{editingRev ? "Salvar" : "Adicionar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir receita?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
