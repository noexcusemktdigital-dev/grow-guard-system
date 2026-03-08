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
import { useFinanceExpenses, useFinanceMutations, useFinanceClosings } from "@/hooks/useFinance";
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
  const { data: contracts, isLoading: lc } = useNetworkContracts();
  const { createExpense, updateExpense, deleteExpense } = useFinanceMutations();
  const chargeClient = useChargeClient();
  const { data: asaasPayments, isLoading: la, refetch: refetchAsaas } = useAsaasNetworkPayments();
  const { data: closings, isLoading: loadingClosings } = useFinanceClosings();
  const { data: units, isLoading: loadingUnits } = useUnits();
  const { data: org, isLoading: loadingOrg, update: updateOrg } = useOrgProfile();

  const [selectedMonth, setSelectedMonth] = useState("all");
  const monthOptions = useMemo(getMonthOptions, []);

  const isLoading = le || lc;
  const activeContracts = useMemo(() => (contracts ?? []).filter((c: any) => c.status === "active" || c.status === "signed"), [contracts]);

  const filteredExpenses = useMemo(() => {
    if (selectedMonth === "all") return expenses ?? [];
    return (expenses ?? []).filter(e => (e.date || "").startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const filteredAsaas = useMemo(() => {
    if (selectedMonth === "all") return asaasPayments ?? [];
    return (asaasPayments ?? []).filter(p => (p.paymentDate || p.dueDate || "").startsWith(selectedMonth));
  }, [asaasPayments, selectedMonth]);

  const totalRevenue = useMemo(() => filteredAsaas.filter(p => ASAAS_PAID_STATUSES.includes(p.status)).reduce((s, p) => s + p.value, 0), [filteredAsaas]);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const resultado = totalRevenue - totalExpenses;
  const networkMRR = activeContracts.reduce((s: number, c: any) => s + Number(c.monthly_value || 0), 0);
  const overdueCount = useMemo(() => (asaasPayments ?? []).filter(p => p.status === "OVERDUE").length, [asaasPayments]);

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
            expenses={expenses}
            activeContracts={activeContracts}
            selectedMonth={selectedMonth}
            monthOptions={monthOptions}
          />
        </TabsContent>

        {/* ══════════ RECEITAS ══════════ */}
        <TabsContent value="receitas" className="space-y-4">
          <ReceitasTab
            asaasPayments={asaasPayments}
            selectedMonth={selectedMonth}
            la={la}
            refetchAsaas={refetchAsaas}
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
          <ClientesTab activeContracts={activeContracts} chargeClient={chargeClient} refetchAsaas={refetchAsaas} />
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

function DashboardTab({ totalRevenue, totalExpenses, resultado, networkMRR, overdueCount, asaasPayments, expenses, activeContracts, selectedMonth, monthOptions }: any) {
  // Chart data: last 6 months — receitas from Asaas, despesas from manual
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const rec = (asaasPayments ?? [])
        .filter((p: any) => (p.paymentDate || p.dueDate || "").startsWith(prefix) && ASAAS_PAID_STATUSES.includes(p.status))
        .reduce((s: number, p: any) => s + p.value, 0);
      const desp = (expenses ?? []).filter((e: any) => (e.date || "").startsWith(prefix)).reduce((s: number, e: any) => s + Number(e.amount), 0);
      return { name: months[d.getMonth()], receitas: rec, despesas: desp };
    });
  }, [asaasPayments, expenses]);

  // Revenue composition by billing type from Asaas
  const pieData = useMemo(() => {
    const cats: Record<string, number> = {};
    (asaasPayments ?? []).filter((p: any) => ASAAS_PAID_STATUSES.includes(p.status)).forEach((p: any) => {
      const cat = p.billingType || "Outros";
      cats[cat] = (cats[cat] || 0) + p.value;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [asaasPayments]);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="MRR da Rede" value={formatBRL(networkMRR)} sublabel={`${activeContracts.length} contratos ativos`} accent />
        <KpiCard label="Receitas (Asaas)" value={formatBRL(totalRevenue)} trend="up" sublabel={selectedMonth !== "all" ? monthOptions.find((o: any) => o.value === selectedMonth)?.label : undefined} />
        <KpiCard label="Despesas" value={formatBRL(totalExpenses)} sublabel={selectedMonth !== "all" ? monthOptions.find((o: any) => o.value === selectedMonth)?.label : undefined} />
        <KpiCard label="Resultado" value={formatBRL(resultado)} trend={resultado >= 0 ? "up" : "down"} />
        <KpiCard label="Inadimplentes" value={String(overdueCount)} sublabel={overdueCount > 0 ? "cobranças vencidas" : "nenhuma"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
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

        {/* Pie chart — by billing type */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receitas por Tipo de Cobrança</h3>
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

      {/* Active contracts preview */}
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
                <span className="text-sm font-medium text-emerald-500">{c.monthly_value ? formatBRL(Number(c.monthly_value)) : "—"}/mês</span>
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
/* RECEITAS TAB — Asaas only                                          */
/* ═══════════════════════════════════════════════════════════════════ */

function ReceitasTab({ asaasPayments, selectedMonth, la, refetchAsaas }: any) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = (asaasPayments ?? []) as AsaasPayment[];
    if (selectedMonth !== "all") {
      list = list.filter(p => (p.paymentDate || p.dueDate || "").startsWith(selectedMonth));
    }
    if (search) {
      list = list.filter(p => (p.description || p.orgName || "").toLowerCase().includes(search.toLowerCase()));
    }
    return list.sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || ""));
  }, [asaasPayments, selectedMonth, search]);

  const totalPaid = useMemo(() => filtered.filter(p => ASAAS_PAID_STATUSES.includes(p.status)).reduce((s, p) => s + p.value, 0), [filtered]);
  const totalPending = useMemo(() => filtered.filter(p => !ASAAS_PAID_STATUSES.includes(p.status) && p.status !== "REFUNDED").reduce((s, p) => s + p.value, 0), [filtered]);

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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Recebido</CardTitle></CardHeader><CardContent><span className="text-xl font-bold text-emerald-600">{formatBRL(totalPaid)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pendente</CardTitle></CardHeader><CardContent><span className="text-xl font-bold text-yellow-600">{formatBRL(totalPending)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cobranças</CardTitle></CardHeader><CardContent><span className="text-xl font-bold text-foreground">{filtered.length}</span></CardContent></Card>
      </div>

      {la && !asaasPayments ? (
        <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Inbox className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma cobrança encontrada no Asaas.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">Descrição / Cliente</th>
              <th className="text-left py-3 px-4 font-medium">Tipo</th>
              <th className="text-right py-3 px-4 font-medium">Valor</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">Vencimento</th>
              <th className="text-left py-3 px-4 font-medium">Pagamento</th>
              <th className="text-center py-3 px-4 font-medium">Fatura</th>
            </tr></thead>
            <tbody>
              {filtered.map(p => {
                const st = asaasStatusLabel(p.status);
                return (
                  <tr key={p.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="font-medium">{p.description || p.orgName || "—"}</div>
                      {p.orgName && p.description && <div className="text-xs text-muted-foreground">{p.orgName}</div>}
                    </td>
                    <td className="py-3 px-4"><Badge variant="outline" className="text-[10px]">{p.billingType || "—"}</Badge></td>
                    <td className="py-3 px-4 text-right text-emerald-500 font-medium">{formatBRL(p.value)}</td>
                    <td className="py-3 px-4 text-center"><span className={`text-xs px-2 py-0.5 rounded ${st.cls}`}>{st.label}</span></td>
                    <td className="py-3 px-4 text-muted-foreground">{p.dueDate ? new Date(p.dueDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.paymentDate ? new Date(p.paymentDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      {(p.invoiceUrl || p.bankSlipUrl) ? (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(p.invoiceUrl || p.bankSlipUrl!, "_blank")}><ExternalLink className="w-3.5 h-3.5" /></Button>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
