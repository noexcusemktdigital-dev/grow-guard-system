import { useState } from "react";
import { Link2, Wifi, WifiOff, Settings2, RefreshCw, Unplug, AlertTriangle, Headset, Copy, Key, Webhook, Calendar, BarChart3, Globe, Megaphone, MessageSquare, Database, Code2, TrendingUp } from "lucide-react";
import { WebsiteChatConfig } from "@/components/cliente/WebsiteChatConfig";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { WhatsAppSetupWizard } from "@/components/cliente/WhatsAppSetupWizard";
import { useWhatsAppInstances, useSetupWhatsApp } from "@/hooks/useWhatsApp";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const SUPPORT_LINK = "https://wa.me/5500000000000?text=Olá! Preciso de ajuda com a integração Z-API.";

interface IntegrationItem {
  name: string;
  icon: any;
  desc: string;
  provider: string;
  fields: { key: string; label: string; placeholder: string }[];
}

const INTEGRATIONS_BY_SECTION: { title: string; icon: any; items: IntegrationItem[] }[] = [
  {
    title: "Comunicação",
    icon: MessageSquare,
    items: [
      { name: "WhatsApp Z-API", icon: MessageSquare, desc: "Envie e receba mensagens via WhatsApp", provider: "whatsapp_zapi", fields: [] },
      { name: "Widget de Chat", icon: MessageSquare, desc: "Chat ao vivo no seu site", provider: "website_chat", fields: [] },
    ],
  },
  {
    title: "Anúncios & Tráfego",
    icon: TrendingUp,
    items: [
      { name: "Meta Ads", icon: Megaphone, desc: "Conecte campanhas do Facebook e Instagram", provider: "meta_ads", fields: [{ key: "access_token", label: "Token de Acesso", placeholder: "EAAx..." }, { key: "account_id", label: "ID da Conta", placeholder: "act_123456" }] },
      { name: "Google Ads", icon: Globe, desc: "Importe leads de campanhas Google", provider: "google_ads", fields: [{ key: "access_token", label: "Token de Acesso", placeholder: "ya29..." }, { key: "customer_id", label: "Customer ID", placeholder: "123-456-7890" }] },
      { name: "TikTok Ads", icon: TrendingUp, desc: "Conecte campanhas do TikTok", provider: "tiktok_ads", fields: [{ key: "access_token", label: "Token de Acesso", placeholder: "tok_..." }, { key: "advertiser_id", label: "Advertiser ID", placeholder: "123456" }] },
    ],
  },
  {
    title: "CRM & Automação",
    icon: Database,
    items: [
      { name: "RD Station", icon: BarChart3, desc: "Importe leads automaticamente", provider: "rd_station", fields: [{ key: "api_token", label: "Token da API", placeholder: "Seu token RD Station" }] },
      { name: "Webhook de Leads", icon: Webhook, desc: "Receba leads de fontes externas", provider: "webhook_leads", fields: [] },
    ],
  },
  {
    title: "Produtividade",
    icon: Calendar,
    items: [
      { name: "Google Agenda", icon: Calendar, desc: "Sincronize eventos e reuniões", provider: "google_calendar", fields: [{ key: "client_id", label: "Client ID", placeholder: "xxxxx.apps.googleusercontent.com" }, { key: "client_secret", label: "Client Secret", placeholder: "GOCSPX-..." }] },
    ],
  },
];

function IntegrationConnectDialog({ integration, open, onOpenChange }: { integration: IntegrationItem | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("organization_integrations" as any)
        .upsert({
          organization_id: orgId!,
          provider: integration!.provider,
          config,
          status: "connected",
        }, { onConflict: "organization_id,provider" } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${integration!.name} conectado!`);
      qc.invalidateQueries({ queryKey: ["org-integrations"] });
      onOpenChange(false);
      setConfig({});
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!integration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar {integration.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">{integration.desc}</p>
          {integration.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <Input
                value={config[field.key] || ""}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando..." : "Conectar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClienteIntegracoes() {
  const { data: instances, isLoading, refetch } = useWhatsAppInstances();
  const setupMutation = useSetupWhatsApp();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { data: org } = useOrgProfile();
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();
  const [connectDialog, setConnectDialog] = useState<IntegrationItem | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);

  const { data: savedIntegrations } = useQuery({
    queryKey: ["org-integrations", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_integrations" as any)
        .select("*")
        .eq("organization_id", orgId!);
      if (error) throw error;
      return (data ?? []) as unknown as { provider: string; status: string }[];
    },
    enabled: !!orgId,
  });

  const isConnected = (provider: string) => savedIntegrations?.some((i) => i.provider === provider && i.status === "connected");

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
      await setupMutation.mutateAsync({ instanceId, instanceToken: token, clientToken, action: "check-status" });
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
          {/* ── WhatsApp Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Comunicação — WhatsApp
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
                const isConn = instance.status === "connected";
                return (
                  <Card key={instance.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConn ? "bg-emerald-500/10" : "bg-muted"}`}>
                            <MessageSquare className={`w-5 h-5 ${isConn ? "text-emerald-500" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold">{instance.label || instance.phone_number || `Instância ${instance.instance_id.slice(0, 8)}...`}</h4>
                              <Badge variant="outline" className={`text-[10px] gap-1 ${isConn ? "text-primary border-primary/30" : "text-muted-foreground border-border"}`}>
                                {isConn ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                {isConn ? "Conectado" : "Desconectado"}
                              </Badge>
                            </div>
                            {instance.phone_number && <p className="text-xs text-muted-foreground">Número: {instance.phone_number}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isConn ? (
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

          {/* ── Integration Sections ── */}
          {INTEGRATIONS_BY_SECTION.filter((s) => s.title !== "Comunicação").map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <section.icon className="w-4 h-4 text-primary" /> {section.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.items.map((int) => {
                  const connected = isConnected(int.provider);
                  const isSpecial = int.provider === "webhook_leads" || int.provider === "website_chat";
                  return (
                    <Card key={int.provider} className={connected ? "border-primary/30" : ""}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${connected ? "bg-primary/10" : "bg-muted"}`}>
                          <int.icon className={`w-5 h-5 ${connected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{int.name}</p>
                          <p className="text-xs text-muted-foreground">{int.desc}</p>
                        </div>
                        {connected ? (
                          <Badge className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/30">
                            <Wifi className="w-3 h-3" /> Conectado
                          </Badge>
                        ) : isSpecial ? null : (
                          <Button size="sm" variant="outline" onClick={() => { setConnectDialog(int); setConnectOpen(true); }}>
                            Conectar
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ── API & Developers ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" /> API & Desenvolvedores
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

          {/* Website Chat Widget */}
          <WebsiteChatConfig />

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
      <IntegrationConnectDialog integration={connectDialog} open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
}
