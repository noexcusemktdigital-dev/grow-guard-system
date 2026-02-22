import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plug, Copy, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Zap, Globe, Trash2, TestTube2, Plus } from "lucide-react";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmSettings, useCrmSettingsMutations } from "@/hooks/useCrmSettings";
import { useToast } from "@/hooks/use-toast";

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
  { key: "n8n", label: "n8n", icon: "🔗", placeholder: "https://seu-n8n.com/webhook/...", instructions: "Adicione um node 'Webhook' no n8n e cole a URL de produção acima." },
  { key: "custom", label: "Webhook Genérico", icon: "🌐", placeholder: "https://sua-api.com/webhook", instructions: "Qualquer URL que aceite POST JSON com os dados do lead." },
];

export function CrmIntegrations() {
  const { toast } = useToast();
  const { data: orgId } = useUserOrgId();
  const { createLead } = useCrmLeadMutations();
  const { data: settings } = useCrmSettings();
  const { upsertSettings } = useCrmSettingsMutations();
  const fileRef = useRef<HTMLInputElement>(null);

  const [csvData, setCsvData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);

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

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = orgId ? `https://${projectId}.supabase.co/functions/v1/crm-lead-webhook/${orgId}` : "Carregando...";

  const copyUrl = () => { navigator.clipboard.writeText(webhookUrl); toast({ title: "URL copiada!" }); };

  // CSV handlers
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast({ title: "CSV vazio ou inválido", variant: "destructive" }); return; }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ""; });
        return obj;
      });
      setCsvData(rows);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0, errors = 0;
    for (const row of csvData) {
      try {
        await createLead.mutateAsync({ name: row.nome || row.name || "Sem nome", email: row.email || undefined, phone: row.telefone || row.phone || undefined, company: row.empresa || row.company || undefined, source: row.origem || row.source || "CSV", value: row.valor || row.value ? parseFloat(row.valor || row.value) : undefined, stage: "novo" });
        success++;
      } catch { errors++; }
    }
    setImportResult({ success, errors });
    setCsvData([]);
    setImporting(false);
    toast({ title: `Importação: ${success} leads criados, ${errors} erros` });
  };

  // Outbound webhooks
  const saveWebhooks = (updated: OutboundWebhook[]) => {
    setWebhooks(updated);
    upsertSettings.mutate({ outbound_webhooks: updated });
  };

  const addWebhook = () => {
    if (!newUrl.trim()) { toast({ title: "Informe a URL", variant: "destructive" }); return; }
    const platform = PLATFORMS.find(p => p.key === newPlatform) || PLATFORMS[3];
    const updated = [...webhooks, { name: platform.label, url: newUrl.trim(), events: newEvents, active: true }];
    saveWebhooks(updated);
    setNewUrl("");
    setNewEvents(["lead_created"]);
    toast({ title: `${platform.label} adicionado` });
  };

  const removeWebhook = (idx: number) => {
    saveWebhooks(webhooks.filter((_, i) => i !== idx));
    toast({ title: "Webhook removido" });
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
      toast({ title: `Teste enviado para ${name}`, description: isZapier ? "Verifique o histórico do Zap para confirmar" : "Verifique se recebeu o payload" });
    } catch {
      toast({ title: "Erro ao testar webhook", variant: "destructive" });
    }
  };

  const toggleEvent = (event: string) => {
    setNewEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Inbound Webhook */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plug className="w-4 h-4" /> Webhook de Leads (Entrada)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Configure esta URL em plataformas (Meta Leads, Google Ads, formulários, etc.) para receber leads automaticamente.</p>
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly className="text-xs font-mono" />
            <Button size="sm" variant="outline" onClick={copyUrl}><Copy className="w-3.5 h-3.5" /></Button>
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

      {/* Outbound Webhooks — Make/Zapier/n8n */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4" /> Plataformas de Automação (Saída)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Envie eventos do CRM para Make, Zapier, n8n ou qualquer webhook.</p>

          {/* Existing webhooks */}
          {webhooks.length > 0 && (
            <div className="space-y-2">
              {webhooks.map((wh, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
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
                </div>
              ))}
            </div>
          )}

          {/* Add new webhook */}
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <p className="text-xs font-semibold">Adicionar webhook</p>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map(p => (
                <button key={p.key} className={`text-left text-xs p-2 rounded-lg border transition-colors ${newPlatform === p.key ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`} onClick={() => setNewPlatform(p.key)}>
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
          </div>
        </CardContent>
      </Card>

      {/* CSV Import */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Importar CSV</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Faça upload de um CSV com colunas: nome, email, telefone, empresa, origem, valor</p>
          <input type="file" accept=".csv" ref={fileRef} onChange={handleCsvUpload} className="hidden" />
          <Button size="sm" variant="outline" className="gap-1" onClick={() => fileRef.current?.click()}><Upload className="w-3.5 h-3.5" /> Selecionar arquivo</Button>

          {csvData.length > 0 && (
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">{csvData.length} leads encontrados</Badge>
              <div className="max-h-40 overflow-auto border rounded p-2">
                {csvData.slice(0, 5).map((row, i) => <p key={i} className="text-[10px] text-muted-foreground truncate">{row.nome || row.name} · {row.email} · {row.telefone || row.phone}</p>)}
                {csvData.length > 5 && <p className="text-[10px] text-muted-foreground">... e mais {csvData.length - 5}</p>}
              </div>
              <Button size="sm" onClick={handleImport} disabled={importing}>{importing ? "Importando..." : `Importar ${csvData.length} leads`}</Button>
            </div>
          )}

          {importResult && (
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3" /> {importResult.success} sucesso</span>
              {importResult.errors > 0 && <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3 h-3" /> {importResult.errors} erros</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
