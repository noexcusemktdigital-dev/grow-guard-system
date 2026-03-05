import { useState, useEffect } from "react";
import { Link2, Wifi, WifiOff, Settings2, RefreshCw, Unplug, AlertTriangle, Headset, Copy, Key, Webhook, MessageSquare, Code2, Zap, TestTube2, Trash2, Plus } from "lucide-react";
import { WebsiteChatConfig } from "@/components/cliente/WebsiteChatConfig";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { WhatsAppSetupWizard } from "@/components/cliente/WhatsAppSetupWizard";
import { useWhatsAppInstances, useSetupWhatsApp } from "@/hooks/useWhatsApp";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useCrmSettings, useCrmSettingsMutations } from "@/hooks/useCrmSettings";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const SUPPORT_LINK = "https://wa.me/5500000000000?text=Olá! Preciso de ajuda com a integração Z-API.";

const WEBHOOK_EVENTS = [
  { value: "lead_created", label: "Lead criado" },
  { value: "stage_changed", label: "Mudança de etapa" },
  { value: "lead_won", label: "Lead vendido" },
  { value: "lead_lost", label: "Lead perdido" },
];

interface OutboundWebhook {
  name: string;
  url: string;
  events: string[];
  active: boolean;
}

const PLATFORMS = [
  { key: "make", label: "Make (Integromat)", icon: "🔧", placeholder: "https://hook.us1.make.com/...", instructions: "Crie um cenário no Make com trigger 'Webhook'. Cole a URL gerada acima." },
  { key: "zapier", label: "Zapier", icon: "⚡", placeholder: "https://hooks.zapier.com/hooks/catch/...", instructions: "Crie um Zap com trigger 'Webhooks by Zapier > Catch Hook'. Cole a URL gerada." },
];

export default function ClienteIntegracoes() {
  const { data: instances, isLoading, refetch } = useWhatsAppInstances();
  const setupMutation = useSetupWhatsApp();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { data: org } = useOrgProfile();
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  // Outbound webhooks state (persisted via CRM settings)
  const { data: settings } = useCrmSettings();
  const { upsertSettings } = useCrmSettingsMutations();
  const [webhooks, setWebhooks] = useState<OutboundWebhook[]>([]);
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>(["lead_created"]);

  useEffect(() => {
    if (settings) {
      const stored = (settings as any).outbound_webhooks;
      if (Array.isArray(stored)) setWebhooks(stored);
    }
  }, [settings]);

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

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = orgId ? `https://${projectId}.supabase.co/functions/v1/crm-lead-webhook?org_id=${orgId}` : "";
  const hasAnyConnected = instances?.some((i) => i.status === "connected");

  // Outbound webhook helpers
  const saveWebhooks = (updated: OutboundWebhook[]) => {
    setWebhooks(updated);
    upsertSettings.mutate({ outbound_webhooks: updated });
  };

  const addWebhook = () => {
    if (!newUrl.trim()) { toast.error("Informe a URL"); return; }
    const platform = PLATFORMS.find(p => p.key === newPlatform) || PLATFORMS[0];
    const updated = [...webhooks, { name: platform.label, url: newUrl.trim(), events: newEvents, active: true }];
    saveWebhooks(updated);
    setNewUrl("");
    setNewEvents(["lead_created"]);
    toast.success(`${platform.label} adicionado`);
  };

  const removeWebhook = (idx: number) => {
    saveWebhooks(webhooks.filter((_, i) => i !== idx));
    toast.success("Webhook removido");
  };

  const toggleWebhook = (idx: number) => {
    const updated = [...webhooks];
    updated[idx] = { ...updated[idx], active: !updated[idx].active };
    saveWebhooks(updated);
  };

  const testWebhook = async (url: string, name: string) => {
    try {
      const isZapier = url.includes("zapier.com");
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...(isZapier ? { mode: "no-cors" as RequestMode } : {}),
        body: JSON.stringify({ event: "test", name: "Lead Teste", email: "teste@exemplo.com", phone: "11999999999", timestamp: new Date().toISOString(), source: "NoExcuse CRM" }),
      });
      toast.success(`Teste enviado para ${name}`, { description: isZapier ? "Verifique o histórico do Zap para confirmar" : "Verifique se recebeu o payload" });
    } catch {
      toast.error("Erro ao testar webhook");
    }
  };

  const toggleEvent = (event: string) => {
    setNewEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Integrações" subtitle="Conecte ferramentas e gerencie APIs" icon={<Link2 className="w-5 h-5 text-primary" />} />

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <>
          {/* ── 1. WhatsApp Section ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> WhatsApp (Z-API)
            </h3>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Envie e receba mensagens via WhatsApp</p>
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

          {/* ── 2. API Aberta ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" /> API Aberta
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
                <CardTitle className="text-base flex items-center gap-2"><Webhook className="w-4 h-4" /> Webhook de Leads (Entrada)</CardTitle>
                <CardDescription>Envie leads de formulários, landing pages ou ads para este endpoint</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="bg-muted font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("URL copiada!"); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Payload aceito (POST JSON)</summary>
                  <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto mt-1">{`{
  "name": "Nome do Lead",
  "email": "email@exemplo.com",
  "phone": "11999999999",
  "company": "Empresa",
  "source": "Meta Leads",
  "value": 5000,
  "tags": ["ads"]
}`}</pre>
                </details>
              </CardContent>
            </Card>
          </div>

          {/* ── 3. Automações (Make & Zapier) ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Automações (Saída)
            </h3>
            <p className="text-xs text-muted-foreground">Envie eventos do CRM para Make ou Zapier automaticamente.</p>

            {/* Existing webhooks */}
            {webhooks.length > 0 && (
              <div className="space-y-2">
                {webhooks.map((wh, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-3 flex items-center gap-2">
                      <Switch checked={wh.active} onCheckedChange={() => toggleWebhook(idx)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{wh.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate font-mono">{wh.url}</p>
                        <div className="flex gap-1 mt-1">
                          {wh.events.map(e => <Badge key={e} variant="outline" className="text-[8px]">{WEBHOOK_EVENTS.find(we => we.value === e)?.label || e}</Badge>)}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => testWebhook(wh.url, wh.name)}><TestTube2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeWebhook(idx)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add new webhook */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-semibold">Adicionar automação</p>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.key} className={`text-left text-xs p-2.5 rounded-lg border transition-colors ${newPlatform === p.key ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`} onClick={() => setNewPlatform(p.key)}>
                      <span className="mr-1.5">{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>

                {newPlatform && (
                  <>
                    <p className="text-[10px] text-muted-foreground">{PLATFORMS.find(p => p.key === newPlatform)?.instructions}</p>
                    <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder={PLATFORMS.find(p => p.key === newPlatform)?.placeholder} className="text-xs font-mono h-8" />
                    <div>
                      <Label className="text-xs mb-1.5 block">Eventos</Label>
                      <div className="flex flex-wrap gap-2">
                        {WEBHOOK_EVENTS.map(ev => (
                          <label key={ev.value} className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <Checkbox checked={newEvents.includes(ev.value)} onCheckedChange={() => toggleEvent(ev.value)} />
                            {ev.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" className="gap-1" onClick={addWebhook}><Plus className="w-3.5 h-3.5" /> Adicionar</Button>
                  </>
                )}
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
    </div>
  );
}
