import { useState, useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, ArrowRight, Plus, Pencil, Trash2, Search, CreditCard, Copy, ExternalLink, Loader2, RefreshCw, Send, QrCode, Check, FileDown, Building2, Upload, Save, Clock, CheckCircle, AlertTriangle, TrendingUp, DollarSign, AlertCircle, Users, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceExpenses, useFinanceRevenues, useFinanceMutations, useFinanceClosings } from "@/hooks/useFinance";
import { useNetworkContracts } from "@/hooks/useContracts";
import { useChargeClient, useAsaasNetworkPayments, type AsaasPayment } from "@/hooks/useClientPayments";
import { useUnits } from "@/hooks/useUnits";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend } from "recharts";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const expCategories = ["Pessoas", "Plataformas", "Estrutura", "Empréstimos", "Investimentos", "Eventos", "Treinamentos", "Impostos"];
const ASAAS_PAID_STATUSES = ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"];
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--muted-foreground))"];

function getMonthOptions() {
  const now = new Date();
  const opts: { value: string; label: string }[] = [{ value: "all", label: "Todos os meses" }];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `${months[d.getMonth()]} ${d.getFullYear()}` });
  }
  return opts;
}

function asaasStatusLabel(s: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    CONFIRMED: { label: "Confirmado", cls: "bg-emerald-500/15 text-emerald-600" },
    RECEIVED: { label: "Recebido", cls: "bg-emerald-500/15 text-emerald-600" },
    RECEIVED_IN_CASH: { label: "Recebido", cls: "bg-emerald-500/15 text-emerald-600" },
    PENDING: { label: "Pendente", cls: "bg-yellow-500/15 text-yellow-600" },
    OVERDUE: { label: "Vencido", cls: "bg-destructive/15 text-destructive" },
    REFUNDED: { label: "Estornado", cls: "bg-muted text-muted-foreground" },
  };
  return map[s] || { label: s, cls: "bg-muted text-muted-foreground" };
}

