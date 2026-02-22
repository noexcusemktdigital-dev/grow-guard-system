import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSetupWhatsApp, useWhatsAppInstance } from "@/hooks/useWhatsApp";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2, Loader2, Wifi, WifiOff, ExternalLink,
  ArrowRight, ArrowLeft, KeyRound, Plug, ShieldCheck,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppSetupWizard({ open, onOpenChange }: Props) {
  const { refetch } = useWhatsAppInstance();
  const setupMutation = useSetupWhatsApp();
  const [step, setStep] = useState(1);
  const [creds, setCreds] = useState({ instanceId: "", instanceToken: "", clientToken: "" });
  const [result, setResult] = useState<{ status?: string; phone?: string } | null>(null);

  const reset = () => {
    setStep(1);
    setCreds({ instanceId: "", instanceToken: "", clientToken: "" });
    setResult(null);
  };

  const handleConnect = async () => {
    setStep(3);
    try {
      const res = await setupMutation.mutateAsync({
        instanceId: creds.instanceId.trim(),
        instanceToken: creds.instanceToken.trim(),
        clientToken: creds.clientToken.trim(),
        action: "connect",
      });
      setResult(res);
      refetch();
      toast({ title: "WhatsApp conectado!", description: "Webhooks configurados com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao conectar", description: err.message, variant: "destructive" });
      setStep(2);
    }
  };

  const canConnect = creds.instanceId.trim() && creds.instanceToken.trim() && creds.clientToken.trim();

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configurar WhatsApp Z-API</SheetTitle>
          <SheetDescription>Conecte sua instância Z-API em poucos passos</SheetDescription>
        </SheetHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mt-6 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Instructions */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" /> Onde encontrar suas credenciais
              </h4>
              <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Acesse seu painel Z-API em <a href="https://app.z-api.io" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">app.z-api.io <ExternalLink className="w-3 h-3" /></a></li>
                <li>Selecione sua instância (ou crie uma nova)</li>
                <li>Na aba "Detalhes", copie: <strong>Instance ID</strong>, <strong>Token</strong> e <strong>Client-Token</strong></li>
                <li>Certifique-se de que o WhatsApp está conectado (QR Code lido)</li>
              </ol>
            </div>
            <Button className="w-full" onClick={() => setStep(2)}>
              Tenho minhas credenciais <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Credentials */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Instance ID</Label>
              <Input
                placeholder="Ex: 3C67AB2F..."
                value={creds.instanceId}
                onChange={(e) => setCreds((p) => ({ ...p, instanceId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Token</Label>
              <Input
                placeholder="Token da instância"
                type="password"
                value={creds.instanceToken}
                onChange={(e) => setCreds((p) => ({ ...p, instanceToken: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Client-Token</Label>
              <Input
                placeholder="Token de segurança da conta"
                type="password"
                value={creds.clientToken}
                onChange={(e) => setCreds((p) => ({ ...p, clientToken: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button className="flex-1" disabled={!canConnect || setupMutation.isPending} onClick={handleConnect}>
                <Plug className="w-4 h-4 mr-1" /> Conectar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && (
          <div className="space-y-4">
            {setupMutation.isPending ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium">Conectando à Z-API...</p>
                <p className="text-xs text-muted-foreground mt-1">Configurando webhooks e verificando status</p>
              </div>
            ) : result ? (
              <div className="flex flex-col items-center py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">WhatsApp conectado!</p>
                  {result.phone && (
                    <p className="text-xs text-muted-foreground mt-1">Número: {result.phone}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 gap-1">
                  <Wifi className="w-3 h-3" /> {result.status || "connected"}
                </Badge>
                <Button className="w-full mt-4" onClick={() => { reset(); onOpenChange(false); }}>
                  Concluir
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
