import { Link2, Wifi, WifiOff, Settings2, RefreshCw, Unplug } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WhatsAppSetupWizard } from "@/components/cliente/WhatsAppSetupWizard";
import { useWhatsAppInstance, useSetupWhatsApp } from "@/hooks/useWhatsApp";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ClienteIntegracoes() {
  const { data: instance, isLoading, refetch } = useWhatsAppInstance();
  const setupMutation = useSetupWhatsApp();
  const [wizardOpen, setWizardOpen] = useState(false);

  const isConnected = instance?.status === "connected";

  const handleCheckStatus = async () => {
    if (!instance) return;
    try {
      await setupMutation.mutateAsync({
        instanceId: instance.instance_id,
        instanceToken: instance.token,
        clientToken: instance.client_token,
        action: "status",
      });
      refetch();
      toast({ title: "Status atualizado" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDisconnect = async () => {
    if (!instance) return;
    try {
      await setupMutation.mutateAsync({
        instanceId: instance.instance_id,
        instanceToken: instance.token,
        clientToken: instance.client_token,
        action: "disconnect",
      });
      refetch();
      toast({ title: "WhatsApp desconectado" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Integrações"
        subtitle="Conecte ferramentas externas"
        icon={<Link2 className="w-5 h-5 text-primary" />}
      />

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isConnected ? "bg-emerald-500/10" : "bg-muted"
                }`}>
                  <svg viewBox="0 0 24 24" className={`w-6 h-6 ${isConnected ? "text-emerald-500" : "text-muted-foreground"}`} fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.382-1.572l-.376-.226-3.897 1.306 1.306-3.897-.226-.376A9.94 9.94 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">WhatsApp via Z-API</h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] gap-1 ${
                        isConnected
                          ? "text-emerald-400 border-emerald-500/30"
                          : "text-muted-foreground border-border"
                      }`}
                    >
                      {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {isConnected ? "Conectado" : "Desconectado"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isConnected && instance?.phone_number
                      ? `Número: ${instance.phone_number}`
                      : "Envie e receba mensagens pelo WhatsApp"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isConnected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckStatus}
                      disabled={setupMutation.isPending}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1 ${setupMutation.isPending ? "animate-spin" : ""}`} />
                      Verificar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={setupMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Unplug className="w-3.5 h-3.5 mr-1" /> Desconectar
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setWizardOpen(true)}>
                    <Settings2 className="w-3.5 h-3.5 mr-1" /> Configurar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <WhatsAppSetupWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
