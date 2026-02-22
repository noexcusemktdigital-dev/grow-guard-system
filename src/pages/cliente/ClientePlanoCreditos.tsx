import { useState } from "react";
import { CreditCard, Zap, ArrowUpRight, Plus, Check, Star, Crown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { mockPlans, getCreditConsumptionByModule } from "@/data/clienteData";

export default function ClientePlanoCreditos() {
  const { data: wallet, isLoading: walletLoading } = useClienteWallet();
  const { data: subscription, isLoading: subLoading } = useClienteSubscription();
  const isLoading = walletLoading || subLoading;

  const pieData = getCreditConsumptionByModule();

  // Map DB data or use defaults
  const balance = wallet?.balance ?? 0;
  const totalIncluded = 2000; // from plan
  const creditPercent = totalIncluded > 0 ? (balance / totalIncluded) * 100 : 0;

  const currentPlanSlug = subscription?.plan;
  const planDetails = mockPlans.find(p => p.id === currentPlanSlug);
  
  const planName = planDetails?.name ?? "Sem plano";
  const planStatus = subscription?.status ?? "inactive";
  const planPrice = planDetails?.price ?? 0;
  const renewalDate = subscription?.expires_at;

  const currentPlanId = currentPlanSlug ?? "";

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader title="Plano & Créditos" subtitle="Gerencie sua assinatura e créditos" icon={<CreditCard className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

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
              <Badge variant={planStatus === "trial" ? "outline" : "default"} className="gap-1">
                {planStatus === "trial" ? "🧪 Trial" : planName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plano ativo</span>
              <span className="font-semibold text-foreground">{planName} — R$ {planPrice}/mês</span>
            </div>
            {renewalDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Renovação</span>
                <span className="text-foreground">{new Date(renewalDate).toLocaleDateString("pt-BR")}</span>
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
              <span className="text-3xl font-bold text-foreground">{balance.toLocaleString("pt-BR")}</span>
              <span className="text-sm text-muted-foreground">/ {totalIncluded.toLocaleString("pt-BR")}</span>
            </div>
            <Progress value={creditPercent} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{creditPercent.toFixed(0)}% disponível</span>
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

      {/* Row 3: Plans */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockPlans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
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
                  <Button className="w-full" variant={isCurrent ? "outline" : "default"} disabled={isCurrent} onClick={() => toast.success(`Plano ${plan.name} selecionado!`)}>
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
