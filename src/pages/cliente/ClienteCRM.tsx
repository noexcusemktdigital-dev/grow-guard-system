import { useState, useMemo } from "react";
import {
  Users, Plus, Phone, Search, LayoutGrid, List, Clock,
  GripVertical, Settings2, Filter, X, Copy, MoreHorizontal,
  MessageCircle, CircleDot, XCircle, Tag
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCrmLeads, useCrmLeadMutations } from "@/hooks/useClienteCrm";
import { useCrmFunnels } from "@/hooks/useClienteCrm";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragOverlay, closestCorners, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CrmLeadDetailSheet } from "@/components/crm/CrmLeadDetailSheet";
import { CrmNewLeadDialog } from "@/components/crm/CrmNewLeadDialog";
import { CrmFunnelManager } from "@/components/crm/CrmFunnelManager";
import { DEFAULT_STAGES, STAGE_ICONS, getColorStyle, type FunnelStage } from "@/components/crm/CrmStageSystem";

const SOURCES = ["WhatsApp", "Formulário", "Indicação", "Ads", "LinkedIn", "Evento", "Orgânico"];

// ===== Droppable Column =====
function DroppableColumn({ stageKey, children }: { stageKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return (
    <div ref={setNodeRef} className={`min-h-[80px] space-y-2 transition-all duration-200 rounded-lg p-1.5 ${isOver ? "bg-primary/5 ring-2 ring-primary/20 ring-dashed" : ""}`}>
      {children}
    </div>
  );
}

// ===== Lead Card Row Type =====
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
  won_at?: string | null;
  lost_at?: string | null;
  lost_reason?: string | null;
  whatsapp_contact_id?: string | null;
}

// ===== Draggable Lead Card with Quick Actions =====
function DraggableLeadCard({ lead, onClick, stageColor, onCopyPhone, onMarkLost, onDelete }: {
  lead: LeadRow;
  onClick: () => void;
  stageColor: string;
  onCopyPhone: () => void;
  onMarkLost: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  const colorStyle = getColorStyle(stageColor);

  return (
    <div ref={setNodeRef} style={style} className="group">
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
            {/* Quick actions on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-36 p-1" align="end">
                  <button className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2" onClick={onCopyPhone}>
                    <Copy className="w-3 h-3" /> Copiar telefone
                  </button>
                  {lead.phone && (
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                  )}
                  <button className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 text-red-600" onClick={onMarkLost}>
                    <XCircle className="w-3 h-3" /> Marcar perdido
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-primary">
              {lead.value ? `R$ ${Number(lead.value).toLocaleString()}` : "—"}
            </span>
            {lead.source && (
              <Badge variant="secondary" className="text-[8px] px-1.5 py-0 font-normal">{lead.source}</Badge>
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
  const { toast } = useToast();
  const { data: leads, isLoading: leadsLoading } = useCrmLeads();
  const { data: funnelsData, isLoading: funnelsLoading } = useCrmFunnels();
  const { updateLead, deleteLead, markAsLost } = useCrmLeadMutations();

  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [funnelManagerOpen, setFunnelManagerOpen] = useState(false);

  // Filters
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterTag, setFilterTag] = useState("");

  const isLoading = leadsLoading || funnelsLoading;

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

  // Collect unique tags for filter
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allLeads.forEach(l => l.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [allLeads]);

  const filteredLeads = useMemo(() => {
    let result = allLeads;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.company?.toLowerCase().includes(q)
      );
    }
    if (filterSource) {
      result = result.filter(l => l.source === filterSource);
    }
    if (filterTag) {
      result = result.filter(l => l.tags?.includes(filterTag));
    }
    return result;
  }, [allLeads, search, filterSource, filterTag]);

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

  const hasFilters = !!filterSource || !!filterTag;

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
            <Button size="sm" onClick={() => setNewLeadOpen(true)} className="gap-1">
              <Plus className="w-3.5 h-3.5" /> Novo Lead
            </Button>
            <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50 border">
              <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setView("kanban")}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button variant={view === "list" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setView("list")}>
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setFunnelManagerOpen(true)}>
                    <Settings2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Configurar funil</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        }
      />

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-8" />
        </div>
        <Select value={filterSource} onValueChange={v => setFilterSource(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todas origens</SelectItem>
            {SOURCES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {allTags.length > 0 && (
          <Select value={filterTag} onValueChange={v => setFilterTag(v === "all" ? "" : v)}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <Tag className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas tags</SelectItem>
              {allTags.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => { setFilterSource(""); setFilterTag(""); }}>
            <X className="w-3 h-3" /> Limpar filtros
          </Button>
        )}
      </div>

      {allLeads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium">Nenhum lead cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione leads para começar a gerenciar suas vendas.</p>
            <Button size="sm" className="mt-4 gap-1" onClick={() => setNewLeadOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Novo Lead
            </Button>
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
                        onCopyPhone={() => {
                          if (lead.phone) {
                            navigator.clipboard.writeText(lead.phone);
                            toast({ title: "Telefone copiado" });
                          } else {
                            toast({ title: "Lead sem telefone", variant: "destructive" });
                          }
                        }}
                        onMarkLost={() => {
                          markAsLost.mutate({ id: lead.id });
                          toast({ title: "Lead marcado como perdido" });
                        }}
                        onDelete={() => {
                          deleteLead.mutate(lead.id);
                          toast({ title: "Lead excluído" });
                        }}
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
      <CrmLeadDetailSheet lead={selectedLead} onClose={() => setSelectedLead(null)} stages={stages} />

      {/* New Lead Dialog */}
      <CrmNewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} defaultStage={stages[0]?.key || "novo"} />

      {/* Funnel Manager */}
      <CrmFunnelManager open={funnelManagerOpen} onOpenChange={setFunnelManagerOpen} />
    </div>
  );
}
