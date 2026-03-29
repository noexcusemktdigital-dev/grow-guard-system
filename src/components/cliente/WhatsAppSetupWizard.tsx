import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSetupWhatsApp, useWhatsAppInstances } from "@/hooks/useWhatsApp";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2, Loader2, Wifi, ExternalLink,
  ArrowRight, ArrowLeft, KeyRound, Plug, ShieldCheck,
  AlertTriangle, QrCode, Copy, Headset,
  MessageSquare, UserPlus, Eye, EyeOff,
  Server, HelpCircle, Zap,
} from "lucide-react";
import { WhatsAppHowItWorks } from "./WhatsAppHowItWorks";

type Provider = "izitech" | "evolution";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INSTANCE_NAME_REGEX = /^[a-zA-Z0-9-]+$/;
const SUPPORT_LINK = "https://wa.me/5500000000000?text=Olá! Preciso de ajuda para configurar a integração WhatsApp.";

export function WhatsAppSetupWizard({ open, onOpenChange }: Props) {
  const { refetch } = useWhatsAppInstances();
  const setupMutation = useSetupWhatsApp();
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<Provider>("izitech");
  const [creds, setCreds] = useState({ instanceId: "", instanceToken: "", clientToken: "" });
  const [evoCreds, setEvoCreds] = useState({ baseUrl: "", apiKey: "", instanceName: "" });
  const [izitechName, setIzitechName] = useState("");
  const [izitechNameError, setIzitechNameError] = useState("");
  const [result, setResult] = useState<{ status?: string; phone?: string } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showClientToken, setShowClientToken] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  // IZITECH QR flow
  const [izitechQr, setIzitechQr] = useState<string | null>(null);
  const [izitechLoading, setIzitechLoading] = useState(false);
  const [izitechConnected, setIzitechConnected] = useState(false);
  const [izitechPhone, setIzitechPhone] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = provider === "izitech" ? 3 : 3;

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Cleanup polling on unmount/close
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const reset = () => {
    stopPolling();
    setStep(1);
    setProvider("izitech");
    setCreds({ instanceId: "", instanceToken: "", clientToken: "" });
    setEvoCreds({ baseUrl: "", apiKey: "", instanceName: "" });
    setIzitechName("");
    setIzitechNameError("");
    setResult(null);
    setIzitechQr(null);
    setIzitechLoading(false);
    setIzitechConnected(false);
    setIzitechPhone(null);
    setShowToken(false);
    setShowClientToken(false);
    setShowApiKey(false);
  };

  const validateIzitechName = (name: string): string => {
    if (name.length < 3) return "Nome deve ter no mínimo 3 caracteres";
    if (!INSTANCE_NAME_REGEX.test(name)) return "Apenas letras, números e hífens";
    return "";
  };

  // ── IZITECH: Create instance + QR polling ──
  const handleIzitechConnect = async () => {
    const err = validateIzitechName(izitechName);
    if (err) { setIzitechNameError(err); return; }

    setStep(3);
    setIzitechLoading(true);
    setIzitechQr(null);
    setIzitechConnected(false);

    try {
      // Create instance via IZITECH
      const { data, error } = await supabase.functions.invoke("izitech-provision", {
        body: { action: "create", instance_name: izitechName.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.qr_code) {
        setIzitechQr(data.qr_code);
      }
      setIzitechLoading(false);

      // Start polling for QR updates / connection
      const pollName = izitechName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      pollingRef.current = setInterval(async () => {
        try {
          const { data: qrData } = await supabase.functions.invoke("izitech-provision", {
            body: { action: "qr", instance_name: pollName },
          });
          if (qrData?.status === "connected") {
            stopPolling();
            setIzitechConnected(true);
            setIzitechPhone(qrData.phone_number || null);
            setIzitechQr(null);
            refetch();
            toast({ title: "WhatsApp conectado!", description: "Tudo configurado automaticamente." });
          } else if (qrData?.qr_code) {
            setIzitechQr(qrData.qr_code);
          }
        } catch {
          // Ignore polling errors
        }
      }, 4000);
    } catch (err: unknown) {
      setIzitechLoading(false);
      toast({ title: "Erro", description: (err instanceof Error ? err.message : String(err)) || "Falha ao criar instância", variant: "destructive" });
      setStep(2);
    }
  };

  // ── Z-API / Evolution: existing flow ──
  const handleConnect = async () => {
    setStep(3);
    try {
      let res: Record<string, unknown>;
      if (provider === "evolution") {
        res = await setupMutation.mutateAsync({
          provider: "evolution",
          baseUrl: evoCreds.baseUrl.trim() || undefined,
          apiKey: evoCreds.apiKey.trim() || undefined,
          instanceName: evoCreds.instanceName.trim(),
          action: "connect",
        });
      } else {
        res = await setupMutation.mutateAsync({
          instanceId: creds.instanceId.trim(),
          instanceToken: creds.instanceToken.trim(),
          clientToken: creds.clientToken.trim(),
          action: "connect",
          provider: "zapi",
        });
      }
      setResult(res);
      refetch();
      toast({ title: "WhatsApp conectado!", description: "Webhooks configurados com sucesso." });
    } catch (err: unknown) {
      toast({ title: "Erro ao conectar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      setStep(2);
    }
  };

  const canConnect = provider === "izitech"
    ? izitechName.trim().length >= 3 && !validateIzitechName(izitechName.trim())
    : provider === "evolution"
      ? evoCreds.instanceName.trim()
      : creds.instanceId.trim() && creds.instanceToken.trim() && creds.clientToken.trim();

  const openSupport = () => window.open(SUPPORT_LINK, "_blank");
  const providerLabel = provider === "izitech" ? "IZITECH Connect" : provider === "evolution" ? "Evolution API" : "Z-API";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); } onOpenChange(v); }}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Conectar WhatsApp{provider !== "izitech" ? ` via ${providerLabel}` : ""}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {provider === "izitech"
                ? "Crie e conecte seu WhatsApp automaticamente"
                : "Siga o passo a passo para conectar seu WhatsApp ao sistema"}
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
          {/* ─── STEP 1: Choose Provider ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Como deseja conectar?</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Escolha a forma de integração do seu WhatsApp.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* IZITECH — recommended */}
                <button
                  onClick={() => setProvider("izitech")}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    provider === "izitech"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">IZITECH Connect</p>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]">Recomendado</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                        Automático — criamos e gerenciamos a instância para você. Basta escanear o QR code.
                      </p>
                      <p className="text-[10px] text-amber-500 mt-1 font-medium">
                        Serviço com custo separado conforme plano contratado
                      </p>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-3 px-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">ou configure manualmente</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setProvider("zapi")}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      provider === "zapi"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                      <Plug className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-sm font-bold">Z-API</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      Plataforma SaaS gerenciada. Crie sua conta em app.z-api.io.
                    </p>
                  </button>

                  <button
                    onClick={() => setProvider("evolution")}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      provider === "evolution"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                      <Server className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-sm font-bold">Evolution API</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      Open-source, self-hosted. Configure sua própria instância.
                    </p>
                  </button>
                </div>
              </div>

              {provider === "zapi" && (
                <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400">Conta paga obrigatória</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Na conta gratuita (trial) da Z-API, todas as mensagens enviadas terão um aviso automático de teste.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {provider === "izitech" && (
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
                    O que você vai precisar
                  </h4>
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
              )}

              {(provider === "zapi" || provider === "evolution") && (
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
                    O que você vai precisar
                  </h4>
                  <div className="grid gap-2">
                    {provider === "zapi" ? (
                      <>
                        {[
                          { icon: UserPlus, text: "Uma conta na Z-API (gratuita ou paga)" },
                          { icon: QrCode, text: "Um celular com WhatsApp para escanear o QR Code" },
                          { icon: KeyRound, text: "Instance ID, Token e Client-Token" },
                        ].map(({ icon: Icon, text }, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs text-foreground">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-3.5 h-3.5 text-primary" />
                            </div>
                            {text}
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          { icon: Server, text: "Uma instância da Evolution API rodando" },
                          { icon: QrCode, text: "Um celular com WhatsApp conectado à instância" },
                          { icon: KeyRound, text: "URL da API, API Key global e nome da instância" },
                        ].map(({ icon: Icon, text }, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs text-foreground">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-3.5 h-3.5 text-primary" />
                            </div>
                            {text}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={() => setStep(2)}>
                Vamos começar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ─── STEP 2: Credentials / Instance Name ─── */}
          {step === 2 && (
            <div className="space-y-5">
              {provider === "izitech" ? (
                <>
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
                      <p className="text-xs font-semibold">Powered by IZITECH Connect</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      A instância será criada automaticamente na plataforma IZITECH Connect.
                      Os webhooks serão configurados para receber mensagens diretamente neste sistema.
                      Este serviço tem custo separado conforme seu plano contratado.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                    </Button>
                    <Button className="flex-1" disabled={!canConnect} onClick={handleIzitechConnect}>
                      <Zap className="w-4 h-4 mr-1" /> Criar e Conectar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <StepHeader
                    number={2}
                    title="Insira suas credenciais"
                    description={provider === "zapi"
                      ? "Copie as informações do painel Z-API e cole nos campos abaixo."
                      : "Informe o nome da instância. URL e API Key são opcionais se usar o servidor padrão."
                    }
                  />

                  {provider === "zapi" ? (
                    <>
                      <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-5">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                            <KeyRound className="w-8 h-8 text-violet-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Onde encontrar as credenciais?</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              No painel Z-API, selecione sua instância e vá na aba <strong>"Detalhes"</strong>.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Copy className="w-3 h-3 text-muted-foreground" /> Instance ID
                          </Label>
                          <Input placeholder="Ex: 3C67AB2F1A4D..." value={creds.instanceId} onChange={(e) => setCreds((p) => ({ ...p, instanceId: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <KeyRound className="w-3 h-3 text-muted-foreground" /> Token
                          </Label>
                          <div className="relative">
                            <Input placeholder="Token da instância" type={showToken ? "text" : "password"} value={creds.instanceToken} onChange={(e) => setCreds((p) => ({ ...p, instanceToken: e.target.value }))} />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowToken(!showToken)}>
                              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3 text-muted-foreground" /> Client-Token
                          </Label>
                          <div className="relative">
                            <Input placeholder="Token de segurança da conta" type={showClientToken ? "text" : "password"} value={creds.clientToken} onChange={(e) => setCreds((p) => ({ ...p, clientToken: e.target.value }))} />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowClientToken(!showClientToken)}>
                              {showClientToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Copy className="w-3 h-3 text-muted-foreground" /> Nome da Instância <span className="text-destructive">*</span>
                          </Label>
                          <Input placeholder="Ex: minha-empresa" value={evoCreds.instanceName} onChange={(e) => setEvoCreds((p) => ({ ...p, instanceName: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Server className="w-3 h-3 text-muted-foreground" /> URL da API <span className="text-[10px] text-muted-foreground font-normal">(opcional)</span>
                          </Label>
                          <Input placeholder="https://evo.grupolamadre.com.br" value={evoCreds.baseUrl} onChange={(e) => setEvoCreds((p) => ({ ...p, baseUrl: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <KeyRound className="w-3 h-3 text-muted-foreground" /> API Key Global <span className="text-[10px] text-muted-foreground font-normal">(opcional)</span>
                          </Label>
                          <div className="relative">
                            <Input placeholder="Sua API Key global" type={showApiKey ? "text" : "password"} value={evoCreds.apiKey} onChange={(e) => setEvoCreds((p) => ({ ...p, apiKey: e.target.value }))} />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowApiKey(!showApiKey)}>
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                    </Button>
                    <Button className="flex-1" disabled={!canConnect || setupMutation.isPending} onClick={handleConnect}>
                      <Plug className="w-4 h-4 mr-1" /> Conectar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── STEP 3: QR Code (IZITECH) or Result (Z-API/Evolution) ─── */}
          {step === 3 && (
            <div className="space-y-5">
              {provider === "izitech" ? (
                // IZITECH QR flow
                izitechConnected ? (
                  <div className="flex flex-col items-center py-10 text-center space-y-5">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-base font-bold">WhatsApp conectado com sucesso!</p>
                      {izitechPhone && <p className="text-sm text-muted-foreground mt-1">Número: {izitechPhone}</p>}
                    </div>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 gap-1 px-3 py-1">
                      <Wifi className="w-3 h-3" /> connected
                    </Badge>
                    <div className="rounded-xl border border-border bg-muted/30 p-4 w-full text-left space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Tudo pronto!</h4>
                      <ul className="space-y-1.5 text-xs text-foreground">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Instância criada via IZITECH Connect</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Webhooks configurados automaticamente</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Pronto para enviar e receber mensagens</li>
                        <li className="flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5 text-primary" /> Acesse o Chat para conversar com seus contatos</li>
                      </ul>
                    </div>
                    <Button className="w-full" onClick={() => { reset(); onOpenChange(false); }}>Concluir</Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-5">
                    {izitechLoading ? (
                      <>
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-sm font-semibold">Criando instância via IZITECH Connect...</p>
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
                            <Zap className="w-3 h-3 text-primary" /> Powered by IZITECH Connect
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
                )
              ) : (
                // Z-API / Evolution result
                <>
                  {setupMutation.isPending ? (
                    <div className="flex flex-col items-center py-16 text-center">
                      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                      <p className="text-sm font-semibold">Conectando via {providerLabel}...</p>
                      <p className="text-xs text-muted-foreground mt-1">Configurando webhooks e verificando status</p>
                    </div>
                  ) : result ? (
                    <div className="flex flex-col items-center py-10 text-center space-y-5">
                      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-10 h-10 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-base font-bold">WhatsApp conectado com sucesso!</p>
                        {result.phone && <p className="text-sm text-muted-foreground mt-1">Número: {result.phone}</p>}
                      </div>
                      <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 gap-1 px-3 py-1">
                        <Wifi className="w-3 h-3" /> {result.status || "connected"}
                      </Badge>
                      <div className="rounded-xl border border-border bg-muted/30 p-4 w-full text-left space-y-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Próximos passos</h4>
                        <ul className="space-y-1.5 text-xs text-foreground">
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Webhooks configurados automaticamente</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Pronto para enviar e receber mensagens</li>
                          <li className="flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5 text-primary" /> Acesse o Chat para conversar com seus contatos</li>
                        </ul>
                      </div>
                      <Button className="w-full" onClick={() => { reset(); onOpenChange(false); }}>Concluir</Button>
                    </div>
                  ) : null}
                </>
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
      </DialogContent>
    </Dialog>
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