/* ═══════════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

export default function FinanceiroDashboard() {
  const { toast } = useToast();
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  const { data: expenses, isLoading: le } = useFinanceExpenses();
  const { data: revenues, isLoading: lr } = useFinanceRevenues();
  const { data: contracts, isLoading: lc } = useNetworkContracts();
  const { createRevenue, updateRevenue, deleteRevenue, createExpense, updateExpense, deleteExpense } = useFinanceMutations();
  const chargeClient = useChargeClient();
  const { data: asaasPayments, isLoading: la, refetch: refetchAsaas } = useAsaasNetworkPayments();
  const { data: closings, isLoading: loadingClosings } = useFinanceClosings();
  const { data: units, isLoading: loadingUnits } = useUnits();
  const { data: org, isLoading: loadingOrg, update: updateOrg } = useOrgProfile();

  const [selectedMonth, setSelectedMonth] = useState("all");
  const monthOptions = useMemo(getMonthOptions, []);

  const isLoading = le || lc || lr;
  const activeContracts = useMemo(() => (contracts ?? []).filter((c: any) => c.status === "active" || c.status === "signed"), [contracts]);

  const filteredExpenses = useMemo(() => {
    if (selectedMonth === "all") return expenses ?? [];
    return (expenses ?? []).filter(e => (e.date || "").startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const filteredAsaas = useMemo(() => {
    if (selectedMonth === "all") return asaasPayments ?? [];
    return (asaasPayments ?? []).filter(p => (p.paymentDate || p.dueDate || "").startsWith(selectedMonth));
  }, [asaasPayments, selectedMonth]);

  const filteredRevenues = useMemo(() => {
    if (selectedMonth === "all") return revenues ?? [];
    return (revenues ?? []).filter((r: any) => (r.date || "").startsWith(selectedMonth));
  }, [revenues, selectedMonth]);

  const totalAsaasPaid = useMemo(() => filteredAsaas.filter(p => ASAAS_PAID_STATUSES.includes(p.status)).reduce((s, p) => s + p.value, 0), [filteredAsaas]);
  const totalManualPaid = useMemo(() => filteredRevenues.filter((r: any) => r.status === "paid").reduce((s: number, r: any) => s + Number(r.amount), 0), [filteredRevenues]);
  const totalRevenue = totalAsaasPaid + totalManualPaid;
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const resultado = totalRevenue - totalExpenses;
  const networkMRR = activeContracts.reduce((s: number, c: any) => s + Number(c.monthly_value || 0), 0);
  const overdueCount = useMemo(() => (asaasPayments ?? []).filter(p => p.status === "OVERDUE").length, [asaasPayments]);

  // Current month Asaas stats
  const now = new Date();
  const currentPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthAsaas = useMemo(() => (asaasPayments ?? []).filter(p => (p.dueDate || "").startsWith(currentPrefix)), [asaasPayments, currentPrefix]);
  const monthTotal = useMemo(() => monthAsaas.reduce((s, p) => s + p.value, 0), [monthAsaas]);
  const monthReceived = useMemo(() => monthAsaas.filter(p => ASAAS_PAID_STATUSES.includes(p.status)).reduce((s, p) => s + p.value, 0), [monthAsaas]);
  const monthOverdue = useMemo(() => monthAsaas.filter(p => p.status === "OVERDUE").reduce((s, p) => s + p.value, 0), [monthAsaas]);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-header-title">Gestão Financeira</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão consolidada: rede + matriz</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar mês" /></SelectTrigger>
          <SelectContent>{monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="w-full grid grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="repasse">Repasse</TabsTrigger>
          <TabsTrigger value="fechamentos">Fechamentos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="configuracoes">Config</TabsTrigger>
        </TabsList>

        {/* ══════════ DASHBOARD ══════════ */}
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardTab
            totalRevenue={totalRevenue}
            totalExpenses={totalExpenses}
            resultado={resultado}
            networkMRR={networkMRR}
            overdueCount={overdueCount}
            asaasPayments={asaasPayments}
            revenues={revenues}
            expenses={expenses}
            activeContracts={activeContracts}
            selectedMonth={selectedMonth}
            monthOptions={monthOptions}
            monthTotal={monthTotal}
            monthReceived={monthReceived}
            monthOverdue={monthOverdue}
          />
        </TabsContent>

        {/* ══════════ RECEITAS ══════════ */}
        <TabsContent value="receitas" className="space-y-4">
          <ReceitasTab
            asaasPayments={asaasPayments}
            revenues={revenues}
            selectedMonth={selectedMonth}
            la={la}
            refetchAsaas={refetchAsaas}
            createRevenue={createRevenue}
            updateRevenue={updateRevenue}
            deleteRevenue={deleteRevenue}
            toast={toast}
          />
        </TabsContent>

        {/* ══════════ DESPESAS ══════════ */}
        <TabsContent value="despesas" className="space-y-4">
          <DespesasTab
            expenses={expenses}
            selectedMonth={selectedMonth}
            createExpense={createExpense}
            updateExpense={updateExpense}
            deleteExpense={deleteExpense}
            toast={toast}
          />
        </TabsContent>

        {/* ══════════ REPASSE ══════════ */}
        <TabsContent value="repasse" className="space-y-6">
          <RepasseTab orgId={orgId} />
        </TabsContent>

        {/* ══════════ FECHAMENTOS ══════════ */}
        <TabsContent value="fechamentos" className="space-y-6">
          <FechamentosTab
            contracts={contracts}
            closings={closings}
            units={units}
            orgId={orgId}
          />
        </TabsContent>

        {/* ══════════ CLIENTES ══════════ */}
        <TabsContent value="clientes" className="space-y-6">
          <ClientesTab asaasPayments={asaasPayments} la={la} refetchAsaas={refetchAsaas} chargeClient={chargeClient} activeContracts={activeContracts} selectedMonth={selectedMonth} />
        </TabsContent>

        {/* ══════════ CONFIGURAÇÕES ══════════ */}
        <TabsContent value="configuracoes" className="space-y-6">
          <ConfigTab org={org} loadingOrg={loadingOrg} updateOrg={updateOrg} toast={toast} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* DASHBOARD TAB                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

