import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSignature, DollarSign, TrendingUp, Calendar, Inbox, FileDown, CheckCircle, Clock, AlertCircle, Receipt } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { useFinanceClosings } from "@/hooks/useFinance";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function FranqueadoFinanceiro() {
  const { data: contracts, isLoading: loadingCon } = useContracts();
  const { data: closings, isLoading: loadingCl } = useFinanceClosings();

  const [paymentMonth, setPaymentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

  const isLoading = loadingCon || loadingCl;

  const activeContracts = useMemo(() => (contracts ?? []).filter(c => c.status === "active"), [contracts]);

  // KPIs
  const mrr = useMemo(() => activeContracts.reduce((s, c) => s + Number((c as any).monthly_value || 0), 0), [activeContracts]);
  const ticketMedio = activeContracts.length > 0 ? mrr / activeContracts.length : 0;
  const previsao3m = mrr * 3;

  // Chart - last 6 months of MRR (simplified: assumes current active contracts were active)
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      // Count contracts that were active in that month
      const monthMrr = activeContracts.reduce((s, c) => {
        const start = (c as any).start_date ? new Date((c as any).start_date) : null;
        const end = (c as any).end_date ? new Date((c as any).end_date) : null;
        if (start && start <= new Date(y, m + 1, 0) && (!end || end >= new Date(y, m, 1))) {
          return s + Number((c as any).monthly_value || 0);
        }
        return s;
      }, 0);
      return { name: `${monthNames[m]}/${String(y).slice(2)}`, Receita: monthMrr };
    });
  }, [activeContracts]);

  // Payment control - generate expected payments for selected month
  const payments = useMemo(() => {
    const [year, month] = paymentMonth.split("-").map(Number);
    return activeContracts.map(c => {
      const payDay = (c as any).payment_day || 10;
      const startDate = (c as any).start_date ? new Date((c as any).start_date) : null;
      const endDate = (c as any).end_date ? new Date((c as any).end_date) : null;
      const paymentDate = new Date(year, month - 1, payDay);

      // Check if contract is active in this month
      if (startDate && startDate > new Date(year, month - 1 + 1, 0)) return null;
      if (endDate && endDate < new Date(year, month - 1, 1)) return null;

      const today = new Date();
      const isPast = paymentDate < today;
      // Simple status logic: past dates without explicit tracking = pendente
      const status = isPast ? "atrasado" : "pendente";

      return {
        id: `${c.id}-${paymentMonth}`,
        contractId: c.id,
        title: c.title,
        client: c.signer_name || "—",
        value: Number((c as any).monthly_value || 0),
        payDay,
        paymentDate,
        status,
      };
    }).filter(Boolean) as any[];
  }, [activeContracts, paymentMonth]);

  const filteredPayments = paymentStatusFilter === "all"
    ? payments
    : payments.filter(p => p.status === paymentStatusFilter);

  // Month options for filter
  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 3 + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      return { value: val, label };
    });
  }, []);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Financeiro Comercial" subtitle="Visão financeira baseada nos contratos e vendas da unidade" />

      <Tabs defaultValue="visao" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visao">Visão Geral</TabsTrigger>
          <TabsTrigger value="pagamentos">Controle de Pagamentos</TabsTrigger>
          <TabsTrigger value="fechamentos">Fechamentos</TabsTrigger>
        </TabsList>

        {/* ========== VISÃO GERAL ========== */}
        <TabsContent value="visao" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Receita Recorrente (MRR)" value={`R$ ${mrr.toLocaleString("pt-BR")}`} icon={DollarSign} delay={0} variant="accent" />
            <KpiCard label="Contratos Ativos" value={String(activeContracts.length)} icon={FileSignature} delay={1} />
            <KpiCard label="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`} icon={TrendingUp} delay={2} />
            <KpiCard label="Previsão 3 Meses" value={`R$ ${previsao3m.toLocaleString("pt-BR")}`} icon={Calendar} delay={3} />
          </div>

          {/* Active Contracts Table */}
          {activeContracts.length > 0 ? (
            <Card className="glass-card">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Contratos Ativos</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Valor Mensal</TableHead>
                      <TableHead>Dia Pagamento</TableHead>
                      <TableHead>Vigência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeContracts.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.signer_name || "—"}</TableCell>
                        <TableCell>{c.title}</TableCell>
                        <TableCell className="font-semibold text-primary">R$ {Number((c as any).monthly_value || 0).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Dia {(c as any).payment_day || "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {(c as any).start_date ? new Date((c as any).start_date).toLocaleDateString("pt-BR") : "—"} — {(c as any).end_date ? new Date((c as any).end_date).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-16">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum contrato ativo. Crie contratos no módulo "Meus Contratos".</p>
            </div>
          )}

          {/* Revenue Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Receita Recorrente (6 meses)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== CONTROLE DE PAGAMENTOS ========== */}
        <TabsContent value="pagamentos" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={paymentMonth} onValueChange={setPaymentMonth}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-1.5">
              {[
                { value: "all", label: "Todos" },
                { value: "pendente", label: "Pendente" },
                { value: "atrasado", label: "Atrasado" },
              ].map(s => (
                <Button key={s.value} size="sm" variant={paymentStatusFilter === s.value ? "default" : "outline"} onClick={() => setPaymentStatusFilter(s.value)}>
                  {s.label}
                </Button>
              ))}
            </div>
            <div className="ml-auto text-sm font-semibold text-primary">
              Total: R$ {filteredPayments.reduce((s, p) => s + p.value, 0).toLocaleString("pt-BR")}
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="text-center py-16">
              <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum pagamento esperado neste período.</p>
            </div>
          ) : (
            <Card className="glass-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Dia Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.client}</TableCell>
                      <TableCell>{p.title}</TableCell>
                      <TableCell className="font-semibold">R$ {p.value.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Dia {p.payDay}</Badge>
                      </TableCell>
                      <TableCell>
                        {p.status === "pendente" && (
                          <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pendente</Badge>
                        )}
                        {p.status === "atrasado" && (
                          <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Atrasado</Badge>
                        )}
                        {p.status === "pago" && (
                          <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 border-emerald-500/30"><CheckCircle className="w-3 h-3" />Pago</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ========== FECHAMENTOS ========== */}
        <TabsContent value="fechamentos" className="space-y-4">
          <p className="text-sm text-muted-foreground">Arquivos de fechamento (DRE) enviados pela franqueadora.</p>
          {(closings ?? []).length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Nenhum fechamento disponível</p>
              <p className="text-xs text-muted-foreground mt-1">Os documentos aparecerão aqui quando a franqueadora publicá-los.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {(closings ?? []).map(cl => (
                <Card key={cl.id} className="glass-card">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileDown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{cl.title}</p>
                        <p className="text-xs text-muted-foreground">{monthNames[(cl.month || 1) - 1]} / {cl.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={cl.status === "published" ? "default" : "secondary"}>
                        {cl.status === "published" ? "Disponível" : "Pendente"}
                      </Badge>
                      {cl.file_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={cl.file_url} target="_blank" rel="noreferrer"><FileDown className="w-4 h-4 mr-1" />Baixar</a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
