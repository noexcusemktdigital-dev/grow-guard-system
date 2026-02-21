import { useState, useMemo } from "react";
import {
  Users, Plus, Phone, Mail, ThermometerSun, Search, LayoutGrid, List,
  MessageCircle, ClipboardList, StickyNote, CheckSquare, Tag, Globe,
  Instagram, Clock, Bot, User, ArrowRight, FileText, CheckCircle,
  XCircle, PhoneCall, Settings2, GripVertical, Pencil, Trash2,
  Filter, DollarSign, Target, AlertTriangle, ChevronDown,
  Zap, BarChart3, X, Save, Palette, CirclePlus, CircleDot,
  Crosshair, Handshake, ShieldCheck, Ban, Sparkles, Star,
  PhoneOutgoing, SearchCheck
} from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getCrmLeads, getChatConversations, type CrmLead } from "@/data/clienteData";
import { DndContext, DragOverlay, closestCorners, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";

// ===== Stage System =====

interface FunnelStage {
  key: string;
  label: string;
  color: string;
  icon: string; // lucide icon key
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  "circle-plus": <CirclePlus className="w-4 h-4" />,
  "phone-outgoing": <PhoneOutgoing className="w-4 h-4" />,
  "search-check": <SearchCheck className="w-4 h-4" />,
  "clipboard": <ClipboardList className="w-4 h-4" />,
  "handshake": <Handshake className="w-4 h-4" />,
  "shield-check": <ShieldCheck className="w-4 h-4" />,
  "ban": <Ban className="w-4 h-4" />,
  "star": <Star className="w-4 h-4" />,
  "sparkles": <Sparkles className="w-4 h-4" />,
  "target": <Target className="w-4 h-4" />,
  "crosshair": <Crosshair className="w-4 h-4" />,
  "circle-dot": <CircleDot className="w-4 h-4" />,
};

const STAGE_ICON_OPTIONS = Object.keys(STAGE_ICONS);

const STAGE_COLORS = [
  { name: "blue", label: "Azul", gradient: "from-blue-500/10 to-transparent", border: "border-blue-500/25", text: "text-blue-500", dot: "bg-blue-500", bg: "bg-blue-500", ring: "ring-blue-500/20", light: "bg-blue-500/8" },
  { name: "amber", label: "Âmbar", gradient: "from-amber-500/10 to-transparent", border: "border-amber-500/25", text: "text-amber-500", dot: "bg-amber-500", bg: "bg-amber-500", ring: "ring-amber-500/20", light: "bg-amber-500/8" },
  { name: "purple", label: "Roxo", gradient: "from-purple-500/10 to-transparent", border: "border-purple-500/25", text: "text-purple-500", dot: "bg-purple-500", bg: "bg-purple-500", ring: "ring-purple-500/20", light: "bg-purple-500/8" },
  { name: "emerald", label: "Verde", gradient: "from-emerald-500/10 to-transparent", border: "border-emerald-500/25", text: "text-emerald-500", dot: "bg-emerald-500", bg: "bg-emerald-500", ring: "ring-emerald-500/20", light: "bg-emerald-500/8" },
  { name: "red", label: "Vermelho", gradient: "from-red-500/10 to-transparent", border: "border-red-500/25", text: "text-red-500", dot: "bg-red-500", bg: "bg-red-500", ring: "ring-red-500/20", light: "bg-red-500/8" },
  { name: "cyan", label: "Ciano", gradient: "from-cyan-500/10 to-transparent", border: "border-cyan-500/25", text: "text-cyan-500", dot: "bg-cyan-500", bg: "bg-cyan-500", ring: "ring-cyan-500/20", light: "bg-cyan-500/8" },
  { name: "pink", label: "Rosa", gradient: "from-pink-500/10 to-transparent", border: "border-pink-500/25", text: "text-pink-500", dot: "bg-pink-500", bg: "bg-pink-500", ring: "ring-pink-500/20", light: "bg-pink-500/8" },
  { name: "orange", label: "Laranja", gradient: "from-orange-500/10 to-transparent", border: "border-orange-500/25", text: "text-orange-500", dot: "bg-orange-500", bg: "bg-orange-500", ring: "ring-orange-500/20", light: "bg-orange-500/8" },
  { name: "indigo", label: "Índigo", gradient: "from-indigo-500/10 to-transparent", border: "border-indigo-500/25", text: "text-indigo-500", dot: "bg-indigo-500", bg: "bg-indigo-500", ring: "ring-indigo-500/20", light: "bg-indigo-500/8" },
  { name: "teal", label: "Teal", gradient: "from-teal-500/10 to-transparent", border: "border-teal-500/25", text: "text-teal-500", dot: "bg-teal-500", bg: "bg-teal-500", ring: "ring-teal-500/20", light: "bg-teal-500/8" },
];

const getColorStyle = (colorName: string) => STAGE_COLORS.find(c => c.name === colorName) || STAGE_COLORS[0];

const DEFAULT_STAGES: FunnelStage[] = [
  { key: "novo", label: "Novo Lead", color: "blue", icon: "circle-plus" },
  { key: "contato", label: "Contato", color: "amber", icon: "phone-outgoing" },
  { key: "qualificacao", label: "Qualificação", color: "cyan", icon: "search-check" },
  { key: "proposta", label: "Proposta", color: "purple", icon: "clipboard" },
  { key: "negociacao", label: "Negociação", color: "orange", icon: "handshake" },
  { key: "fechado", label: "Fechado", color: "emerald", icon: "shield-check" },
  { key: "perdido", label: "Perdido", color: "red", icon: "ban" },
];

const tempColors: Record<string, string> = {
  Quente: "text-destructive bg-destructive/10 border-destructive/20",
  Morno: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  Frio: "text-blue-400 bg-blue-400/10 border-blue-400/20",
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

// ===== Droppable Column =====

function DroppableColumn({ stageKey, children }: { stageKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return (
    <div ref={setNodeRef} className={`min-h-[80px] space-y-2 transition-all duration-200 rounded-lg p-1.5 ${isOver ? "bg-primary/5 ring-2 ring-primary/20 ring-dashed" : ""}`}>
      {children}
    </div>
  );
}

// ===== Draggable Lead Card =====

function DraggableLeadCard({ lead, onClick, stageColor }: { lead: CrmLead; onClick: () => void; stageColor: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  const colorStyle = getColorStyle(stageColor);
  const overdueTasks = lead.tasks.filter(t => t.status === "atrasada").length;
  const pendingTasks = lead.tasks.filter(t => t.status === "pendente" || t.status === "atrasada").length;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`cursor-pointer hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 border-l-[3px] ${colorStyle.border}`}
        onClick={() => { if (!isDragging) onClick(); }}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing pt-0.5 -ml-1 px-1 touch-none">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold truncate leading-tight">{lead.name}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 shrink-0" /> {lead.phone}
              </p>
            </div>
            <Badge variant="outline" className={`text-[9px] shrink-0 ${tempColors[lead.temperature]}`}>
              {lead.temperature}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-primary">R$ {lead.value.toLocaleString()}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                <span className="text-[9px] font-semibold text-muted-foreground">{lead.responsible.charAt(0)}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{lead.responsible}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {lead.origin && (
              <Badge variant="secondary" className="text-[8px] px-1.5 py-0 gap-0.5 font-normal">
                {originIcons[lead.origin]}{lead.origin}
              </Badge>
            )}
            {lead.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-[8px] px-1 py-0 font-normal">{tag}</Badge>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1.5 border-t border-border/40">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lead.lastInteraction?.split(" ")[0] || lead.createdAt}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              {lead.diagnosticoDone && (
                <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                  </div>
                </TooltipTrigger><TooltipContent><p className="text-xs">Diagnóstico feito</p></TooltipContent></Tooltip></TooltipProvider>
              )}
              {lead.propostaEnviada && (
                <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                  <div className="w-4 h-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <FileText className="w-2.5 h-2.5 text-blue-500" />
                  </div>
                </TooltipTrigger><TooltipContent><p className="text-xs">Proposta enviada</p></TooltipContent></Tooltip></TooltipProvider>
              )}
              {overdueTasks > 0 && (
                <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
                  <div className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-2.5 h-2.5 text-destructive" />
                  </div>
                </TooltipTrigger><TooltipContent><p className="text-xs">{overdueTasks} atrasada(s)</p></TooltipContent></Tooltip></TooltipProvider>
              )}
              {pendingTasks > 0 && overdueTasks === 0 && (
                <span className="text-[9px] text-muted-foreground">{pendingTasks} tarefa(s)</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Stage Editor Dialog =====

function StageEditorDialog({ open, onClose, stages, onSave }: {
  open: boolean; onClose: () => void; stages: FunnelStage[]; onSave: (stages: FunnelStage[]) => void;
}) {
  const [editStages, setEditStages] = useState<FunnelStage[]>(stages);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [newIcon, setNewIcon] = useState("circle-dot");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const addStage = () => {
    if (!newLabel.trim() || editStages.length >= 10) return;
    const key = newLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    setEditStages([...editStages, { key: `custom_${key}_${Date.now()}`, label: newLabel.trim(), color: newColor, icon: newIcon }]);
    setNewLabel("");
  };

  const removeStage = (idx: number) => setEditStages(editStages.filter((_, i) => i !== idx));

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditLabel(editStages[idx].label);
  };

  const saveEdit = () => {
    if (editingIdx === null || !editLabel.trim()) return;
    setEditStages(editStages.map((s, i) => i === editingIdx ? { ...s, label: editLabel.trim() } : s));
    setEditingIdx(null);
  };

  const updateColor = (idx: number, color: string) => setEditStages(editStages.map((s, i) => i === idx ? { ...s, color } : s));
  const updateIcon = (idx: number, icon: string) => setEditStages(editStages.map((s, i) => i === idx ? { ...s, icon } : s));

  const moveStage = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= editStages.length) return;
    const arr = [...editStages];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setEditStages(arr);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Settings2 className="w-5 h-5 text-primary" />
            Etapas do Funil
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">Máximo 10 etapas. Reordene, renomeie ou altere cores.</p>
        </DialogHeader>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {editStages.map((stage, idx) => {
            const colorStyle = getColorStyle(stage.color);
            return (
              <div key={stage.key} className={`flex items-center gap-2 p-2.5 rounded-lg border ${colorStyle.border} bg-gradient-to-r ${colorStyle.gradient} transition-all`}>
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

                <div className={`w-7 h-7 rounded-lg ${colorStyle.light} flex items-center justify-center ${colorStyle.text} shrink-0`}>
                  {STAGE_ICONS[stage.icon] || <CircleDot className="w-4 h-4" />}
                </div>

                {editingIdx === idx ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-7 text-sm" autoFocus onKeyDown={e => e.key === "Enter" && saveEdit()} />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}><Save className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingIdx(null)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                ) : (
                  <span className="text-sm font-medium flex-1">{stage.label}</span>
                )}

                <div className="flex items-center gap-0.5 shrink-0">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Palette className="w-3.5 h-3.5" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="end">
                      <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Cor</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {STAGE_COLORS.map(c => (
                          <button key={c.name} className={`w-6 h-6 rounded-full ${c.bg} ${stage.color === c.name ? "ring-2 ring-offset-2 ring-foreground" : ""} transition-all hover:scale-110`} onClick={() => updateColor(idx, c.name)} />
                        ))}
                      </div>
                      <Separator className="my-2" />
                      <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Ícone</p>
                      <div className="grid grid-cols-6 gap-1">
                        {STAGE_ICON_OPTIONS.map(iconKey => (
                          <button key={iconKey} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-muted ${stage.icon === iconKey ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "text-muted-foreground"}`} onClick={() => updateIcon(idx, iconKey)}>
                            {STAGE_ICONS[iconKey]}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => moveStage(idx, -1)} disabled={idx === 0}>
                    <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => moveStage(idx, 1)} disabled={idx === editStages.length - 1}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(idx)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => removeStage(idx)} disabled={editStages.length <= 2}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {editStages.length < 10 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nova etapa ({editStages.length}/10)</Label>
              <div className="flex gap-2">
                <Input placeholder="Nome da etapa..." value={newLabel} onChange={e => setNewLabel(e.target.value)} className="h-9 text-sm flex-1" onKeyDown={e => e.key === "Enter" && addStage()} />
                <Select value={newColor} onValueChange={setNewColor}>
                  <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGE_COLORS.map(c => (
                      <SelectItem key={c.name} value={c.name}>
                        <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${c.bg}`} />{c.label}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-9" onClick={addStage} disabled={!newLabel.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => { onSave(editStages); onClose(); }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== New Lead Dialog =====

function NewLeadDialog({ open, onClose, stages, onSave }: {
  open: boolean; onClose: () => void; stages: FunnelStage[]; onSave: (lead: CrmLead) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [value, setValue] = useState("");
  const [temp, setTemp] = useState<"Quente" | "Morno" | "Frio">("Morno");
  const [origin, setOrigin] = useState("WhatsApp");
  const [stage, setStage] = useState(stages[0]?.key || "novo");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    const lead: CrmLead = {
      id: `lead_${Date.now()}`,
      name: name.trim(), phone, email,
      value: Number(value) || 0, temperature: temp, stage,
      responsible: "Você", notes,
      createdAt: new Date().toISOString().split("T")[0],
      origin, tags: [],
      diagnosticoDone: false, propostaEnviada: false, propostaAceita: false,
      lastInteraction: new Date().toLocaleString("pt-BR"),
      linkedConversationId: null,
      timeline: [{ id: `t_${Date.now()}`, type: "stage_change", description: "Lead criado manualmente", date: new Date().toLocaleString("pt-BR"), icon: "arrow-right" }],
      tasks: [], leadNotes: [],
    };
    onSave(lead);
    onClose();
    setName(""); setPhone(""); setEmail(""); setValue(""); setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display"><Plus className="w-5 h-5 text-primary" /> Novo Lead</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do lead" className="h-9 text-sm mt-1" /></div>
            <div><Label className="text-xs">Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="h-9 text-sm mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">E-mail</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@email.com" className="h-9 text-sm mt-1" /></div>
            <div><Label className="text-xs">Valor (R$)</Label><Input value={value} onChange={e => setValue(e.target.value)} placeholder="0" type="number" className="h-9 text-sm mt-1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Temperatura</Label>
              <div className="flex gap-1 mt-1">
                {(["Quente", "Morno", "Frio"] as const).map(t => (
                  <button key={t} className={`flex-1 text-[10px] font-medium py-1.5 rounded-lg border transition-all ${temp === t ? tempColors[t] + " border-current" : "border-border hover:bg-muted/50"}`} onClick={() => setTemp(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Origem</Label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Google Ads", "Instagram", "WhatsApp", "Indicação", "Site"].map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Etapa</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas sobre o lead..." className="text-sm mt-1 min-h-[60px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Criar Lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== Lead Detail Sheet =====

function LeadDetailSheet({ lead, open, onClose, stages, onUpdate }: { lead: CrmLead | null; open: boolean; onClose: () => void; stages: FunnelStage[]; onUpdate: (lead: CrmLead) => void }) {
  const [noteText, setNoteText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<CrmLead>>({});
  const conversations = useMemo(() => getChatConversations(), []);

  if (!lead) return null;

  const linkedConvo = lead.linkedConversationId ? conversations.find(c => c.id === lead.linkedConversationId) : null;
  const stageInfo = stages.find(s => s.key === lead.stage);
  const colorStyle = stageInfo ? getColorStyle(stageInfo.color) : getColorStyle("blue");

  const startEdit = () => {
    setEditMode(true);
    setEditData({ name: lead.name, phone: lead.phone, email: lead.email, value: lead.value, temperature: lead.temperature, stage: lead.stage, notes: lead.notes, responsible: lead.responsible });
  };

  const saveEdit = () => {
    const updated: CrmLead = {
      ...lead,
      ...editData,
      timeline: [
        { id: `t_${Date.now()}`, type: "edit", description: "Lead editado", date: new Date().toLocaleString("pt-BR"), icon: "check-circle" },
        ...lead.timeline,
      ],
    };
    onUpdate(updated);
    setEditMode(false);
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    const updated: CrmLead = {
      ...lead,
      leadNotes: [{ id: `n_${Date.now()}`, text: noteText.trim(), author: "Você", createdAt: new Date().toLocaleString("pt-BR") }, ...lead.leadNotes],
      timeline: [{ id: `t_${Date.now()}`, type: "note", description: `Nota adicionada: "${noteText.trim().slice(0, 40)}..."`, date: new Date().toLocaleString("pt-BR"), icon: "clipboard" }, ...lead.timeline],
    };
    onUpdate(updated);
    setNoteText("");
  };

  const addTask = () => {
    if (!taskTitle.trim()) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const updated: CrmLead = {
      ...lead,
      tasks: [...lead.tasks, { id: `task_${Date.now()}`, title: taskTitle.trim(), status: "pendente", dueDate: dueDate.toISOString().split("T")[0] }],
      timeline: [{ id: `t_${Date.now()}`, type: "task", description: `Tarefa criada: "${taskTitle.trim()}"`, date: new Date().toLocaleString("pt-BR"), icon: "clipboard" }, ...lead.timeline],
    };
    onUpdate(updated);
    setTaskTitle("");
  };

  const toggleTask = (taskId: string) => {
    const updated: CrmLead = {
      ...lead,
      tasks: lead.tasks.map(t => t.id === taskId ? { ...t, status: t.status === "feita" ? "pendente" : "feita" } : t),
    };
    onUpdate(updated);
  };

  const deleteTask = (taskId: string) => {
    const updated: CrmLead = {
      ...lead,
      tasks: lead.tasks.filter(t => t.id !== taskId),
    };
    onUpdate(updated);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { onClose(); setEditMode(false); } }}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl ${colorStyle.bg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {lead.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg font-display truncate">{lead.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {stageInfo && (
                    <Badge className={`${colorStyle.bg} text-white text-[10px]`}>
                      {stageInfo.label}
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-[10px] ${tempColors[lead.temperature]}`}>
                    {lead.temperature}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={editMode ? saveEdit : startEdit} className="shrink-0">
                {editMode ? <><Save className="w-3.5 h-3.5 mr-1" /> Salvar</> : <><Pencil className="w-3.5 h-3.5 mr-1" /> Editar</>}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Valor</p>
                <p className="text-sm font-bold text-primary">R$ {lead.value.toLocaleString()}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Tarefas</p>
                <p className="text-sm font-bold">{lead.tasks.filter(t => t.status !== "feita").length}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Atividades</p>
                <p className="text-sm font-bold">{lead.timeline.length}</p>
              </div>
            </div>
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
                {editMode ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Nome</Label><Input value={editData.name || ""} onChange={e => setEditData({ ...editData, name: e.target.value })} className="h-9 text-sm mt-1" /></div>
                      <div><Label className="text-xs">Telefone</Label><Input value={editData.phone || ""} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="h-9 text-sm mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">E-mail</Label><Input value={editData.email || ""} onChange={e => setEditData({ ...editData, email: e.target.value })} className="h-9 text-sm mt-1" /></div>
                      <div><Label className="text-xs">Valor (R$)</Label><Input type="number" value={editData.value || 0} onChange={e => setEditData({ ...editData, value: Number(e.target.value) })} className="h-9 text-sm mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Etapa</Label>
                        <Select value={editData.stage} onValueChange={v => setEditData({ ...editData, stage: v })}>
                          <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>{stages.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Temperatura</Label>
                        <div className="flex gap-1 mt-1">
                          {(["Quente", "Morno", "Frio"] as const).map(t => (
                            <button key={t} className={`flex-1 text-[10px] font-medium py-1.5 rounded-lg border transition-all ${editData.temperature === t ? tempColors[t] + " border-current" : "border-border hover:bg-muted/50"}`} onClick={() => setEditData({ ...editData, temperature: t })}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Observações</Label>
                      <Textarea value={editData.notes || ""} onChange={e => setEditData({ ...editData, notes: e.target.value })} className="text-sm mt-1 min-h-[60px]" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Telefone", value: lead.phone, icon: <Phone className="w-3 h-3 text-primary" /> },
                        { label: "E-mail", value: lead.email, icon: <Mail className="w-3 h-3 text-primary" /> },
                        { label: "Responsável", value: lead.responsible },
                        { label: "Origem", value: lead.origin, icon: originIcons[lead.origin] },
                        { label: "Última interação", value: lead.lastInteraction },
                        { label: "Criado em", value: lead.createdAt },
                      ].map(item => (
                        <div key={item.label} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{item.label}</p>
                          <p className="text-sm font-medium flex items-center gap-1">{item.icon} {item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Status</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {lead.diagnosticoDone && <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30 bg-emerald-500/5"><CheckCircle className="w-3 h-3 mr-0.5" /> Diagnóstico</Badge>}
                        {lead.propostaEnviada && <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-500/30 bg-blue-500/5"><FileText className="w-3 h-3 mr-0.5" /> Proposta Enviada</Badge>}
                        {lead.propostaAceita && <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30 bg-emerald-500/5"><CheckCircle className="w-3 h-3 mr-0.5" /> Aceita</Badge>}
                        {!lead.diagnosticoDone && !lead.propostaEnviada && <span className="text-xs text-muted-foreground">Nenhum progresso</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Tags</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {lead.tags.map(tag => <Badge key={tag} variant="secondary" className="text-[10px] gap-1"><Tag className="w-2.5 h-2.5" /> {tag}</Badge>)}
                        {lead.tags.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma tag</span>}
                      </div>
                    </div>
                    {lead.notes && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Observações</p>
                        <p className="text-sm bg-muted/30 p-3 rounded-lg border border-border/50">{lead.notes}</p>
                      </div>
                    )}
                  </>
                )}
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
                    <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-emerald-500" /><span className="text-sm font-medium">Conversa vinculada</span></div>
                    <ScrollArea className="h-[300px] border rounded-lg p-3">
                      <div className="space-y-2">
                        {linkedConvo.messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender === "contact" ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.sender === "contact" ? "bg-muted" : msg.sender === "ia" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : msg.sender === "system" ? "bg-muted/50 text-muted-foreground text-center text-[11px] italic max-w-full w-full" : "bg-primary text-primary-foreground"}`}>
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
                  <Button size="sm" className="self-end" disabled={!noteText.trim()} onClick={addNote}>Salvar</Button>
                </div>
                {lead.leadNotes.map(note => (
                  <div key={note.id} className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-sm">{note.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{note.author} · {note.createdAt}</p>
                  </div>
                ))}
                {lead.leadNotes.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma nota</p>}
              </TabsContent>

              <TabsContent value="tarefas" className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Nova tarefa..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="text-sm" onKeyDown={e => e.key === "Enter" && addTask()} />
                  <Button size="sm" disabled={!taskTitle.trim()} onClick={addTask}>Adicionar</Button>
                </div>
                {lead.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-muted/20">
                    <Checkbox checked={task.status === "feita"} onCheckedChange={() => toggleTask(task.id)} />
                    <div className="flex-1">
                      <p className={`text-sm ${task.status === "feita" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">Prazo: {task.dueDate}</p>
                    </div>
                    <Badge variant="outline" className={`text-[9px] ${taskStatusColors[task.status]}`}>{task.status}</Badge>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteTask(task.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
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

// ===== KPI Bar =====

function CrmKpiBar({ leads, stages }: { leads: CrmLead[]; stages: FunnelStage[] }) {
  const totalValue = leads.reduce((s, l) => s + l.value, 0);
  const hotLeads = leads.filter(l => l.temperature === "Quente").length;
  const pendingTasks = leads.flatMap(l => l.tasks).filter(t => t.status === "pendente" || t.status === "atrasada").length;
  const closedStage = stages.find(s => s.label.toLowerCase().includes("fechado") || s.label.toLowerCase().includes("venda"));
  const closedLeads = closedStage ? leads.filter(l => l.stage === closedStage.key).length : 0;
  const conversionRate = leads.length > 0 ? Math.round((closedLeads / leads.length) * 100) : 0;

  const kpis = [
    { label: "Total no Funil", value: leads.length.toString(), icon: Users, color: "text-primary", sub: `${stages.length} etapas` },
    { label: "Valor Total", value: `R$ ${totalValue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", sub: "pipeline" },
    { label: "Leads Quentes", value: hotLeads.toString(), icon: Zap, color: "text-destructive", sub: "prioridade" },
    { label: "Conversão", value: `${conversionRate}%`, icon: Target, color: "text-blue-500", sub: `${closedLeads} fechados` },
    { label: "Tarefas", value: pendingTasks.toString(), icon: AlertTriangle, color: pendingTasks > 3 ? "text-destructive" : "text-amber-500", sub: pendingTasks > 3 ? "ação necessária" : "em dia" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map(kpi => (
        <Card key={kpi.label} className="border-border/50 hover:shadow-sm transition-shadow">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center ${kpi.color}`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none font-display">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ===== Funnel Visualization =====

function FunnelVisualization({ leads, stages }: { leads: CrmLead[]; stages: FunnelStage[] }) {
  const maxLeads = Math.max(...stages.map(s => leads.filter(l => l.stage === s.key).length), 1);
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2 font-display"><BarChart3 className="w-4 h-4 text-primary" /> Visão do Funil</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-1.5">
          {stages.map(stage => {
            const count = leads.filter(l => l.stage === stage.key).length;
            const pct = (count / maxLeads) * 100;
            const colorStyle = getColorStyle(stage.color);
            const value = leads.filter(l => l.stage === stage.key).reduce((s, l) => s + l.value, 0);
            return (
              <div key={stage.key} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 w-28 shrink-0">
                  <div className={`w-5 h-5 rounded ${colorStyle.light} flex items-center justify-center ${colorStyle.text}`}>
                    {STAGE_ICONS[stage.icon] ? <span className="scale-75">{STAGE_ICONS[stage.icon]}</span> : <CircleDot className="w-3 h-3" />}
                  </div>
                  <span className="text-[10px] truncate text-muted-foreground">{stage.label}</span>
                </div>
                <div className="flex-1 h-6 bg-muted/30 rounded-md overflow-hidden relative">
                  <div className={`h-full ${colorStyle.bg} rounded-md transition-all duration-500 opacity-80`} style={{ width: `${Math.max(pct, 4)}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium mix-blend-difference text-white">
                    {count} leads · R$ {value.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Main CRM =====

export default function ClienteCRM() {
  const [leads, setLeads] = useState<CrmLead[]>(() => getCrmLeads());
  const [stages, setStages] = useState<FunnelStage[]>(DEFAULT_STAGES);
  const [selected, setSelected] = useState<CrmLead | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showStageEditor, setShowStageEditor] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showFunnel, setShowFunnel] = useState(false);

  const [filterTemp, setFilterTemp] = useState<string>("all");
  const [filterOrigin, setFilterOrigin] = useState<string>("all");
  const [filterResponsible, setFilterResponsible] = useState<string>("all");

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.email.toLowerCase().includes(q) || l.tags.some(t => t.toLowerCase().includes(q)));
    }
    if (filterTemp !== "all") result = result.filter(l => l.temperature === filterTemp);
    if (filterOrigin !== "all") result = result.filter(l => l.origin === filterOrigin);
    if (filterResponsible !== "all") result = result.filter(l => l.responsible === filterResponsible);
    return result;
  }, [leads, search, filterTemp, filterOrigin, filterResponsible]);

  const responsibles = useMemo(() => [...new Set(leads.map(l => l.responsible))], [leads]);
  const origins = useMemo(() => [...new Set(leads.map(l => l.origin))], [leads]);
  const activeFilters = [filterTemp, filterOrigin, filterResponsible].filter(f => f !== "all").length;

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    // over.id is the droppable column's stage key
    const targetStageKey = String(over.id);
    const targetStage = stages.find(s => s.key === targetStageKey);
    if (targetStage) {
      setLeads(prev => prev.map(l => l.id === active.id ? { ...l, stage: targetStageKey } : l));
    }
  };

  const handleAddLead = (lead: CrmLead) => setLeads(prev => [lead, ...prev]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <PageHeader
        title="CRM de Vendas"
        subtitle="Gerencie leads e funil de vendas"
        icon={<Users className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFunnel(!showFunnel)} className={showFunnel ? "bg-muted" : ""}>
              <BarChart3 className="w-4 h-4 mr-1" /> Funil
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowStageEditor(true)}>
              <Settings2 className="w-4 h-4 mr-1" /> Etapas
            </Button>
            <Button size="sm" onClick={() => setShowNewLead(true)}>
              <Plus className="w-4 h-4 mr-1" /> Novo Lead
            </Button>
          </div>
        }
      />

      <CrmKpiBar leads={filteredLeads} stages={stages} />

      {showFunnel && <FunnelVisualization leads={filteredLeads} stages={stages} />}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Filter className="w-4 h-4" /> Filtros
              {activeFilters > 0 && <Badge className="bg-primary text-primary-foreground text-[9px] h-4 w-4 p-0 flex items-center justify-center rounded-full ml-0.5">{activeFilters}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 space-y-3" align="start">
            <div>
              <Label className="text-xs text-muted-foreground">Temperatura</Label>
              <Select value={filterTemp} onValueChange={setFilterTemp}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Quente">Quente</SelectItem>
                  <SelectItem value="Morno">Morno</SelectItem>
                  <SelectItem value="Frio">Frio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Origem</Label>
              <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {origins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Responsável</Label>
              <Select value={filterResponsible} onValueChange={setFilterResponsible}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {responsibles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setFilterTemp("all"); setFilterOrigin("all"); setFilterResponsible("all"); }}>
                <X className="w-3 h-3 mr-1" /> Limpar filtros
              </Button>
            )}
          </PopoverContent>
        </Popover>

        <div className="flex border rounded-lg overflow-hidden ml-auto">
          <Button variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" className="rounded-none h-9" onClick={() => setViewMode("kanban")}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="rounded-none h-9" onClick={() => setViewMode("list")}>
            <List className="w-4 h-4" />
          </Button>
        </div>

        <span className="text-[11px] text-muted-foreground">{filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Kanban */}
      {viewMode === "kanban" ? (
        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ minHeight: "calc(100vh - 420px)" }}>
            {stages.map(stage => {
              const colorStyle = getColorStyle(stage.color);
              const stageLeads = filteredLeads.filter(l => l.stage === stage.key);
              const total = stageLeads.reduce((s, l) => s + l.value, 0);
              return (
                <div key={stage.key} className={`flex-shrink-0 w-[280px] rounded-xl border ${colorStyle.border} bg-gradient-to-b ${colorStyle.gradient} overflow-hidden flex flex-col`}>
                  <div className="px-3 py-2.5 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg ${colorStyle.light} flex items-center justify-center ${colorStyle.text}`}>
                        {STAGE_ICONS[stage.icon] ? <span className="scale-[0.8]">{STAGE_ICONS[stage.icon]}</span> : <CircleDot className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">{stage.label}</span>
                      <Badge variant="outline" className={`text-[9px] ml-auto ${colorStyle.border} ${colorStyle.text}`}>{stageLeads.length}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5 pl-8">R$ {total.toLocaleString()}</p>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      <DroppableColumn stageKey={stage.key}>
                        {stageLeads.length === 0 ? (
                          <div className={`border border-dashed ${colorStyle.border} rounded-lg p-6 text-center`}>
                            <p className="text-[10px] text-muted-foreground">Arraste leads aqui</p>
                          </div>
                        ) : stageLeads.map(lead => (
                          <DraggableLeadCard key={lead.id} lead={lead} onClick={() => setSelected(lead)} stageColor={stage.color} />
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
              <Card className="rotate-2 scale-105 shadow-2xl w-[270px] border-primary/30">
                <CardContent className="p-3">
                  <p className="text-sm font-semibold">{activeLead.name}</p>
                  <p className="text-xs text-muted-foreground">{activeLead.phone}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-primary">R$ {activeLead.value.toLocaleString()}</span>
                    <Badge variant="outline" className={`text-[9px] ${tempColors[activeLead.temperature]}`}>{activeLead.temperature}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/20">
                    {["Lead", "Contato", "Etapa", "Origem", "Valor", "Temp.", "Responsável"].map(h => (
                      <th key={h} className="text-left text-[11px] font-medium p-3 text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(lead => {
                    const stageInfo = stages.find(s => s.key === lead.stage);
                    const colorStyle = stageInfo ? getColorStyle(stageInfo.color) : getColorStyle("blue");
                    return (
                      <tr key={lead.id} className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setSelected(lead)}>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg ${colorStyle.bg} flex items-center justify-center text-white font-semibold text-xs`}>
                              {lead.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{lead.name}</p>
                              <p className="text-[10px] text-muted-foreground">{lead.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{lead.phone}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${colorStyle.border} ${colorStyle.text}`}>
                            {stageInfo?.label || lead.stage}
                          </Badge>
                        </td>
                        <td className="p-3"><Badge variant="secondary" className="text-[9px] gap-0.5 font-normal">{originIcons[lead.origin]}{lead.origin}</Badge></td>
                        <td className="p-3 text-sm font-bold text-primary">R$ {lead.value.toLocaleString()}</td>
                        <td className="p-3"><Badge variant="outline" className={`text-[9px] ${tempColors[lead.temperature]}`}>{lead.temperature}</Badge></td>
                        <td className="p-3 text-sm text-muted-foreground">{lead.responsible}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <LeadDetailSheet lead={selected} open={!!selected} onClose={() => setSelected(null)} stages={stages} onUpdate={(updated) => { setLeads(prev => prev.map(l => l.id === updated.id ? updated : l)); setSelected(updated); }} />
      <StageEditorDialog open={showStageEditor} onClose={() => setShowStageEditor(false)} stages={stages} onSave={setStages} />
      <NewLeadDialog open={showNewLead} onClose={() => setShowNewLead(false)} stages={stages} onSave={handleAddLead} />
    </div>
  );
}
