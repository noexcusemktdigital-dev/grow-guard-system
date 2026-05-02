// @ts-nocheck
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard, Zap, ArrowUpRight, Plus, Check, Star, Crown, BarChart3,
  History, Package, FileText, ExternalLink, Receipt, Calculator,
  Lock, Bot, MessageSquare, Send, Tag,
} from "lucide-react";
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
import { reportError } from "@/lib/error-toast";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { useCreditAlert } from "@/hooks/useCreditAlert";
import { useCreditTransactions } from "@/hooks/useCreditTransactions";
import {
  UNIFIED_PLANS, CREDIT_PACKS, CREDIT_COSTS,
  getEffectiveLimits, getUnifiedPlan,
  UnifiedPlan, CreditPack, EXTRA_USER_PRICE,
} from "@/constants/plans";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { generateIdempotencyKey, generateRequestId } from "@/lib/idempotency";
import { analytics } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";

/* ── Token Usage Card ── */
export function TokenUsageCard() {
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
export function TransactionHistoryCard() {
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
            {transactions.map((tx: Record<string, unknown>) => {
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
export function InvoicesCard() {
  const { data: orgId } = useUserOrgId();
  const { data, isLoading } = useQuery({
    queryKey: ["asaas-payments", orgId],
    queryFn: async () => {
      const { data, error } = await invokeEdge("asaas-list-payments", {
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
            {data.map((p: Record<string, unknown>) => {
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
export function InlinePaymentView({ result, billingType, onClose }: { result: Record<string, unknown>; billingType: string; onClose: () => void }) {
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
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">Clique abaixo para completar o pagamento com cartão</p>
          <Button className="w-full gap-2" onClick={() => window.open(result.invoice_url, "_blank")}>
            <CreditCard className="w-4 h-4" />
            Abrir página de pagamento
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center">Link de pagamento não disponível</p>
      )}
      <Button variant="secondary" onClick={onClose} className="w-full">Fechar</Button>
    </div>
  );
}

/* ── Subscription Dialog (unified) ── */
export function SubscriptionDialog({
  plan, open, onOpenChange,
}: {
  plan: UnifiedPlan | null; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const [billingType, setBillingType] = useState("CREDIT_CARD");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<Record<string, unknown> | null>(null);
  const { data: orgId } = useUserOrgId();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleClose = (o: boolean) => {
    if (!o) {
      setPaymentResult(null);
      setBillingType("CREDIT_CARD");
      setCouponCode("");
      setCouponDiscount(0);
      setCouponValid(null);
    }
    onOpenChange(o);
  };

  const { data: orgData } = useQuery({
    queryKey: ["org-cnpj-check", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("cnpj")
        .eq("id", orgId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId && open,
  });

  const hasCnpj = !!(orgData?.cnpj && orgData.cnpj.trim().length >= 11);

  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponValid(null);
    try {
      const { data, error } = await invokeEdge("validate-coupon", {
        body: { code: couponCode.trim() },
      });
      if (error || data?.error) {
        setCouponValid(false);
        setCouponDiscount(0);
        reportError(new Error(data?.error || "Cupom inválido"), { title: data?.error || "Cupom inválido", category: "plano.coupon" });
      } else if (data?.valid) {
        setCouponValid(true);
        setCouponDiscount(data.discount_percent);
        toast.success(`Cupom aplicado: ${data.discount_percent}% de desconto!`);
      }
    } catch {
      setCouponValid(false);
      setCouponDiscount(0);
      reportError(new Error("Erro ao validar cupom"), { title: "Erro ao validar cupom", category: "plano.coupon" });
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode]);

  const finalPrice = plan
    ? Math.round(plan.price * (1 - couponDiscount / 100) * 100) / 100
    : 0;

  const subscribe = useMutation({
    mutationFn: async () => {
      if (!hasCnpj) {
        throw new Error("Preencha o CNPJ/CPF da empresa em Configurações antes de assinar um plano.");
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");
      const { data, error } = await invokeEdge("asaas-create-subscription", {
        body: {
          organization_id: orgId,
          plan: plan?.id,
          billing_type: billingType,
          coupon_code: couponValid ? couponCode.trim().toUpperCase() : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success("Cobrança gerada! Seus créditos serão liberados após a confirmação do pagamento.");
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
      setPaymentResult(data);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      if (msg.includes("Unauthorized") || msg.includes("401")) {
        reportError(new Error("Sessão expirada. Recarregue a página e tente novamente."), { title: "Sessão expirada. Recarregue a página e tente novamente.", category: "plano.session" });
      } else {
        reportError(new Error(msg), { title: `Erro: ${msg}`, category: "plano.payment" });
      }
    },
  });

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {paymentResult ? "Pagamento — Plano " + plan.name : "Assinar Plano " + plan.name}
          </DialogTitle>
        </DialogHeader>

        {paymentResult ? (
          <InlinePaymentView result={paymentResult} billingType={billingType} onClose={() => handleClose(false)} />
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div>
                <div className="flex items-baseline gap-2">
                  {couponDiscount > 0 ? (
                    <>
                      <span className="text-lg line-through text-muted-foreground">R$ {plan.price}</span>
                      <span className="text-3xl font-bold text-foreground">R$ {finalPrice}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-foreground">R$ {plan.price}</span>
                  )}
                  <span className="text-muted-foreground">/mês</span>
                </div>
                {couponDiscount > 0 && (
                  <Badge className="mt-1 text-xs" variant="secondary">
                    <Tag className="w-3 h-3 mr-1" /> {couponDiscount}% de desconto aplicado
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground mt-1">{plan.credits.toLocaleString("pt-BR")} créditos/mês</p>
              </div>

              {/* Coupon field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cupom de desconto</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      if (couponValid !== null) {
                        setCouponValid(null);
                        setCouponDiscount(0);
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="shrink-0"
                  >
                    {couponLoading ? "..." : "Aplicar"}
                  </Button>
                </div>
                {couponValid === false && (
                  <p className="text-xs text-destructive">Cupom inválido ou expirado</p>
                )}
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
                      <RadioGroupItem value={opt.value} id={`sub-${opt.value}`} />
                      <Label htmlFor={`sub-${opt.value}`} className="cursor-pointer flex-1">
                        <span className="font-medium">{opt.label}</span>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              {!hasCnpj && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 flex items-center justify-between gap-2">
                  <span>⚠️ Preencha o CNPJ/CPF da empresa antes de assinar.</span>
                  <Button size="sm" variant="outline" className="shrink-0 border-destructive text-destructive hover:bg-destructive/10" onClick={() => navigate("/cliente/configuracoes")}>
                    Cadastrar CNPJ
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={subscribe.isPending}>Cancelar</Button>
              <Button onClick={() => subscribe.mutate()} disabled={subscribe.isPending || !hasCnpj}>
                {subscribe.isPending ? "Processando..." : "Confirmar Assinatura"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Credit Pack Purchase Dialog ── */
export function CreditPackDialog({ pack, open, onOpenChange }: { pack: CreditPack | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [billingType, setBillingType] = useState("PIX");
  const [paymentResult, setPaymentResult] = useState<Record<string, unknown> | null>(null);
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
      const body = { organization_id: orgId, pack_id: pack?.id, billing_type: billingType };
      const idempKey = await generateIdempotencyKey("buy-credits", body);
      const { data, error } = await invokeEdge("asaas-buy-credits", {
        body,
        headers: {
          "Idempotency-Key": idempKey,
          "x-request-id": generateRequestId(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Cobrança de R$ ${data.value} criada!`);
      analytics.track(ANALYTICS_EVENTS.CREDITS_PURCHASED, { pack_id: pack?.id });
      setPaymentResult(data);
      qc.invalidateQueries({ queryKey: ["asaas-payments"] });
    },
    onError: (err: unknown) => {
      analytics.track(ANALYTICS_EVENTS.CHECKOUT_FAILED, { pack_id: pack?.id, error_code: err instanceof Error ? err.message : String(err) });
      reportError(err, { title: err instanceof Error ? err.message : "Erro ao processar pagamento", category: "plano.payment" });
    },
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

/* ── Credit Calculator ── */
export function CreditCalculatorCard() {
  const creditEntries = Object.values(CREDIT_COSTS).filter((c) => c.cost > 0).sort((a, b) => b.cost - a.cost);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Calculadora de Créditos</CardTitle>
          <Calculator className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Cada ação da nossa IA e automação consome créditos do seu plano mensal. Veja quanto custa cada execução:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {creditEntries.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/30 border">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-bold text-foreground">{item.cost} cr</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Briefings e planejamento são gratuitos. Créditos só são cobrados na execução/aprovação.
        </p>
      </CardContent>
    </Card>
  );
}

/* ── Plan Card ── */
export function PlanCard({
  plan, isCurrent, onSelect,
}: {
  plan: UnifiedPlan;
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
        <p className="text-sm text-muted-foreground">{plan.credits.toLocaleString("pt-BR")} créditos/mês</p>
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

