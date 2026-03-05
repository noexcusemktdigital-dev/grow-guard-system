import { useState } from "react";
import {
  CreditCard, Zap, ArrowUpRight, Plus, Check, Star, Crown, BarChart3,
  History, Package, FileText, ExternalLink, Receipt,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useCreditAlert } from "@/hooks/useCreditAlert";
import { useCreditTransactions } from "@/hooks/useCreditTransactions";
import { PLANS, CREDIT_PACKS, getPlanBySlug, getPlanPrice, PlanConfig, ModuleChoice, CreditPack } from "@/constants/plans";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";

/* ── Token Usage Card ── */
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
  const barColor = level === "zero" || level === "critical" ? "bg-destructive" : level === "warning" ? "bg-amber-500" : "bg-primary";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Consumo por Módulo</CardTitle>
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Créditos disponíveis</span>
            <span className="font-semibold text-foreground">{balance.toLocaleString("pt-BR")} / {total.toLocaleString("pt-BR")}</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percent}%` }} />
          </div>
        </div>
        {isLoading ? <Skeleton className="h-16 w-full" /> : agentUsage && agentUsage.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tokens por Agente</p>
            {agentUsage.map((agent, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate">{agent.name}</span>
                  <span className="text-muted-foreground tabular-nums">{agent.tokens.toLocaleString("pt-BR")}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${(agent.tokens / maxTokens) * 100}%` }} />
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

