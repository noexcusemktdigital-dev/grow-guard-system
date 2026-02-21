import { useState, useRef, useEffect } from "react";
import {
  Bot, Settings, MessageSquare, Pause, Play, Copy, Send,
  Sparkles, Clock, CheckCircle2, Zap, ChevronDown, User,
  Phone, Tag, Volume2, X, ArrowRight, BookOpen, Brain,
  Database, Code2, Stethoscope, FileText, Plus, Trash2,
  AlertTriangle, Activity
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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { getIAAgents, getChatAccounts, type IAAgent } from "@/data/clienteData";

const agentGradients: Record<IAAgent["type"], string> = {
  SDR: "from-blue-500/20 to-blue-600/5",
  Closer: "from-emerald-500/20 to-emerald-600/5",
  Suporte: "from-amber-500/20 to-amber-600/5",
  "Pós-venda": "from-orange-500/20 to-orange-600/5",
};

const agentAccent: Record<IAAgent["type"], string> = {
  SDR: "border-blue-500/30 text-blue-400",
  Closer: "border-emerald-500/30 text-emerald-400",
  Suporte: "border-amber-500/30 text-amber-400",
  "Pós-venda": "border-orange-500/30 text-orange-400",
};

const agentIcons: Record<IAAgent["type"], string> = {
  SDR: "🎯",
  Closer: "💰",
  Suporte: "🛠️",
  "Pós-venda": "🔄",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ClienteAgentesIA() {
  const [agents, setAgents] = useState<IAAgent[]>(getIAAgents());
  const accounts = getChatAccounts();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [configAgent, setConfigAgent] = useState<string | null>(null);

  // Playground state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeCount = agents.filter(a => a.active).length;
  const totalConversations = agents.reduce((s, a) => s + a.stats.conversationsToday, 0);
  const totalResolved = agents.reduce((s, a) => s + a.stats.resolved, 0);
  const resolutionRate = totalConversations > 0 ? Math.round((totalResolved / totalConversations) * 100) : 0;

  const currentAgent = agents.find(a => a.id === selectedAgent);
  const currentConfig = agents.find(a => a.id === configAgent);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const updateAgentConfig = (field: string, value: any) => {
    setAgents(prev => prev.map(a => a.id === configAgent ? { ...a, [field]: value } : a));
  };

  const openPlayground = (agentId: string) => {
    setSelectedAgent(agentId);
    setChatMessages([]);
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !currentAgent) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply: ChatMessage = {
        role: "assistant",
        content: `Olá! Sou o agente ${currentAgent.name} (${currentAgent.type}). Recebi sua mensagem: "${userMsg.content}".\n\nComo agente com tom ${currentAgent.tone}, vou te ajudar da melhor forma possível. Esta é uma simulação — em produção, estarei conectado ao seu WhatsApp.`,
      };
      setChatMessages(prev => [...prev, reply]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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

      {/* Main layout: cards + playground */}
      <div className={`grid gap-6 transition-all duration-300 ${selectedAgent ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1"}`}>
        {/* Agent cards */}
        <div className={`space-y-4 ${selectedAgent ? "lg:col-span-2" : ""}`}>
          <div className={`grid gap-4 ${selectedAgent ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
            {agents.map((agent, i) => (
              <Card
                key={agent.id}
                className={`relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group ${
                  agent.active ? "" : "opacity-50"
                } ${selectedAgent === agent.id ? "ring-2 ring-primary shadow-lg" : ""}`}
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => agent.active && openPlayground(agent.id)}
              >
                {/* Gradient accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${agentGradients[agent.type]} opacity-60`} />

                <CardContent className="relative p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg border-2 ${agentAccent[agent.type]} bg-background/50 backdrop-blur-sm`}>
                        {agentIcons[agent.type]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{agent.name}</h3>
                        <Badge variant="outline" className={`text-[9px] mt-0.5 ${agentAccent[agent.type]}`}>{agent.type}</Badge>
                      </div>
                    </div>
                    <Switch
                      checked={agent.active}
                      onCheckedChange={(e) => { e; toggleAgent(agent.id); }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: agent.stats.conversationsToday, l: "Conversas" },
                      { v: agent.stats.resolved, l: "Resolvidas" },
                      { v: agent.stats.conversationsToday > 0 ? `${Math.round((agent.stats.resolved / agent.stats.conversationsToday) * 100)}%` : "—", l: "Taxa" },
                    ].map(s => (
                      <div key={s.l} className="text-center p-2 rounded-lg bg-background/40 backdrop-blur-sm">
                        <p className="text-base font-bold">{s.v}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.l}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tags row */}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {agent.linkedAccountName && (
                      <Badge variant="outline" className="gap-1 font-normal text-[9px]">
                        <Phone className="w-2.5 h-2.5" /> {agent.linkedAccountName}
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1 font-normal text-[9px]">
                      <Volume2 className="w-2.5 h-2.5" /> {agent.tone}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => { e.stopPropagation(); setConfigAgent(agent.id); }}
                    >
                      <Settings className="w-3 h-3 mr-1" /> Config
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={!agent.active}
                      onClick={(e) => { e.stopPropagation(); openPlayground(agent.id); }}
                    >
                      <Sparkles className="w-3 h-3 mr-1" /> Testar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Playground panel */}
        {selectedAgent && currentAgent && (
          <div className="lg:col-span-3 animate-fade-in">
            <Card className="h-[600px] flex flex-col overflow-hidden">
              {/* Playground header */}
              <div className={`flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r ${agentGradients[currentAgent.type]}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base border ${agentAccent[currentAgent.type]} bg-background/60`}>
                    {agentIcons[currentAgent.type]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{currentAgent.name}</h3>
                    <p className="text-[10px] text-muted-foreground">Playground de teste • {currentAgent.tone}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedAgent(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Chat area */}
              <ScrollArea className="flex-1 p-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-16">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mb-4">
                      {agentIcons[currentAgent.type]}
                    </div>
                    <p className="text-sm font-medium">Teste o agente {currentAgent.name}</p>
                    <p className="text-xs mt-1 max-w-xs">Envie uma mensagem para simular como o agente responderia aos seus clientes.</p>
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      {["Quero saber sobre preços", "Agendar uma demo", "Suporte técnico"].map(s => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          className="text-[10px] h-7"
                          onClick={() => { setChatInput(s); }}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted/50 border rounded-bl-md"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-2 items-center">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="bg-muted/50 border rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-3 flex gap-2">
                <Input
                  placeholder="Simule uma mensagem do cliente..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  className="flex-1 text-sm"
                />
                <Button size="icon" onClick={sendMessage} disabled={!chatInput.trim() || isTyping}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Config Sheet — 6 abas */}
      <Sheet open={!!configAgent} onOpenChange={(open) => !open && setConfigAgent(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="p-5 pb-0">
            <SheetTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" /> Configurar Agente
            </SheetTitle>
            <SheetDescription>{currentConfig?.name} — {currentConfig?.type}</SheetDescription>
          </SheetHeader>

          {currentConfig && (
            <Tabs defaultValue="identidade" className="mt-4">
              <TabsList className="w-full justify-start px-5 flex-wrap h-auto gap-1 bg-transparent border-b rounded-none pb-0">
                {[
                  { v: "identidade", l: "Identidade", i: BookOpen },
                  { v: "persona", l: "Persona", i: User },
                  { v: "base", l: "Base de Conhecimento", i: Database },
                  { v: "prompt", l: "Engenharia de Prompt", i: Code2 },
                  { v: "simulador", l: "Simulador", i: Sparkles },
                  { v: "diagnostico", l: "Diagnóstico", i: Stethoscope },
                ].map(tab => (
                  <TabsTrigger key={tab.v} value={tab.v} className="text-xs gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
                    <tab.i className="w-3 h-3" /> {tab.l}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* === IDENTIDADE === */}
              <TabsContent value="identidade" className="p-5 space-y-5 mt-0">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Nome do Agente</Label>
                  <Input value={currentConfig.name} onChange={e => updateAgentConfig("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Tipo / Função</Label>
                  <Select value={currentConfig.type} onValueChange={v => updateAgentConfig("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SDR">SDR — Prospecção</SelectItem>
                      <SelectItem value="Closer">Closer — Fechamento</SelectItem>
                      <SelectItem value="Suporte">Suporte — Atendimento</SelectItem>
                      <SelectItem value="Pós-venda">Pós-venda — Retenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Descrição</Label>
                  <Textarea value={currentConfig.description} onChange={e => updateAgentConfig("description", e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Conta WhatsApp vinculada</Label>
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
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Agente ativo</Label>
                    <p className="text-[11px] text-muted-foreground">Habilitar/desabilitar o agente</p>
                  </div>
                  <Switch checked={currentConfig.active} onCheckedChange={v => updateAgentConfig("active", v)} />
                </div>
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
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Tags de atuação</Label>
                  <div className="flex gap-4">
                    {["Lead", "Cliente", "Pós-venda"].map(tag => (
                      <label key={tag} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={currentConfig.tags.includes(tag)}
                          onCheckedChange={(checked) => {
                            const newTags = checked ? [...currentConfig.tags, tag] : currentConfig.tags.filter(t => t !== tag);
                            updateAgentConfig("tags", newTags);
                          }}
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* === PERSONA === */}
              <TabsContent value="persona" className="p-5 space-y-5 mt-0">
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
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Personalidade</Label>
                  <Textarea rows={3} placeholder="Descreva a personalidade do agente. Ex: Objetivo, empático, persuasivo..." defaultValue="Profissional, empático e orientado a resultados. Sempre busca entender a dor do cliente antes de oferecer soluções." />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Mensagem de boas-vindas</Label>
                  <Textarea rows={2} placeholder="Primeira mensagem ao iniciar conversa..." defaultValue={`Olá! Sou o ${currentConfig.name}, assistente virtual da empresa. Como posso te ajudar hoje?`} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Idioma</Label>
                  <Select defaultValue="pt-BR">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (BR)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Usar emojis</Label>
                    <p className="text-[11px] text-muted-foreground">Permitir emojis nas respostas</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Resposta automática</Label>
                    <p className="text-[11px] text-muted-foreground">Sem intervenção humana</p>
                  </div>
                  <Switch checked={currentConfig.autoReply} onCheckedChange={v => updateAgentConfig("autoReply", v)} />
                </div>
              </TabsContent>

              {/* === BASE DE CONHECIMENTO === */}
              <TabsContent value="base" className="p-5 space-y-5 mt-0">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <Label className="text-xs font-medium">Documentos carregados</Label>
                  </div>
                  {[
                    { name: "catalogo-produtos.pdf", size: "2.4 MB", date: "20/02/2026" },
                    { name: "politica-precos.pdf", size: "850 KB", date: "18/02/2026" },
                    { name: "faq-suporte.docx", size: "1.1 MB", date: "15/02/2026" },
                  ].map(doc => (
                    <div key={doc.name} className="flex items-center justify-between p-2.5 rounded-lg border bg-background">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.size} • {doc.date}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full text-xs"><Plus className="w-3 h-3 mr-1" /> Upload de documento</Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">URLs de referência</Label>
                  <div className="space-y-2">
                    {["https://minhaempresa.com/produtos", "https://minhaempresa.com/faq"].map(url => (
                      <div key={url} className="flex items-center gap-2 p-2 rounded-lg border bg-background">
                        <p className="text-xs flex-1 truncate text-muted-foreground">{url}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="https://..." className="flex-1 text-xs" />
                    <Button variant="outline" size="sm" className="text-xs"><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Informações adicionais (texto livre)</Label>
                  <Textarea rows={3} placeholder="Adicione informações extras que o agente deve saber: preços, políticas, regras de negócio..." />
                </div>
              </TabsContent>

              {/* === ENGENHARIA DE PROMPT === */}
              <TabsContent value="prompt" className="p-5 space-y-5 mt-0">
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground">Área avançada. Alterações no prompt afetam diretamente o comportamento do agente.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">System Prompt (instruções principais)</Label>
                  <Textarea
                    value={currentConfig.instructions}
                    onChange={e => updateAgentConfig("instructions", e.target.value)}
                    rows={6}
                    className="font-mono text-xs"
                    placeholder="Defina o comportamento principal do agente..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Regras de comportamento</Label>
                  <Textarea rows={4} className="font-mono text-xs" defaultValue={`- Nunca invente informações que não estão na base de conhecimento\n- Sempre pergunte o nome do cliente no início\n- Se não souber a resposta, ofereça transferir para um humano\n- Nunca compartilhe informações de outros clientes`} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Gatilhos de escalamento</Label>
                  <Textarea rows={3} className="font-mono text-xs" defaultValue={`- Cliente insatisfeito ou irritado → transferir para humano\n- Pedido de cancelamento → transferir para retenção\n- Dúvida técnica complexa → transferir para suporte N2`} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Temperatura (criatividade)</Label>
                  <div className="flex items-center gap-3">
                    <Input type="number" min={0} max={1} step={0.1} defaultValue={0.7} className="w-24 text-xs" />
                    <p className="text-[10px] text-muted-foreground">0 = determinístico, 1 = criativo</p>
                  </div>
                </div>
              </TabsContent>

              {/* === SIMULADOR === */}
              <TabsContent value="simulador" className="p-5 space-y-4 mt-0">
                <div className="p-4 rounded-xl border bg-muted/10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl mx-auto">
                    {agentIcons[currentConfig.type]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Simulador do {currentConfig.name}</p>
                    <p className="text-xs text-muted-foreground">Teste as configurações em tempo real sem afetar conversas reais</p>
                  </div>
                  <Button size="sm" onClick={() => { setConfigAgent(null); openPlayground(currentConfig.id); }}>
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Abrir Playground
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Cenários de teste rápido</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: "Lead novo perguntando preço", msg: "Oi, quanto custa o plano empresarial?" },
                      { label: "Cliente reclamando", msg: "Estou insatisfeito com o atendimento, quero cancelar." },
                      { label: "Dúvida técnica", msg: "Como faço para integrar com meu sistema atual?" },
                      { label: "Pedido de demo", msg: "Quero agendar uma demonstração do produto." },
                    ].map(s => (
                      <button
                        key={s.label}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors text-left"
                        onClick={() => { setConfigAgent(null); openPlayground(currentConfig.id); setChatInput(s.msg); }}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-medium">{s.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{s.msg}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* === DIAGNÓSTICO === */}
              <TabsContent value="diagnostico" className="p-5 space-y-5 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Conversas Hoje", value: String(currentConfig.stats.conversationsToday), icon: MessageSquare },
                    { label: "Resolvidas", value: String(currentConfig.stats.resolved), icon: CheckCircle2 },
                    { label: "Taxa Resolução", value: currentConfig.stats.conversationsToday > 0 ? `${Math.round((currentConfig.stats.resolved / currentConfig.stats.conversationsToday) * 100)}%` : "—", icon: Activity },
                    { label: "Tempo Médio", value: "14s", icon: Clock },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-xl border bg-muted/10">
                      <div className="flex items-center gap-2 mb-1">
                        <s.icon className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                      </div>
                      <p className="text-xl font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Últimos erros / escalamentos</Label>
                  <div className="space-y-2">
                    {[
                      { type: "escalamento", msg: "Cliente pediu cancelamento — transferido para retenção", time: "Há 2h" },
                      { type: "erro", msg: "Agente não encontrou resposta na base de conhecimento", time: "Há 5h" },
                      { type: "escalamento", msg: "Dúvida técnica complexa — transferido para suporte N2", time: "Ontem" },
                    ].map((log, i) => (
                      <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${log.type === "erro" ? "border-red-500/20 bg-red-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                        <AlertTriangle className={`w-3 h-3 mt-0.5 shrink-0 ${log.type === "erro" ? "text-red-400" : "text-amber-400"}`} />
                        <div className="flex-1">
                          <p className="text-xs">{log.msg}</p>
                          <p className="text-[10px] text-muted-foreground">{log.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Saúde do Agente</Label>
                  <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-medium text-emerald-400">Operacional</p>
                      <p className="text-[10px] text-muted-foreground">Todos os sistemas funcionando normalmente</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Footer */}
              <div className="flex gap-2 p-5 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setConfigAgent(null)}>Cancelar</Button>
                <Button className="flex-1" onClick={() => {
                  setConfigAgent(null);
                  toast({ title: "Agente atualizado!", description: "Configurações salvas com sucesso." });
                }}>
                  Salvar Configurações
                </Button>
              </div>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
