// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWhatsAppInstances } from "@/hooks/useWhatsApp";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2, Loader2, Wifi, ExternalLink,
  ArrowRight, ArrowLeft, ShieldCheck,
  QrCode, Copy, Headset,
  MessageSquare, HelpCircle, Zap, CreditCard, Receipt, Lock,
  Cloud, Building2, Webhook, ListChecks,
} from "lucide-react";
import { useMemberPermissions } from "@/hooks/useMemberPermissions";
import { WhatsAppHowItWorks } from "./WhatsAppHowItWorks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "meta_cloud" | "izitech";
}

const INSTANCE_NAME_REGEX = /^[a-zA-Z0-9-]+$/;
const SUPPORT_LINK = "https://wa.me/5500000000000?text=Olá! Preciso de ajuda para configurar a integração WhatsApp.";

export function WhatsAppSetupWizard({ open, onOpenChange, mode = "izitech" }: Props) {
  const { refetch } = useWhatsAppInstances();
  const { data: orgId } = useUserOrgId();
  const { isAdmin } = useMemberPermissions();
  const canSetup = isAdmin;
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<"whatsapp_cloud" | "evolution">("whatsapp_cloud");
  const [izitechName, setIzitechName] = useState("");
  const [izitechNameError, setIzitechNameError] = useState("");
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  // QR flow state (Evolution)
  const [izitechQr, setIzitechQr] = useState<string | null>(null);
  const [izitechLoading, setIzitechLoading] = useState(false);
  const [izitechConnected, setIzitechConnected] = useState(false);
  const [izitechPhone, setIzitechPhone] = useState<string | null>(null);
  // WhatsApp Cloud (Meta) state
  const [cloudPhoneNumberId, setCloudPhoneNumberId] = useState("");
  const [cloudWabaId, setCloudWabaId] = useState("");
  const [cloudVerifiedName, setCloudVerifiedName] = useState("");
  const [cloudAccessToken, setCloudAccessToken] = useState("");
  const [cloudSaving, setCloudSaving] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Payment step
  const [billingType, setBillingType] = useState<string>("PIX");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    pix_qr_code_base64?: string | null;
    pix_copy_paste?: string | null;
    invoice_url?: string | null;
    bank_slip_url?: string | null;
  } | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const cloudWebhookUrl = `https://${projectId}.supabase.co/functions/v1/whatsapp-cloud-webhook`;

  const totalSteps = 4;

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const reset = () => {
    stopPolling();
    setStep(1);
    setProvider("whatsapp_cloud");
    setIzitechName("");
    setIzitechNameError("");
    setIzitechQr(null);
    setIzitechLoading(false);
    setIzitechConnected(false);
    setIzitechPhone(null);
    setCloudPhoneNumberId("");
    setCloudWabaId("");
    setCloudVerifiedName("");
    setCloudAccessToken("");
    setCloudSaving(false);
    setBillingType("PIX");
    setPaymentLoading(false);
    setPaymentData(null);
    setPaymentDone(false);
  };

  const validateName = (name: string): string => {
    if (name.length < 3) return "Nome deve ter no mínimo 3 caracteres";
    if (!INSTANCE_NAME_REGEX.test(name)) return "Apenas letras, números e hífens";
    return "";
  };

  const canConnect = izitechName.trim().length >= 3 && !validateName(izitechName.trim());

  const handleConnectCloud = async () => {
    if (!cloudPhoneNumberId.trim()) {
      toast({ title: "Phone Number ID obrigatório", variant: "destructive" });
      return;
    }
    setCloudSaving(true);
    try {
      const { data, error } = await invokeEdge("whatsapp-setup", {
        body: {
          provider: "whatsapp_cloud",
          phoneNumberId: cloudPhoneNumberId.trim(),
          wabaId: cloudWabaId.trim() || undefined,
          verifiedName: cloudVerifiedName.trim() || undefined,
          accessToken: cloudAccessToken.trim() || undefined,
          label: cloudVerifiedName.trim() || cloudPhoneNumberId.trim(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "WhatsApp Cloud conectado!",
        description: data?.verification_status === "verified"
          ? "Número verificado pela Meta."
          : "Conexão salva. Conclua a verificação no Business Manager se ainda não fez.",
      });
      refetch();
      onOpenChange(false);
      reset();
    } catch (err: unknown) {
      toast({
        title: "Erro ao conectar WhatsApp Cloud",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setCloudSaving(false);
    }
  };

  // ── Automatic connect: uses whatsapp-setup (Evolution API) ──
  const handleAutoConnect = async () => {
    const err = validateName(izitechName);
    if (err) { setIzitechNameError(err); return; }

    const instanceName = izitechName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    setStep(3);
    setIzitechLoading(true);
    setIzitechQr(null);
    setIzitechConnected(false);

    try {
      // Step 1: Create instance via whatsapp-setup (Evolution, no manual credentials needed)
      const { data: createData, error: createError } = await invokeEdge("whatsapp-setup", {
        body: { provider: "evolution", instanceName, label: izitechName.trim() },
      });
      if (createError) throw createError;
      if (createData?.error) throw new Error(createData.error);

      // If already connected, skip QR
      if (createData?.status === "connected") {
        setIzitechConnected(true);
        setIzitechPhone(createData.phone || null);
        setIzitechLoading(false);
        refetch();
        setStep(4);
        return;
      }

      // Step 2: Get QR code
      const { data: qrData } = await invokeEdge("whatsapp-setup", {
        body: { action: "get-qr", instanceName },
      });

      if (qrData?.status === "connected") {
        setIzitechConnected(true);
        setIzitechPhone(qrData.phone || null);
        setIzitechLoading(false);
        refetch();
        setStep(4);
        return;
      }

      if (qrData?.qr_code) {
        setIzitechQr(qrData.qr_code);
      }
      setIzitechLoading(false);

      // Step 3: Poll for connection
      pollingRef.current = setInterval(async () => {
        try {
          const { data: pollData } = await invokeEdge("whatsapp-setup", {
            body: { action: "get-qr", instanceName },
          });

          if (pollData?.status === "connected") {
            stopPolling();
            setIzitechConnected(true);
            setIzitechPhone(pollData.phone || null);
            setIzitechQr(null);
            refetch();
            toast({ title: "WhatsApp conectado!", description: "Agora configure o pagamento." });
            setStep(4);
          } else if (pollData?.status === "qr_ready" && pollData.qr_code) {
            setIzitechQr(pollData.qr_code);
          }
        } catch {
          // Ignore polling errors
        }
      }, 4000);
    } catch (err: unknown) {
      setIzitechLoading(false);
      toast({
        title: "Erro",
        description: (err instanceof Error ? err.message : String(err)) || "Falha ao criar instância",
        variant: "destructive",
      });
      setStep(2);
    }
  };

  const openSupport = () => window.open(SUPPORT_LINK, "_blank");

  if (mode === "meta_cloud") {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); } onOpenChange(v); }}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {!canSetup ? (
            <div className="px-6 py-12 flex flex-col items-center text-center space-y-4">
              <Lock className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-sm font-semibold">Configuração restrita</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Apenas administradores podem configurar a conexão oficial com a Meta.
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" /> WhatsApp Cloud API — Meta oficial
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Conecte a WABA oficial usada no App Review da Meta. Este fluxo é separado da operação via QR/Izitech.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-5">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Cloud className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Fluxo oficial para verificação Meta</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                        Use os dados da WhatsApp Business Account aprovada no Meta Business Manager. A gravação deve mostrar a consent screen da Meta antes de salvar estes dados na plataforma.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <MetaRequirement icon={<ShieldCheck className="w-3.5 h-3.5" />} label="Permissões" text="whatsapp_business_messaging, whatsapp_business_management, business_management" />
                    <MetaRequirement icon={<Webhook className="w-3.5 h-3.5" />} label="Webhook" text="messages e message_template_status_update" />
                    <MetaRequirement icon={<ListChecks className="w-3.5 h-3.5" />} label="Vídeo" text="mensagem, resposta, template, opt-in, opt-out e desconexão" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-muted-foreground" /> Phone Number ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={cloudPhoneNumberId}
                      onChange={(e) => setCloudPhoneNumberId(e.target.value)}
                      placeholder="Ex: 123456789012345"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-muted-foreground" /> WABA ID
                    </Label>
                    <Input
                      value={cloudWabaId}
                      onChange={(e) => setCloudWabaId(e.target.value)}
                      placeholder="Ex: 987654321098765"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Nome verificado</Label>
                    <Input
                      value={cloudVerifiedName}
                      onChange={(e) => setCloudVerifiedName(e.target.value)}
                      placeholder="Ex: NoExcuse Digital"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Access token por organização</Label>
                    <Input
                      value={cloudAccessToken}
                      onChange={(e) => setCloudAccessToken(e.target.value)}
                      placeholder="Opcional se houver token global configurado"
                      className="font-mono text-xs"
                      type="password"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Webhook para o App Dashboard da Meta</p>
                  <p className="break-all font-mono text-[11px] text-foreground">{cloudWebhookUrl}</p>
                  <p className="text-[10px] text-muted-foreground">
                    No vídeo, mostre este endpoint configurado no app Meta e os campos assinados: <strong>messages</strong> e <strong>message_template_status_update</strong>.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConnectCloud} disabled={cloudSaving || !cloudPhoneNumberId.trim()} className="gap-1.5">
                    {cloudSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Salvar Meta Cloud
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); } onOpenChange(v); }}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {!canSetup ? (
          <div className="px-6 py-12 flex flex-col items-center text-center space-y-4">
            <Lock className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm font-semibold">Configuração restrita</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Apenas administradores podem configurar ou contratar o WhatsApp. Você pode usar o chat normalmente se ele já estiver ativo.
            </p>
          </div>
        ) : (
        <>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Conectar WhatsApp</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Crie e conecte seu WhatsApp automaticamente via Izitech
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
              <span>Passo {step} de {totalSteps}</span>
              <span>{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2" />
          </div>
        </div>

        <div className="px-6 py-5">
          {/* ─── STEP 1: Intro ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Conectar WhatsApp via Izitech</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Parceiro oficial de integração WhatsApp.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Desconto exclusivo NoExcuse</p>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-xs text-muted-foreground line-through">R$ 90,00/mês</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">R$ 45,00</span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Você tem <strong>50% de desconto</strong> na integração WhatsApp por ser cliente NoExcuse.
                </p>
              </div>

              <div className="rounded-xl border-2 border-primary bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Automático via Izitech</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Criamos e gerenciamos a instância para você. Basta escanear o QR code.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">O que você vai precisar</h4>
                <div className="grid gap-2">
                  {[
                    { icon: QrCode, text: "Um celular com WhatsApp para escanear o QR Code" },
                    { icon: Zap, text: "Só isso! Nós cuidamos de toda a configuração técnica" },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-foreground">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={() => setStep(2)}>
                Vamos começar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ─── STEP 2: Instance Name ─── */}
          {step === 2 && (
            <div className="space-y-5">
              <StepHeader
                number={2}
                title="Nome da sua instância"
                description="Escolha um nome para identificar seu WhatsApp no sistema."
              />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <QrCode className="w-3 h-3 text-muted-foreground" /> Nome da instância <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Ex: minha-empresa"
                    value={izitechName}
                    onChange={(e) => { setIzitechName(e.target.value); setIzitechNameError(""); }}
                    className={izitechNameError ? "border-destructive" : ""}
                  />
                  {izitechNameError ? (
                    <p className="text-[10px] text-destructive">{izitechNameError}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Apenas letras, números e hífens. Mínimo 3 caracteres.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <p className="text-xs font-semibold">Powered by Izitech</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  A instância será criada e os webhooks configurados automaticamente.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button className="flex-1" disabled={!canConnect} onClick={handleAutoConnect}>
                  <Zap className="w-4 h-4 mr-1" /> Criar e Conectar
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: QR Code ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center space-y-5">
                {izitechLoading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-sm font-semibold">Criando instância...</p>
                    <p className="text-xs text-muted-foreground">Aguarde enquanto configuramos tudo</p>
                  </>
                ) : izitechQr ? (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold">Escaneie o QR Code</h3>
                      <p className="text-xs text-muted-foreground">Abra o WhatsApp no celular → Menu → Aparelhos conectados → Conectar</p>
                    </div>
                    <div className="rounded-2xl border-2 border-primary/20 p-4 bg-white">
                      <img src={izitechQr} alt="QR Code WhatsApp" className="w-64 h-64 mx-auto" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Aguardando conexão...
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-primary" /> Powered by Izitech
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-sm font-semibold">Gerando QR Code...</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 4: Payment ─── */}
          {step === 4 && (
            <div className="space-y-5">
              {paymentDone ? (
                <div className="flex flex-col items-center py-10 text-center space-y-5">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-base font-bold">Tudo pronto!</p>
                    {izitechPhone && <p className="text-sm text-muted-foreground mt-1">Número: {izitechPhone}</p>}
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 w-full text-left space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Resumo</h4>
                    <ul className="space-y-1.5 text-xs text-foreground">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp conectado</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Cobrança gerada — R$ 45,00/mês</li>
                      <li className="flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5 text-primary" /> Integração ativa após confirmação do pagamento</li>
                    </ul>
                  </div>
                  <Button className="w-full" onClick={() => { reset(); onOpenChange(false); }}>Concluir</Button>
                </div>
              ) : paymentData ? (
                <div className="space-y-5">
                  <StepHeader number={4} title="Pagamento gerado" description="Efetue o pagamento para ativar sua integração WhatsApp." />

                  {paymentData.pix_qr_code_base64 && (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="rounded-2xl border-2 border-primary/20 p-4 bg-white">
                        <img src={`data:image/png;base64,${paymentData.pix_qr_code_base64}`} alt="QR Code PIX" className="w-48 h-48 mx-auto" />
                      </div>
                      {paymentData.pix_copy_paste && (
                        <div className="w-full">
                          <Label className="text-xs font-semibold">PIX Copia e Cola</Label>
                          <div className="flex gap-2 mt-1">
                            <Input value={paymentData.pix_copy_paste} readOnly className="text-[10px] font-mono bg-muted" />
                            <Button variant="outline" size="sm" onClick={() => {
                              navigator.clipboard.writeText(paymentData.pix_copy_paste!);
                              toast({ title: "Copiado!" });
                            }}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {paymentData.bank_slip_url && (
                    <Button variant="outline" className="w-full" onClick={() => window.open(paymentData.bank_slip_url!, "_blank")}>
                      <Receipt className="w-4 h-4 mr-2" /> Abrir Boleto
                    </Button>
                  )}
                  {paymentData.invoice_url && (
                    <Button variant="outline" className="w-full" onClick={() => window.open(paymentData.invoice_url!, "_blank")}>
                      <ExternalLink className="w-4 h-4 mr-2" /> Abrir Fatura
                    </Button>
                  )}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="text-[10px] text-muted-foreground">
                      Sua integração ficará ativa após confirmação do pagamento de <strong>R$ 45,00/mês</strong>.
                      <br />O status será atualizado automaticamente.
                    </p>
                  </div>
                  <PaymentPolling orgId={orgId} onConfirmed={() => setPaymentDone(true)} />
                </div>
              ) : (
                <div className="space-y-5">
                  <StepHeader number={4} title="Pagamento — R$ 45,00/mês" description="Escolha como pagar a integração WhatsApp Izitech." />

                  <div className="flex flex-col items-center space-y-2">
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 gap-1 px-3 py-1">
                      <Wifi className="w-3 h-3" /> WhatsApp conectado
                    </Badge>
                    {izitechPhone && <p className="text-xs text-muted-foreground">Número: {izitechPhone}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(["PIX", "BOLETO", "CREDIT_CARD"] as const).map((bt) => (
                      <button
                        key={bt}
                        onClick={() => setBillingType(bt)}
                        className={`rounded-xl border-2 p-3 text-center transition-all ${
                          billingType === bt ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          {bt === "PIX" && <QrCode className="w-5 h-5 text-primary" />}
                          {bt === "BOLETO" && <Receipt className="w-5 h-5 text-primary" />}
                          {bt === "CREDIT_CARD" && <CreditCard className="w-5 h-5 text-primary" />}
                          <span className="text-xs font-semibold">
                            {bt === "PIX" ? "PIX" : bt === "BOLETO" ? "Boleto" : "Cartão"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                    <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      R$ 45,00<span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Desconto exclusivo NoExcuse (50% off)</p>
                  </div>

                  <Button
                    className="w-full"
                    disabled={paymentLoading || !orgId}
                    onClick={async () => {
                      setPaymentLoading(true);
                      try {
                        const { data, error } = await invokeEdge("asaas-create-subscription", {
                          body: { organization_id: orgId, plan: "whatsapp", billing_type: billingType },
                        });
                        if (error) throw error;
                        if (data?.error) throw new Error(data.error);
                        setPaymentData({
                          pix_qr_code_base64: data.pix_qr_code_base64,
                          pix_copy_paste: data.pix_copy_paste,
                          invoice_url: data.invoice_url,
                          bank_slip_url: data.bank_slip_url,
                        });
                        if (billingType === "CREDIT_CARD" && data.invoice_url) {
                          window.open(data.invoice_url, "_blank");
                          setPaymentDone(true);
                        }
                      } catch (err: unknown) {
                        toast({
                          title: "Erro ao gerar cobrança",
                          description: (err instanceof Error ? err.message : String(err)) || "Tente novamente",
                          variant: "destructive",
                        });
                      } finally {
                        setPaymentLoading(false);
                      }
                    }}
                  >
                    {paymentLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    Gerar Cobrança
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 3 && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setHowItWorksOpen(true)} className="text-xs text-muted-foreground gap-1.5 hover:text-primary">
              <HelpCircle className="w-3.5 h-3.5" /> Como funciona?
            </Button>
            <span className="text-border">|</span>
            <Button variant="ghost" size="sm" onClick={openSupport} className="text-xs text-muted-foreground gap-1.5 hover:text-primary">
              <Headset className="w-3.5 h-3.5" /> Precisa de ajuda?
            </Button>
          </div>
        )}

        <WhatsAppHowItWorks open={howItWorksOpen} onOpenChange={setHowItWorksOpen} />
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetaRequirement({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/80 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <span className="text-emerald-600">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function StepHeader({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function PaymentPolling({ orgId, onConfirmed }: { orgId: string | null | undefined; onConfirmed: () => void }) {
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orgId) return;
    intervalRef.current = setInterval(async () => {
      try {
        setChecking(true);
        const { data } = await supabase
          .from("whatsapp_instances" as any)
          .select("billing_status")
          .eq("organization_id", orgId)
          .limit(1)
          .single();
        if ((data as any)?.billing_status === "active") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onConfirmed();
        }
      } catch {
        // Silenciar erros de polling — próxima iteração tentará novamente
      } finally { setChecking(false); }
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [orgId, onConfirmed]);

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <Loader2 className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
      Aguardando confirmação de pagamento...
    </div>
  );
}
