import { useState, useMemo } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { Inbox, Search, Filter, Pencil, Trash2, Eye, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNetworkContracts, useContractMutations } from "@/hooks/useContracts";
import { KpiCard } from "@/components/KpiCard";
import { useToast } from "@/hooks/use-toast";
import { formatBRL } from "@/lib/formatting";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/15 text-emerald-500",
  signed: "bg-blue-500/15 text-blue-500",
  expired: "bg-red-500/15 text-red-500",
  cancelled: "bg-red-500/15 text-red-500",
};
const statusLabels: Record<string, string> = { draft: "Rascunho", active: "Ativo", signed: "Assinado", expired: "Vencido", cancelled: "Cancelado" };
const typeLabels: Record<string, string> = { assessoria: "Assessoria", saas: "SaaS", sistema: "Sistema", franquia: "Franquia" };
const ownerLabels: Record<string, string> = { unidade: "Unidade", matriz: "Matriz", cliente_saas: "Cliente SaaS" };

function daysUntilExpiry(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ContratosGerenciamento() {
  const { toast } = useToast();
  const { data: contracts, isLoading, isError, error, refetch } = useNetworkContracts();
  const { updateContract, deleteContract } = useContractMutations();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Detail sheet
  const [detailContract, setDetailContract] = useState<Tables<'contracts'> | null>(null);
  // Edit dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Tables<'contracts'> | null>(null);
  const [editForm, setEditForm] = useState({ status: "active", monthly_value: 0, signer_name: "", signer_email: "", start_date: "", end_date: "" });
  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!contracts) return [];
    return contracts.filter(c => {
      if (search && !c.title?.toLowerCase().includes(search.toLowerCase()) && !c.signer_name?.toLowerCase().includes(search.toLowerCase()) && !c.org_name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && c.contract_type !== filterType) return false;
      if (filterOwner !== "all" && c.owner_type !== filterOwner) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      return true;
    });
  }, [contracts, search, filterType, filterOwner, filterStatus]);

  const totalMRR = filtered.filter(c => c.status === "active" || c.status === "signed").reduce((s, c) => s + Number(c.monthly_value || 0), 0);
  const totalContracts = filtered.length;
  const activeCount = filtered.filter(c => c.status === "active" || c.status === "signed").length;
  const expiringCount = filtered.filter(c => { const d = daysUntilExpiry(c.end_date); return d !== null && d > 0 && d <= 30; }).length;

  const openEdit = (c: Tables<'contracts'>) => {
    setEditingContract(c);
    setEditForm({ status: c.status, monthly_value: Number(c.monthly_value || 0), signer_name: c.signer_name || "", signer_email: c.signer_email || "", start_date: c.start_date || "", end_date: c.end_date || "" });
    setEditDialog(true);
  };

  const saveEdit = () => {
    if (!editingContract) return;
    updateContract.mutate({ id: editingContract.id, ...editForm });
    setEditDialog(false);
    toast({ title: "Contrato atualizado" });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteContract.mutate(deleteId);
    setDeleteId(null);
    toast({ title: "Contrato excluído" });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="font-semibold text-destructive mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Erro ao carregar contratos
        </h3>
        <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Não foi possível carregar os contratos."}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header-title">Gestão de Contratos</h1>
        <p className="text-sm text-muted-foreground mt-1">Cada contrato = um cliente. Visão consolidada da rede.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total" value={String(totalContracts)} />
        <KpiCard label="Ativos" value={String(activeCount)} trend="up" />
        <KpiCard label="MRR Rede" value={formatBRL(totalMRR)} accent />
        <KpiCard label="A Vencer (30d)" value={String(expiringCount)} sublabel={expiringCount > 0 ? "⚠️" : undefined} />
        <KpiCard label="Valor Total" value={formatBRL(filtered.reduce((s, c) => s + Number(c.total_value || 0), 0))} />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por título, cliente ou unidade..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar por título, cliente ou unidade" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterOwner} onValueChange={setFilterOwner}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Proprietário" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Donos</SelectItem>
            {Object.entries(ownerLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum contrato encontrado</h3>
          <p className="text-sm text-muted-foreground">Ajuste os filtros ou crie novos contratos.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium">Cliente</th>
                <th className="text-left py-3 px-4 font-medium">Contrato</th>
                <th className="text-left py-3 px-4 font-medium">Unidade</th>
                <th className="text-center py-3 px-4 font-medium">Tipo</th>
                <th className="text-right py-3 px-4 font-medium">Mensal</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Vencimento</th>
                <th className="text-center py-3 px-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: Tables<'contracts'>) => {
                const days = daysUntilExpiry(c.end_date);
                const isExpiring = days !== null && days > 0 && days <= 30;
                const isExpired = days !== null && days <= 0;
                return (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{c.signer_name || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{c.title}</td>
                    <td className="py-3 px-4 text-muted-foreground">{c.org_name || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="text-[10px] capitalize">{typeLabels[c.contract_type] || c.contract_type || "—"}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">{c.monthly_value ? formatBRL(Number(c.monthly_value)) : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColors[c.status] || "bg-muted"}`}>{statusLabels[c.status] || c.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{c.end_date ? new Date(c.end_date).toLocaleDateString("pt-BR") : "—"}</span>
                        {isExpiring && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
                        {isExpired && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailContract(c)} aria-label="Visualizar"><Eye className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)} aria-label="Editar"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)} aria-label="Excluir"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!detailContract} onOpenChange={() => setDetailContract(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>Detalhes do Contrato</SheetTitle></SheetHeader>
          {detailContract && (
            <div className="space-y-4 mt-4">
              {[
                ["Título", detailContract.title],
                ["Cliente (Signatário)", detailContract.signer_name],
                ["E-mail", detailContract.signer_email],
                ["CPF/CNPJ", detailContract.client_document],
                ["Telefone", detailContract.client_phone],
                ["Endereço", detailContract.client_address],
                ["Unidade", detailContract.org_name],
                ["Tipo", typeLabels[detailContract.contract_type] || detailContract.contract_type],
                ["Dono", ownerLabels[detailContract.owner_type] || detailContract.owner_type],
                ["Status", statusLabels[detailContract.status] || detailContract.status],
                ["Valor Mensal", detailContract.monthly_value ? formatBRL(Number(detailContract.monthly_value)) : "—"],
                ["Valor Total", detailContract.total_value ? formatBRL(Number(detailContract.total_value)) : "—"],
                ["Duração", detailContract.duration_months ? `${detailContract.duration_months} meses` : "—"],
                ["Início", detailContract.start_date ? new Date(detailContract.start_date).toLocaleDateString("pt-BR") : "—"],
                ["Vencimento", detailContract.end_date ? new Date(detailContract.end_date).toLocaleDateString("pt-BR") : "—"],
                ["Dia Pagamento", detailContract.payment_day || "—"],
                ["Descrição do Serviço", detailContract.service_description],
                ["Criado em", new Date(detailContract.created_at).toLocaleDateString("pt-BR")],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Contrato</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Cliente (Signatário)</Label><Input value={editForm.signer_name} onChange={e => setEditForm(f => ({ ...f, signer_name: e.target.value }))} /></div>
            <div><Label>E-mail</Label><Input value={editForm.signer_email} onChange={e => setEditForm(f => ({ ...f, signer_email: e.target.value }))} /></div>
            <div><Label>Valor Mensal (R$)</Label><Input type="number" value={editForm.monthly_value} onChange={e => setEditForm(f => ({ ...f, monthly_value: Number(e.target.value) }))} /></div>
            <div><Label>Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Início</Label><Input type="date" value={editForm.start_date} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={editForm.end_date} onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Deseja excluir este contrato?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
