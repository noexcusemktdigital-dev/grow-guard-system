// @ts-nocheck
import { useState, useMemo } from "react";
import { formatBRL } from "@/lib/formatting";
import { ArrowRight, Pencil, Trash2, Search, CreditCard, Copy, ExternalLink, Loader2, RefreshCw, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useManagePayment, type AsaasPayment } from "@/hooks/useClientPayments";
import { toast as sonnerToast } from "sonner";
import { type NetworkContract, ASAAS_PAID_STATUSES, asaasStatusLabel } from "./FinanceiroDashboardTypes";

export interface ClientesTabProps {
  asaasPayments: AsaasPayment[] | undefined;
  la: boolean;
  refetchAsaas: () => void;
  chargeClient: { mutate: (data: Record<string, unknown>, opts: Record<string, unknown>) => void; isPending: boolean };
  selectedMonth: string;
}

export function ClientesTab({ asaasPayments, la, refetchAsaas, chargeClient, selectedMonth }: ClientesTabProps) {
  const [search, setSearch] = useState("");
  const [filterClientStatus, setFilterClientStatus] = useState("all");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [chargeContract, setChargeContract] = useState<NetworkContract | null>(null);
  const [chargeBillingType, setChargeBillingType] = useState("PIX");
  const [chargeResult, setChargeResult] = useState<Record<string, unknown> | null>(null);

  // Manage payment (cancel/edit)
  const managePayment = useManagePayment();
  const [cancelPaymentId, setCancelPaymentId] = useState<string | null>(null);
  const [editPayment, setEditPayment] = useState<AsaasPayment | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const EDITABLE_STATUSES = ["PENDING", "OVERDUE"];

  const byCustomer = useMemo(() => {
    const map = new Map<string, { name: string; customerAsaasId: string; payments: AsaasPayment[]; total: number; received: number; pending: number; overdue: number }>();
    const payments = (asaasPayments ?? []) as AsaasPayment[];
    const filtered = selectedMonth === "all" ? payments : payments.filter((p: AsaasPayment) => (p.dueDate || p.paymentDate || "").startsWith(selectedMonth));
    filtered.forEach((p: AsaasPayment) => {
      const key = p.customerAsaasId || p.orgName;
      if (!key) return;
      if (!map.has(key)) map.set(key, { name: p.orgName, customerAsaasId: key, payments: [], total: 0, received: 0, pending: 0, overdue: 0 });
      const entry = map.get(key)!;
      entry.payments.push(p);
      entry.total += p.value;
      if (ASAAS_PAID_STATUSES.includes(p.status)) entry.received += p.value;
      else if (p.status === "OVERDUE") entry.overdue += p.value;
      else entry.pending += p.value;
    });
    let list = [...map.values()].sort((a, b) => b.total - a.total);
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (filterClientStatus === "received") list = list.filter(c => c.received > 0);
    else if (filterClientStatus === "pending") list = list.filter(c => c.pending > 0);
    else if (filterClientStatus === "overdue") list = list.filter(c => c.overdue > 0);
    return list;
  }, [asaasPayments, selectedMonth, search, filterClientStatus]);

  const totalReceived = useMemo(() => byCustomer.reduce((s, c) => s + c.received, 0), [byCustomer]);
  const totalPending = useMemo(() => byCustomer.reduce((s, c) => s + c.pending, 0), [byCustomer]);
  const totalOverdue = useMemo(() => byCustomer.reduce((s, c) => s + c.overdue, 0), [byCustomer]);

  const submitCharge = () => {
    if (!chargeContract) return;
    chargeClient.mutate(
      { contract_id: chargeContract.id, billing_type: chargeBillingType, organization_id: chargeContract.organization_id },
      {
        onSuccess: (data: Record<string, unknown>) => { setChargeResult(data); refetchAsaas(); },
        onError: () => {},
      }
    );
  };

  const copyPixCode = (code: string) => { navigator.clipboard.writeText(code); sonnerToast.success("Código PIX copiado!"); };

  const handleCancelConfirm = () => {
    if (!cancelPaymentId) return;
    managePayment.mutate({ action: "cancel", payment_id: cancelPaymentId }, {
      onSuccess: () => { setCancelPaymentId(null); refetchAsaas(); },
      onSettled: () => setCancelPaymentId(null),
    });
  };

  const openEditDialog = (p: AsaasPayment) => {
    setEditPayment(p);
    setEditValue(String(p.value));
    setEditDueDate(p.dueDate || "");
    setEditDescription(p.description || "");
  };

  const handleEditSubmit = () => {
    if (!editPayment) return;
    const params: Record<string, unknown> = { action: "update", payment_id: editPayment.id };
    const newVal = parseFloat(editValue);
    if (!isNaN(newVal) && newVal !== editPayment.value) params.value = newVal;
    if (editDueDate && editDueDate !== editPayment.dueDate) params.dueDate = editDueDate;
    if (editDescription !== (editPayment.description || "")) params.description = editDescription;
    managePayment.mutate(params, {
      onSuccess: () => { setEditPayment(null); refetchAsaas(); },
    });
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar cliente" />
        </div>
        <Select value={filterClientStatus} onValueChange={setFilterClientStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="received">Com recebidos</SelectItem>
            <SelectItem value="pending">Com pendentes</SelectItem>
            <SelectItem value="overdue">Com vencidos</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetchAsaas()} disabled={la}>
          <RefreshCw className={`w-4 h-4 ${la ? "animate-spin" : ""}`} /> Sincronizar Asaas
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Clientes</CardTitle></CardHeader><CardContent><span className="text-xl font-bold text-foreground">{byCustomer.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Recebido</CardTitle></CardHeader><CardContent><span className="text-xl font-bold text-primary">{formatBRL(totalReceived)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pendente</CardTitle></CardHeader><CardContent><span className="text-xl font-bold text-muted-foreground">{formatBRL(totalPending)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Vencido</CardTitle></CardHeader><CardContent><span className="text-xl font-bold text-destructive">{formatBRL(totalOverdue)}</span></CardContent></Card>
      </div>

      {byCustomer.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">{la ? "Carregando cobranças do Asaas..." : "Nenhuma cobrança encontrada"}</h3>
          <p className="text-sm text-muted-foreground">{la ? "Aguarde a sincronização." : "Nenhum pagamento registrado no período."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {byCustomer.map(customer => {
            const isExpanded = expandedCustomer === customer.customerAsaasId;
            return (
              <Card key={customer.customerAsaasId} className="overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedCustomer(isExpanded ? null : customer.customerAsaasId)}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{customer.name || "Cliente sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{customer.payments.length} cobrança{customer.payments.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {customer.overdue > 0 && <span className="text-destructive font-medium">{formatBRL(customer.overdue)} vencido</span>}
                    {customer.pending > 0 && <span className="text-muted-foreground">{formatBRL(customer.pending)} pendente</span>}
                    <span className="text-primary font-semibold">{formatBRL(customer.received)} recebido</span>
                    <ArrowRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-muted/30">
                        <th className="text-left py-2 px-4 font-medium text-xs">Descrição</th>
                        <th className="text-left py-2 px-4 font-medium text-xs">Vencimento</th>
                        <th className="text-left py-2 px-4 font-medium text-xs">Pagamento</th>
                        <th className="text-right py-2 px-4 font-medium text-xs">Valor</th>
                        <th className="text-right py-2 px-4 font-medium text-xs">Líquido</th>
                        <th className="text-center py-2 px-4 font-medium text-xs">Tipo</th>
                        <th className="text-center py-2 px-4 font-medium text-xs">Status</th>
                        <th className="text-center py-2 px-4 font-medium text-xs">Ações</th>
                      </tr></thead>
                      <tbody>
                        {customer.payments.sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || "")).map(p => {
                          const st = asaasStatusLabel(p.status);
                          const canManage = EDITABLE_STATUSES.includes(p.status);
                          return (
                            <tr key={p.id} className="border-t border-border/30 hover:bg-muted/20">
                              <td className="py-2 px-4">{p.description || "—"}</td>
                              <td className="py-2 px-4 text-muted-foreground">{p.dueDate ? new Date(p.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                              <td className="py-2 px-4 text-muted-foreground">{p.paymentDate ? new Date(p.paymentDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                              <td className="py-2 px-4 text-right font-medium">{formatBRL(p.value)}</td>
                              <td className="py-2 px-4 text-right text-muted-foreground">{formatBRL(p.netValue)}</td>
                              <td className="py-2 px-4 text-center"><Badge variant="outline" className="text-[10px]">{p.billingType}</Badge></td>
                              <td className="py-2 px-4 text-center"><span className={`text-xs px-2 py-0.5 rounded ${st.cls}`}>{st.label}</span></td>
                              <td className="py-2 px-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {canManage && (
                                    <>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar cobrança" onClick={() => openEditDialog(p)} aria-label="Editar">
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Cancelar cobrança" onClick={() => setCancelPaymentId(p.id)} aria-label="Excluir">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </>
                                  )}
                                  {(p.invoiceUrl || p.bankSlipUrl) && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(p.invoiceUrl || p.bankSlipUrl!, "_blank")} aria-label="Abrir em nova aba"><ExternalLink className="w-3.5 h-3.5" /></Button>
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
              </Card>
            );
          })}
        </div>
      )}

      {/* Charge Dialog */}
      <Dialog open={!!chargeContract} onOpenChange={(open) => { if (!open) { setChargeContract(null); setChargeResult(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{chargeResult ? "Cobrança Gerada" : "Emitir Cobrança"}</DialogTitle>
            <DialogDescription>{chargeResult ? `Cobrança para ${chargeContract?.signer_name || "cliente"} gerada.` : `Gerar cobrança para "${chargeContract?.title}"`}</DialogDescription>
          </DialogHeader>
          {!chargeResult ? (
            <div className="space-y-4">
              <div><Label>Valor</Label><p className="text-lg font-semibold text-primary">{chargeContract?.monthly_value ? formatBRL(Number(chargeContract.monthly_value)) : "—"}</p></div>
              <div><Label>Método de Pagamento</Label>
                <Select value={chargeBillingType} onValueChange={setChargeBillingType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                    <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setChargeContract(null); setChargeResult(null); }}>Cancelar</Button>
                <Button onClick={submitCharge} disabled={chargeClient.isPending} className="gap-2">
                  {chargeClient.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Gerar Cobrança
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {chargeBillingType === "PIX" && chargeResult.pix_qr_code ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={`data:image/png;base64,${chargeResult.pix_qr_code}`} alt="QR Code PIX" className="w-48 h-48 rounded-lg border" />
                  {chargeResult.pix_copy_paste && (
                    <div className="w-full">
                      <Label className="text-xs text-muted-foreground">Código Copia e Cola</Label>
                      <div className="flex gap-2 mt-1">
                        <Input readOnly value={chargeResult.pix_copy_paste as string} className="text-xs font-mono" />
                        <Button variant="outline" size="icon" onClick={() => copyPixCode(chargeResult.pix_copy_paste as string)} aria-label="Copiar"><Copy className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">{chargeBillingType === "BOLETO" ? "Boleto gerado." : "Link de pagamento gerado."}</p>
                  {chargeResult.invoice_url && (
                    <Button variant="outline" className="gap-2" onClick={() => window.open(chargeResult.invoice_url as string, "_blank")}><ExternalLink className="w-4 h-4" /> Abrir Fatura</Button>
                  )}
                </div>
              )}
              <DialogFooter><Button variant="outline" onClick={() => { setChargeContract(null); setChargeResult(null); }}>Fechar</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelPaymentId} onOpenChange={(open) => { if (!open) setCancelPaymentId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Cobrança</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja cancelar esta cobrança? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm} disabled={managePayment.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {managePayment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Cancelar Cobrança
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Payment Dialog */}
      <Dialog open={!!editPayment} onOpenChange={(open) => { if (!open) setEditPayment(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cobrança</DialogTitle>
            <DialogDescription>Altere o valor, vencimento ou descrição da cobrança.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" min="0" value={editValue} onChange={e => setEditValue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento</Label>
              <Input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Descrição da cobrança" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPayment(null)}>Cancelar</Button>
            <Button onClick={handleEditSubmit} disabled={managePayment.isPending} className="gap-2">
              {managePayment.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
