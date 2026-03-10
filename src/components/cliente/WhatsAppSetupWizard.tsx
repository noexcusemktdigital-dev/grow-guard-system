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
  Server,
} from "lucide-react";

type Provider = "zapi" | "evolution";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUPPORT_LINK = "https://wa.me/5500000000000?text=Olá! Preciso de ajuda para configurar a integração WhatsApp.";

const TOTAL_STEPS = 5;

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
    setStep(5);
    try {
      let res: any;
      if (provider === "evolution") {
        res = await setupMutation.mutateAsync({
          provider: "evolution",
          baseUrl: evoCreds.baseUrl.trim(),
          apiKey: evoCreds.apiKey.trim(),
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
      setStep(4);
    }
  };

  const canConnect = provider === "evolution"
    ? evoCreds.baseUrl.trim() && evoCreds.apiKey.trim() && evoCreds.instanceName.trim()
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

          {/* ─── STEP 2: Create Account / Setup ─── */}
          {step === 2 && (
            <div className="space-y-5">
              {provider === "zapi" ? (
                <>
                  <StepHeader number={1} title="Crie sua conta na Z-API" description="Se você já tem uma conta, pule para o próximo passo." />
                  <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-5">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <Monitor className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Acesse o site da Z-API</p>
                        <p className="text-xs text-muted-foreground mt-1">Clique no botão abaixo para abrir o painel</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.open("https://app.z-api.io", "_blank")}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Abrir Z-API
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Passo a passo</h4>
                    <ol className="space-y-3">
                      {['Acesse app.z-api.io e clique em "Criar conta"', "Preencha seu e-mail e crie uma senha", "Confirme seu e-mail clicando no link de verificação", "Faça login no painel da Z-API"].map((text, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-foreground">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                          <span className="mt-0.5 leading-relaxed">{text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              ) : (
                <>
                  <StepHeader number={1} title="Configure sua Evolution API" description="Certifique-se de que sua instância está rodando e acessível." />
                  <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-5">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Server className="w-8 h-8 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Evolution API</p>
                        <p className="text-xs text-muted-foreground mt-1">Sua instância deve estar rodando e acessível via HTTP</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.open("https://doc.evolution-api.com", "_blank")}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Documentação
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Passo a passo</h4>
                    <ol className="space-y-3">
                      {["Instale a Evolution API no seu servidor (Docker recomendado)", "Configure a API Key global no arquivo .env", "Crie uma instância via painel ou API", "Conecte o WhatsApp escaneando o QR Code no painel"].map((text, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-foreground">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                          <span className="mt-0.5 leading-relaxed">{text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  {provider === "zapi" ? "Já tenho conta" : "API configurada"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Create & Connect Instance ─── */}
          {step === 3 && (
            <div className="space-y-5">
              {provider === "zapi" ? (
                <>
                  <StepHeader number={2} title="Crie e conecte sua instância" description="Crie uma instância no painel e conecte escaneando o QR Code." />
                  <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-5">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Settings className="w-8 h-8 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Criar nova instância</p>
                        <p className="text-xs text-muted-foreground mt-1">No painel Z-API, clique em <strong>"Nova Instância"</strong></p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Passo a passo</h4>
                    <ol className="space-y-3">
                      {['No painel Z-API, clique em "Nova Instância"', 'Dê um nome para sua instância (ex: "Minha Empresa")', 'Após criar, clique em "Conectar" para gerar o QR Code', "Abra o WhatsApp no celular → Configurações → Aparelhos conectados → Conectar aparelho", "Escaneie o QR Code exibido na tela com seu celular", 'Aguarde a confirmação de conexão (status: "Connected")'].map((text, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-foreground">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                          <span className="mt-0.5 leading-relaxed">{text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              ) : (
                <>
                  <StepHeader number={2} title="Conecte o WhatsApp na instância" description="Escaneie o QR Code no painel da Evolution API." />
                  <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl border-2 border-border bg-background flex items-center justify-center shrink-0">
                        <QrCode className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Escaneie o QR Code</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          No painel da Evolution API, acesse sua instância e escaneie o QR Code com o WhatsApp.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Passo a passo</h4>
                    <ol className="space-y-3">
                      {["Acesse o painel da Evolution API", "Selecione a instância que deseja conectar", 'Clique em "Conectar" para gerar o QR Code', "Abra o WhatsApp → Aparelhos conectados → Conectar", "Escaneie o QR Code e aguarde a conexão"].map((text, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-foreground">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                          <span className="mt-0.5 leading-relaxed">{text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}

              {/* QR Code visual hint (Z-API only) */}
              {provider === "zapi" && (
                <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl border-2 border-border bg-background flex items-center justify-center shrink-0">
                      <QrCode className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Escaneie o QR Code</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        O QR Code será exibido no painel da Z-API. Use a câmera do WhatsApp para conectar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button className="flex-1" onClick={() => setStep(4)}>
                  {provider === "zapi" ? "Instância conectada" : "WhatsApp conectado"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Enter Credentials ─── */}
          {step === 4 && (
            <div className="space-y-5">
              <StepHeader
                number={3}
                title="Insira suas credenciais"
                description={provider === "zapi"
                  ? "Copie as informações do painel Z-API e cole nos campos abaixo."
                  : "Informe a URL, API Key e o nome da instância da Evolution API."
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
                  <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-5">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Server className="w-8 h-8 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Credenciais da Evolution API</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Informe a URL base do seu servidor, a API Key global e o nome da instância criada.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Server className="w-3 h-3 text-muted-foreground" /> URL da API
                      </Label>
                      <Input placeholder="Ex: http://129.121.44.154:8080" value={evoCreds.baseUrl} onChange={(e) => setEvoCreds((p) => ({ ...p, baseUrl: e.target.value }))} />
                      <p className="text-[10px] text-muted-foreground">URL base do seu servidor Evolution API</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <KeyRound className="w-3 h-3 text-muted-foreground" /> API Key Global
                      </Label>
                      <div className="relative">
                        <Input placeholder="Sua API Key global" type={showApiKey ? "text" : "password"} value={evoCreds.apiKey} onChange={(e) => setEvoCreds((p) => ({ ...p, apiKey: e.target.value }))} />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowApiKey(!showApiKey)}>
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Chave de autenticação global da Evolution API</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Copy className="w-3 h-3 text-muted-foreground" /> Nome da Instância
                      </Label>
                      <Input placeholder="Ex: minha-empresa" value={evoCreds.instanceName} onChange={(e) => setEvoCreds((p) => ({ ...p, instanceName: e.target.value }))} />
                      <p className="text-[10px] text-muted-foreground">Nome exato da instância criada na Evolution API</p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button className="flex-1" disabled={!canConnect || setupMutation.isPending} onClick={handleConnect}>
                  <Plug className="w-4 h-4 mr-1" /> Conectar
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 5: Result ─── */}
          {step === 5 && (
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

        {/* Footer with support */}
        {step < 5 && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-center">
            <Button variant="ghost" size="sm" onClick={openSupport} className="text-xs text-muted-foreground gap-1.5 hover:text-primary">
              <Headset className="w-3.5 h-3.5" />
              Precisa de ajuda? Fale com o suporte
            </Button>
          </div>
        )}
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