function DashboardTab({ totalRevenue, totalExpenses, resultado, networkMRR, overdueCount, asaasPayments, revenues, expenses, activeContracts, selectedMonth, monthOptions, monthTotal, monthReceived, monthOverdue }: any) {
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const asaasRec = (asaasPayments ?? [])
        .filter((p: any) => (p.paymentDate || p.dueDate || "").startsWith(prefix) && ASAAS_PAID_STATUSES.includes(p.status))
        .reduce((s: number, p: any) => s + p.value, 0);
      const manualRec = (revenues ?? [])
        .filter((r: any) => (r.date || "").startsWith(prefix) && r.status === "paid")
        .reduce((s: number, r: any) => s + Number(r.amount), 0);
      const desp = (expenses ?? []).filter((e: any) => (e.date || "").startsWith(prefix)).reduce((s: number, e: any) => s + Number(e.amount), 0);
      return { name: months[d.getMonth()], receitas: asaasRec + manualRec, despesas: desp };
    });
  }, [asaasPayments, revenues, expenses]);

  const pieData = useMemo(() => {
    const cats: Record<string, number> = { "Manual": 0 };
    (asaasPayments ?? []).filter((p: any) => ASAAS_PAID_STATUSES.includes(p.status)).forEach((p: any) => {
      const cat = p.billingType || "Outros";
      cats[cat] = (cats[cat] || 0) + p.value;
    });
    const manualTotal = (revenues ?? []).filter((r: any) => r.status === "paid").reduce((s: number, r: any) => s + Number(r.amount), 0);
    if (manualTotal > 0) cats["Manual"] = manualTotal;
    else delete cats["Manual"];
    return Object.entries(cats).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [asaasPayments, revenues]);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KpiCard label="MRR da Rede" value={formatBRL(networkMRR)} sublabel={`${activeContracts.length} contratos ativos`} accent />
        <KpiCard label="Cobranças do Mês" value={formatBRL(monthTotal)} sublabel="total no período" />
        <KpiCard label="Recebidas" value={formatBRL(monthReceived)} trend="up" sublabel="confirmadas" />
        <KpiCard label="Atrasadas" value={formatBRL(monthOverdue)} sublabel={overdueCount > 0 ? `${overdueCount} cobranças` : "nenhuma"} />
        <KpiCard label="Despesas" value={formatBRL(totalExpenses)} sublabel={selectedMonth !== "all" ? monthOptions.find((o: any) => o.value === selectedMonth)?.label : undefined} />
        <KpiCard label="Resultado" value={formatBRL(resultado)} trend={resultado >= 0 ? "up" : "down"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receitas vs Despesas (últimos 6 meses)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <ReTooltip formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receitas por Tipo</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <RePieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip formatter={(v: number) => formatBRL(v)} />
              </RePieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Receita de Contratos Ativos</h3>
        {activeContracts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum contrato ativo na rede.</p>
        ) : (
          <div className="space-y-2">
            {activeContracts.slice(0, 8).map((c: any) => (
              <div key={c.id} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <span className="text-sm font-medium">{c.signer_name || c.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">{c.org_name || "Matriz"}</span>
                </div>
                <span className="text-sm font-medium text-primary">{c.monthly_value ? formatBRL(Number(c.monthly_value)) : "—"}/mês</span>
              </div>
            ))}
            {activeContracts.length > 8 && <p className="text-xs text-muted-foreground text-center pt-2">+{activeContracts.length - 8} contratos</p>}
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* RECEITAS TAB — Asaas + Manual                                      */
/* ═══════════════════════════════════════════════════════════════════ */

const revCategories = ["Serviço", "Consultoria", "Licença", "Comissão", "Outros"];

function ReceitasTab({ asaasPayments, revenues, selectedMonth, la, refetchAsaas, createRevenue, updateRevenue, deleteRevenue, toast }: any) {
  const [search, setSearch] = useState("");
  const [revDialog, setRevDialog] = useState(false);
  const [editingRev, setEditingRev] = useState<any>(null);
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
    const manualList: UnifiedEntry[] = ((revenues ?? []) as any[]).map(r => ({
      id: r.id, description: r.description || "—", value: Number(r.amount),
      date: r.date || "", status: r.status || "pending",
      source: "manual" as const, category: r.category,
    }));
    let list = [...asaasList, ...manualList];
    if (selectedMonth !== "all") list = list.filter(e => e.date.startsWith(selectedMonth));
    if (search) list = list.filter(e => e.description.toLowerCase().includes(search.toLowerCase()) || (e.orgName || "").toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [asaasPayments, revenues, selectedMonth, search]);

  const totalPaid = useMemo(() => unified.filter(e => e.status === "paid").reduce((s, e) => s + e.value, 0), [unified]);
  const totalPending = useMemo(() => unified.filter(e => e.status === "pending").reduce((s, e) => s + e.value, 0), [unified]);
  const totalOverdue = useMemo(() => unified.filter(e => e.status === "overdue").reduce((s, e) => s + e.value, 0), [unified]);

  const openNewRev = () => { setEditingRev(null); setRevForm({ description: "", amount: 0, category: "Serviço", status: "pending", date: "", payment_method: "" }); setRevDialog(true); };
  const openEditRev = (r: any) => { setEditingRev(r); setRevForm({ description: r.description, amount: Number(r.amount), category: r.category || "Serviço", status: r.status || "pending", date: r.date || "", payment_method: r.payment_method || "" }); setRevDialog(true); };

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
          <Input placeholder="Buscar por descrição ou cliente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
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
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(entry.invoiceUrl || entry.bankSlipUrl!, "_blank")}><ExternalLink className="w-3.5 h-3.5" /></Button>
                        )}
                        {entry.source === "manual" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                              const rev = (revenues ?? []).find((r: any) => r.id === entry.id);
                              if (rev) openEditRev(rev);
                            }}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(entry.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

/* ═══════════════════════════════════════════════════════════════════ */
/* DESPESAS TAB                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

function DespesasTab({ expenses, selectedMonth, createExpense, updateExpense, deleteExpense, toast }: any) {
  const [search, setSearch] = useState("");
  const [expDialog, setExpDialog] = useState(false);
  const [editingExp, setEditingExp] = useState<any>(null);
  const [expForm, setExpForm] = useState({ description: "", amount: 0, category: "Plataformas", status: "pending", is_recurring: false, date: "" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = (expenses ?? []).filter((e: any) => selectedMonth === "all" || (e.date || "").startsWith(selectedMonth));
    if (search) list = list.filter((e: any) => e.description?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [expenses, selectedMonth, search]);

  const openNewExp = () => { setEditingExp(null); setExpForm({ description: "", amount: 0, category: "Plataformas", status: "pending", is_recurring: false, date: "" }); setExpDialog(true); };
  const openEditExp = (e: any) => { setEditingExp(e); setExpForm({ description: e.description, amount: Number(e.amount), category: e.category || "Plataformas", status: e.status || "pending", is_recurring: !!e.is_recurring, date: e.date || "" }); setExpDialog(true); };

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
          <Input placeholder="Buscar despesa..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
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
              {filtered.map((e: any) => (
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditExp(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

/* ═══════════════════════════════════════════════════════════════════ */
/* REPASSE TAB                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

function RepasseTab({ orgId }: { orgId: string | null | undefined }) {
  const qc = useQueryClient();
  const [billingType, setBillingType] = useState("BOLETO");
  const [pixDialog, setPixDialog] = useState<{ open: boolean; paymentId: string | null }>({ open: false, paymentId: null });
  const [copied, setCopied] = useState(false);

  const { data: charges, isLoading } = useQuery({
    queryKey: ["franchisee-charges", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franchisee_charges")
        .select("*, franchisee_org:organizations!franchisee_charges_franchisee_org_id_fkey(name)")
        .eq("organization_id", orgId!)
        .order("month", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const generateCharges = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("asaas-charge-franchisee", {
        body: { organization_id: orgId, month: currentMonth, billing_type: billingType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      const created = data.results?.filter((r: any) => r.status === "created").length || 0;
      const skipped = data.results?.filter((r: any) => r.status === "skipped").length || 0;
      sonnerToast.success(`${created} cobranças geradas, ${skipped} ignoradas`);
      qc.invalidateQueries({ queryKey: ["franchisee-charges"] });
    },
    onError: (err: any) => sonnerToast.error(`Erro: ${err.message}`),
  });

  const fetchPix = useQuery({
    queryKey: ["pix-qr", pixDialog.paymentId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("asaas-get-pix", { body: { payment_id: pixDialog.paymentId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { encoded_image: string | null; copy_paste: string | null };
    },
    enabled: !!pixDialog.paymentId && pixDialog.open,
  });

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    sonnerToast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const totalPending = charges?.filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + Number(c.total_amount), 0) ?? 0;
  const totalPaid = charges?.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.total_amount), 0) ?? 0;

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendente", icon: <Clock className="w-3 h-3" />, variant: "outline" },
    paid: { label: "Pago", icon: <CheckCircle className="w-3 h-3" />, variant: "default" },
    overdue: { label: "Vencido", icon: <AlertTriangle className="w-3 h-3" />, variant: "destructive" },
  };

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm text-muted-foreground">Cobranças automáticas de royalties e sistema para franqueados</p>
        <div className="flex items-center gap-3">
          <Select value={billingType} onValueChange={setBillingType}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BOLETO">Boleto</SelectItem>
              <SelectItem value="PIX">PIX</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => generateCharges.mutate()} disabled={generateCharges.isPending} className="gap-2">
            {generateCharges.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gerar Cobranças do Mês
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pendente</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold text-foreground">{formatBRL(totalPending)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Recebido</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold text-emerald-600">{formatBRL(totalPaid)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cobranças Geradas</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold text-foreground">{charges?.length ?? 0}</span></CardContent></Card>
      </div>

      {!charges || charges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhuma cobrança gerada</h3>
          <p className="text-sm text-muted-foreground">Clique em "Gerar Cobranças do Mês" para criar cobranças automáticas.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Franqueado</TableHead>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Royalties</TableHead>
                  <TableHead className="text-right">Sistema</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead className="text-center">PIX</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge: any) => {
                  const st = statusConfig[charge.status] || statusConfig.pending;
                  const franchiseeName = charge.franchisee_org?.name || "—";
                  const canShowPix = charge.asaas_payment_id && charge.status === "pending";
                  return (
                    <TableRow key={charge.id}>
                      <TableCell className="font-medium">{franchiseeName}</TableCell>
                      <TableCell>{charge.month}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(Number(charge.royalty_amount))}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(Number(charge.system_fee))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatBRL(Number(charge.total_amount))}</TableCell>
                      <TableCell><Badge variant={st.variant} className="gap-1">{st.icon} {st.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{charge.paid_at ? new Date(charge.paid_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-center">
                        {canShowPix ? (
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setCopied(false); setPixDialog({ open: true, paymentId: charge.asaas_payment_id }); }}>
                            <QrCode className="w-4 h-4" /> Ver PIX
                          </Button>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* PIX QR Code Dialog */}
      <Dialog open={pixDialog.open} onOpenChange={(open) => setPixDialog({ open, paymentId: open ? pixDialog.paymentId : null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><QrCode className="w-5 h-5" /> QR Code PIX</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {fetchPix.isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : fetchPix.data?.encoded_image ? (
              <>
                <img src={`data:image/png;base64,${fetchPix.data.encoded_image}`} alt="QR Code PIX" className="w-56 h-56 rounded-lg border" />
                {fetchPix.data.copy_paste && (
                  <Button variant="outline" className="w-full gap-2" onClick={() => handleCopy(fetchPix.data!.copy_paste!)}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado!" : "Copiar código PIX"}
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center">QR Code não disponível.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* FECHAMENTOS TAB                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

function FechamentosTab({ contracts, closings, units, orgId }: any) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const unitFeeMap = useMemo(() => {
    const map: Record<string, number> = {};
    (units ?? []).forEach((u: any) => { if (u.unit_org_id) map[u.unit_org_id] = Number(u.system_fee ?? 250); });
    return map;
  }, [units]);

  const consolidation = useMemo(() => {
    if (!contracts) return [];
    const active = contracts.filter((c: any) => c.status === "active" || c.status === "signed");
    const byOrg: Record<string, { orgName: string; orgId: string; contracts: number; mrr: number; royalty: number; systemFee: number }> = {};
    active.forEach((c: any) => {
      const key = c.org_name || c.organization_id;
      if (!byOrg[key]) {
        const fee = unitFeeMap[c.organization_id] ?? 250;
        byOrg[key] = { orgName: c.org_name || "—", orgId: c.organization_id, contracts: 0, mrr: 0, royalty: 0, systemFee: fee };
      }
      byOrg[key].contracts++;
      byOrg[key].mrr += Number(c.monthly_value || 0);
    });
    Object.values(byOrg).forEach(o => { o.royalty = o.mrr * 0.1; });
    return Object.values(byOrg).sort((a, b) => b.mrr - a.mrr);
  }, [contracts, unitFeeMap]);

  const totalMRR = consolidation.reduce((s, c) => s + c.mrr, 0);
  const totalRoyalties = consolidation.reduce((s, c) => s + c.royalty, 0);
  const totalSystemFees = consolidation.reduce((s, c) => s + c.systemFee, 0);

  const selectedUnitName = useMemo(() => {
    const u = (units ?? []).find((u: any) => u.id === selectedUnitId);
    return (u as any)?.name || "";
  }, [units, selectedUnitId]);

  const handleUnitOrMonthChange = (unitId: string, m: string, y: string) => {
    const u = (units ?? []).find((u: any) => u.id === unitId);
    const name = (u as any)?.name || "";
    if (name) setTitle(`DRE ${name} - ${MONTH_NAMES[Number(m) - 1]}/${y}`);
  };

  const handleSave = async () => {
    if (!selectedUnitId || !orgId) { sonnerToast.error("Selecione uma unidade"); return; }
    setSaving(true);
    try {
      let fileUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${orgId}/${selectedUnitId}/${year}-${month}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("closing-files").upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("closing-files").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("finance_closings").insert({
        organization_id: orgId, unit_id: selectedUnitId, month: Number(month), year: Number(year),
        title: title || `DRE ${selectedUnitName} - ${MONTH_NAMES[Number(month) - 1]}/${year}`,
        file_url: fileUrl, notes: notes || null, status: "published",
      });
      if (error) throw error;
      sonnerToast.success("Fechamento publicado com sucesso!");
      qc.invalidateQueries({ queryKey: ["finance-closings"] });
      setDialogOpen(false);
    } catch (e: any) {
      sonnerToast.error(`Erro: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Consolidação mensal por unidade — royalties e taxas</p>
        <Button onClick={() => { setSelectedUnitId(""); setMonth(String(new Date().getMonth() + 1)); setYear(String(new Date().getFullYear())); setTitle(""); setNotes(""); setFile(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Fechamento
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="MRR Rede" value={formatBRL(totalMRR)} accent />
        <KpiCard label="Royalties (10%)" value={formatBRL(totalRoyalties)} />
        <KpiCard label="Taxas Sistema" value={formatBRL(totalSystemFees)} />
        <KpiCard label="Unidades Ativas" value={String(consolidation.length)} />
      </div>

      {consolidation.length > 0 && (
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">Unidade</th>
              <th className="text-center py-3 px-4 font-medium">Contratos</th>
              <th className="text-right py-3 px-4 font-medium">MRR</th>
              <th className="text-right py-3 px-4 font-medium">Royalty (10%)</th>
              <th className="text-right py-3 px-4 font-medium">Taxa Sistema</th>
              <th className="text-right py-3 px-4 font-medium">Total Devido</th>
            </tr></thead>
            <tbody>
              {consolidation.map((c, i) => (
                <tr key={i} className="border-b hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />{c.orgName}</td>
                  <td className="py-3 px-4 text-center">{c.contracts}</td>
                  <td className="py-3 px-4 text-right">{formatBRL(c.mrr)}</td>
                  <td className="py-3 px-4 text-right text-amber-600">{formatBRL(c.royalty)}</td>
                  <td className="py-3 px-4 text-right text-blue-600">{formatBRL(c.systemFee)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatBRL(c.royalty + c.systemFee)}</td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-semibold">
                <td className="py-3 px-4">Total</td>
                <td className="py-3 px-4 text-center">{consolidation.reduce((s, c) => s + c.contracts, 0)}</td>
                <td className="py-3 px-4 text-right">{formatBRL(totalMRR)}</td>
                <td className="py-3 px-4 text-right text-amber-600">{formatBRL(totalRoyalties)}</td>
                <td className="py-3 px-4 text-right text-blue-600">{formatBRL(totalSystemFees)}</td>
                <td className="py-3 px-4 text-right">{formatBRL(totalRoyalties + totalSystemFees)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {(closings ?? []).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Arquivos de Fechamento</h3>
          {closings.map((cl: any) => (
            <Card key={cl.id} className="glass-card">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileDown className="w-5 h-5 text-primary" /></div>
                  <div><p className="font-medium text-sm">{cl.title}</p><p className="text-xs text-muted-foreground">{MONTH_NAMES[(cl.month ?? 1) - 1]}/{cl.year}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cl.status === "published" ? "default" : "secondary"}>{cl.status === "published" ? "Publicado" : "Pendente"}</Badge>
                  {cl.file_url && <Button size="sm" variant="outline" asChild><a href={cl.file_url} target="_blank" rel="noreferrer"><FileDown className="w-4 h-4 mr-1" />Baixar</a></Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Novo Fechamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Fechamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Unidade *</Label>
              <Select value={selectedUnitId} onValueChange={(v) => { setSelectedUnitId(v); handleUnitOrMonthChange(v, month, year); }}>
                <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                <SelectContent>{(units ?? []).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Mês</Label>
                <Select value={month} onValueChange={(v) => { setMonth(v); handleUnitOrMonthChange(selectedUnitId, v, year); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Ano</Label><Input type="number" value={year} onChange={(e) => { setYear(e.target.value); handleUnitOrMonthChange(selectedUnitId, month, e.target.value); }} /></div>
            </div>
            <div className="space-y-1.5"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="DRE Unidade - Mês/Ano" /></div>
            <div className="space-y-1.5">
              <Label>Arquivo (PDF / Excel)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? <p className="text-sm font-medium">{file.name}</p> : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground"><Upload className="w-5 h-5" /><span className="text-xs">Clique para selecionar</span></div>
                )}
              </div>
            </div>
            <div className="space-y-1.5"><Label>Observações</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionais..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !selectedUnitId}>{saving ? "Publicando..." : "Publicar Fechamento"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* CLIENTES TAB                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

function ClientesTab({ activeContracts, chargeClient, refetchAsaas }: any) {
  const [chargeContract, setChargeContract] = useState<any>(null);
  const [chargeBillingType, setChargeBillingType] = useState("PIX");
  const [chargeResult, setChargeResult] = useState<any>(null);

  const submitCharge = () => {
    if (!chargeContract) return;
    chargeClient.mutate(
      { contract_id: chargeContract.id, billing_type: chargeBillingType, organization_id: chargeContract.organization_id },
      {
        onSuccess: (data: any) => { setChargeResult(data); refetchAsaas(); },
        onError: () => {},
      }
    );
  };

  const copyPixCode = (code: string) => { navigator.clipboard.writeText(code); sonnerToast.success("Código PIX copiado!"); };

  if (activeContracts.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Users className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">Nenhum cliente vinculado</h3>
        <p className="text-sm text-muted-foreground">Adicione contratos ativos para visualizar seus clientes.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">Todos os clientes vinculados a contratos ativos (internos, SaaS, franquias)</p>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left py-3 px-4 font-medium">Cliente (Signatário)</th>
            <th className="text-left py-3 px-4 font-medium">Contrato</th>
            <th className="text-left py-3 px-4 font-medium">Unidade</th>
            <th className="text-right py-3 px-4 font-medium">Valor Mensal</th>
            <th className="text-center py-3 px-4 font-medium">Tipo</th>
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
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setChargeContract(c); setChargeBillingType("PIX"); setChargeResult(null); }} disabled={!c.monthly_value || Number(c.monthly_value) <= 0}>
                    <CreditCard className="w-3.5 h-3.5" /> Emitir Cobrança
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charge Dialog */}
      <Dialog open={!!chargeContract} onOpenChange={(open) => { if (!open) { setChargeContract(null); setChargeResult(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{chargeResult ? "Cobrança Gerada" : "Emitir Cobrança"}</DialogTitle>
            <DialogDescription>{chargeResult ? `Cobrança para ${chargeContract?.signer_name || "cliente"} gerada.` : `Gerar cobrança para "${chargeContract?.title}"`}</DialogDescription>
          </DialogHeader>
          {!chargeResult ? (
            <div className="space-y-4">
              <div><Label>Valor</Label><p className="text-lg font-semibold text-emerald-500">{chargeContract?.monthly_value ? formatBRL(Number(chargeContract.monthly_value)) : "—"}</p></div>
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
                        <Input readOnly value={chargeResult.pix_copy_paste} className="text-xs font-mono" />
                        <Button variant="outline" size="icon" onClick={() => copyPixCode(chargeResult.pix_copy_paste)}><Copy className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">{chargeBillingType === "BOLETO" ? "Boleto gerado." : "Link de pagamento gerado."}</p>
                  {chargeResult.invoice_url && (
                    <Button variant="outline" className="gap-2" onClick={() => window.open(chargeResult.invoice_url, "_blank")}><ExternalLink className="w-4 h-4" /> Abrir Fatura</Button>
                  )}
                </div>
              )}
              <DialogFooter><Button variant="outline" onClick={() => { setChargeContract(null); setChargeResult(null); }}>Fechar</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* CONFIGURAÇÕES TAB                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

interface FinanceSettings {
  impostoPercent: number;
  repasseFranqueado: number;
  repasseParceiro: number;
  capacidade: number;
  runwayMinimo: number;
  margemMinima: number;
}

const DEFAULTS: FinanceSettings = { impostoPercent: 10, repasseFranqueado: 20, repasseParceiro: 10, capacidade: 30, runwayMinimo: 2, margemMinima: 15 };

function ConfigTab({ org, loadingOrg, updateOrg, toast }: any) {
  const [settings, setSettings] = useState<FinanceSettings>(DEFAULTS);

  useMemo(() => {
    if (org?.finance_settings && typeof org.finance_settings === "object") {
      const saved = org.finance_settings as Record<string, unknown>;
      setSettings({
        impostoPercent: (saved.impostoPercent as number) ?? DEFAULTS.impostoPercent,
        repasseFranqueado: (saved.repasseFranqueado as number) ?? DEFAULTS.repasseFranqueado,
        repasseParceiro: (saved.repasseParceiro as number) ?? DEFAULTS.repasseParceiro,
        capacidade: (saved.capacidade as number) ?? DEFAULTS.capacidade,
        runwayMinimo: (saved.runwayMinimo as number) ?? DEFAULTS.runwayMinimo,
        margemMinima: (saved.margemMinima as number) ?? DEFAULTS.margemMinima,
      });
    }
  }, [org]);

  const handleSave = () => {
    updateOrg.mutate(
      { finance_settings: settings } as any,
      {
        onSuccess: () => toast({ title: "Configurações salvas com sucesso!" }),
        onError: () => toast({ title: "Erro ao salvar configurações", variant: "destructive" }),
      }
    );
  };

  const set = (key: keyof FinanceSettings, value: number) => setSettings(prev => ({ ...prev, [key]: value }));

  if (loadingOrg) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Motor do sistema — Regras e parâmetros financeiros</p>
        <Button size="sm" className="gap-2" onClick={handleSave} disabled={updateOrg.isPending}>
          {updateOrg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
        </Button>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Regra de Imposto</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Percentual de imposto</label>
            <div className="flex items-center gap-2">
              <Input type="number" value={settings.impostoPercent} onChange={(e) => set("impostoPercent", Number(e.target.value))} className="w-24" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Base de cálculo</label>
            <p className="text-sm text-foreground">Faturamento com NF + Folha Operacional</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Repasse</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">% Repasse Franqueado</label>
            <div className="flex items-center gap-2">
              <Input type="number" value={settings.repasseFranqueado} onChange={(e) => set("repasseFranqueado", Number(e.target.value))} className="w-24" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">% Repasse Parceiro</label>
            <div className="flex items-center gap-2">
              <Input type="number" value={settings.repasseParceiro} onChange={(e) => set("repasseParceiro", Number(e.target.value))} className="w-24" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Capacidade e Limiares</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Capacidade máxima clientes</label>
            <Input type="number" value={settings.capacidade} onChange={(e) => set("capacidade", Number(e.target.value))} className="w-32" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Runway mínimo (meses)</label>
            <Input type="number" value={settings.runwayMinimo} onChange={(e) => set("runwayMinimo", Number(e.target.value))} className="w-24" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Margem mínima (%)</label>
            <Input type="number" value={settings.margemMinima} onChange={(e) => set("margemMinima", Number(e.target.value))} className="w-24" />
          </div>
        </div>
      </div>
    </>
  );
}
