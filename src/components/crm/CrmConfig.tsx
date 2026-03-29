// @ts-nocheck
import { useState } from "react";
import { ArrowLeft, GripVertical, Link2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FRANCHISE_STAGES, CLIENT_STAGES, LEAD_ORIGINS, RESPONSAVEIS } from "@/types/crm";

interface CrmConfigProps {
  onBack: () => void;
}

export function CrmConfig({ onBack }: CrmConfigProps) {
  const { toast } = useToast();
  const [slaHours, setSlaHours] = useState("24");
  const [slaTaskDays, setSlaTaskDays] = useState("3");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoTasks, setAutoTasks] = useState(true);

  return (
    <div className="animate-in fade-in duration-300">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao CRM
      </Button>
      <h2 className="text-xl font-bold mb-6">Configurações do CRM</h2>

      <Tabs defaultValue="etapas">
        <TabsList className="mb-4">
          <TabsTrigger value="etapas">Etapas</TabsTrigger>
          <TabsTrigger value="origens">Origens</TabsTrigger>
          <TabsTrigger value="responsaveis">Responsáveis</TabsTrigger>
          <TabsTrigger value="sla">SLA & Alertas</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="etapas">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Funil Franquia</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {FRANCHISE_STAGES.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 p-2 rounded border border-border">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm flex-1">{s}</span>
                    <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-2">Arraste para reordenar (placeholder)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Funil Clientes</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {CLIENT_STAGES.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 p-2 rounded border border-border">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm flex-1">{s}</span>
                    <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="origens">
          <Card>
            <CardHeader><CardTitle className="text-base">Origens de Lead</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {LEAD_ORIGINS.map((o) => (
                <div key={o} className="flex items-center gap-2 p-2 rounded border border-border">
                  <span className="text-sm flex-1">{o}</span>
                  <Badge variant="secondary" className="text-xs">Ativo</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responsaveis">
          <Card>
            <CardHeader><CardTitle className="text-base">Responsáveis</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {RESPONSAVEIS.map((r) => (
                <div key={r} className="flex items-center gap-2 p-2 rounded border border-border">
                  <span className="text-sm flex-1">{r}</span>
                  <Badge variant="secondary" className="text-xs">Ativo</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla">
          <Card>
            <CardHeader><CardTitle className="text-base">Regras de SLA</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tempo máx. sem contato (horas)</Label>
                  <Input type="number" value={slaHours} onChange={(e) => setSlaHours(e.target.value)} />
                </div>
                <div>
                  <Label>Tempo máx. tarefa aberta (dias)</Label>
                  <Input type="number" value={slaTaskDays} onChange={(e) => setSlaTaskDays(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Alertas habilitados</Label>
                <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Tarefas automáticas ao mover etapa</Label>
                <Switch checked={autoTasks} onCheckedChange={setAutoTasks} />
              </div>
              <Button onClick={() => toast({ title: "Configurações salvas" })}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="w-4 h-4" /> Meta Leads API</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>URL do Webhook</Label><Input placeholder="https://api.exemplo.com/leads" /></div>
                <div><Label>Token</Label><Input placeholder="••••••••" type="password" /></div>
                <Button size="sm" onClick={() => toast({ title: "Configurações do webhook salvas" })}>Salvar</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="w-4 h-4" /> Webhook Formulários</CardTitle></CardHeader>
              <CardContent>
                <div><Label>URL para receber leads</Label><Input value="https://app.n3w.com.br/api/crm/webhook/leads" readOnly /></div>
                <p className="text-xs text-muted-foreground mt-2">Use esta URL nos formulários externos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="w-4 h-4" /> Importação CSV</CardTitle></CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Arraste um arquivo CSV ou clique para selecionar</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => toast({ title: "Use o botão de importação no CRM para importar leads via CSV." })}>
                    Importar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
