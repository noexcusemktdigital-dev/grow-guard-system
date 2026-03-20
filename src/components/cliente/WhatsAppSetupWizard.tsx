import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSetupWhatsApp, useWhatsAppInstances } from "@/hooks/useWhatsApp";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2, Loader2, Wifi, ExternalLink,
  ArrowRight, ArrowLeft, KeyRound, Plug, ShieldCheck,
  AlertTriangle, Monitor, QrCode, Copy, Headset,
  MessageSquare, UserPlus, Settings, Eye, EyeOff,
  Server, HelpCircle,
} from "lucide-react";
import { WhatsAppHowItWorks } from "./WhatsAppHowItWorks";

type Provider = "zapi" | "evolution";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUPPORT_LINK = "https://wa.me/5500000000000?text=Olá! Preciso de ajuda para configurar a integração WhatsApp.";

const TOTAL_STEPS = 3;

export function WhatsAppSetupWizard({ open, onOpenChange }: Props) {
  const { refetch } = useWhatsAppInstances();
  const setupMutation = useSetupWhatsApp();
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<Provider>("zapi");
  const [creds, setCreds] = useState({ instanceId: "", instanceToken: "", clientToken: "" });
  const [evoCreds, setEvoCreds] = useState({ baseUrl: "", apiKey: "", instanceName: "" });
  const [result, setResult] = useState<{ status?: string; phone?: string } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showClientToken, setShowClientToken] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const reset = () => {
    setStep(1);
    setProvider("zapi");
    setCreds({ instanceId: "", instanceToken: "", clientToken: "" });
    setEvoCreds({ baseUrl: "", apiKey: "", instanceName: "" });
    setResult(null);
    setShowToken(false);
    setShowClientToken(false);
    setShowApiKey(false);
  };

  const handleConnect = async () => {
    setStep(3);
    try {
      let res: any;
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
    } catch (err: any) {
      toast({ title: "Erro ao conectar", description: err.message, variant: "destructive" });
      setStep(2);
    }
  };

  const canConnect = provider === "evolution"
    ? evoCreds.instanceName.trim()
    : creds.instanceId.trim() && creds.instanceToken.trim() && creds.clientToken.trim();

  const openSupport = () => window.open(SUPPORT_LINK, "_blank");

  const providerLabel = provider === "evolution" ? "Evolution API" : "Z-API";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Configurar WhatsApp via {providerLabel}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Siga o passo a passo para conectar seu WhatsApp ao sistema
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
              <span>Passo {step} de {TOTAL_STEPS}</span>
              <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
            </div>
            <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
          </div>

          <div className="flex items-center gap-1.5 mt-4">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  step >= s ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
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
                  <h3 className="text-sm font-bold">Escolha o fornecedor</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Selecione a plataforma que você utiliza para conectar ao WhatsApp.
                  </p>
                </div>
              </div>

              {/* Provider selection */}
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

              {/* Trial warning (Z-API only) */}
              {provider === "zapi" && (
                <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400">Conta paga obrigatória</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Na conta gratuita (trial) da Z-API, todas as mensagens enviadas terão um aviso automático de teste.
                        Para enviar mensagens <strong>sem essa marca</strong>, é necessário ativar um plano pago.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* What you'll need */}
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

              <Button className="w-full" onClick={() => setStep(2)}>
                Vamos começar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ─── STEP 2: Enter Credentials ─── */}
          {step === 2 && (
            <div className="space-y-5">
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
                      <p className="text-[10px] text-muted-foreground">Identificador único da sua instância</p>
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
                      <p className="text-[10px] text-muted-foreground">Token de autenticação da instância</p>
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
                      <p className="text-[10px] text-muted-foreground">Token de segurança da sua conta Z-API</p>
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
                      <p className="text-[10px] text-muted-foreground">Nome exato da instância criada na Evolution API</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Server className="w-3 h-3 text-muted-foreground" /> URL da API <span className="text-[10px] text-muted-foreground font-normal">(opcional)</span>
                      </Label>
                      <Input placeholder="https://evo.grupolamadre.com.br" value={evoCreds.baseUrl} onChange={(e) => setEvoCreds((p) => ({ ...p, baseUrl: e.target.value }))} />
                      <p className="text-[10px] text-muted-foreground">Deixe em branco para usar o servidor padrão</p>
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
                      <p className="text-[10px] text-muted-foreground">Deixe em branco para usar a chave padrão</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-amber-600 dark:text-amber-400">Dica:</strong> Se você não tem essas informações, entre em contato com o suporte.
                    </p>
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
            </div>
          )}

          {/* ─── STEP 3: Result ─── */}
          {step === 3 && (
            <div className="space-y-5">
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
                    {result.phone && (
                      <p className="text-sm text-muted-foreground mt-1">Número: {result.phone}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 gap-1 px-3 py-1">
                    <Wifi className="w-3 h-3" /> {result.status || "connected"}
                  </Badge>

                  <div className="rounded-xl border border-border bg-muted/30 p-4 w-full text-left space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Próximos passos</h4>
                    <ul className="space-y-1.5 text-xs text-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Webhooks configurados automaticamente
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Pronto para enviar e receber mensagens
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-primary" /> Acesse o Chat para conversar com seus contatos
                      </li>
                    </ul>
                  </div>

                  <Button className="w-full" onClick={() => { reset(); onOpenChange(false); }}>
                    Concluir
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer with how-it-works + support */}
        {step < 3 && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setHowItWorksOpen(true)} className="text-xs text-muted-foreground gap-1.5 hover:text-primary">
              <HelpCircle className="w-3.5 h-3.5" />
              Como funciona?
            </Button>
            <span className="text-border">|</span>
            <Button variant="ghost" size="sm" onClick={openSupport} className="text-xs text-muted-foreground gap-1.5 hover:text-primary">
              <Headset className="w-3.5 h-3.5" />
              Precisa de ajuda? Fale com o suporte
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
