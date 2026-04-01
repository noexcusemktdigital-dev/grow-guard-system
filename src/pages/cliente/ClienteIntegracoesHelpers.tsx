// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { Link2, Wifi, WifiOff, Settings2, RefreshCw, Unplug, AlertTriangle, Headset, Copy, Key, Webhook, MessageSquare, Code2, Zap, TestTube2, Trash2, Plus, Plug, Server, Pencil, Stethoscope, CheckCircle2, XCircle, Loader2, QrCode, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { WhatsAppInstance, useSetupWhatsApp } from "@/hooks/useWhatsApp";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const SUPPORT_LINK = "https://wa.me/554499997369?text=Olá! Preciso de ajuda com a integração WhatsApp.";

export const WEBHOOK_EVENTS = [
  { value: "lead_created", label: "Lead criado" },
  { value: "stage_changed", label: "Mudança de etapa" },
  { value: "lead_won", label: "Lead vendido" },
  { value: "lead_lost", label: "Lead perdido" },
];

export interface OutboundWebhook {
  name: string;
  url: string;
  events: string[];
  active: boolean;
}

export const PLATFORMS = [
  { key: "make", label: "Make (Integromat)", icon: "🔧", placeholder: "https://hook.us1.make.com/...", instructions: "Crie um cenário no Make com trigger 'Webhook'. Cole a URL gerada acima." },
  { key: "zapier", label: "Zapier", icon: "⚡", placeholder: "https://hooks.zapier.com/hooks/catch/...", instructions: "Crie um Zap com trigger 'Webhooks by Zapier > Catch Hook'. Cole a URL gerada." },
];

/* ── Edit Instance Dialog ── */
export function EditInstanceDialog({ instance, open, onOpenChange, onSave, isPending }: {
  instance: WhatsAppInstance | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: Record<string, unknown>) => void;
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
          <DialogTitle className="text-base">Editar instância Izitech</DialogTitle>
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
export function DiagnosticsDialog({ open, onOpenChange, instances, setupMutation, refetch }: {
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
        const foundResult = res?.results?.find((r: Record<string, unknown>) => r.instance_id === inst.instance_id) || res;
        newResults[inst.id] = { status: foundResult?.status || res?.status || "unknown", checking: false };
      } catch (err: unknown) {
        newResults[inst.id] = { status: "error", checking: false, error: err instanceof Error ? err.message : String(err) };
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
                      <Badge variant="outline" className="text-[9px]">Izitech</Badge>
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

/* ── QR Code Dialog ── */
export function QrCodeDialog({ open, onOpenChange, qrCode, pairingCode, instanceName, onConnected }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  qrCode: string | null;
  pairingCode: string | null;
  instanceName: string;
  onConnected: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> Escanear QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 flex flex-col items-center">
          <p className="text-xs text-muted-foreground text-center">
            Abra o <strong>WhatsApp</strong> no celular → Configurações → Aparelhos conectados → Conectar → Escaneie o código abaixo.
          </p>

          {qrCode ? (
            <div className="p-3 bg-white rounded-xl shadow-md">
              <img
                src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                className="w-56 h-56 object-contain"
              />
            </div>
          ) : (
            <div className="w-56 h-56 flex items-center justify-center bg-muted rounded-xl">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {pairingCode && (
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Código de pareamento:</p>
              <p className="font-mono text-lg font-bold tracking-widest">{pairingCode}</p>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center">
            Instância: <span className="font-mono">{instanceName}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export function InstanceCard({ instance, onCheckStatus, onDisconnect, onEdit, onReconnect, onReconfigureWebhook, isPending }: {
  instance: WhatsAppInstance;
  onCheckStatus: () => void;
  onDisconnect: () => void;
  onEdit: () => void;
  onReconnect?: () => void;
  onReconfigureWebhook?: () => void;
  isPending: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isConn = instance.status === "connected";
  const isEvo = instance.provider === "evolution";

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
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
                  <Badge variant="outline" className="text-[9px]">Izitech</Badge>
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
              <Button variant="outline" size="sm" onClick={onEdit} disabled={isPending} title="Editar" aria-label="Editar">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={onCheckStatus} disabled={isPending} title="Verificar status" aria-label="Atualizar">
                <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)} disabled={isPending} title="Desconectar e remover" className="gap-1">
                <Unplug className="w-3.5 h-3.5" /> Desconectar
              </Button>
            </div>
          </div>

          {/* Webhook status info for Evolution */}
          {isEvo && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Webhook className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Webhook</span>
                {instance.webhook_url ? (
                  <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-300 gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> Não configurado
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {instance.webhook_url
                  ? "Webhook configurado automaticamente. Mensagens recebidas serão processadas em tempo real."
                  : "Clique em \"Webhook\" acima para configurar o recebimento de mensagens."}
              </p>
              {instance.webhook_url && (
                <p className="text-[10px] font-mono text-muted-foreground truncate" title={instance.webhook_url}>
                  {instance.webhook_url}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disconnect confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" /> Desconectar Instância
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja desconectar <strong>{instance.label || instance.phone_number || instance.instance_id}</strong>?
            </p>
            <p className="text-xs text-muted-foreground">
              A instância será removida e você poderá conectar uma nova em seguida.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={() => { setConfirmOpen(false); onDisconnect(); }} disabled={isPending} className="gap-1">
                <Unplug className="w-3.5 h-3.5" /> Confirmar Desconexão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

