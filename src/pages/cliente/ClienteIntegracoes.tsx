// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { Link2, Wifi, WifiOff, Settings2, RefreshCw, Unplug, AlertTriangle, Headset, Copy, Key, Webhook, MessageSquare, Code2, Zap, TestTube2, Trash2, Plus, Plug, Server, Pencil, Stethoscope, CheckCircle2, XCircle, Loader2, QrCode, Smartphone } from "lucide-react";
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
import { reportError } from "@/lib/error-toast";
import { supabase } from "@/lib/supabase";
import { subscribeToTable } from "@/lib/realtimeManager";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

import {
  SUPPORT_LINK, WEBHOOK_EVENTS, PLATFORMS,
  EditInstanceDialog, DiagnosticsDialog, QrCodeDialog, WhatsAppProviderModules,
  type OutboundWebhook,
} from "./ClienteIntegracoesHelpers";

export default function ClienteIntegracoes() {
  const { data: instances, isLoading, refetch } = useWhatsAppInstances();
  const setupMutation = useSetupWhatsApp();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<"meta_cloud" | "izitech">("meta_cloud");
  const [editInstance, setEditInstance] = useState<WhatsAppInstance | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrInstanceName, setQrInstanceName] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
      const stored = (settings as unknown as { outbound_webhooks?: unknown }).outbound_webhooks;
      if (Array.isArray(stored)) setWebhooks(stored);
    }
  }, [settings]);

  // PERF: usa o realtimeManager (singleton por org) em vez de abrir um channel dedicado.
  // Isso compartilha a conexão WebSocket com outras telas do mesmo workspace
  // (ClienteChat, etc.), reduzindo conexões e carga no servidor.
  useEffect(() => {
    if (!orgId) return;
    const unsub = subscribeToTable(orgId, "whatsapp_instances", () => {
      refetch();
    });
    return unsub;
  }, [orgId, refetch]);

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
    onError: (err: unknown) => reportError(err, { title: err instanceof Error ? err.message : "Erro ao gerar API Key", category: "integracoes.api_key" }),
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
    } catch (err: unknown) {
      reportError(err, { title: err instanceof Error ? err.message : "Erro ao atualizar status", category: "integracoes.status" });
    }
  };

  const handleDisconnect = async (instance: WhatsAppInstance) => {
    try {
      await setupMutation.mutateAsync({
        instanceId: instance.instance_id,
        instanceToken: instance.token,
        clientToken: instance.client_token,
        action: "disconnect",
        provider: instance.provider,
        phoneNumberId: instance.phone_number_id || undefined,
      });
      refetch();
      toast.success("Instância removida");
    } catch (err: unknown) {
      reportError(err, { title: err instanceof Error ? err.message : "Erro ao remover instância", category: "integracoes.remove_instance" });
    }
  };

  const handleEditSave = async (data: Record<string, unknown>) => {
    try {
      const res = await setupMutation.mutateAsync(data);
      refetch();
      setEditInstance(null);
      if (res?.status === "connected") {
        toast.success("Instância atualizada e conectada!");
      } else {
        toast.warning("Instância salva, mas status: " + (res?.status || "desconectado"), { description: "Verifique as credenciais ou o nome da instância no servidor." });
      }
    } catch (err: unknown) {
      reportError(err, { title: err instanceof Error ? err.message : "Erro ao salvar instância", category: "integracoes.save_instance" });
    }
  };

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startQrPolling = useCallback((inst: WhatsAppInstance) => {
    stopPolling();
    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 24) { // ~2 min
        stopPolling();
        return;
      }
      try {
        const res = await setupMutation.mutateAsync({
          action: "get-qr",
          provider: "evolution",
          instanceName: inst.instance_id,
          baseUrl: inst.base_url || undefined,
          apiKey: inst.client_token || undefined,
        });
        if (res?.status === "connected") {
          stopPolling();
          setQrDialogOpen(false);
          refetch();
          toast.success("WhatsApp conectado com sucesso!");
        } else if (res?.qr_code) {
          setQrCode(res.qr_code);
          if (res.pairing_code) setPairingCode(res.pairing_code);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);
  }, [stopPolling, setupMutation, refetch]);

  // Cleanup polling on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleReconnect = async (inst: WhatsAppInstance) => {
    try {
      if (inst.provider === "evolution") {
        // First try get-qr to show QR code
        setQrInstanceName(inst.label || inst.instance_id);
        setQrCode(null);
        setPairingCode(null);
        setQrDialogOpen(true);

        const res = await setupMutation.mutateAsync({
          action: "get-qr",
          provider: "evolution",
          instanceName: inst.instance_id,
          baseUrl: inst.base_url || undefined,
          apiKey: inst.client_token || undefined,
        });

        if (res?.status === "connected") {
          setQrDialogOpen(false);
          refetch();
          toast.success("WhatsApp já está conectado!");
          return;
        }

        if (res?.qr_code) {
          setQrCode(res.qr_code);
          if (res.pairing_code) setPairingCode(res.pairing_code);
          // Start polling for connection status
          startQrPolling(inst);
        } else {
          setQrDialogOpen(false);
          toast.warning("Não foi possível obter o QR code", {
            description: "Verifique se a instância existe no servidor Evolution.",
          });
        }
    } else {
        // Fallback: try evolution reconnect
        const res = await setupMutation.mutateAsync({
          action: "get-qr",
          provider: "evolution",
          instanceName: inst.instance_id,
          baseUrl: inst.base_url || undefined,
          apiKey: inst.client_token || undefined,
        });
        refetch();
        if (res?.status === "connected") {
          toast.success("Reconexão realizada — conectado!");
        } else {
          toast.warning("Reconexão executada, mas status: " + (res?.status || "desconectado"));
        }
      }
    } catch (err: unknown) {
      setQrDialogOpen(false);
      reportError(err, { title: "Erro na reconexão Izitech: " + (err instanceof Error ? err.message : String(err)), category: "integracoes.reconnect" });
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
    } catch (err: unknown) {
      reportError(err, { title: "Erro ao reconfigurar webhook: " + (err instanceof Error ? err.message : String(err)), category: "integracoes.webhook" });
    }
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = orgId ? `https://${projectId}.supabase.co/functions/v1/crm-lead-webhook/${orgId}` : "";

  const allInstances = instances || [];

  // Outbound webhook helpers
  const saveWebhooks = (updated: OutboundWebhook[]) => {
    setWebhooks(updated);
    upsertSettings.mutate({ outbound_webhooks: updated });
  };
  const addWebhook = () => {
    if (!newUrl.trim()) { reportError(new Error("Informe a URL"), { title: "Informe a URL", category: "integracoes.validation" }); return; }
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
    } catch (err) { reportError(err, { title: "Erro ao testar webhook", category: "integracoes.webhook_test" }); }
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

          <WhatsAppProviderModules
            instances={allInstances}
            isPending={setupMutation.isPending}
            projectId={projectId}
            onOpenMetaSetup={() => { setWizardMode("meta_cloud"); setWizardOpen(true); }}
            onOpenIzitechSetup={() => { setWizardMode("izitech"); setWizardOpen(true); }}
            onCheckStatus={handleCheckStatus}
            onDisconnect={handleDisconnect}
            onEdit={setEditInstance}
            onReconnect={handleReconnect}
            onReconfigureWebhook={handleReconfigureWebhook}
          />

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

      <WhatsAppSetupWizard open={wizardOpen} onOpenChange={setWizardOpen} mode={wizardMode} />
      <EditInstanceDialog instance={editInstance} open={!!editInstance} onOpenChange={v => { if (!v) setEditInstance(null); }} onSave={handleEditSave} isPending={setupMutation.isPending} />
      <DiagnosticsDialog open={diagOpen} onOpenChange={setDiagOpen} instances={instances || []} setupMutation={setupMutation} refetch={refetch} />
      <QrCodeDialog
        open={qrDialogOpen}
        onOpenChange={(v) => { if (!v) { stopPolling(); setQrDialogOpen(false); } }}
        qrCode={qrCode}
        pairingCode={pairingCode}
        instanceName={qrInstanceName}
        onConnected={() => { stopPolling(); setQrDialogOpen(false); refetch(); }}
      />
    </div>
  );
}
