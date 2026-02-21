import { useState, useRef, useEffect } from "react";
import {
  Bot, Settings, MessageSquare, Send, Sparkles, Clock, CheckCircle2,
  Zap, User, Phone, Volume2, X, BookOpen, Brain, Database, Code2,
  Stethoscope, FileText, Plus, Trash2, AlertTriangle, Activity, Target,
  DollarSign, Wrench, RefreshCw, Pencil, Copy, GripVertical
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
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

const agentIcons: Record<IAAgent["type"], React.ElementType> = {
  SDR: Target,
  Closer: DollarSign,
  Suporte: Wrench,
  "Pós-venda": RefreshCw,
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ===== Create/Edit Agent Dialog =====

function AgentFormDialog({ open, onClose, agent, onSave }: {
  open: boolean; onClose: () => void; agent: IAAgent | null; onSave: (agent: IAAgent) => void;
}) {
  const isNew = !agent;
  const [name, setName] = useState(agent?.name || "");
  const [type, setType] = useState<IAAgent["type"]>(agent?.type || "SDR");
  const [description, setDescription] = useState(agent?.description || "");
  const [tone, setTone] = useState(agent?.tone || "amigavel");
  const [instructions, setInstructions] = useState(agent?.instructions || "Você é um assistente comercial da empresa. Seja cordial e objetivo.");

  useEffect(() => {
    if (open) {
      setName(agent?.name || "");
      setType(agent?.type || "SDR");
      setDescription(agent?.description || "");
      setTone(agent?.tone || "amigavel");
      setInstructions(agent?.instructions || "Você é um assistente comercial da empresa. Seja cordial e objetivo.");
    }
  }, [open, agent]);

  const handleSave = () => {
    if (!name.trim()) return;
    const saved: IAAgent = agent ? {
      ...agent,
      name: name.trim(),
      type,
      description: description.trim(),
      tone,
      instructions,
    } : {
      id: `agent_${Date.now()}`,
      name: name.trim(),
      type,
      description: description.trim(),
      tone,
      instructions,
      active: false,
      autoReply: true,
      linkedAccountId: null,
      linkedAccountName: null,
      workingHours: { start: "08:00", end: "18:00" },
      tags: [],
      stats: { conversationsToday: 0, resolved: 0, avgResponseTime: "—" },
    };
    onSave(saved);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isNew ? <Plus className="w-5 h-5 text-primary" /> : <Pencil className="w-5 h-5 text-primary" />}
            {isNew ? "Criar Agente" : "Editar Agente"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome do Agente *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: SDR Principal" className="h-9 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Tipo / Função</Label>
              <Select value={type} onValueChange={v => setType(v as IAAgent["type"])}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SDR">SDR — Prospecção</SelectItem>
                  <SelectItem value="Closer">Closer — Fechamento</SelectItem>
                  <SelectItem value="Suporte">Suporte — Atendimento</SelectItem>
                  <SelectItem value="Pós-venda">Pós-venda — Retenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="text-sm mt-1" placeholder="Descreva o papel deste agente..." />
          </div>
          <div>
            <Label className="text-xs">Tom de voz</Label>
            <Select value={tone} onValueChange={v => setTone(v as any)}>
              <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="amigavel">Amigável</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Instruções principais</Label>
            <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4} className="text-sm font-mono mt-1" placeholder="Defina o comportamento do agente..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isNew ? "Criar Agente" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== Delete Confirm Dialog =====

function DeleteAgentDialog({ open, onClose, agentName, onConfirm }: {
  open: boolean; onClose: () => void; agentName: string; onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" /> Excluir Agente
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja excluir o agente <strong>{agentName}</strong>? Esta ação não pode ser desfeita.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>Excluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClienteAgentesIA() {
  const [agents, setAgents] = useState<IAAgent[]>(getIAAgents());
  const accounts = getChatAccounts();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [configAgent, setConfigAgent] = useState<string | null>(null);

  // CRUD dialogs
  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingAgent, setEditingAgent] = useState<IAAgent | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<IAAgent | null>(null);

  // Playground state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const handleSaveAgent = (agent: IAAgent) => {
    setAgents(prev => {
      const exists = prev.find(a => a.id === agent.id);
      if (exists) return prev.map(a => a.id === agent.id ? agent : a);
      return [...prev, agent];
    });
    toast({ title: editingAgent ? "Agente atualizado!" : "Agente criado!" });
  };

  const handleDeleteAgent = (id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    if (selectedAgent === id) setSelectedAgent(null);
    if (configAgent === id) setConfigAgent(null);
    toast({ title: "Agente excluído!" });
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
        subtitle="Crie, edite e gerencie seus agentes inteligentes"
        icon={<Bot className="w-5 h-5 text-primary" />}
        actions={
          <Button size="sm" onClick={() => { setEditingAgent(null); setShowCreateEdit(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Novo Agente
          </Button>
        }
      />

      {/* Agent count summary */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Badge variant="outline" className="gap-1.5 py-1">
          <Bot className="w-3 h-3" />
          {agents.length} agente{agents.length !== 1 ? "s" : ""}
          <span className="text-primary font-medium ml-1">{agents.filter(a => a.active).length} ativo{agents.filter(a => a.active).length !== 1 ? "s" : ""}</span>
        </Badge>
      </div>

      {/* Main layout: cards + playground */}
      <div className={`grid gap-6 transition-all duration-300 ${selectedAgent ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1"}`}>
        {/* Agent cards */}
        <div className={`space-y-4 ${selectedAgent ? "lg:col-span-2" : ""}`}>
          {agents.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Bot className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium">Nenhum agente criado</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Crie seu primeiro agente de IA para automatizar o atendimento.</p>
                <Button size="sm" onClick={() => { setEditingAgent(null); setShowCreateEdit(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Criar Agente
                </Button>
              </CardContent>
            </Card>
          )}

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
                <div className={`absolute inset-0 bg-gradient-to-br ${agentGradients[agent.type]} opacity-60`} />

                <CardContent className="relative p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 ${agentAccent[agent.type]} bg-background/50 backdrop-blur-sm`}>
                        {(() => { const AgIcon = agentIcons[agent.type]; return <AgIcon className="w-5 h-5" />; })()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{agent.name}</h3>
                        <Badge variant="outline" className={`text-[9px] mt-0.5 ${agentAccent[agent.type]}`}>{agent.type}</Badge>
                      </div>
                    </div>
                    <Switch
                      checked={agent.active}
                      onCheckedChange={() => toggleAgent(agent.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>

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
                      variant="outline"
                      className="text-xs"
                      onClick={(e) => { e.stopPropagation(); setEditingAgent(agent); setShowCreateEdit(true); }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeleteAgent(agent); }}
                    >
                      <Trash2 className="w-3 h-3" />
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
              <div className={`flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r ${agentGradients[currentAgent.type]}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${agentAccent[currentAgent.type]} bg-background/60`}>
                    {(() => { const AgIcon = agentIcons[currentAgent.type]; return <AgIcon className="w-4 h-4" />; })()}
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

              <ScrollArea className="flex-1 p-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-16">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      {(() => { const AgIcon = agentIcons[currentAgent.type]; return <AgIcon className="w-8 h-8 text-primary" />; })()}
                    </div>
                    <p className="text-sm font-medium">Teste o agente {currentAgent.name}</p>
                    <p className="text-xs mt-1 max-w-xs">Envie uma mensagem para simular como o agente responderia.</p>
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      {["Quero saber sobre preços", "Agendar uma demo", "Suporte técnico"].map(s => (
                        <Button key={s} variant="outline" size="sm" className="text-[10px] h-7" onClick={() => setChatInput(s)}>
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
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted/50 border rounded-bl-md"
                      }`}>
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
                  <Label className="text-xs font-medium">Personalidade</Label>
                  <Textarea rows={3} placeholder="Descreva a personalidade do agente..." defaultValue="Profissional, empático e orientado a resultados." />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Mensagem de boas-vindas</Label>
                  <Textarea rows={2} placeholder="Primeira mensagem ao iniciar conversa..." defaultValue={`Olá! Sou o ${currentConfig.name}, assistente virtual. Como posso te ajudar?`} />
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
                  <Label className="text-xs font-medium">Informações adicionais</Label>
                  <Textarea rows={3} placeholder="Adicione informações extras..." />
                </div>
              </TabsContent>

              {/* === ENGENHARIA DE PROMPT === */}
              <TabsContent value="prompt" className="p-5 space-y-5 mt-0">
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground">Área avançada. Alterações no prompt afetam o comportamento do agente.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Regras de comportamento</Label>
                  <Textarea rows={4} className="font-mono text-xs" defaultValue={`- Nunca invente informações\n- Sempre pergunte o nome do cliente\n- Se não souber, ofereça transferir para humano\n- Nunca compartilhe dados de outros clientes`} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Gatilhos de escalamento</Label>
                  <Textarea rows={3} className="font-mono text-xs" defaultValue={`- Cliente insatisfeito → transferir para humano\n- Pedido de cancelamento → transferir para retenção\n- Dúvida técnica complexa → suporte N2`} />
                </div>
              </TabsContent>

              {/* === SIMULADOR === */}
              <TabsContent value="simulador" className="p-5 space-y-4 mt-0">
                <div className="p-4 rounded-xl border bg-muted/10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    {(() => { const AgIcon = agentIcons[currentConfig.type]; return <AgIcon className="w-6 h-6 text-primary" />; })()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Simulador do {currentConfig.name}</p>
                    <p className="text-xs text-muted-foreground">Teste em tempo real sem afetar conversas reais</p>
                  </div>
                  <Button size="sm" onClick={() => { setConfigAgent(null); openPlayground(currentConfig.id); }}>
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Abrir Playground
                  </Button>
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
                  toast({ title: "Configurações salvas!" });
                }}>
                  Salvar
                </Button>
              </div>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      {/* CRUD Dialogs */}
      <AgentFormDialog
        open={showCreateEdit}
        onClose={() => { setShowCreateEdit(false); setEditingAgent(null); }}
        agent={editingAgent}
        onSave={handleSaveAgent}
      />

      {deleteAgent && (
        <DeleteAgentDialog
          open={!!deleteAgent}
          onClose={() => setDeleteAgent(null)}
          agentName={deleteAgent.name}
          onConfirm={() => handleDeleteAgent(deleteAgent.id)}
        />
      )}
    </div>
  );
}
