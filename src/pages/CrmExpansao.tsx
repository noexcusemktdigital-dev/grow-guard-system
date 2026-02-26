import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Inbox, Plus, TrendingUp, LayoutGrid, List, Search, X,
  Filter, ChevronDown, GripVertical, DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCrmLeads, useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { CrmLeadDetailSheet } from "@/components/crm/CrmLeadDetailSheet";
import { CrmNewLeadDialog } from "@/components/crm/CrmNewLeadDialog";
import { DEFAULT_STAGES, type FunnelStage } from "@/components/crm/CrmStageSystem";
import { STAGE_ICONS, getColorStyle } from "@/components/crm/CrmStageSystem";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";

type ViewType = "kanban" | "list";

// Default expansion stages if no funnels exist
const EXPANSION_STAGES: FunnelStage[] = [
  { key: "Novo Lead", label: "Novo Lead", color: "blue", icon: "circle-plus" },
  { key: "Contato Feito", label: "Contato Feito", color: "amber", icon: "phone-outgoing" },
  { key: "Reunião Agendada", label: "Reunião Agendada", color: "cyan", icon: "search-check" },
  { key: "Diagnóstico", label: "Diagnóstico", color: "purple", icon: "clipboard" },
  { key: "Proposta Enviada", label: "Proposta Enviada", color: "orange", icon: "handshake" },
  { key: "Negociação", label: "Negociação", color: "indigo", icon: "target" },
  { key: "Venda", label: "Venda", color: "emerald", icon: "star" },
  { key: "Oportunidade Perdida", label: "Oportunidade Perdida", color: "red", icon: "ban" },
];

interface Filters {
  source: string;
  dateFrom: string;
  dateTo: string;
  temperature: string;
  hasValue: string;
}

const emptyFilters: Filters = { source: "", dateFrom: "", dateTo: "", temperature: "", hasValue: "" };

