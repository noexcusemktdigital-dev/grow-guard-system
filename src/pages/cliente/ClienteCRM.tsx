import { useState, useMemo } from "react";
import { Users, Plus, Phone, Mail, ThermometerSun, Search, LayoutGrid, List, MessageCircle, ClipboardList, StickyNote, CheckSquare, Tag, Globe, Instagram, Clock, Bot, User, ArrowRight, FileText, CheckCircle, XCircle, PhoneCall } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getCrmLeads, getChatConversations, type CrmLead } from "@/data/clienteData";
import { DndContext, DragOverlay, closestCorners, type DragEndEvent, type DragStartEvent, useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const stages = [
  { key: "novo", label: "Novo Lead", color: "bg-blue-500", gradient: "from-blue-500/15 to-blue-600/5", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-500" },
  { key: "contato", label: "Contato", color: "bg-amber-500", gradient: "from-amber-500/15 to-amber-600/5", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500" },
  { key: "proposta", label: "Proposta", color: "bg-purple-500", gradient: "from-purple-500/15 to-purple-600/5", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-500" },
  { key: "fechado", label: "Fechado", color: "bg-emerald-500", gradient: "from-emerald-500/15 to-emerald-600/5", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500" },
  { key: "perdido", label: "Perdido", color: "bg-red-500", gradient: "from-red-500/15 to-red-600/5", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-500" },
] as const;

const tempColors: Record<string, string> = {
  Quente: "text-destructive bg-destructive/10",
  Morno: "text-yellow-500 bg-yellow-500/10",
  Frio: "text-blue-400 bg-blue-400/10",
};

const originIcons: Record<string, React.ReactNode> = {
  "Google Ads": <Globe className="w-3 h-3" />,
  "Instagram": <Instagram className="w-3 h-3" />,
  "WhatsApp": <MessageCircle className="w-3 h-3" />,
  "Indicação": <Users className="w-3 h-3" />,
  "Site": <Globe className="w-3 h-3" />,
};

const timelineIcons: Record<string, React.ReactNode> = {
  "search": <Globe className="w-3.5 h-3.5" />,
  "bot": <Bot className="w-3.5 h-3.5" />,
  "arrow-right": <ArrowRight className="w-3.5 h-3.5" />,
  "message-circle": <MessageCircle className="w-3.5 h-3.5" />,
  "phone": <PhoneCall className="w-3.5 h-3.5" />,
  "clipboard": <ClipboardList className="w-3.5 h-3.5" />,
  "file-text": <FileText className="w-3.5 h-3.5" />,
  "check-circle": <CheckCircle className="w-3.5 h-3.5" />,
  "x-circle": <XCircle className="w-3.5 h-3.5" />,
  "users": <Users className="w-3.5 h-3.5" />,
  "instagram": <Instagram className="w-3.5 h-3.5" />,
  "globe": <Globe className="w-3.5 h-3.5" />,
};

const taskStatusColors: Record<string, string> = {
  pendente: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  feita: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  atrasada: "bg-destructive/10 text-destructive border-destructive/20",
};

function DroppableColumn({ stageKey, stageColor, children }: { stageKey: string; stageColor: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return (
    <div ref={setNodeRef} className={`min-h-[100px] space-y-2 pr-1 transition-all duration-200 rounded-lg p-1.5 ${isOver ? `${stageColor} bg-opacity-10` : ""}`}>
      {children}
    </div>
  );
}

function DraggableLeadCard({ lead, onClick }: { lead: CrmLead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:-translate-y-0.5" onClick={onClick}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{lead.name}</p>
              <p className="text-[11px] text-muted-foreground">{lead.phone}</p>
            </div>
            <Badge className={`text-[9px] ${tempColors[lead.temperature]}`}>
              <ThermometerSun className="w-2.5 h-2.5 mr-0.5" />{lead.temperature}
            </Badge>
          </div>
          {/* Extra info visible on card */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{lead.lastInteraction?.split(" ")[0] || lead.createdAt}</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {lead.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-[8px] px-1 py-0">{tag}</Badge>
            ))}
            {lead.origin && <Badge variant="secondary" className="text-[8px] px-1 py-0 gap-0.5">{originIcons[lead.origin]}{lead.origin}</Badge>}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="text-xs font-bold text-primary">R$ {lead.value.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground">{lead.responsible}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Lead Detail Sheet =====

function LeadDetailSheet({ lead, open, onClose }: { lead: CrmLead | null; open: boolean; onClose: () => void }) {
  const [noteText, setNoteText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const conversations = useMemo(() => getChatConversations(), []);

  if (!lead) return null;

  const linkedConvo = lead.linkedConversationId ? conversations.find(c => c.id === lead.linkedConversationId) : null;
  const stageInfo = stages.find(s => s.key === lead.stage);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="text-lg">{lead.name}</SheetTitle>
            {stageInfo && <Badge className={`${stageInfo.color} text-white text-[10px]`}>{stageInfo.label}</Badge>}
            <Badge className={`text-[10px] ${tempColors[lead.temperature]}`}><ThermometerSun className="w-3 h-3 mr-0.5" />{lead.temperature}</Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-5 py-4">
            <Tabs defaultValue="resumo">
              <TabsList className="grid grid-cols-5 w-full mb-4">
                <TabsTrigger value="resumo" className="text-[11px] gap-0.5"><User className="w-3 h-3" /> Resumo</TabsTrigger>
                <TabsTrigger value="historico" className="text-[11px] gap-0.5"><Clock className="w-3 h-3" /> Histórico</TabsTrigger>
                <TabsTrigger value="whatsapp" className="text-[11px] gap-0.5"><MessageCircle className="w-3 h-3" /> Chat</TabsTrigger>
                <TabsTrigger value="notas" className="text-[11px] gap-0.5"><StickyNote className="w-3 h-3" /> Notas</TabsTrigger>
                <TabsTrigger value="tarefas" className="text-[11px] gap-0.5"><CheckSquare className="w-3 h-3" /> Tarefas</TabsTrigger>
              </TabsList>

              <TabsContent value="resumo" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[10px] text-muted-foreground">Telefone</p><p className="text-sm font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">E-mail</p><p className="text-sm font-medium flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Valor</p><p className="text-sm font-bold text-primary">R$ {lead.value.toLocaleString()}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Responsável</p><p className="text-sm font-medium">{lead.responsible}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Origem</p><p className="text-sm flex items-center gap-1">{originIcons[lead.origin]} {lead.origin}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Última interação</p><p className="text-sm">{lead.lastInteraction}</p></div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Status</p>
                  <div className="flex gap-1">
                    {lead.diagnosticoDone && <Badge variant="outline" className="text-[9px] text-emerald-600">Diagnóstico ✓</Badge>}
                    {lead.propostaEnviada && <Badge variant="outline" className="text-[9px] text-blue-600">Proposta ✓</Badge>}
                    {lead.propostaAceita && <Badge variant="outline" className="text-[9px] text-emerald-600">Aceita ✓</Badge>}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Tags</p>
                  <div className="flex gap-1 flex-wrap">
                    {lead.tags.map(tag => <Badge key={tag} variant="secondary" className="text-[10px] gap-1"><Tag className="w-2.5 h-2.5" /> {tag}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg">{lead.notes}</p>
                </div>
              </TabsContent>

              <TabsContent value="historico">
                {lead.timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade</p>
                ) : (
                  <div className="relative pl-6">
                    <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-border" />
                    <div className="space-y-3">
                      {lead.timeline.map(entry => (
                        <div key={entry.id} className="relative flex gap-3 items-start">
                          <div className="absolute -left-3.5 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary">
                            {timelineIcons[entry.icon] || <Clock className="w-3 h-3" />}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm">{entry.description}</p>
                            <p className="text-[10px] text-muted-foreground">{entry.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="whatsapp">
                {linkedConvo ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">Conversa vinculada</span>
                    </div>
                    <ScrollArea className="h-[300px] border rounded-lg p-3">
                      <div className="space-y-2">
                        {linkedConvo.messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender === "contact" ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                              msg.sender === "contact" ? "bg-muted" :
                              msg.sender === "ia" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" :
                              msg.sender === "system" ? "bg-muted/50 text-muted-foreground text-center text-[11px] italic max-w-full w-full" :
                              "bg-primary text-primary-foreground"
                            }`}>
                              <p>{msg.text}</p>
                              <p className="text-[9px] opacity-50 mt-0.5 text-right">{msg.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-2">
                    <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Nenhuma conversa vinculada</p>
                    <Button variant="outline" size="sm"><MessageCircle className="w-4 h-4 mr-1" /> Vincular</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notas" className="space-y-3">
                <div className="flex gap-2">
                  <Textarea placeholder="Nova nota..." value={noteText} onChange={e => setNoteText(e.target.value)} className="min-h-[50px] text-sm" />
                  <Button size="sm" className="self-end" disabled={!noteText.trim()}>Salvar</Button>
                </div>
                {lead.leadNotes.map(note => (
                  <div key={note.id} className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm">{note.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{note.author} · {note.createdAt}</p>
                  </div>
                ))}
                {lead.leadNotes.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma nota</p>}
              </TabsContent>

              <TabsContent value="tarefas" className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Nova tarefa..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="text-sm" />
                  <Button size="sm" disabled={!taskTitle.trim()}>Adicionar</Button>
                </div>
                {lead.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg border">
                    <Checkbox checked={task.status === "feita"} />
                    <div className="flex-1">
                      <p className={`text-sm ${task.status === "feita" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">Prazo: {task.dueDate}</p>
                    </div>
                    <Badge variant="outline" className={`text-[9px] ${taskStatusColors[task.status]}`}>{task.status}</Badge>
                  </div>
                ))}
                {lead.tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma tarefa</p>}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ===== Main CRM =====

export default function ClienteCRM() {
  const [leads, setLeads] = useState<CrmLead[]>(() => getCrmLeads());
  const [selected, setSelected] = useState<CrmLead | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l => l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.email.toLowerCase().includes(q) || l.tags.some(t => t.toLowerCase().includes(q)));
  }, [leads, search]);

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const targetStage = stages.find(s => s.key === over.id)?.key;
    if (targetStage) setLeads(prev => prev.map(l => l.id === active.id ? { ...l, stage: targetStage } : l));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="CRM" subtitle="Funil de vendas" icon={<Users className="w-5 h-5 text-primary" />} actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Lead</Button>} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex border rounded-lg overflow-hidden">
          <Button variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" className="rounded-none h-9" onClick={() => setViewMode("kanban")}><LayoutGrid className="w-4 h-4" /></Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="rounded-none h-9" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {stages.map(stage => {
              const stageLeads = filteredLeads.filter(l => l.stage === stage.key);
              const total = stageLeads.reduce((s, l) => s + l.value, 0);
              return (
                <div key={stage.key} className={`rounded-xl border ${stage.border} bg-gradient-to-b ${stage.gradient} overflow-hidden`}>
                  {/* Column header */}
                  <div className="px-3 py-2.5 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.dot} shadow-sm`} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${stage.text}`}>{stage.label}</span>
                      <Badge variant="outline" className={`text-[9px] ml-auto ${stage.border} ${stage.text}`}>{stageLeads.length}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">R$ {total.toLocaleString()}</p>
                  </div>
                  {/* Column body */}
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    <div className="p-2">
                      <DroppableColumn stageKey={stage.key} stageColor={stage.color}>
                        {stageLeads.length === 0 ? (
                          <div className={`border-2 border-dashed ${stage.border} rounded-lg p-4 text-center`}>
                            <p className="text-[10px] text-muted-foreground">Arraste leads aqui</p>
                          </div>
                        ) : stageLeads.map(lead => (
                          <DraggableLeadCard key={lead.id} lead={lead} onClick={() => setSelected(lead)} />
                        ))}
                      </DroppableColumn>
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
          <DragOverlay>
            {activeLead && (
              <Card className="rotate-3 scale-105 shadow-xl">
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{activeLead.name}</p>
                  <p className="text-xs text-muted-foreground">{activeLead.phone}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-primary">R$ {activeLead.value.toLocaleString()}</span>
                    <Badge className={`text-[9px] ${tempColors[activeLead.temperature]}`}>{activeLead.temperature}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Nome</th>
                  <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Telefone</th>
                  <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Etapa</th>
                  <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Origem</th>
                  <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Valor</th>
                  <th className="text-left text-xs font-semibold p-3 text-muted-foreground">Temp.</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="border-b hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelected(lead)}>
                    <td className="p-3 text-sm font-medium">{lead.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">{lead.phone}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[10px]">{stages.find(s => s.key === lead.stage)?.label}</Badge></td>
                    <td className="p-3"><Badge variant="secondary" className="text-[9px] gap-0.5">{originIcons[lead.origin]}{lead.origin}</Badge></td>
                    <td className="p-3 text-sm font-bold text-primary">R$ {lead.value.toLocaleString()}</td>
                    <td className="p-3"><Badge className={`text-[9px] ${tempColors[lead.temperature]}`}>{lead.temperature}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Lead Detail Sheet */}
      <LeadDetailSheet lead={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
