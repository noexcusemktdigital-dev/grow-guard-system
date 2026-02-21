import { useState } from "react";
import {
  Bot, Settings, MessageSquare, Pause, Play, Copy, Send,
  Sparkles, Clock, CheckCircle2, Zap, ChevronDown, User,
  Phone, Tag, Volume2
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { getIAAgents, getChatAccounts, type IAAgent } from "@/data/clienteData";

const agentColors: Record<IAAgent["type"], string> = {
  "SDR": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Closer": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Suporte": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Pós-venda": "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const agentIcons: Record<IAAgent["type"], string> = {
  "SDR": "🎯",
  "Closer": "💰",
  "Suporte": "🛠️",
  "Pós-venda": "🔄",
};

export default function ClienteAgentesIA() {
  const [agents, setAgents] = useState<IAAgent[]>(getIAAgents());
  const accounts = getChatAccounts();
  const [configAgent, setConfigAgent] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testAgentId, setTestAgentId] = useState<string>("");
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState("");

  const activeCount = agents.filter(a => a.active).length;
  const totalConversations = agents.reduce((s, a) => s + a.stats.conversationsToday, 0);
  const totalResolved = agents.reduce((s, a) => s + a.stats.resolved, 0);
  const resolutionRate = totalConversations > 0 ? Math.round((totalResolved / totalConversations) * 100) : 0;

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const currentConfig = agents.find(a => a.id === configAgent);

  const updateAgentConfig = (field: string, value: any) => {
    setAgents(prev => prev.map(a => a.id === configAgent ? { ...a, [field]: value } : a));
  };

  const handleSimulate = () => {
    if (!testInput.trim() || !testAgentId) return;
    const agent = agents.find(a => a.id === testAgentId);
    if (!agent) return;
    setTestResult(`🤖 ${agent.name}\n\nOlá! Recebi sua mensagem: "${testInput}"\n\nBaseado nas minhas instruções como agente ${agent.type}, aqui está minha resposta personalizada com tom ${agent.tone}. Esta funcionalidade será integrada com IA real em breve.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Agentes de IA"
        subtitle="Gerencie agentes inteligentes integrados ao Chat e CRM"
        icon={<Bot className="w-5 h-5 text-primary" />}
        badge="Beta"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Agentes Ativos" value={`${activeCount}/${agents.length}`} icon={Bot} trend="neutral" delay={0} />
        <KpiCard label="Conversas IA Hoje" value={String(totalConversations)} icon={MessageSquare} trend="up" delay={1} />
        <KpiCard label="Taxa de Resolução" value={`${resolutionRate}%`} icon={CheckCircle2} trend="up" delay={2} />
        <KpiCard label="Tempo Médio Resp." value="14s" icon={Clock} trend="down" delay={3} />
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map(agent => (
          <Card key={agent.id} className={`relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md ${agent.active ? "" : "opacity-60"}`}>
            <CardContent className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${agentColors[agent.type]}`}>
                    {agentIcons[agent.type]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{agent.description}</p>
                  </div>
                </div>
                <Switch checked={agent.active} onCheckedChange={() => toggleAgent(agent.id)} />
              </div>

              {/* Info */}
              <div className="flex flex-wrap gap-2 text-xs">
                {agent.linkedAccountName ? (
                  <Badge variant="outline" className="gap-1 font-normal">
                    <Phone className="w-3 h-3" /> {agent.linkedAccountName}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
                    <Phone className="w-3 h-3" /> Sem vínculo
                  </Badge>
                )}
                {agent.tags.map(t => (
                  <Badge key={t} variant="secondary" className="gap-1 font-normal">
                    <Tag className="w-3 h-3" /> {t}
                  </Badge>
                ))}
                <Badge variant="outline" className="gap-1 font-normal">
                  <Volume2 className="w-3 h-3" /> {agent.tone}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 bg-muted/30 rounded-lg p-3">
                <div className="text-center">
                  <p className="text-lg font-bold">{agent.stats.conversationsToday}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Conversas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{agent.stats.resolved}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Resolvidas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">
                    {agent.stats.conversationsToday > 0
                      ? `${Math.round((agent.stats.resolved / agent.stats.conversationsToday) * 100)}%`
                      : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">Taxa</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfigAgent(agent.id)}>
                  <Settings className="w-3.5 h-3.5 mr-1" /> Configurar
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <MessageSquare className="w-3.5 h-3.5 mr-1" /> Ver Conversas
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleAgent(agent.id)}>
                  {agent.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Agent Section */}
      <Collapsible open={testOpen} onOpenChange={setTestOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Testar Agente</span>
                <Badge variant="secondary" className="text-[10px]">Simulação</Badge>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${testOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Selecionar Agente</Label>
                  <Select value={testAgentId} onValueChange={setTestAgentId}>
                    <SelectTrigger><SelectValue placeholder="Escolha um agente" /></SelectTrigger>
                    <SelectContent>
                      {agents.filter(a => a.active).map(a => (
                        <SelectItem key={a.id} value={a.id}>{agentIcons[a.type]} {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Simular mensagem do cliente</Label>
                  <Textarea
                    placeholder="Ex: Olá, quero saber sobre os planos..."
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <Button onClick={handleSimulate} disabled={!testAgentId || !testInput.trim()}>
                <Zap className="w-3.5 h-3.5 mr-1" /> Simular Resposta
              </Button>

              {testResult && (
                <div className="relative">
                  {/* Chat bubble style */}
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl rounded-tl-sm p-4 text-sm whitespace-pre-wrap flex-1">
                      {testResult}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => {
                      navigator.clipboard.writeText(testResult);
                      toast({ title: "Copiado!" });
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Config Dialog */}
      <Dialog open={!!configAgent} onOpenChange={(open) => !open && setConfigAgent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurar Agente
            </DialogTitle>
            <DialogDescription>
              {currentConfig?.name}
            </DialogDescription>
          </DialogHeader>

          {currentConfig && (
            <ScrollArea className="max-h-[60vh] pr-3">
              <div className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Nome personalizado</Label>
                  <Input value={currentConfig.name} onChange={e => updateAgentConfig("name", e.target.value)} />
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Tom de voz</Label>
                  <Select value={currentConfig.tone} onValueChange={v => updateAgentConfig("tone", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="amigavel">Amigável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto Reply */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Resposta automática</Label>
                    <p className="text-[11px] text-muted-foreground">Agente responde sem intervenção humana</p>
                  </div>
                  <Switch checked={currentConfig.autoReply} onCheckedChange={v => updateAgentConfig("autoReply", v)} />
                </div>

                {/* WhatsApp Account */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Vincular a conta WhatsApp</Label>
                  <Select
                    value={currentConfig.linkedAccountId || "none"}
                    onValueChange={v => {
                      const acc = accounts.find(a => a.id === v);
                      updateAgentConfig("linkedAccountId", v === "none" ? null : v);
                      updateAgentConfig("linkedAccountName", acc?.name || null);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {accounts.filter(a => a.status === "connected").map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name} — {a.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Tags de atuação</Label>
                  <div className="flex gap-4">
                    {["Lead", "Cliente", "Pós-venda"].map(tag => (
                      <label key={tag} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={currentConfig.tags.includes(tag)}
                          onCheckedChange={(checked) => {
                            const newTags = checked
                              ? [...currentConfig.tags, tag]
                              : currentConfig.tags.filter(t => t !== tag);
                            updateAgentConfig("tags", newTags);
                          }}
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Instruções personalizadas</Label>
                  <Textarea
                    value={currentConfig.instructions}
                    onChange={e => updateAgentConfig("instructions", e.target.value)}
                    rows={4}
                    placeholder="Defina o comportamento do agente..."
                  />
                </div>

                {/* Working hours */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Horário de atuação</Label>
                  <div className="flex items-center gap-3">
                    <Select value={currentConfig.workingHours.start} onValueChange={v => updateAgentConfig("workingHours", { ...currentConfig.workingHours, start: v })}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`).map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">até</span>
                    <Select value={currentConfig.workingHours.end} onValueChange={v => updateAgentConfig("workingHours", { ...currentConfig.workingHours, end: v })}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`).map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigAgent(null)}>Cancelar</Button>
            <Button onClick={() => {
              setConfigAgent(null);
              toast({ title: "Agente atualizado!", description: "As configurações foram salvas." });
            }}>
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
