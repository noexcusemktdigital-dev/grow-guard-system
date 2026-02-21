import { useState, useMemo } from "react";
import { Send, Plus, MessageSquare, Zap, BarChart3, Clock, Filter, ChevronDown, ChevronUp, Play, Pause, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { KpiCard } from "@/components/KpiCard";
import { getWhatsAppDisparos, getFollowUpRules, getDisparosKpis, getChatAccounts, type WhatsAppDisparo, type FollowUpRule } from "@/data/clienteData";

const statusColors: Record<string, string> = {
  enviado: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  agendado: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  rascunho: "bg-muted text-muted-foreground",
  andamento: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const typeLabels: Record<string, string> = {
  unica: "Mensagem Única",
  campanha: "Campanha",
  followup: "Follow-up",
};

const typeColors: Record<string, string> = {
  unica: "bg-blue-500/10 text-blue-600",
  campanha: "bg-purple-500/10 text-purple-600",
  followup: "bg-orange-500/10 text-orange-600",
};

export default function ClienteDisparos() {
  const disparos = useMemo(() => getWhatsAppDisparos(), []);
  const followUps = useMemo(() => getFollowUpRules(), []);
  const kpis = useMemo(() => getDisparosKpis(), []);
  const accounts = useMemo(() => getChatAccounts().filter(a => a.status === "connected"), []);
  const [followUpsOpen, setFollowUpsOpen] = useState(false);
  const [newDisparoOpen, setNewDisparoOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Disparos WhatsApp"
        subtitle="Envie mensagens, campanhas e follow-ups via WhatsApp"
        icon={<Send className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600"><Zap className="w-3 h-3" /> Z-API</Badge>
            <Dialog open={newDisparoOpen} onOpenChange={setNewDisparoOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Disparo</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Novo Disparo WhatsApp</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Nome do disparo</label>
                    <Input placeholder="Ex: Promoção de março" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                      <Select defaultValue="unica">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unica">Mensagem Única</SelectItem>
                          <SelectItem value="campanha">Campanha</SelectItem>
                          <SelectItem value="followup">Follow-up Automático</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Conta WhatsApp</label>
                      <Select defaultValue={accounts[0]?.id}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Etapa do funil</label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="novo">Novo Lead</SelectItem>
                          <SelectItem value="contato">Contato</SelectItem>
                          <SelectItem value="proposta">Proposta</SelectItem>
                          <SelectItem value="fechado">Fechado</SelectItem>
                          <SelectItem value="perdido">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Temperatura</label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="Quente">Quente</SelectItem>
                          <SelectItem value="Morno">Morno</SelectItem>
                          <SelectItem value="Frio">Frio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Segmento (Tags CRM)</label>
                    <Input placeholder="Ex: Lead Quente, Decisor" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Mensagem</label>
                    <Textarea placeholder="Digite a mensagem do disparo..." className="min-h-[80px]" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setNewDisparoOpen(false)}>Cancelar</Button>
                    <Button size="sm" onClick={() => setNewDisparoOpen(false)}><Send className="w-3.5 h-3.5 mr-1" /> Enviar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <KpiCard key={k.label} label={k.label} value={k.value} trend={k.trend} />
        ))}
      </div>

      {/* Lista de Disparos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Disparos Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Nome</th>
                <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Tipo</th>
                <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Segmento</th>
                <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Dest.</th>
                <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Status</th>
                <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Entrega</th>
                <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Resposta</th>
                <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {disparos.map(d => (
                <tr key={d.id} className="border-b hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="p-3">
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-[10px] text-muted-foreground">{d.accountName}</p>
                  </td>
                  <td className="p-3"><Badge className={`text-[9px] ${typeColors[d.type]}`}>{typeLabels[d.type]}</Badge></td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {d.segment.length > 0 ? d.segment.map(s => <Badge key={s} variant="outline" className="text-[8px]">{s}</Badge>) : <span className="text-[10px] text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="p-3 text-sm">{d.recipients}</td>
                  <td className="p-3"><Badge variant="outline" className={`text-[9px] ${statusColors[d.status]}`}>{d.status}</Badge></td>
                  <td className="p-3 text-sm font-medium">{d.deliveryRate ? `${d.deliveryRate}%` : "—"}</td>
                  <td className="p-3 text-sm font-medium text-primary">{d.responseRate ? `${d.responseRate}%` : "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{d.sentAt || d.scheduledAt || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Follow-ups Automáticos */}
      <Collapsible open={followUpsOpen} onOpenChange={setFollowUpsOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/20 transition-colors">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Follow-ups Automáticos
                <Badge variant="outline" className="text-[9px] ml-auto">{followUps.filter(f => f.active).length} ativos</Badge>
                {followUpsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {followUps.map(rule => (
                <div key={rule.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Switch checked={rule.active} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Se não respondeu em <span className="font-semibold">{rule.daysNoResponse} dias</span> → enviar mensagem
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 italic">"{rule.message.slice(0, 80)}..."</p>
                  </div>
                  <div className="flex gap-1">
                    {rule.segment.map(s => <Badge key={s} variant="outline" className="text-[8px]">{s}</Badge>)}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full"><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Regra</Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
