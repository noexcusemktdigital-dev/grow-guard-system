// @ts-nocheck
import { formatBRL } from "@/lib/formatting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertTriangle, Download, Eye, FileType, Filter, Inbox, Pencil, Search, Trash2 } from "lucide-react";
import { downloadContractPdf } from "@/lib/contractPdfTemplate";
import { downloadContractDocx } from "@/lib/contractDocxGenerator";

const gestaoStatusLabels: Record<string, string> = { draft: "Rascunho", active: "Ativo", signed: "Assinado", expired: "Vencido", cancelled: "Cancelado" };
const gestaoStatusColors: Record<string, string> = { draft: "bg-muted text-muted-foreground", active: "bg-emerald-500/15 text-emerald-500", signed: "bg-blue-500/15 text-blue-500", expired: "bg-red-500/15 text-red-500", cancelled: "bg-red-500/15 text-red-500" };
const typeLabels: Record<string, string> = { assessoria: "Assessoria", saas: "SaaS", sistema: "Sistema", franquia: "Franquia" };
const ownerLabels: Record<string, string> = { unidade: "Unidade", matriz: "Matriz", cliente_saas: "Cliente SaaS" };

function daysUntilExpiry(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface ContractItem {
  id: string;
  title: string;
  content?: string | null;
  signer_name?: string;
  signer_email?: string;
  client_document?: string;
  client_phone?: string;
  client_address?: string;
  org_name?: string;
  contract_type: string;
  owner_type: string;
  status: string;
  monthly_value?: number | string;
  total_value?: number | string;
  duration_months?: number;
  start_date?: string;
  end_date?: string;
  payment_day?: number;
  service_description?: string;
  created_at: string;
}

interface EditForm {
  status: string;
  monthly_value: number;
  signer_name: string;
  signer_email: string;
  start_date: string;
  end_date: string;
}

interface ContratosGeradorGestaoTabProps {
  filtered: ContractItem[];
  search: string;
  setSearch: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterOwner: string;
  setFilterOwner: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  detailContract: ContractItem | null;
  setDetailContract: (c: ContractItem | null) => void;
  editDialog: boolean;
  setEditDialog: (v: boolean) => void;
  editForm: EditForm;
  setEditForm: (fn: (f: EditForm) => EditForm) => void;
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  openEdit: (c: ContractItem) => void;
  saveEdit: () => void;
  confirmDelete: () => void;
  isPendingUpdate: boolean;
}

export function ContratosGeradorGestaoTab({
  filtered,
  search,
  setSearch,
  filterType,
  setFilterType,
  filterOwner,
  setFilterOwner,
  filterStatus,
  setFilterStatus,
  detailContract,
  setDetailContract,
  editDialog,
  setEditDialog,
  editForm,
  setEditForm,
  deleteId,
  setDeleteId,
  openEdit,
  saveEdit,
  confirmDelete,
  isPendingUpdate,
}: ContratosGeradorGestaoTabProps) {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, cliente ou unidade..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Buscar por título, cliente ou unidade"
          />
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
            {Object.entries(gestaoStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
              {filtered.map((c) => {
                const days = daysUntilExpiry(c.end_date || null);
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
                      <span className={`text-xs px-2 py-0.5 rounded ${gestaoStatusColors[c.status] || "bg-muted"}`}>{gestaoStatusLabels[c.status] || c.status}</span>
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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadContractPdf(c)} title="Baixar PDF" aria-label="Baixar PDF"><Download className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadContractDocx(c)} title="Baixar DOCX" aria-label="Baixar DOCX"><FileType className="w-3.5 h-3.5" /></Button>
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
                ["Status", gestaoStatusLabels[detailContract.status] || detailContract.status],
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
                  <p className="text-sm font-medium">{String(value || "—")}</p>
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
            <div><Label>Valor Mensal (R$)</Label><NumericInput value={editForm.monthly_value ?? null} onChange={v => setEditForm(f => ({ ...f, monthly_value: v ?? 0 }))} prefix="R$ " decimals={2} /></div>
            <div><Label>Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(gestaoStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Início</Label><Input type="date" value={editForm.start_date} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={editForm.end_date} onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={isPendingUpdate}>Salvar</Button>
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
    </>
  );
}
