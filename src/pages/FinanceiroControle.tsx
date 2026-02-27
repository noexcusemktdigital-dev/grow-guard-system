import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Inbox, Search, CreditCard, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/KpiCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceRevenues, useFinanceExpenses, useFinanceMutations } from "@/hooks/useFinance";
import { useNetworkContracts } from "@/hooks/useContracts";
import { useChargeClient } from "@/hooks/useClientPayments";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const revCategories = ["Assessoria", "SaaS", "Franquia", "Outros"];
const expCategories = ["Pessoas", "Plataformas", "Estrutura", "Empréstimos", "Investimentos", "Eventos", "Treinamentos", "Impostos"];

export default function FinanceiroControle() {
  const { toast } = useToast();
  const { data: revenues, isLoading: lr } = useFinanceRevenues();
  const { data: expenses, isLoading: le } = useFinanceExpenses();
  const { data: contracts, isLoading: lc } = useNetworkContracts();
  const { createRevenue, updateRevenue, deleteRevenue, createExpense, updateExpense, deleteExpense } = useFinanceMutations();
  const chargeClient = useChargeClient();

  const [search, setSearch] = useState("");
  // Revenue dialog
  const [revDialog, setRevDialog] = useState(false);
  const [editingRev, setEditingRev] = useState<any>(null);
  const [revForm, setRevForm] = useState({ description: "", amount: 0, category: "Assessoria", status: "pending", date: "" });
  // Expense dialog
  const [expDialog, setExpDialog] = useState(false);
  const [editingExp, setEditingExp] = useState<any>(null);
  const [expForm, setExpForm] = useState({ description: "", amount: 0, category: "Plataformas", status: "pending", is_recurring: false, date: "" });
  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ type: "rev" | "exp"; id: string } | null>(null);

  // Charge dialog state
  const [chargeContract, setChargeContract] = useState<any>(null);
  const [chargeBillingType, setChargeBillingType] = useState("PIX");
  const [chargeResult, setChargeResult] = useState<any>(null);

  const isLoading = lr || le || lc;

  const activeContracts = useMemo(() => (contracts ?? []).filter((c: any) => c.status === "active" || c.status === "signed"), [contracts]);

  const filteredRevenues = useMemo(() => {
    if (!revenues) return [];
    if (!search) return revenues;
    return revenues.filter(r => r.description?.toLowerCase().includes(search.toLowerCase()));
  }, [revenues, search]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    if (!search) return expenses;
    return expenses.filter(e => e.description?.toLowerCase().includes(search.toLowerCase()));
  }, [expenses, search]);

  const totalRev = (revenues ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalExp = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const networkMRR = activeContracts.reduce((s: number, c: any) => s + Number(c.monthly_value || 0), 0);

  // Revenue handlers
  const openNewRev = () => { setEditingRev(null); setRevForm({ description: "", amount: 0, category: "Assessoria", status: "pending", date: "" }); setRevDialog(true); };
  const openEditRev = (r: any) => { setEditingRev(r); setRevForm({ description: r.description, amount: Number(r.amount), category: r.category || "Assessoria", status: r.status || "pending", date: r.date || "" }); setRevDialog(true); };
  const saveRev = () => {
    if (!revForm.description.trim()) { toast({ title: "Informe a descrição", variant: "destructive" }); return; }
    if (editingRev) {
      updateRevenue.mutate({ id: editingRev.id, ...revForm });
      toast({ title: "Receita atualizada" });
    } else {
      createRevenue.mutate(revForm);
      toast({ title: "Receita adicionada" });
    }
    setRevDialog(false);
  };

  // Expense handlers
  const openNewExp = () => { setEditingExp(null); setExpForm({ description: "", amount: 0, category: "Plataformas", status: "pending", is_recurring: false, date: "" }); setExpDialog(true); };
  const openEditExp = (e: any) => { setEditingExp(e); setExpForm({ description: e.description, amount: Number(e.amount), category: e.category || "Plataformas", status: e.status || "pending", is_recurring: !!e.is_recurring, date: e.date || "" }); setExpDialog(true); };
  const saveExp = () => {
    if (!expForm.description.trim()) { toast({ title: "Informe a descrição", variant: "destructive" }); return; }
    if (editingExp) {
      updateExpense.mutate({ id: editingExp.id, ...expForm });
      toast({ title: "Despesa atualizada" });
    } else {
      createExpense.mutate(expForm);
      toast({ title: "Despesa adicionada" });
    }
    setExpDialog(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "rev") {
      deleteRevenue.mutate(deleteTarget.id);
      toast({ title: "Receita excluída" });
    } else {
      deleteExpense.mutate(deleteTarget.id);
      toast({ title: "Despesa excluída" });
    }
    setDeleteTarget(null);
  };

  // Charge handlers
  const handleEmitCharge = (contract: any) => {
    setChargeContract(contract);
    setChargeBillingType("PIX");
    setChargeResult(null);
  };

  const submitCharge = () => {
    if (!chargeContract) return;
    chargeClient.mutate(
      {
        contract_id: chargeContract.id,
        billing_type: chargeBillingType,
        organization_id: chargeContract.organization_id,
      },
      {
        onSuccess: (data) => {
          setChargeResult(data);
        },
        onError: () => {
          // toast is handled by the hook
        },
      }
    );
  };

  const copyPixCode = (code: string) => {
    navigator.clipboard.writeText(code);
    sonnerToast.success("Código PIX copiado!");
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="page-header-title">Controle Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão completa de entradas, saídas e receitas de contratos</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receitas" value={formatBRL(totalRev)} trend="up" />
        <KpiCard label="Despesas" value={formatBRL(totalExp)} />
        <KpiCard label="Resultado" value={formatBRL(totalRev - totalExp)} trend={totalRev >= totalExp ? "up" : "down"} />
        <KpiCard label="MRR Contratos" value={formatBRL(networkMRR)} accent />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por descrição..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="entradas">
        <TabsList>
          <TabsTrigger value="entradas">Entradas ({(revenues ?? []).length})</TabsTrigger>
          <TabsTrigger value="saidas">Saídas ({(expenses ?? []).length})</TabsTrigger>
          <TabsTrigger value="contratos">Contratos Ativos ({activeContracts.length})</TabsTrigger>
        </TabsList>

        {/* === ENTRADAS === */}
        <TabsContent value="entradas" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openNewRev} className="gap-2"><Plus className="w-4 h-4" /> Nova Receita</Button>
          </div>
          {filteredRevenues.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma receita encontrada.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">Descrição</th>
                  <th className="text-left py-3 px-4 font-medium">Categoria</th>
                  <th className="text-right py-3 px-4 font-medium">Valor</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Data</th>
                  <th className="text-center py-3 px-4 font-medium">Ações</th>
                </tr></thead>
                <tbody>
                  {filteredRevenues.map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{r.description}</td>
                      <td className="py-3 px-4 text-muted-foreground">{r.category || "—"}</td>
                      <td className="py-3 px-4 text-right text-emerald-500 font-medium">{formatBRL(Number(r.amount))}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${r.status === "paid" ? "bg-emerald-500/15 text-emerald-500" : "bg-yellow-500/15 text-yellow-500"}`}>
                          {r.status === "paid" ? "Recebido" : "Pendente"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{r.date ? new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditRev(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: "rev", id: r.id })}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* === SAÍDAS === */}
        <TabsContent value="saidas" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openNewExp} className="gap-2"><Plus className="w-4 h-4" /> Nova Despesa</Button>
          </div>
          {filteredExpenses.length === 0 ? (
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
                  <th className="text-center py-3 px-4 font-medium">Ações</th>
                </tr></thead>
                <tbody>
                  {filteredExpenses.map(e => (
                    <tr key={e.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{e.description}</td>
                      <td className="py-3 px-4"><Badge variant="secondary" className="text-[10px]">{e.category || "—"}</Badge></td>
                      <td className="py-3 px-4 text-right text-red-500 font-medium">-{formatBRL(Number(e.amount))}</td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground">{e.is_recurring ? "Fixa" : "Variável"}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${e.status === "paid" ? "bg-emerald-500/15 text-emerald-500" : "bg-yellow-500/15 text-yellow-500"}`}>
                          {e.status === "paid" ? "Pago" : "Previsto"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditExp(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: "exp", id: e.id })}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* === CONTRATOS ATIVOS === */}
        <TabsContent value="contratos" className="space-y-4">
          {activeContracts.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum contrato ativo na rede.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">Cliente (Signatário)</th>
                  <th className="text-left py-3 px-4 font-medium">Contrato</th>
                  <th className="text-left py-3 px-4 font-medium">Unidade</th>
                  <th className="text-right py-3 px-4 font-medium">Valor Mensal</th>
                  <th className="text-center py-3 px-4 font-medium">Tipo</th>
                  <th className="text-center py-3 px-4 font-medium">Repasse</th>
                  <th className="text-center py-3 px-4 font-medium">Ações</th>
                </tr></thead>
                <tbody>
                  {activeContracts.map((c: any) => (
                    <tr key={c.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{c.signer_name || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{c.title}</td>
                      <td className="py-3 px-4 text-muted-foreground">{c.org_name || "Matriz"}</td>
                      <td className="py-3 px-4 text-right text-emerald-500 font-medium">{c.monthly_value ? formatBRL(Number(c.monthly_value)) : "—"}</td>
                      <td className="py-3 px-4 text-center"><Badge variant="outline" className="text-[10px] capitalize">{c.contract_type || "—"}</Badge></td>
                      <td className="py-3 px-4 text-center">
                        {c.owner_type === "unidade" ? <Badge className="text-[10px] bg-blue-500/15 text-blue-500">Sim</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => handleEmitCharge(c)}
                          disabled={!c.monthly_value || Number(c.monthly_value) <= 0}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Emitir Cobrança
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Charge Dialog */}
      <Dialog open={!!chargeContract} onOpenChange={(open) => { if (!open) { setChargeContract(null); setChargeResult(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{chargeResult ? "Cobrança Gerada" : "Emitir Cobrança"}</DialogTitle>
            <DialogDescription>
              {chargeResult
                ? `Cobrança para ${chargeContract?.signer_name || "cliente"} gerada com sucesso.`
                : `Gerar cobrança para o contrato "${chargeContract?.title}" — ${chargeContract?.signer_name || "cliente"}`
              }
            </DialogDescription>
          </DialogHeader>

          {!chargeResult ? (
            <div className="space-y-4">
              <div>
                <Label>Valor</Label>
                <p className="text-lg font-semibold text-emerald-500">{chargeContract?.monthly_value ? formatBRL(Number(chargeContract.monthly_value)) : "—"}</p>
              </div>
              <div>
                <Label>Método de Pagamento</Label>
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
                  {chargeClient.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Gerar Cobrança
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
                        <Input readOnly value={chargeResult.pix_copy_paste} className="text-xs font-mono" />
                        <Button variant="outline" size="icon" onClick={() => copyPixCode(chargeResult.pix_copy_paste)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {chargeBillingType === "BOLETO" ? "Boleto gerado com sucesso." : "Link de pagamento gerado."}
                  </p>
                  {chargeResult.invoice_url && (
                    <Button variant="outline" className="gap-2" onClick={() => window.open(chargeResult.invoice_url, "_blank")}>
                      <ExternalLink className="w-4 h-4" />
                      Abrir Fatura
                    </Button>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { setChargeContract(null); setChargeResult(null); }}>Fechar</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevDialog(false)}>Cancelar</Button>
            <Button onClick={saveRev}>{editingRev ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={expDialog} onOpenChange={setExpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingExp ? "Editar Despesa" : "Nova Despesa"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição *</Label><Input value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: Number(e.target.value) }))} /></div>
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
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Deseja excluir este lançamento?</AlertDialogDescription>
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
