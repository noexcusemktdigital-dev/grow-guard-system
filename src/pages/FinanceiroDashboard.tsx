// @ts-nocheck
import { useState, useMemo } from "react";
import { formatBRL } from "@/lib/formatting";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinanceExpenses, useFinanceRevenues, useFinanceMutations, useFinanceClosings } from "@/hooks/useFinance";
import { useNetworkContracts } from "@/hooks/useContracts";
import { useChargeClient, useAsaasNetworkPayments } from "@/hooks/useClientPayments";
import { useUnits } from "@/hooks/useUnits";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useToast } from "@/hooks/use-toast";
import {
  type RevenueRow,
  ASAAS_PAID_STATUSES,
  getMonthOptions,
} from "./FinanceiroDashboardTypes";

import { DashboardTab } from "./FinanceiroDashboardDashboardTab";
import { ReceitasTab } from "./FinanceiroDashboardReceitas";
import { DespesasTab } from "./FinanceiroDashboardDespesas";
import { RepasseTab } from "./FinanceiroDashboardRepasse";
import { FechamentosTab } from "./FinanceiroDashboardFechamentos";
import { ClientesTab } from "./FinanceiroDashboardClientes";
import { ConfigTab } from "./FinanceiroDashboardConfig";

/* ═══════════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

export default function FinanceiroDashboard() {
  const { toast } = useToast();
  const { data: orgId } = useUserOrgId();

  const { data: expenses, isLoading: le } = useFinanceExpenses();
  const { data: revenues, isLoading: lr } = useFinanceRevenues();
  const { data: contracts, isLoading: lc } = useNetworkContracts();
  const { createRevenue, updateRevenue, deleteRevenue, createExpense, updateExpense, deleteExpense } = useFinanceMutations();
  const chargeClient = useChargeClient();
  const { data: asaasPayments, isLoading: la, refetch: refetchAsaas } = useAsaasNetworkPayments();
  const { data: closings } = useFinanceClosings();
  const { data: units } = useUnits();
  const { data: org, isLoading: loadingOrg, update: updateOrg } = useOrgProfile();

  const [selectedMonth, setSelectedMonth] = useState("all");
  const monthOptions = useMemo(getMonthOptions, []);

  const isLoading = le || lc || lr;
  const activeContracts = useMemo(() => (contracts ?? []).filter((c: Record<string, unknown>) => c.status === "active" || c.status === "signed"), [contracts]);

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
    return (revenues ?? []).filter((r: RevenueRow) => (r.date || "").startsWith(selectedMonth));
  }, [revenues, selectedMonth]);

  const totalAsaasPaid = useMemo(() => filteredAsaas.filter(p => ASAAS_PAID_STATUSES.includes(p.status)).reduce((s, p) => s + p.value, 0), [filteredAsaas]);
  const totalManualPaid = useMemo(() => filteredRevenues.filter((r: RevenueRow) => r.status === "paid").reduce((s: number, r: RevenueRow) => s + Number(r.amount), 0), [filteredRevenues]);
  const totalRevenue = totalAsaasPaid + totalManualPaid;
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const resultado = totalRevenue - totalExpenses;
  const networkMRR = useMemo(() => {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    return (asaasPayments ?? [])
      .filter(p => ASAAS_PAID_STATUSES.includes(p.status) && (p.dueDate || "").startsWith(currentMonth))
      .reduce((s, p) => s + p.value, 0);
  }, [asaasPayments]);
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

        <TabsContent value="repasse" className="space-y-6">
          <RepasseTab orgId={orgId} />
        </TabsContent>

        <TabsContent value="fechamentos" className="space-y-6">
          <FechamentosTab
            contracts={contracts}
            closings={closings}
            units={units}
            orgId={orgId}
          />
        </TabsContent>

        <TabsContent value="clientes" className="space-y-6">
          <ClientesTab asaasPayments={asaasPayments} la={la} refetchAsaas={refetchAsaas} chargeClient={chargeClient} selectedMonth={selectedMonth} />
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-6">
          <ConfigTab org={org} loadingOrg={loadingOrg} updateOrg={updateOrg} toast={toast} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
