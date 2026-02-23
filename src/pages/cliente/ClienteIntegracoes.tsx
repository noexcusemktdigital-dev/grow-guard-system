import { useState } from "react";
import { Link2, Wifi, WifiOff, Settings2, RefreshCw, Unplug, AlertTriangle, Headset, Tag, Copy, Key, Webhook, Calendar, BarChart3, Globe, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WhatsAppSetupWizard } from "@/components/cliente/WhatsAppSetupWizard";
import { useWhatsAppInstances, useSetupWhatsApp } from "@/hooks/useWhatsApp";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const SUPPORT_LINK = "https://wa.me/5500000000000?text=Olá! Preciso de ajuda com a integração Z-API.";

const UPCOMING_INTEGRATIONS = [
  { name: "Google Agenda", icon: Calendar, desc: "Sincronize eventos e reuniões", status: "Em breve" },
  { name: "RD Station", icon: BarChart3, desc: "Importe leads automaticamente", status: "Em breve" },
  { name: "Meta Ads", icon: Megaphone, desc: "Conecte campanhas do Facebook e Instagram", status: "Em breve" },
  { name: "Google Ads", icon: Globe, desc: "Importe leads de campanhas Google", status: "Em breve" },
];

export default function ClienteIntegracoes() {
  const { data: instances, isLoading, refetch } = useWhatsAppInstances();
  const setupMutation = useSetupWhatsApp();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { data: org } = useOrgProfile();
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  const generateApiKey = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("generate_org_api_key", { _org_id: orgId! });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (key) => {
      qc.invalidateQueries({ queryKey: ["org-profile"] });
      navigator.clipboard.writeText(key);
      toast.success("API Key gerada e copiada!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCheckStatus = async (instanceId: string, token: string, clientToken: string) => {
    try {
      await setupMutation.mutateAsync({ instanceId, instanceToken: token, clientToken, action: "status" });
      refetch();
      toast.success("Status atualizado");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDisconnect = async (instanceId: string, token: string, clientToken: string) => {
    try {
      await setupMutation.mutateAsync({ instanceId, instanceToken: token, clientToken, action: "disconnect" });
      refetch();
      toast.success("WhatsApp desconectado");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const webhookUrl = orgId ? `https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/crm-lead-webhook?org_id=${orgId}` : "";
  const hasAnyConnected = instances?.some((i) => i.status === "connected");

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Integrações" subtitle="Conecte ferramentas e gerencie APIs" icon={<Link2 className="w-5 h-5 text-primary" />} />

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <>
          {/* Active integrations: WhatsApp */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" /> Integrações Ativas
            </h3>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">WhatsApp via Z-API</p>
              <Button size="sm" onClick={() => setWizardOpen(true)}>
                <Settings2 className="w-3.5 h-3.5 mr-1" /> Adicionar número
              </Button>
            </div>

            {(!instances || instances.length === 0) ? (
              <Card>
                <CardContent className="p-5 text-center">
                  <p className="text-sm text-muted-foreground">Nenhum número configurado ainda.</p>
                  <Button className="mt-3" size="sm" onClick={() => setWizardOpen(true)}>
                    <Settings2 className="w-3.5 h-3.5 mr-1" /> Configurar primeiro número
                  </Button>
                </CardContent>
              </Card>
            ) : (
              instances.map((instance) => {
                const isConnected = instance.status === "connected";
                return (
                  <Card key={instance.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConnected ? "bg-emerald-500/10" : "bg-muted"}`}>
                            <svg viewBox="0 0 24 24" className={`w-5 h-5 ${isConnected ? "text-emerald-500" : "text-muted-foreground"}`} fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.382-1.572l-.376-.226-3.897 1.306 1.306-3.897-.226-.376A9.94 9.94 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold">
                                {instance.label || instance.phone_number || `Instância ${instance.instance_id.slice(0, 8)}...`}
                              </h4>
                              <Badge variant="outline" className={`text-[10px] gap-1 ${isConnected ? "text-primary border-primary/30" : "text-muted-foreground border-border"}`}>
                                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                {isConnected ? "Conectado" : "Desconectado"}
                              </Badge>
                            </div>
                            {instance.phone_number && <p className="text-xs text-muted-foreground">Número: {instance.phone_number}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isConnected ? (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleCheckStatus(instance.instance_id, instance.token, instance.client_token)} disabled={setupMutation.isPending}>
                                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${setupMutation.isPending ? "animate-spin" : ""}`} /> Verificar
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDisconnect(instance.instance_id, instance.token, instance.client_token)} disabled={setupMutation.isPending} className="text-destructive hover:text-destructive">
                                <Unplug className="w-3.5 h-3.5 mr-1" /> Desconectar
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleDisconnect(instance.instance_id, instance.token, instance.client_token)} disabled={setupMutation.isPending} className="text-destructive hover:text-destructive">
                              <Unplug className="w-3.5 h-3.5 mr-1" /> Remover
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {hasAnyConnected && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Conta Z-API em modo trial?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Ative um plano pago na Z-API para remover o prefixo de trial.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.open("https://app.z-api.io", "_blank")} className="shrink-0 text-xs">Ver planos</Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Upcoming Integrations */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Integrações Disponíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {UPCOMING_INTEGRATIONS.map((int) => (
                <Card key={int.name} className="opacity-70">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <int.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{int.name}</p>
                      <p className="text-xs text-muted-foreground">{int.desc}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{int.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* API & Webhooks */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" /> API & Webhooks
            </h3>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Chave de API</CardTitle>
                <CardDescription>Use sua API Key para integrar com sistemas externos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={org?.api_key || "Nenhuma chave gerada"} readOnly className="bg-muted font-mono text-xs" />
                  {org?.api_key ? (
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(org.api_key!); toast.success("Copiado!"); }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => generateApiKey.mutate()} disabled={generateApiKey.isPending}>
                      <Key className="w-4 h-4 mr-1" /> Gerar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Webhook className="w-4 h-4" /> Webhook de Leads</CardTitle>
                <CardDescription>Envie leads de formulários, landing pages ou ads para este endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="bg-muted font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("URL copiada!"); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Envie POST com JSON: {"{"}"name", "email", "phone", "source"{"}"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Support CTA */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Headset className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Precisa de ajuda?</p>
                  <p className="text-xs text-muted-foreground">Nossa equipe pode te ajudar a configurar</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open(SUPPORT_LINK, "_blank")}>Falar com suporte</Button>
            </CardContent>
          </Card>
        </>
      )}

      <WhatsAppSetupWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