export default function CrmExpansao() {
  const [view, setView] = useState<ViewType>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const { data: leads, isLoading } = useCrmLeads(activeFunnelId || undefined);
  const { data: funnels } = useCrmFunnels();
  const { updateLead } = useCrmLeadMutations();

  // Resolve stages from funnel or use defaults
  const stages: FunnelStage[] = useMemo(() => {
    if (activeFunnelId && funnels) {
      const funnel = funnels.find((f: any) => f.id === activeFunnelId);
      if (funnel?.stages && Array.isArray(funnel.stages) && funnel.stages.length > 0) {
        return funnel.stages as unknown as FunnelStage[];
      }
    }
    return EXPANSION_STAGES;
  }, [activeFunnelId, funnels]);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const filteredLeads = useMemo(() => {
    return (leads ?? []).filter((l: any) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!l.name?.toLowerCase().includes(q) && !(l.email || "").toLowerCase().includes(q) && !(l.phone || "").includes(q) && !(l.company || "").toLowerCase().includes(q)) return false;
      }
      if (filters.source && l.source !== filters.source) return false;
      if (filters.temperature && l.temperature !== filters.temperature) return false;
      if (filters.dateFrom && l.created_at < filters.dateFrom) return false;
      if (filters.dateTo && l.created_at > filters.dateTo + "T23:59:59") return false;
      if (filters.hasValue === "yes" && (!l.value || l.value <= 0)) return false;
      if (filters.hasValue === "no" && l.value && l.value > 0) return false;
      return true;
    });
  }, [leads, searchQuery, filters]);

  const selectedLead = useMemo(() => {
    if (!selectedLeadId) return null;
    return (leads ?? []).find((l: any) => l.id === selectedLeadId) || null;
  }, [selectedLeadId, leads]);

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedLeadId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedLeadId(null);
    const { active, over } = event;
    if (!over) return;
    const leadId = active.id as string;
    const newStage = over.id as string;
    const lead = (leads ?? []).find((l: any) => l.id === leadId);
    if (lead && lead.stage !== newStage) {
      const extra: any = { id: leadId, stage: newStage };
      if (newStage === "Venda") extra.won_at = new Date().toISOString();
      if (newStage === "Oportunidade Perdida") extra.lost_at = new Date().toISOString();
      updateLead.mutate(extra);
      toast.success(`Lead movido para "${newStage}"`);
    }
  };

  const draggedLead = draggedLeadId ? (leads ?? []).find((l: any) => l.id === draggedLeadId) : null;

  // Stats
  const totalValue = filteredLeads.reduce((sum: number, l: any) => sum + (l.value || 0), 0);
  const wonCount = filteredLeads.filter((l: any) => l.won_at).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-64 flex-shrink-0" />)}</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h1 className="page-header-title">CRM Expansão</h1>
            <Badge variant="outline">Franqueadora</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Gestão de leads e oportunidades da rede</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="gap-1"><DollarSign className="w-3 h-3" /> R$ {totalValue.toLocaleString("pt-BR")}</Badge>
          <Badge variant="secondary">{filteredLeads.length} leads</Badge>
          <Badge variant="default" className="bg-emerald-600">{wonCount} vendas</Badge>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Funnel selector */}
        {funnels && funnels.length > 0 && (
          <Select value={activeFunnelId || "all"} onValueChange={v => setActiveFunnelId(v === "all" ? null : v)}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue placeholder="Todos os funis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os funis</SelectItem>
              {funnels.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {/* View toggle */}
        <div className="flex bg-muted rounded-lg p-0.5">
          <button className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${view === "kanban" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setView("kanban")}><LayoutGrid className="w-4 h-4" /> Kanban</button>
          <button className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${view === "list" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setView("list")}><List className="w-4 h-4" /> Lista</button>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar lead..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-8 w-48 text-sm" />
        </div>

        {/* Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5" />
              Filtros
              {activeFiltersCount > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1">{activeFiltersCount}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3" align="end">
            <p className="text-xs font-semibold">Filtros avançados</p>
            <div className="space-y-2">
              <div>
                <Label className="text-[10px]">Origem</Label>
                <Select value={filters.source} onValueChange={v => setFilters(f => ({ ...f, source: v }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_sources">Todas</SelectItem>
                    {["Orgânico", "Indicação", "Ads", "Evento", "LinkedIn", "WhatsApp", "Formulário"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Temperatura</Label>
                <Select value={filters.temperature} onValueChange={v => setFilters(f => ({ ...f, temperature: v }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_temp">Todas</SelectItem>
                    <SelectItem value="hot">Quente</SelectItem>
                    <SelectItem value="warm">Morno</SelectItem>
                    <SelectItem value="cold">Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">De</Label>
                  <Input type="date" className="h-7 text-xs" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-[10px]">Até</Label>
                  <Input type="date" className="h-7 text-xs" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-[10px]">Com valor</Label>
                <Select value={filters.hasValue} onValueChange={v => setFilters(f => ({ ...f, hasValue: v }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_values">Todos</SelectItem>
                    <SelectItem value="yes">Com valor</SelectItem>
                    <SelectItem value="no">Sem valor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setFilters(emptyFilters)}>
                <X className="w-3 h-3 mr-1" /> Limpar filtros
              </Button>
            )}
          </PopoverContent>
        </Popover>

        <Button size="sm" onClick={() => setNewLeadOpen(true)} className="h-8"><Plus className="w-4 h-4 mr-1" /> Novo Lead</Button>
      </div>

      {/* Content */}
      {filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum lead encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro lead para começar a prospectar.</p>
          <Button onClick={() => setNewLeadOpen(true)}><Plus className="w-4 h-4 mr-1" /> Novo Lead</Button>
        </div>
      ) : view === "kanban" ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-4 min-w-max">
              {stages.map(stage => {
                const stageLeads = filteredLeads.filter((l: any) => l.stage === stage.key);
                const stageValue = stageLeads.reduce((sum: number, l: any) => sum + (l.value || 0), 0);
                const colorStyle = getColorStyle(stage.color);
                return (
                  <DroppableColumn key={stage.key} stageKey={stage.key}>
                    <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg text-sm font-medium ${colorStyle.light} ${colorStyle.text} border ${colorStyle.border} border-b-0`}>
                      <div className="flex items-center gap-1.5">
                        {STAGE_ICONS[stage.icon]}
                        <span className="truncate">{stage.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] h-5">{stageLeads.length}</Badge>
                        {stageValue > 0 && <span className="text-[10px] font-medium">R$ {(stageValue / 1000).toFixed(0)}k</span>}
                      </div>
                    </div>
                    <div className="bg-muted/20 rounded-b-lg p-2 min-h-[200px] space-y-2 border border-t-0 border-border/50">
                      {stageLeads.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum lead</p>}
                      {stageLeads.map((l: any) => (
                        <DraggableCard key={l.id} lead={l} onClick={() => setSelectedLeadId(l.id)} />
                      ))}
                    </div>
                  </DroppableColumn>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <DragOverlay>
            {draggedLead && <LeadCardContent lead={draggedLead} />}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((l: any) => (
                <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLeadId(l.id)}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-muted-foreground">{l.company || "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{l.stage}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{l.source || "—"}</TableCell>
                  <TableCell className="text-xs">{l.phone || "—"}</TableCell>
                  <TableCell className="text-right font-medium">{l.value && l.value > 0 ? `R$ ${Number(l.value).toLocaleString("pt-BR")}` : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail Sheet */}
      <CrmLeadDetailSheet
        lead={selectedLead}
        onClose={() => setSelectedLeadId(null)}
        stages={stages}
      />

      {/* New Lead Dialog */}
      <CrmNewLeadDialog
        open={newLeadOpen}
        onOpenChange={setNewLeadOpen}
        defaultStage={stages[0]?.key || "Novo Lead"}
      />
    </div>
  );
}

/* ========== Droppable Column ========== */
function DroppableColumn({ stageKey, children }: { stageKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return (
    <div ref={setNodeRef} className={`w-[260px] flex-shrink-0 transition-all ${isOver ? "ring-2 ring-primary/30 rounded-lg" : ""}`}>
      {children}
    </div>
  );
}

/* ========== Draggable Card ========== */
function DraggableCard({ lead, onClick }: { lead: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}>
      <LeadCardContent lead={lead} />
    </div>
  );
}

/* ========== Card Content ========== */
function LeadCardContent({ lead }: { lead: any }) {
  return (
    <Card className="p-3 space-y-1.5 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium leading-tight">{lead.name}</p>
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
      </div>
      {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
      {lead.value && lead.value > 0 && (
        <p className="text-xs text-primary font-medium">R$ {Number(lead.value).toLocaleString("pt-BR")}</p>
      )}
      <div className="flex items-center gap-1 flex-wrap">
        {lead.source && <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>}
        {lead.tags?.slice(0, 2).map((t: string) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
      </div>
      {lead.won_at && <Badge className="text-[10px] bg-emerald-600">Vendido</Badge>}
      {lead.lost_at && !lead.won_at && <Badge variant="destructive" className="text-[10px]">Perdido</Badge>}
    </Card>
  );
}
