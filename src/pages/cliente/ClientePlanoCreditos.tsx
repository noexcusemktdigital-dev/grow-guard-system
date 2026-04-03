import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard, Zap, ArrowUpRight, Plus, Check, Star, Crown, BarChart3,
  History, Package, FileText, ExternalLink, Receipt, Calculator,
  Lock, Bot, MessageSquare, Send, Tag,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useCreditAlert } from "@/hooks/useCreditAlert";
import { useCreditTransactions } from "@/hooks/useCreditTransactions";
import {
  UNIFIED_PLANS, CREDIT_PACKS, CREDIT_COSTS,
  getEffectiveLimits, getUnifiedPlan,
  UnifiedPlan, CreditPack, EXTRA_USER_PRICE,
} from "@/constants/plans";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";

import {
  TokenUsageCard, TransactionHistoryCard, InvoicesCard,
  SubscriptionDialog, CreditPackDialog, CreditCalculatorCard, PlanCard,
} from "./ClientePlanoCreditsHelpers";

/* ── Main Page ── */
export default function ClientePlanoCreditos() {
  const { data: wallet, isLoading: walletLoading } = useClienteWallet();
  const { data: subscription, isLoading: subLoading } = useClienteSubscription();
  const isLoading = walletLoading || subLoading;

  const [selectedPlan, setSelectedPlan] = useState<UnifiedPlan | null>(null);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [packDialogOpen, setPackDialogOpen] = useState(false);

  const isTrial = subscription?.status === "trial";
  const currentPlanId = subscription?.plan as string | null;
  const currentPlan = getUnifiedPlan(currentPlanId);

  const limits = getEffectiveLimits(currentPlanId, isTrial);
  const balance = wallet?.balance ?? 0;
  const totalIncluded = limits.totalCredits || 500;
  const creditPercent = totalIncluded > 0 ? Math.min((balance / totalIncluded) * 100, 100) : 0;

  const statusLabel = isTrial ? "Trial" : (currentPlan ? currentPlan.name : "Sem plano");

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Plano & Créditos" subtitle="Gerencie sua assinatura e créditos" icon={<CreditCard className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Plano & Créditos" subtitle="Gerencie sua assinatura, créditos e faturas" icon={<CreditCard className="w-5 h-5 text-primary" />} />

      {/* Status + Wallet row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Status do Plano</CardTitle>
              <Badge variant={isTrial ? "outline" : "default"} className="gap-1">
                {isTrial ? "🧪 Trial" : statusLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isTrial && (() => {
              const createdAt = subscription?.created_at ? new Date(subscription.created_at) : new Date();
              const trialEnd = subscription?.expires_at ? new Date(subscription.expires_at) : new Date(createdAt.getTime() + 7 * 86400000);
              const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000));
              return (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {daysLeft > 0 ? `${daysLeft} dias restantes no trial` : "Trial expirado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    500 créditos · 2 usuários · 7 dias
                  </p>
                </div>
              );
            })()}

            {currentPlan && !isTrial && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-semibold text-foreground">{currentPlan.name} — R$ {currentPlan.price}/mês</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Créditos/mês</span>
                  <span className="font-semibold text-foreground">{currentPlan.credits.toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Usuários</span>
                  <span className="font-semibold text-foreground">até {currentPlan.maxUsers >= 9999 ? "∞" : currentPlan.maxUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Agente IA / WhatsApp</span>
                  <span className="font-semibold text-foreground">✅ Incluso</span>
                </div>
              </>
            )}

            {!isTrial && !currentPlan && (
              <p className="text-sm text-muted-foreground">Nenhum plano ativo. Escolha abaixo para começar.</p>
            )}

            {subscription?.expires_at && !isTrial && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Renovação</span>
                <span className="text-foreground">{new Date(subscription.expires_at).toLocaleDateString("pt-BR")}</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">Usuário adicional: R$ {EXTRA_USER_PRICE}/mês</p>
          </CardContent>
        </Card>

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
            <Button variant="outline" className="w-full gap-2" onClick={() => { setSelectedPack(CREDIT_PACKS[1]); setPackDialogOpen(true); }}>
              <Plus className="w-4 h-4" /> Comprar Créditos Extra
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Plans — Unified */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {UNIFIED_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={!isTrial && currentPlanId === plan.id}
              onSelect={() => { setSelectedPlan(plan); setSubDialogOpen(true); }}
            />
          ))}
        </div>
      </div>

      {/* Credit Calculator */}
      <CreditCalculatorCard />

      {/* Credit Packs */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Pacotes de Recarga
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CREDIT_PACKS.map((pack) => {
            const equivContents = Math.floor(pack.credits / 30);
            const equivSites = Math.floor(pack.credits / 100);
            return (
              <Card key={pack.id} className={pack.popular ? "border-primary ring-1 ring-primary/20" : ""}>
                {pack.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge className="text-[10px] bg-primary text-primary-foreground">Mais Popular</Badge>
                  </div>
                )}
                <CardContent className="p-5 text-center space-y-3 relative">
                  <p className="text-2xl font-bold text-foreground">{pack.credits.toLocaleString("pt-BR")}</p>
                  <p className="text-sm text-muted-foreground">créditos</p>
                  <p className="text-[10px] text-muted-foreground">≈ {equivContents} conteúdos ou {equivSites} sites</p>
                  <p className="text-xl font-bold text-foreground">R$ {pack.price}</p>
                  <Button className="w-full" variant={pack.popular ? "default" : "outline"} onClick={() => { setSelectedPack(pack); setPackDialogOpen(true); }}>
                    Comprar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Usage + Invoices + History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TokenUsageCard />
        <InvoicesCard />
      </div>

      <TransactionHistoryCard />

      <SubscriptionDialog plan={selectedPlan} open={subDialogOpen} onOpenChange={setSubDialogOpen} />
      <CreditPackDialog pack={selectedPack} open={packDialogOpen} onOpenChange={setPackDialogOpen} />
    </div>
  );
}
