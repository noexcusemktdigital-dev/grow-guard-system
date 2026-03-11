import { useState, useEffect } from "react";
import { Link2, Wifi, WifiOff, Settings2, RefreshCw, Unplug, AlertTriangle, Headset, Copy, Key, Webhook, MessageSquare, Code2, Zap, TestTube2, Trash2, Plus, Plug, Server, Pencil, Stethoscope, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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
import { useWhatsAppInstances, useSetupWhatsApp, WhatsAppInstance } from "@/hooks/useWhatsApp";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useCrmSettings, useCrmSettingsMutations } from "@/hooks/useCrmSettings";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const SUPPORT_LINK = "https://wa.me/5500000000000?text=Olá! Preciso de ajuda com a integração WhatsApp.";

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

/* ── Edit Instance Dialog ── */
function EditInstanceDialog({ instance, open, onOpenChange, onSave, isPending }: {
  instance: WhatsAppInstance | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: any) => void;
  isPending: boolean;
}) {
  const [label, setLabel] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [token, setToken] = useState("");
  const [clientToken, setClientToken] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [instanceName, setInstanceName] = useState("");

  useEffect(() => {
    if (instance) {
      setLabel(instance.label || "");
      setInstanceId(instance.instance_id || "");
      setToken(instance.token || "");
      setClientToken(instance.client_token || "");
      setBaseUrl(instance.base_url || "");
      setApiKey(instance.client_token || "");
      setInstanceName(instance.instance_id || "");
    }
  }, [instance]);

  if (!instance) return null;
  const isEvo = instance.provider === "evolution";

  const handleSave = () => {
    if (isEvo) {
      onSave({ provider: "evolution", baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), instanceName: instanceName.trim(), action: "connect", label: label.trim() || undefined });
    } else {
      onSave({ provider: "zapi", instanceId: instanceId.trim(), instanceToken: token.trim(), clientToken: clientToken.trim(), action: "connect", label: label.trim() || undefined });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Editar instância {isEvo ? "Evolution" : "Z-API"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Rótulo</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} className="text-xs h-8" placeholder="Ex: Comercial" />
          </div>
          {isEvo ? (
            <>
              <div>
                <Label className="text-xs">URL do Servidor</Label>
                <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className="text-xs h-8 font-mono" placeholder="http://ip:porta" />
              </div>
              <div>
                <Label className="text-xs">API Key</Label>
                <Input value={apiKey} onChange={e => setApiKey(e.target.value)} className="text-xs h-8 font-mono" type="password" />
              </div>
              <div>
                <Label className="text-xs">Nome da Instância</Label>
                <Input value={instanceName} onChange={e => setInstanceName(e.target.value)} className="text-xs h-8 font-mono" />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs">Instance ID</Label>
                <Input value={instanceId} onChange={e => setInstanceId(e.target.value)} className="text-xs h-8 font-mono" />
              </div>
              <div>
                <Label className="text-xs">Token</Label>
                <Input value={token} onChange={e => setToken(e.target.value)} className="text-xs h-8 font-mono" type="password" />
              </div>
              <div>
                <Label className="text-xs">Client-Token</Label>
                <Input value={clientToken} onChange={e => setClientToken(e.target.value)} className="text-xs h-8 font-mono" type="password" />
              </div>
            </>
          )}
          <Button className="w-full" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Salvar e Reconectar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Diagnostics Dialog ── */
function DiagnosticsDialog({ open, onOpenChange, instances, setupMutation, refetch }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  instances: WhatsAppInstance[];
  setupMutation: ReturnType<typeof useSetupWhatsApp>;
  refetch: () => void;
}) {
  const [results, setResults] = useState<Record<string, { status: string; checking: boolean; error?: string }>>({});

  const runDiagnostics = async () => {
    const newResults: typeof results = {};
    for (const inst of instances) {
      newResults[inst.id] = { status: "checking", checking: true };
    }
    setResults({ ...newResults });

    for (const inst of instances) {
      try {
        const res = await setupMutation.mutateAsync({
          instanceId: inst.instance_id,
          instanceToken: inst.token,
          clientToken: inst.client_token,
          action: "check-status",
          provider: inst.provider,
          baseUrl: inst.base_url || undefined,
          apiKey: inst.client_token || undefined,
          instanceName: inst.instance_id || undefined,
        });
        const foundResult = res?.results?.find((r: any) => r.instance_id === inst.instance_id) || res;
        newResults[inst.id] = { status: foundResult?.status || res?.status || "unknown", checking: false };
      } catch (err: any) {
        newResults[inst.id] = { status: "error", checking: false, error: err.message };
      }
      setResults({ ...newResults });
    }
    refetch();
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Diagnóstico e Correção</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Verifica a conectividade de todas as instâncias e tenta corrigir problemas.</p>
          <Button size="sm" onClick={runDiagnostics} disabled={setupMutation.isPending} className="gap-1.5">
            {setupMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Stethoscope className="w-3.5 h-3.5" />}
            Executar Diagnóstico
          </Button>

          {instances.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma instância cadastrada.</p>}

          {instances.map(inst => {
            const r = results[inst.id];
            const isEvo = inst.provider === "evolution";
            const webhookUrl = isEvo
              ? `https://${projectId}.supabase.co/functions/v1/evolution-webhook/${inst.organization_id}`
              : `https://${projectId}.supabase.co/functions/v1/whatsapp-webhook/${inst.organization_id}`;

            return (
              <Card key={inst.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isEvo ? <Server className="w-4 h-4 text-blue-500" /> : <Plug className="w-4 h-4 text-emerald-500" />}
                      <span className="text-xs font-semibold">{inst.label || inst.instance_id}</span>
                      <Badge variant="outline" className="text-[9px]">{isEvo ? "Evolution" : "Z-API"}</Badge>
                    </div>
                    {r && !r.checking && (
                      r.status === "connected"
                        ? <Badge className="bg-emerald-500/10 text-emerald-600 text-[9px] gap-1"><CheckCircle2 className="w-3 h-3" /> OK</Badge>
                        : <Badge variant="destructive" className="text-[9px] gap-1"><XCircle className="w-3 h-3" /> {r.status}</Badge>
                    )}
                    {r?.checking && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                  </div>

                  <div className="text-[10px] text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Instance ID:</span> <span className="font-mono">{inst.instance_id}</span></div>
                    {isEvo && <div className="flex justify-between"><span>Base URL:</span> <span className="font-mono">{inst.base_url}</span></div>}
                    <div className="flex justify-between"><span>Status no banco:</span> <span className="font-semibold">{inst.status}</span></div>
                    <div className="flex justify-between"><span>Telefone:</span> <span>{inst.phone_number || "—"}</span></div>
                    <div className="flex flex-col gap-0.5">
                      <span>Webhook esperado:</span>
                      <span className="font-mono text-[9px] break-all">{webhookUrl}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span>Webhook registrado:</span>
                      <span className="font-mono text-[9px] break-all">{inst.webhook_url || "—"}</span>
                    </div>
                    {inst.webhook_url && inst.webhook_url !== webhookUrl && (
                      <div className="flex items-center gap-1 text-amber-600"><AlertTriangle className="w-3 h-3" /> Webhook diferente do esperado</div>
                    )}
                  </div>
                  {r?.error && <p className="text-[10px] text-destructive">Erro: {r.error}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Instance Card ── */
function InstanceCard({ instance, onCheckStatus, onDisconnect, onEdit, onReconnect, onReconfigureWebhook, isPending }: {
  instance: WhatsAppInstance;
  onCheckStatus: () => void;
  onDisconnect: () => void;
  onEdit: () => void;
  onReconnect?: () => void;
  onReconfigureWebhook?: () => void;
  isPending: boolean;
}) {
  const isConn = instance.status === "connected";
  const isEvo = instance.provider === "evolution";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConn ? "bg-emerald-500/10" : "bg-muted"}`}>
              {isEvo ? <Server className={`w-5 h-5 ${isConn ? "text-blue-500" : "text-muted-foreground"}`} /> : <MessageSquare className={`w-5 h-5 ${isConn ? "text-emerald-500" : "text-muted-foreground"}`} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">{instance.label || instance.phone_number || instance.instance_id}</h4>
                <Badge variant="outline" className={`text-[10px] gap-1 ${isConn ? "text-primary border-primary/30" : "text-muted-foreground border-border"}`}>
                  {isConn ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isConn ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
              {instance.phone_number && <p className="text-xs text-muted-foreground">Número: {instance.phone_number}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isConn && onReconnect && (
              <Button variant="default" size="sm" onClick={onReconnect} disabled={isPending} title="Reconectar" className="gap-1">
                <Zap className="w-3.5 h-3.5" /> Reconectar
              </Button>
            )}
            {isEvo && onReconfigureWebhook && (
              <Button variant="outline" size="sm" onClick={onReconfigureWebhook} disabled={isPending} title="Reconfigurar Webhook" className="gap-1">
                <Webhook className="w-3.5 h-3.5" /> Webhook
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit} disabled={isPending} title="Editar">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={onCheckStatus} disabled={isPending} title="Verificar status">
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={onDisconnect} disabled={isPending} className="text-destructive hover:text-destructive" title={isConn ? "Desconectar" : "Remover"}>
              <Unplug className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClienteIntegracoes() {
  const { data: instances, isLoading, refetch } = useWhatsAppInstances();
  const setupMutation = useSetupWhatsApp();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editInstance, setEditInstance] = useState<WhatsAppInstance | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const { data: org } = useOrgProfile();
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  // Outbound webhooks state
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

  const handleCheckStatus = async (instance: WhatsAppInstance) => {
    try {
      await setupMutation.mutateAsync({
        instanceId: instance.instance_id,
        instanceToken: instance.token,
        clientToken: instance.client_token,
        action: "check-status",
        provider: instance.provider,
        baseUrl: instance.base_url || undefined,
        apiKey: instance.client_token || undefined,
        instanceName: instance.instance_id || undefined,
      });
      refetch();
      toast.success("Status atualizado");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDisconnect = async (instance: WhatsAppInstance) => {
    try {
      await setupMutation.mutateAsync({ instanceId: instance.instance_id, instanceToken: instance.token, clientToken: instance.client_token, action: "disconnect" });
      refetch();
      toast.success("Instância removida");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEditSave = async (data: any) => {
    try {
      const res = await setupMutation.mutateAsync(data);
      refetch();
      setEditInstance(null);
      if (res?.status === "connected") {
        toast.success("Instância atualizada e conectada!");
      } else {
        toast.warning("Instância salva, mas status: " + (res?.status || "desconectado"), { description: "Verifique as credenciais ou o nome da instância no servidor." });
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReconnect = async (inst: WhatsAppInstance) => {
    try {
      let res: any;
      if (inst.provider === "evolution") {
        res = await setupMutation.mutateAsync({
          action: "connect",
          provider: "evolution",
          baseUrl: inst.base_url,
          apiKey: inst.client_token,
          instanceName: inst.instance_id,
          label: inst.label,
        });
      } else {
        res = await setupMutation.mutateAsync({
          action: "connect",
          provider: "zapi",
          instanceId: inst.instance_id,
          instanceToken: inst.token,
          clientToken: inst.client_token,
          label: inst.label,
        });
      }
      refetch();
      if (res?.status === "connected") {
        toast.success("Reconexão realizada — conectado!");
      } else {
        toast.warning("Reconexão executada, mas status: " + (res?.status || "desconectado"), {
          description: "A instância pode não existir no servidor ou o nome está diferente. Use o Diagnóstico para verificar.",
        });
      }
    } catch (err: any) {
      toast.error("Erro na reconexão: " + err.message);
    }
  };

  const handleReconfigureWebhook = async (inst: WhatsAppInstance) => {
    try {
      const res = await setupMutation.mutateAsync({
        action: "reconfigure-webhook",
        provider: "evolution",
        instanceName: inst.instance_id,
        baseUrl: inst.base_url || undefined,
        apiKey: inst.client_token || undefined,
      });
      refetch();
      if (res?.success) {
        toast.success("Webhook reconfigurado com sucesso!", { description: `URL: ${res.webhookUrl}` });
      } else {
        toast.warning("Webhook pode não ter sido configurado corretamente");
      }
    } catch (err: any) {
      toast.error("Erro ao reconfigurar webhook: " + err.message);
    }
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = orgId ? `https://${projectId}.supabase.co/functions/v1/crm-lead-webhook/${orgId}` : "";

  const zapiInstances = instances?.filter(i => i.provider === "zapi") || [];
  const evoInstances = instances?.filter(i => i.provider === "evolution") || [];

  // Outbound webhook helpers
  const saveWebhooks = (updated: OutboundWebhook[]) => {
    setWebhooks(updated);
    upsertSettings.mutate({ outbound_webhooks: updated });
  };
  const addWebhook = () => {
    if (!newUrl.trim()) { toast.error("Informe a URL"); return; }
    const platform = PLATFORMS.find(p => p.key === newPlatform) || PLATFORMS[0];
    saveWebhooks([...webhooks, { name: platform.label, url: newUrl.trim(), events: newEvents, active: true }]);
    setNewUrl(""); setNewEvents(["lead_created"]);
    toast.success(`${platform.label} adicionado`);
  };
  const removeWebhook = (idx: number) => { saveWebhooks(webhooks.filter((_, i) => i !== idx)); toast.success("Webhook removido"); };
  const toggleWebhook = (idx: number) => { const u = [...webhooks]; u[idx] = { ...u[idx], active: !u[idx].active }; saveWebhooks(u); };
  const testWebhook = async (url: string, name: string) => {
    try {
      const isZapier = url.includes("zapier.com");
      await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, ...(isZapier ? { mode: "no-cors" as RequestMode } : {}), body: JSON.stringify({ event: "test", name: "Lead Teste", email: "teste@exemplo.com", phone: "11999999999", timestamp: new Date().toISOString(), source: "NoExcuse CRM" }) });
      toast.success(`Teste enviado para ${name}`, { description: isZapier ? "Verifique o histórico do Zap para confirmar" : "Verifique se recebeu o payload" });
    } catch { toast.error("Erro ao testar webhook"); }
  };
  const toggleEvent = (event: string) => setNewEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Integrações" subtitle="Conecte ferramentas e gerencie APIs" icon={<Link2 className="w-5 h-5 text-primary" />} />

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <>
          {/* ── Diagnostics Button ── */}
          {instances && instances.length > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setDiagOpen(true)} className="gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" /> Diagnóstico e Correção
              </Button>
            </div>
          )}

          {/* ── 1. WhatsApp Z-API ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Plug className="w-4 h-4 text-emerald-500" /> WhatsApp — Z-API
            </h3>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Instâncias conectadas via Z-API (SaaS gerenciado)</p>
              <Button size="sm" onClick={() => setWizardOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar número</Button>
            </div>

            {zapiInstances.length === 0 ? (
              <Card><CardContent className="p-5 text-center"><p className="text-xs text-muted-foreground">Nenhuma instância Z-API configurada.</p></CardContent></Card>
            ) : (
              zapiInstances.map(inst => (
                <InstanceCard key={inst.id} instance={inst} onCheckStatus={() => handleCheckStatus(inst)} onDisconnect={() => handleDisconnect(inst)} onEdit={() => setEditInstance(inst)} onReconnect={() => handleReconnect(inst)} isPending={setupMutation.isPending} />
              ))
            )}

            {zapiInstances.some(i => i.status === "connected") && (
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

          {/* ── 2. WhatsApp Evolution ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-500" /> WhatsApp — Evolution API
            </h3>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Instâncias conectadas via Evolution API (self-hosted)</p>
              <Button size="sm" onClick={() => setWizardOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar instância</Button>
            </div>

            {evoInstances.length === 0 ? (
              <Card><CardContent className="p-5 text-center"><p className="text-xs text-muted-foreground">Nenhuma instância Evolution configurada.</p></CardContent></Card>
            ) : (
              evoInstances.map(inst => (
                <InstanceCard key={inst.id} instance={inst} onCheckStatus={() => handleCheckStatus(inst)} onDisconnect={() => handleDisconnect(inst)} onEdit={() => setEditInstance(inst)} onReconnect={() => handleReconnect(inst)} isPending={setupMutation.isPending} />
              ))
            )}
          </div>

          {/* ── 3. API Aberta ── */}
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
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(org.api_key!); toast.success("Copiado!"); }}><Copy className="w-4 h-4" /></Button>
                  ) : (
                    <Button size="sm" onClick={() => generateApiKey.mutate()} disabled={generateApiKey.isPending}><Key className="w-4 h-4 mr-1" /> Gerar</Button>
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
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("URL copiada!"); }}><Copy className="w-4 h-4" /></Button>
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

          {/* ── 4. Automações ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Automações (Saída)
            </h3>
            <p className="text-xs text-muted-foreground">Envie eventos do CRM para Make ou Zapier automaticamente.</p>
            {webhooks.length > 0 && (
              <div className="space-y-2">
                {webhooks.map((wh, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-3 flex items-center gap-2">
                      <Switch checked={wh.active} onCheckedChange={() => toggleWebhook(idx)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{wh.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate font-mono">{wh.url}</p>
                        <div className="flex gap-1 mt-1">{wh.events.map(e => <Badge key={e} variant="outline" className="text-[8px]">{WEBHOOK_EVENTS.find(we => we.value === e)?.label || e}</Badge>)}</div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => testWebhook(wh.url, wh.name)}><TestTube2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeWebhook(idx)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Headset className="w-5 h-5 text-primary" /></div>
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
      <EditInstanceDialog instance={editInstance} open={!!editInstance} onOpenChange={v => { if (!v) setEditInstance(null); }} onSave={handleEditSave} isPending={setupMutation.isPending} />
      <DiagnosticsDialog open={diagOpen} onOpenChange={setDiagOpen} instances={instances || []} setupMutation={setupMutation} refetch={refetch} />
    </div>
  );
}