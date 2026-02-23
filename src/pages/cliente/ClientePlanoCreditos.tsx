import { CreditCard, Zap, ArrowUpRight, Plus, Check, Star, Crown, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useCreditAlert } from "@/hooks/useCreditAlert";
import { PLANS, getPlanBySlug } from "@/constants/plans";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";

function TokenUsageCard() {
  const { data: orgId } = useUserOrgId();
  const { level, percent, balance, total } = useCreditAlert();

  const { data: agentUsage, isLoading } = useQuery({
    queryKey: ["token-usage-by-agent", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_conversation_logs")
        .select("agent_id, tokens_used, client_ai_agents(name)")
        .eq("organization_id", orgId!);
      if (error) throw error;

      const grouped: Record<string, { name: string; tokens: number }> = {};
      for (const row of data ?? []) {
        const id = row.agent_id;
        if (!grouped[id]) {
          const agentData = row.client_ai_agents as unknown as { name: string } | null;
          grouped[id] = { name: agentData?.name ?? "Agente", tokens: 0 };
        }
        grouped[id].tokens += row.tokens_used ?? 0;
      }
      return Object.values(grouped).sort((a, b) => b.tokens - a.tokens);
    },
    enabled: !!orgId,
  });

  const totalUsed = agentUsage?.reduce((s, a) => s + a.tokens, 0) ?? 0;
  const maxTokens = agentUsage?.[0]?.tokens ?? 1;

  const barColor =
    level === "zero" || level === "critical"
      ? "bg-destructive"
      : level === "warning"
        ? "bg-amber-500"
        : "bg-primary";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Consumo por Módulo</CardTitle>
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Créditos usados</span>
            <span className="font-semibold text-foreground">
              {balance.toLocaleString("pt-BR")} / {total.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{percent.toFixed(0)}% disponível</p>
        </div>

        {/* Per-agent breakdown */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : agentUsage && agentUsage.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tokens por Agente</p>
            {agentUsage.map((agent, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate">{agent.name}</span>
                  <span className="text-muted-foreground tabular-nums">{agent.tokens.toLocaleString("pt-BR")}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{ width: `${(agent.tokens / maxTokens) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-semibold text-foreground">{totalUsed.toLocaleString("pt-BR")} tokens</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum consumo registrado ainda.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClientePlanoCreditos() {
  const { data: wallet, isLoading: walletLoading } = useClienteWallet();
  const { data: subscription, isLoading: subLoading } = useClienteSubscription();
  const isLoading = walletLoading || subLoading;

  const balance = wallet?.balance ?? 0;
  const currentPlanSlug = subscription?.plan;
  const planDetails = getPlanBySlug(currentPlanSlug);
  const totalIncluded = planDetails?.credits ?? 2000;
  const creditPercent = totalIncluded > 0 ? Math.min((balance / totalIncluded) * 100, 100) : 0;
  const planName = planDetails?.name ?? "Sem plano";
  const planPrice = planDetails?.price ?? 0;

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Status do Plano</CardTitle>
              <Badge variant={subscription?.status === "trial" ? "outline" : "default"} className="gap-1">
                {subscription?.status === "trial" ? "🧪 Trial" : planName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plano ativo</span>
              <span className="font-semibold text-foreground">{planName} — R$ {planPrice}/mês</span>
            </div>
            {subscription?.expires_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Renovação</span>
                <span className="text-foreground">{new Date(subscription.expires_at).toLocaleDateString("pt-BR")}</span>
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

      {/* Token Usage Card */}
      <TokenUsageCard />

      {/* Plans */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanSlug;
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
