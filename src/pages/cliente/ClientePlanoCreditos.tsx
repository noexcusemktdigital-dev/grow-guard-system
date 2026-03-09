import { useState } from "react";
import {
  CreditCard, Zap, ArrowUpRight, Plus, Check, Star, Crown, BarChart3,
  History, Package, FileText, ExternalLink, Receipt, Target, Megaphone,
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
import {
  SALES_PLANS, MARKETING_PLANS, CREDIT_PACKS, COMBO_DISCOUNT,
  getComboPrice, getComboSavings, getEffectiveLimits,
  getSalesPlan, getMarketingPlan,
  SalesModulePlan, MarketingModulePlan, CreditPack, EXTRA_USER_PRICE,
} from "@/constants/plans";
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
          <img src={`data:image/png;base64,${result.pix_qr_code_base64}`} alt="QR Code PIX" className="mx-auto w-56 h-56 rounded-lg border" />
        ) : result.pix_qr_code ? (
          <img src={result.pix_qr_code} alt="QR Code PIX" className="mx-auto w-56 h-56 rounded-lg border" />
        ) : (
          <p className="text-sm text-muted-foreground">QR Code não disponível</p>
        )}
        {result.pix_copy_paste && (
          <div className="space-y-2">
            <div className="bg-muted rounded-lg p-3 text-xs font-mono break-all max-h-20 overflow-y-auto text-foreground">{result.pix_copy_paste}</div>
            <Button onClick={copyPixCode} variant="outline" className="w-full">Copiar código PIX</Button>
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
            <Button variant="outline" className="flex-1" onClick={() => window.open(result.bank_slip_url, "_blank")}>Abrir Boleto</Button>
          )}
          <Button variant="secondary" onClick={onClose} className="flex-1">Fechar</Button>
        </div>
      </div>
    );
  }

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

