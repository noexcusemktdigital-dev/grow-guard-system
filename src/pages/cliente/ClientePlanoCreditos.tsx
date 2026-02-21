import { useState } from "react";
import { CreditCard, Zap, ArrowUpRight, Plus, Calendar, Filter, Check, Star, Crown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import {
  mockSubscription, mockWallet, mockTransactions, mockPlans,
  getTrialDaysRemaining, getCreditConsumptionByModule,
} from "@/data/clienteData";

const typeLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  consumo: { label: "Consumo", variant: "destructive" },
  recarga: { label: "Recarga", variant: "default" },
  compra_extra: { label: "Compra Extra", variant: "secondary" },
  bonus: { label: "Bônus", variant: "outline" },
};

export default function ClientePlanoCreditos() {
  const [filterType, setFilterType] = useState<string>("todos");
  const trialDays = getTrialDaysRemaining();
  const trialTotal = 14;
  const trialProgress = ((trialTotal - trialDays) / trialTotal) * 100;
  const creditPercent = (mockWallet.currentBalance / mockWallet.totalIncluded) * 100;
  const pieData = getCreditConsumptionByModule();

  const filteredTx = filterType === "todos"
    ? mockTransactions
    : mockTransactions.filter(t => t.type === filterType);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title="Plano & Créditos" subtitle="Gerencie sua assinatura e créditos" icon={<CreditCard className="w-5 h-5 text-primary" />} />

      {/* Row 1: Plan Status + Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Status do Plano</CardTitle>
              <Badge variant={mockSubscription.status === "trial" ? "outline" : "default"} className="gap-1">
                {mockSubscription.status === "trial" ? "🧪 Trial" : mockSubscription.planName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plano ativo</span>
              <span className="font-semibold text-foreground">{mockSubscription.planName} — R$ {mockSubscription.price}/mês</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Renovação</span>
              <span className="text-foreground">{new Date(mockSubscription.renewalDate).toLocaleDateString("pt-BR")}</span>
            </div>
            {mockSubscription.status === "trial" && (
              <div className="space-y-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-amber-800 dark:text-amber-300">Trial: {trialDays} dias restantes</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400">{trialDays}/{trialTotal} dias</span>
                </div>
                <Progress value={trialProgress} className="h-1.5 [&>div]:bg-amber-500" />
              </div>
            )}
            <Button className="w-full gap-2" onClick={() => toast.success("Redirecionando para upgrade...")}>
              <ArrowUpRight className="w-4 h-4" /> Fazer Upgrade
            </Button>
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Wallet de Créditos</CardTitle>
              <Zap className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-foreground">{mockWallet.currentBalance.toLocaleString("pt-BR")}</span>
              <span className="text-sm text-muted-foreground">/ {mockWallet.totalIncluded.toLocaleString("pt-BR")}</span>
            </div>
            <Progress value={creditPercent} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Renovação: {new Date(mockWallet.renewalDate).toLocaleDateString("pt-BR")}</span>
              <span>{creditPercent.toFixed(0)}% utilizado</span>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={() => toast.success("Em breve — compra de créditos extras")}>
              <Plus className="w-4 h-4" /> Comprar Créditos Extra
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Consumption Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Consumo por Módulo</CardTitle>
          <CardDescription>Distribuição de créditos consumidos este mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} créditos`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.value} créditos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 3: Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-lg">Histórico de Transações</CardTitle>
              <CardDescription>Todos os movimentos de créditos</CardDescription>
            </div>
            <div className="flex gap-2">
              {["todos", "consumo", "recarga", "compra_extra", "bonus"].map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={filterType === t ? "default" : "outline"}
                  onClick={() => setFilterType(t)}
                  className="text-xs capitalize"
                >
                  {t === "todos" ? "Todos" : typeLabels[t]?.label || t}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTx.sort((a, b) => b.date.localeCompare(a.date)).map((tx) => {
                const meta = typeLabels[tx.type];
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{new Date(tx.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><Badge variant={meta?.variant || "secondary"}>{meta?.label || tx.type}</Badge></TableCell>
                    <TableCell className="text-sm">{tx.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.module}</TableCell>
                    <TableCell className={`text-right font-medium text-sm ${tx.amount > 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Row 4: Plans */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockPlans.map((plan) => {
            const isCurrent = plan.id === mockSubscription.planId;
            return (
              <Card key={plan.id} className={`relative ${plan.popular ? "border-primary ring-2 ring-primary/20" : ""} ${isCurrent ? "bg-primary/5" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 bg-primary text-primary-foreground"><Star className="w-3 h-3" /> Mais Popular</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="outline" className="gap-1 bg-card"><Check className="w-3 h-3" /> Atual</Badge>
                  </div>
                )}
                <CardHeader className="pt-6">
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-foreground">R$ {plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.credits.toLocaleString("pt-BR")} créditos · {plan.maxUsers} usuários</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent}
                    onClick={() => toast.success(`Plano ${plan.name} selecionado! Redirecionando...`)}
                  >
                    {isCurrent ? "Plano Atual" : "Escolher Plano"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
