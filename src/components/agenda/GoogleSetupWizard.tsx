import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowRight, Globe, Shield, KeyRound, AlertTriangle, Users, BookOpen, Settings, Monitor } from "lucide-react";
import {
  useGoogleCalendarSaveCredentials,
  useGoogleCalendarConnect,
} from "@/hooks/useGoogleCalendar";
import { toast } from "sonner";

interface GoogleSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GoogleSetupWizard({ open, onOpenChange }: GoogleSetupWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const saveCredentials = useGoogleCalendarSaveCredentials();
  const connectGoogle = useGoogleCalendarConnect();
  const redirectUri = `${window.location.origin}${window.location.pathname}`;
  const originUrl = window.location.origin;

  async function handleSaveAndConnect() {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error("Preencha o Client ID e Client Secret");
      return;
    }
    try {
      await saveCredentials.mutateAsync({ clientId: clientId.trim(), clientSecret: clientSecret.trim() });
      const url = await connectGoogle.mutateAsync(redirectUri);
      window.location.href = url;
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar credenciais");
    }
  }

  useEffect(() => {
    if (open) {
      setStep(1);
      setClientId("");
      setClientSecret("");
    }
  }, [open]);

  const tutorialSteps = [
    {
      n: 1,
      icon: <Globe className="w-4 h-4" />,
      title: "Acesse o Google Cloud Console",
      text: "Crie um novo projeto ou selecione um existente.",
      link: "https://console.cloud.google.com",
      linkText: "Abrir Console",
    },
    {
      n: 2,
      icon: <BookOpen className="w-4 h-4" />,
      title: "Ative a Google Calendar API",
      text: 'No menu lateral, vá em "APIs e Serviços" → "Biblioteca". Pesquise por "Google Calendar API" e clique em "Ativar".',
    },
    {
      n: 3,
      icon: <Shield className="w-4 h-4" />,
      title: "Configure a Tela de Consentimento OAuth",
      text: 'Vá em "APIs e Serviços" → "Tela de consentimento OAuth". Selecione tipo "Externo". Preencha o nome do app, e-mail de suporte e e-mail de contato do desenvolvedor.',
      tip: "Os demais campos podem ficar em branco neste momento.",
    },
    {
      n: 4,
      icon: <Users className="w-4 h-4" />,
      title: "Adicione Test Users",
      text: 'Ainda na "Tela de consentimento", vá na seção "Usuários de teste" e clique em "+ Add Users". Adicione o e-mail de cada pessoa que vai conectar o Google Agenda.',
      tip: "Enquanto o app estiver em modo 'Testing', apenas e-mails cadastrados aqui conseguem se conectar.",
      badge: "Importante",
    },
    {
      n: 5,
      icon: <Settings className="w-4 h-4" />,
      title: "Crie as credenciais OAuth",
      text: 'Vá em "APIs e Serviços" → "Credenciais" → clique em "+ Criar credenciais" → "ID do cliente OAuth 2.0". Tipo de aplicação: "Aplicativo da Web".',
    },
    {
      n: 6,
      icon: <Monitor className="w-4 h-4" />,
      title: "Origens JavaScript autorizadas",
      text: 'No campo "Origens JavaScript autorizadas", adicione:',
      code: originUrl,
    },
    {
      n: 7,
      icon: <Monitor className="w-4 h-4" />,
      title: "URIs de redirecionamento autorizados",
      text: 'No campo "URIs de redirecionamento autorizados", adicione a URL exata abaixo:',
      code: redirectUri,
      tip: "Use exatamente esta URL, sem barra no final.",
    },
    {
      n: 8,
      icon: <KeyRound className="w-4 h-4" />,
      title: "Copie o Client ID e Client Secret",
      text: 'Após criar, o Google exibirá o "ID do cliente" e a "Chave secreta do cliente". Copie ambos para usar no próximo passo.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Conectar Google Agenda
          </DialogTitle>
          <DialogDescription>
            Configure suas credenciais do Google para sincronizar eventos.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Siga os <strong>8 passos</strong> abaixo para criar suas credenciais OAuth no Google Cloud Console:
            </p>

            <div className="space-y-3">
              {tutorialSteps.map((item) => (
                <Card key={item.n} className="p-3 flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {item.n}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.badge && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.text}</p>
                    {item.code && (
                      <code className="block text-xs bg-muted px-2 py-1.5 rounded break-all select-all font-mono">
                        {item.code}
                      </code>
                    )}
                    {item.tip && (
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{item.tip}</span>
                      </div>
                    )}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {item.linkText} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={() => setStep(2)} className="gap-1">
                Já tenho as credenciais <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-start gap-2">
              <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Suas credenciais são armazenadas de forma segura e usadas apenas para conectar sua agenda pessoal.
              </p>
            </div>
            <div>
              <Label>Client ID *</Label>
              <Input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="123456789-xxxxx.apps.googleusercontent.com"
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label>Client Secret *</Label>
              <Input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                className="font-mono text-xs"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button
                onClick={handleSaveAndConnect}
                disabled={saveCredentials.isPending || connectGoogle.isPending}
                className="gap-1"
              >
                <KeyRound className="w-4 h-4" />
                {saveCredentials.isPending || connectGoogle.isPending ? "Conectando..." : "Salvar e Conectar"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