/* ── Subscription Dialog (new modular) ── */
function ModularSubscriptionDialog({
  salesPlanId, marketingPlanId, open, onOpenChange,
}: {
  salesPlanId: string | null; marketingPlanId: string | null; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const [billingType, setBillingType] = useState("CREDIT_CARD");
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  const sp = getSalesPlan(salesPlanId);
  const mp = getMarketingPlan(marketingPlanId);
  const isCombo = !!sp && !!mp;
  const rawPrice = (sp?.price ?? 0) + (mp?.price ?? 0);
  const finalPrice = isCombo ? getComboPrice(sp!.price, mp!.price) : rawPrice;
  const savings = isCombo ? getComboSavings(sp!.price, mp!.price) : 0;
  const totalCredits = (sp?.credits ?? 0) + (mp?.credits ?? 0);

  const subscribe = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");
      const { data, error } = await supabase.functions.invoke("asaas-create-subscription", {
        body: {
          organization_id: orgId,
          sales_plan: salesPlanId,
          marketing_plan: marketingPlanId,
          billing_type: billingType,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      const label = [sp && `Vendas ${sp.name}`, mp && `Marketing ${mp.name}`].filter(Boolean).join(" + ");
      toast.success(`Plano ${label} ativado!`);
      if (data?.payment_link) toast.info("Link de pagamento enviado.");
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err?.message || "Erro desconhecido";
      if (msg.includes("Unauthorized") || msg.includes("401")) {
        toast.error("Sessão expirada. Recarregue a página e tente novamente.");
      } else {
        toast.error(`Erro: ${msg}`);
      }
    },
  });

  const moduleLabel = [sp && `Vendas ${sp.name}`, mp && `Marketing ${mp.name}`].filter(Boolean).join(" + ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assinar {moduleLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">R$ {finalPrice}</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            {isCombo && savings > 0 && (
              <p className="text-sm text-green-600 font-medium mt-1">
                Combo -15% · Economia de R$ {savings}/mês
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">{totalCredits.toLocaleString("pt-BR")} créditos/mês</p>
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

/* ── Credit Pack Purchase Dialog ── */
function CreditPackDialog({ pack, open, onOpenChange }: { pack: CreditPack | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [billingType, setBillingType] = useState("PIX");
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  const handleClose = (o: boolean) => {
    if (!o) { setPaymentResult(null); setBillingType("PIX"); }
    onOpenChange(o);
  };

  const purchase = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");
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

/* ── Module Plan Card ── */
function ModulePlanCard({
  plan, isCurrent, onSelect,
}: {
  plan: { id: string; name: string; price: number; credits: number; features: string[]; popular: boolean };
  isCurrent: boolean;
  onSelect: () => void;
}) {
  return (
    <Card className={`relative ${plan.popular ? "border-primary ring-2 ring-primary/20" : ""} ${isCurrent ? "bg-primary/5" : ""}`}>
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
        <p className="text-sm text-muted-foreground">{plan.credits.toLocaleString("pt-BR")} créditos</p>
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
        <Button className="w-full" variant={isCurrent ? "outline" : "default"} disabled={isCurrent} onClick={onSelect}>
          {isCurrent ? "Plano Atual" : "Escolher Plano"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Main Page ── */
export default function ClientePlanoCreditos() {
  const { data: wallet, isLoading: walletLoading } = useClienteWallet();
  const { data: subscription, isLoading: subLoading } = useClienteSubscription();
  const isLoading = walletLoading || subLoading;

  // Dialog state
  const [dialogSalesPlan, setDialogSalesPlan] = useState<string | null>(null);
  const [dialogMarketingPlan, setDialogMarketingPlan] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [packDialogOpen, setPackDialogOpen] = useState(false);

  const isTrial = subscription?.status === "trial";
  const currentSalesPlan = (subscription as any)?.sales_plan as string | null;
  const currentMarketingPlan = (subscription as any)?.marketing_plan as string | null;

  const limits = getEffectiveLimits(currentSalesPlan, currentMarketingPlan, isTrial);
  const balance = wallet?.balance ?? 0;
  const totalIncluded = limits.totalCredits || 1000;
  const creditPercent = totalIncluded > 0 ? Math.min((balance / totalIncluded) * 100, 100) : 0;

  const currentSalesObj = getSalesPlan(currentSalesPlan);
  const currentMktObj = getMarketingPlan(currentMarketingPlan);
  const isCombo = !!currentSalesObj && !!currentMktObj;
  const currentPrice = isCombo
    ? getComboPrice(currentSalesObj!.price, currentMktObj!.price)
    : (currentSalesObj?.price ?? 0) + (currentMktObj?.price ?? 0);

  const statusLabel = isTrial ? "Trial" : [currentSalesObj && `Vendas ${currentSalesObj.name}`, currentMktObj && `Mkt ${currentMktObj.name}`].filter(Boolean).join(" + ") || "Sem plano";

  const openSubscription = (salesId: string | null, mktId: string | null) => {
    setDialogSalesPlan(salesId);
    setDialogMarketingPlan(mktId);
    setDialogOpen(true);
  };

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
                    Início: {createdAt.toLocaleDateString("pt-BR")} · Expira: {trialEnd.toLocaleDateString("pt-BR")}
                  </p>
                </div>
              );
            })()}

            {currentSalesObj && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Vendas</span>
                <span className="font-semibold text-foreground">{currentSalesObj.name} — R$ {currentSalesObj.price}/mês</span>
              </div>
            )}
            {currentMktObj && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" /> Marketing</span>
                <span className="font-semibold text-foreground">{currentMktObj.name} — R$ {currentMktObj.price}/mês</span>
              </div>
            )}
            {isCombo && (
              <div className="flex items-center justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Total Combo (-15%)</span>
                <span className="font-bold text-foreground">R$ {currentPrice}/mês</span>
              </div>
            )}
            {!isTrial && !currentSalesObj && !currentMktObj && (
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

      {/* Plans — Modular */}
      <div>
        <Tabs defaultValue="vendas">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Planos Disponíveis</h2>
            <TabsList className="h-8">
              <TabsTrigger value="vendas" className="text-xs px-3 h-7 gap-1"><Target className="w-3 h-3" /> Vendas</TabsTrigger>
              <TabsTrigger value="marketing" className="text-xs px-3 h-7 gap-1"><Megaphone className="w-3 h-3" /> Marketing</TabsTrigger>
              <TabsTrigger value="combo" className="text-xs px-3 h-7">🔥 Combo</TabsTrigger>
            </TabsList>
          </div>

          {/* Sales */}
          <TabsContent value="vendas">
            <p className="text-sm text-muted-foreground mb-4">CRM, Chat WhatsApp, Agentes IA, Scripts, Disparos, Plano de Vendas, Checklist</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SALES_PLANS.map((plan) => (
                <ModulePlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={currentSalesPlan === plan.id}
                  onSelect={() => openSubscription(plan.id, currentMarketingPlan)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Marketing */}
          <TabsContent value="marketing">
            <p className="text-sm text-muted-foreground mb-4">Conteúdos, Artes Sociais, Sites, Tráfego Pago, Estratégia de Marketing</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MARKETING_PLANS.map((plan) => (
                <ModulePlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={currentMarketingPlan === plan.id}
                  onSelect={() => openSubscription(currentSalesPlan, plan.id)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Combo */}
          <TabsContent value="combo">
            <Card className="mb-4 border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Economize {Math.round(COMBO_DISCOUNT * 100)}% com o Combo!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Contrate Vendas + Marketing juntos e desbloqueie todas as 12 ferramentas com desconto.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SALES_PLANS.map((sp, i) => {
                const mp = MARKETING_PLANS[i];
                const combo = getComboPrice(sp.price, mp.price);
                const savings = getComboSavings(sp.price, mp.price);
                const totalCredits = sp.credits + mp.credits;
                const isCurrent = currentSalesPlan === sp.id && currentMarketingPlan === mp.id;

                return (
                  <Card key={sp.id} className={`relative ${sp.popular ? "border-primary ring-2 ring-primary/20" : ""} ${isCurrent ? "bg-primary/5" : ""}`}>
                    {sp.popular && (
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
                        {sp.name} + {mp.name}
                      </CardTitle>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold text-foreground">R$ {combo}</span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground line-through">R$ {sp.price + mp.price}</span>
                        <Badge variant="secondary" className="text-[10px]">-R$ {savings}/mês</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{totalCredits.toLocaleString("pt-BR")} créditos · Vendas + Marketing</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="space-y-2">
                        {[...sp.features.slice(0, 3), ...mp.features.slice(0, 3)].map((f, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full" variant={isCurrent ? "outline" : "default"} disabled={isCurrent} onClick={() => openSubscription(sp.id, mp.id)}>
                        {isCurrent ? "Plano Atual" : "Escolher Combo"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
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

      <ModularSubscriptionDialog salesPlanId={dialogSalesPlan} marketingPlanId={dialogMarketingPlan} open={dialogOpen} onOpenChange={setDialogOpen} />
      <CreditPackDialog pack={selectedPack} open={packDialogOpen} onOpenChange={setPackDialogOpen} />
    </div>
  );
}
