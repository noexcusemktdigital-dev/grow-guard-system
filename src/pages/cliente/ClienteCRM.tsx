import { useState, useMemo } from "react";
import {
  Users, Plus, Phone, Mail, Search, LayoutGrid, List,
  MessageCircle, ClipboardList, StickyNote, CheckSquare, Tag, Globe,
  Instagram, Clock, Bot, User, ArrowRight, FileText, CheckCircle,
  XCircle, PhoneCall, Settings2, GripVertical, Pencil, Trash2,
  Filter, DollarSign, Target, AlertTriangle, ChevronDown,
  Zap, BarChart3, X, Save, Palette, CirclePlus, CircleDot,
  Crosshair, Handshake, ShieldCheck, Ban, Sparkles, Star,
  PhoneOutgoing, SearchCheck, Copy, MoreHorizontal
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
import { Skeleton } from "@/components/ui/skeleton";
import { useCrmLeads, useCrmLeadMutations } from "@/hooks/useClienteCrm";
import { useCrmFunnels, useCrmFunnelMutations } from "@/hooks/useClienteCrm";
import { DndContext, DragOverlay, closestCorners, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";

// ===== Stage System =====

interface FunnelStage {
  key: string;
  label: string;
  color: string;
  icon: string;
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

interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  value: number | null;
  stage: string;
  source: string | null;
  tags: string[] | null;
  created_at: string;
}

function DraggableLeadCard({ lead, onClick, stageColor }: { lead: LeadRow; onClick: () => void; stageColor: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  const colorStyle = getColorStyle(stageColor);

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
              {lead.phone && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 shrink-0" /> {lead.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-primary">
              {lead.value ? `R$ ${Number(lead.value).toLocaleString()}` : "—"}
            </span>
            {lead.source && (
              <Badge variant="secondary" className="text-[8px] px-1.5 py-0 font-normal">
                {lead.source}
              </Badge>
            )}
          </div>

          {lead.tags && lead.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {lead.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-[8px] px-1 py-0 font-normal">{tag}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1.5 border-t border-border/40">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(lead.created_at).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Main Component =====

export default function ClienteCRM() {
  const { data: leads, isLoading: leadsLoading } = useCrmLeads();
  const { data: funnelsData, isLoading: funnelsLoading } = useCrmFunnels();
  const { updateLead } = useCrmLeadMutations();

  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const isLoading = leadsLoading || funnelsLoading;

  // Use DB funnels or defaults
  const stages: FunnelStage[] = useMemo(() => {
    if (funnelsData && funnelsData.length > 0) {
      const defaultFunnel = funnelsData.find(f => f.is_default) || funnelsData[0];
      const dbStages = defaultFunnel.stages as any[];
      if (Array.isArray(dbStages) && dbStages.length > 0) {
        return dbStages.map((s: any) => ({
          key: s.key || s.label?.toLowerCase().replace(/\s+/g, "_") || "stage",
          label: s.label || "Etapa",
          color: s.color || "blue",
          icon: s.icon || "circle-dot",
        }));
      }
    }
    return DEFAULT_STAGES;
  }, [funnelsData]);

  const allLeads = leads ?? [];

  const filteredLeads = useMemo(() => {
    if (!search) return allLeads;
    const q = search.toLowerCase();
    return allLeads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.company?.toLowerCase().includes(q)
    );
  }, [allLeads, search]);

  const leadsByStage = useMemo(() => {
    const map: Record<string, LeadRow[]> = {};
    stages.forEach(s => { map[s.key] = []; });
    filteredLeads.forEach(l => {
      if (map[l.stage]) map[l.stage].push(l);
      else if (stages.length > 0) map[stages[0].key]?.push(l);
    });
    return map;
  }, [filteredLeads, stages]);

  const handleDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = e;
    if (!over) return;
    const leadId = String(active.id);
    const newStage = String(over.id);
    const lead = allLeads.find(l => l.id === leadId);
    if (lead && lead.stage !== newStage) {
      updateLead.mutate({ id: leadId, stage: newStage });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="CRM de Vendas" subtitle="Gerencie seus leads e oportunidades" icon={<Users className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const draggingLead = draggingId ? allLeads.find(l => l.id === draggingId) : null;

  return (
    <div className="max-w-full mx-auto space-y-5">
      <PageHeader
        title="CRM de Vendas"
        subtitle={`${allLeads.length} leads · Gerencie seus leads e oportunidades`}
        icon={<Users className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex gap-2">
            <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50 border">
              <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setView("kanban")}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button variant={view === "list" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setView("list")}>
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {allLeads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium">Nenhum lead cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione leads para começar a gerenciar suas vendas.</p>
          </CardContent>
        </Card>
      ) : view === "kanban" ? (
        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {stages.map(stage => {
              const stageLeads = leadsByStage[stage.key] || [];
              const colorStyle = getColorStyle(stage.color);
              return (
                <div key={stage.key} className="min-w-[260px] max-w-[280px] flex-shrink-0">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl border-b-2 ${colorStyle.border} bg-gradient-to-r ${colorStyle.gradient}`}>
                    <div className={`w-6 h-6 rounded-md ${colorStyle.light} flex items-center justify-center ${colorStyle.text}`}>
                      {STAGE_ICONS[stage.icon] || <CircleDot className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-semibold flex-1">{stage.label}</span>
                    <Badge variant="outline" className="text-[9px] h-5">{stageLeads.length}</Badge>
                  </div>
                  <DroppableColumn stageKey={stage.key}>
                    {stageLeads.map(lead => (
                      <DraggableLeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => setSelectedLead(lead)}
                        stageColor={stage.color}
                      />
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="text-center py-8 text-[11px] text-muted-foreground/50">
                        Arraste leads aqui
                      </div>
                    )}
                  </DroppableColumn>
                </div>
              );
            })}
          </div>
          <DragOverlay>
            {draggingLead && (
              <Card className="shadow-xl border-primary/30 w-[260px]">
                <CardContent className="p-3">
                  <p className="text-sm font-semibold">{draggingLead.name}</p>
                  <p className="text-xs text-muted-foreground">{draggingLead.phone}</p>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List view */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredLeads.map(lead => {
                const stage = stages.find(s => s.key === lead.stage);
                const colorStyle = stage ? getColorStyle(stage.color) : getColorStyle("blue");
                return (
                  <div
                    key={lead.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${colorStyle.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <p className="text-[11px] text-muted-foreground">{lead.email || lead.phone || "—"}</p>
                    </div>
                    <Badge variant="outline" className={`text-[9px] ${colorStyle.text} ${colorStyle.border}`}>
                      {stage?.label || lead.stage}
                    </Badge>
                    <span className="text-sm font-semibold text-primary whitespace-nowrap">
                      {lead.value ? `R$ ${Number(lead.value).toLocaleString()}` : "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={open => !open && setSelectedLead(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedLead?.name}</SheetTitle>
          </SheetHeader>
          {selectedLead && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                {selectedLead.phone && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-[10px] text-muted-foreground uppercase">Telefone</p>
                    <p className="text-sm font-medium">{selectedLead.phone}</p>
                  </div>
                )}
                {selectedLead.email && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-[10px] text-muted-foreground uppercase">E-mail</p>
                    <p className="text-sm font-medium truncate">{selectedLead.email}</p>
                  </div>
                )}
                {selectedLead.company && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-[10px] text-muted-foreground uppercase">Empresa</p>
                    <p className="text-sm font-medium">{selectedLead.company}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg border">
                  <p className="text-[10px] text-muted-foreground uppercase">Valor</p>
                  <p className="text-sm font-bold text-primary">
                    {selectedLead.value ? `R$ ${Number(selectedLead.value).toLocaleString()}` : "—"}
                  </p>
                </div>
              </div>
              {selectedLead.tags && selectedLead.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedLead.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
              <div className="p-3 rounded-lg border">
                <p className="text-[10px] text-muted-foreground uppercase">Criado em</p>
                <p className="text-sm">{new Date(selectedLead.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