/* ── Transaction History ── */
function TransactionHistoryCard() {
  const { data: transactions, isLoading } = useCreditTransactions();
  const typeLabels: Record<string, { label: string; color: string }> = {
    purchase: { label: "Compra", color: "text-green-600" },
    consumption: { label: "Consumo", color: "text-destructive" },
    bonus: { label: "Bônus", color: "text-blue-600" },
    renewal: { label: "Renovação", color: "text-primary" },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Histórico de Créditos</CardTitle>
          <History className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-16 w-full" /> : transactions && transactions.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.map((tx: any) => {
              const info = typeLabels[tx.type] || { label: tx.type, color: "text-foreground" };
              return (
                <div key={tx.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{tx.description || info.label}</span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("pt-BR")} {new Date(tx.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold tabular-nums ${info.color}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("pt-BR")}
                    </span>
                    <p className="text-xs text-muted-foreground">Saldo: {tx.balance_after.toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação registrada.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Invoices ── */
function InvoicesCard() {
  const { data: orgId } = useUserOrgId();
  const { data, isLoading } = useQuery({
    queryKey: ["asaas-payments", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("asaas-list-payments", {
        body: { organization_id: orgId },
      });
      if (error) throw error;
      return data?.payments ?? [];
    },
    enabled: !!orgId,
  });

  const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
    RECEIVED: { label: "Pago", variant: "default" },
    CONFIRMED: { label: "Confirmado", variant: "default" },
    PENDING: { label: "Pendente", variant: "outline" },
    OVERDUE: { label: "Vencido", variant: "destructive" },
    REFUNDED: { label: "Estornado", variant: "secondary" },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Faturas</CardTitle>
          <Receipt className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-16 w-full" /> : data && data.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.map((p: any) => {
              const st = statusMap[p.status] || { label: p.status, variant: "outline" as const };
              return (
                <div key={p.id} className="flex items-center justify-between text-sm py-2.5 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{p.description || "Cobrança"}</p>
                    <p className="text-xs text-muted-foreground">Venc: {new Date(p.dueDate).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground tabular-nums">R$ {p.value?.toFixed(2)}</span>
                    <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                    {p.invoiceUrl && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(p.invoiceUrl, "_blank")}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma fatura encontrada.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Subscription Dialog ── */
function PlanSubscriptionDialog({
  plan, modules, open, onOpenChange,
}: {
  plan: PlanConfig | null; modules: ModuleChoice; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const [billingType, setBillingType] = useState("CREDIT_CARD");
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();
  const price = plan ? getPlanPrice(plan, modules) : 0;

  const subscribe = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("asaas-create-subscription", {
        body: { organization_id: orgId, plan_id: plan!.id, billing_type: billingType, modules },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Plano ${plan!.name} ativado!`);
      if (data?.payment_link) toast.info("Link de pagamento enviado.");
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  if (!plan) return null;

  const moduleLabel = modules === "combo" ? "Comercial + Marketing" : modules === "marketing" ? "Marketing" : "Comercial";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assinar Plano {plan.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">R$ {price}</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{moduleLabel} · {plan.credits.toLocaleString("pt-BR")} créditos · {plan.maxUsers} usuários</p>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Forma de pagamento</Label>
            <RadioGroup value={billingType} onValueChange={setBillingType} className="space-y-2">
              {[
                { value: "CREDIT_CARD", label: "Cartão de Crédito", desc: "Cobrança automática mensal" },
                { value: "BOLETO", label: "Boleto", desc: "Vencimento todo dia 10" },
                { value: "PIX", label: "PIX", desc: "QR Code gerado automaticamente" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-accent/50">
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <Label htmlFor={opt.value} className="cursor-pointer flex-1">
                    <span className="font-medium">{opt.label}</span>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={subscribe.isPending}>Cancelar</Button>
          <Button onClick={() => subscribe.mutate()} disabled={subscribe.isPending}>
            {subscribe.isPending ? "Processando..." : "Confirmar Assinatura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Inline Payment View ── */
function InlinePaymentView({ result, billingType, onClose }: { result: any; billingType: string; onClose: () => void }) {
  const copyPixCode = () => {
    if (result.pix_copy_paste) {
      navigator.clipboard.writeText(result.pix_copy_paste);
      toast.success("Código PIX copiado!");
    }
  };

  if (billingType === "PIX") {
    return (
      <div className="space-y-4 py-2 text-center">
        <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código abaixo</p>
        {result.pix_qr_code_base64 ? (
          <img
            src={`data:image/png;base64,${result.pix_qr_code_base64}`}
            alt="QR Code PIX"
            className="mx-auto w-56 h-56 rounded-lg border"
          />
        ) : result.pix_qr_code ? (
          <img src={result.pix_qr_code} alt="QR Code PIX" className="mx-auto w-56 h-56 rounded-lg border" />
        ) : (
          <p className="text-sm text-muted-foreground">QR Code não disponível</p>
        )}
        {result.pix_copy_paste && (
          <div className="space-y-2">
            <div className="bg-muted rounded-lg p-3 text-xs font-mono break-all max-h-20 overflow-y-auto text-foreground">
              {result.pix_copy_paste}
            </div>
            <Button onClick={copyPixCode} variant="outline" className="w-full">
              Copiar código PIX
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-semibold text-foreground">R$ {result.value}</span>
        </div>
        <Button variant="secondary" onClick={onClose} className="w-full">Fechar</Button>
      </div>
    );
  }

  if (billingType === "BOLETO") {
    return (
      <div className="space-y-4 py-2">
        <p className="text-sm text-muted-foreground text-center">Seu boleto foi gerado com sucesso</p>
        {result.bank_slip_url ? (
          <iframe src={result.bank_slip_url} className="w-full h-80 rounded-lg border" title="Boleto" />
        ) : (
          <p className="text-sm text-muted-foreground text-center">Boleto não disponível para visualização</p>
        )}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-semibold text-foreground">R$ {result.value}</span>
        </div>
        <div className="flex gap-2">
          {result.bank_slip_url && (
            <Button variant="outline" className="flex-1" onClick={() => window.open(result.bank_slip_url, "_blank")}>
              Abrir Boleto
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className="flex-1">Fechar</Button>
        </div>
      </div>
    );
  }

  // CREDIT_CARD — hosted checkout in iframe
  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-muted-foreground text-center">Complete o pagamento abaixo</p>
      {result.invoice_url ? (
        <iframe src={result.invoice_url} className="w-full h-96 rounded-lg border" title="Pagamento" />
      ) : (
        <p className="text-sm text-muted-foreground text-center">Link de pagamento não disponível</p>
      )}
      <Button variant="secondary" onClick={onClose} className="w-full">Fechar</Button>
    </div>
  );
}

/* ── Credit Pack Purchase Dialog ── */
function CreditPackDialog({ pack, open, onOpenChange }: { pack: CreditPack | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [billingType, setBillingType] = useState("PIX");
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  const handleClose = (o: boolean) => {
    if (!o) {
      setPaymentResult(null);
      setBillingType("PIX");
    }
    onOpenChange(o);
  };

  const purchase = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("asaas-create-charge", {
        body: { organization_id: orgId, charge_type: "credits", billing_type: billingType, pack_id: pack!.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Cobrança de R$ ${data.value} criada!`);
      setPaymentResult(data);
      qc.invalidateQueries({ queryKey: ["asaas-payments"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!pack) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {paymentResult ? "Dados do Pagamento" : `Comprar ${pack.credits.toLocaleString()} Créditos`}
          </DialogTitle>
        </DialogHeader>
        {paymentResult ? (
          <InlinePaymentView result={paymentResult} billingType={billingType} onClose={() => handleClose(false)} />
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">R$ {pack.price}</span>
                <span className="text-muted-foreground">pagamento único</span>
              </div>
              <RadioGroup value={billingType} onValueChange={setBillingType} className="space-y-2">
                {[
                  { value: "PIX", label: "PIX" },
                  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
                  { value: "BOLETO", label: "Boleto" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-accent/50">
                    <RadioGroupItem value={opt.value} id={`cp-${opt.value}`} />
                    <Label htmlFor={`cp-${opt.value}`} className="cursor-pointer flex-1 font-medium">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
              <Button onClick={() => purchase.mutate()} disabled={purchase.isPending}>
                {purchase.isPending ? "Processando..." : "Comprar"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ── */
export default function ClientePlanoCreditos() {
  const { data: wallet, isLoading: walletLoading } = useClienteWallet();
  const { data: subscription, isLoading: subLoading } = useClienteSubscription();
  const isLoading = walletLoading || subLoading;

  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moduleToggle, setModuleToggle] = useState<ModuleChoice>("comercial");
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [packDialogOpen, setPackDialogOpen] = useState(false);

  const balance = wallet?.balance ?? 0;
  const currentPlanSlug = subscription?.plan;
  const currentModules = (subscription as any)?.modules as ModuleChoice || "comercial";
  const planDetails = getPlanBySlug(currentPlanSlug);
  const totalIncluded = planDetails?.credits ?? 2000;
  const creditPercent = totalIncluded > 0 ? Math.min((balance / totalIncluded) * 100, 100) : 0;
  const planName = planDetails?.name ?? "Sem plano";
  const planPrice = planDetails ? getPlanPrice(planDetails, currentModules) : 0;

  const moduleLabel = currentModules === "combo" ? "Comercial + Marketing" : currentModules === "marketing" ? "Marketing" : "Comercial";

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Plano & Créditos" subtitle="Gerencie sua assinatura e créditos" icon={<CreditCard className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Status do Plano</CardTitle>
              <Badge variant={subscription?.status === "trial" ? "outline" : "default"} className="gap-1">
                {subscription?.status === "trial" ? "🧪 Trial" : planName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Trial banner */}
            {subscription?.status === "trial" && (() => {
              const createdAt = subscription?.created_at ? new Date(subscription.created_at) : new Date();
              const trialEnd = subscription?.expires_at ? new Date(subscription.expires_at) : new Date(createdAt.getTime() + 14 * 86400000);
              const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000));
              return (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {daysLeft > 0 ? `${daysLeft} dias restantes no trial` : "Trial expirado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Início: {createdAt.toLocaleDateString("pt-BR")} · Expira: {trialEnd.toLocaleDateString("pt-BR")}
                  </p>
                </div>
              );
            })()}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-semibold text-foreground">{planName} — R$ {planPrice}/mês</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Módulos</span>
              <Badge variant="secondary" className="text-xs">{moduleLabel}</Badge>
            </div>
            {subscription?.expires_at && subscription?.status !== "trial" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Renovação</span>
                <span className="text-foreground">{new Date(subscription.expires_at).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            <Button className="w-full gap-2" onClick={() => {
              const upgradePlan = PLANS.find((p) => p.id !== currentPlanSlug && p.basePrice > (planDetails?.basePrice ?? 0));
              if (upgradePlan) { setSelectedPlan(upgradePlan); setDialogOpen(true); }
              else toast.info("Você já está no plano mais avançado!");
            }}>
              <ArrowUpRight className="w-4 h-4" /> Fazer Upgrade
            </Button>
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

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Planos Disponíveis</h2>
          <Tabs value={moduleToggle} onValueChange={(v) => setModuleToggle(v as ModuleChoice)} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="comercial" className="text-xs px-3 h-7">Comercial</TabsTrigger>
              <TabsTrigger value="marketing" className="text-xs px-3 h-7">Marketing</TabsTrigger>
              <TabsTrigger value="combo" className="text-xs px-3 h-7">🔥 Combo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {moduleToggle === "combo" && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Economize até 30% com o Combo!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ao escolher Comercial + Marketing juntos, você desbloqueia o CRM completo, geração de conteúdos, artes sociais, sites, scripts de vendas e estratégias — tudo em um só plano com desconto.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["CRM + Funis", "Conteúdos IA", "Sites", "Artes Sociais", "Scripts", "Estratégias"].map((b) => (
                      <Badge key={b} variant="secondary" className="text-[10px]">{b}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanSlug;
            const displayPrice = getPlanPrice(plan, moduleToggle);
            const comboSavings = moduleToggle === "combo" ? Math.round((1 - plan.comboPrice / (plan.basePrice * 2)) * 100) : 0;
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
                    <span className="text-3xl font-bold text-foreground">R$ {displayPrice}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  {moduleToggle === "combo" && comboSavings > 0 && (
                    <Badge variant="secondary" className="text-[10px] w-fit mt-1">Economize {comboSavings}%</Badge>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {plan.credits.toLocaleString("pt-BR")} créditos · {plan.maxUsers} usuários
                  </p>
                  {moduleToggle === "combo" && (
                    <p className="text-xs text-primary font-medium">Comercial + Marketing inclusos</p>
                  )}
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
                    onClick={() => { setSelectedPlan(plan); setModuleToggle(moduleToggle); setDialogOpen(true); }}
                  >
                    {isCurrent ? "Plano Atual" : "Escolher Plano"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Credit Packs */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Pacotes de Créditos Avulsos
        </h2>
        <Card className="mb-4 border-dashed">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-foreground mb-2">Para que servem os créditos?</p>
            <p className="text-xs text-muted-foreground mb-3">
              Créditos são consumidos por ações de IA como gerar conteúdos, criar sites, enviar disparos inteligentes e muito mais. Compre pacotes avulsos quando precisar de mais capacidade.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { label: "Gerar site", cost: 500 },
                { label: "Estratégia comercial", cost: 300 },
                { label: "Prospecção IA", cost: 250 },
                { label: "Conteúdos (lote)", cost: 200 },
                { label: "Script de vendas", cost: 150 },
                { label: "Arte social", cost: 100 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.cost} cr</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CREDIT_PACKS.map((pack) => {
            const equivContents = Math.floor(pack.credits / 200);
            const equivSites = Math.floor(pack.credits / 500);
            return (
              <Card key={pack.id} className={pack.popular ? "border-primary ring-1 ring-primary/20" : ""}>
                <CardContent className="p-5 text-center space-y-3">
                  <p className="text-2xl font-bold text-foreground">{pack.credits.toLocaleString("pt-BR")}</p>
                  <p className="text-sm text-muted-foreground">créditos</p>
                  <p className="text-[10px] text-muted-foreground">≈ {equivContents} lotes de conteúdo ou {equivSites} sites</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TokenUsageCard />
        <InvoicesCard />
      </div>

      <TransactionHistoryCard />

      <PlanSubscriptionDialog plan={selectedPlan} modules={moduleToggle} open={dialogOpen} onOpenChange={setDialogOpen} />
      <CreditPackDialog pack={selectedPack} open={packDialogOpen} onOpenChange={setPackDialogOpen} />
    </div>
  );
}
