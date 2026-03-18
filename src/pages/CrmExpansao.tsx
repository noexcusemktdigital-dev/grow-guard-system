import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Plus, Phone, Search, LayoutGrid, List, Clock,
  GripVertical, Settings2, Filter, X, Copy, MoreHorizontal,
  MessageCircle, CircleDot, XCircle, ChevronDown,
  Calendar, DollarSign, UserCircle, FileSpreadsheet, BookUser,
  Tag, Trash2, ArrowRightLeft, Thermometer, Snowflake, Sun, Flame,
  TrendingUp, HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useCrmLeads, useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useCrmSettings } from "@/hooks/useCrmSettings";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragOverlay, pointerWithin, PointerSensor, useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { CrmLeadDetailSheet } from "@/components/crm/CrmLeadDetailSheet";
import { CrmNewLeadDialog } from "@/components/crm/CrmNewLeadDialog";
import { CrmContactsView } from "@/components/crm/CrmContactsView";
import { CrmCsvImportDialog } from "@/components/crm/CrmCsvImportDialog";
import { CrmTutorial } from "@/components/crm/CrmTutorial";
import { DEFAULT_STAGES, STAGE_ICONS, getColorStyle, type FunnelStage } from "@/components/crm/CrmStageSystem";
import { Shuffle } from "lucide-react";

const SOURCES = ["WhatsApp", "Formulário", "Indicação", "Ads", "LinkedIn", "Evento", "Orgânico"];

function DroppableColumn({ stageKey, children }: { stageKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return (
    <div ref={setNodeRef} className={`min-h-[80px] space-y-2 transition-all duration-200 rounded-lg p-1.5 ${isOver ? "bg-primary/5 ring-2 ring-primary/20 ring-dashed" : ""}`}>
      {children}
    </div>
  );
}

interface LeadRow {
  id: string; name: string; phone: string | null; email: string | null;
  company: string | null; value: number | null; stage: string;
  source: string | null; tags: string[] | null; created_at: string;
  won_at?: string | null; lost_at?: string | null; lost_reason?: string | null;
  whatsapp_contact_id?: string | null; assigned_to?: string | null;
  temperature?: string | null;
}

function DraggableLeadCard({ lead, onClick, stageColor, onCopyPhone, onMarkLost, onDelete, onUpdateTemperature }: {
  lead: LeadRow; onClick: () => void; stageColor: string;
  onCopyPhone: () => void; onMarkLost: () => void; onDelete: () => void;
  onUpdateTemperature: (temp: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : 1, zIndex: isDragging ? 50 : undefined,
  };
  const colorStyle = getColorStyle(stageColor);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`group touch-none ${isDragging ? "pointer-events-none" : ""}`}>
      <Card className={`cursor-pointer hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 border-l-[3px] ${colorStyle.border}`} onClick={() => { if (!isDragging) onClick(); }}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="cursor-grab active:cursor-grabbing pt-0.5 -ml-1 px-1">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold truncate leading-tight">{lead.name}</p>
              {lead.phone && <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 shrink-0" /> {lead.phone}</p>}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); e.preventDefault(); }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreHorizontal className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent className="w-36" align="end">
                  <DropdownMenuItem className="text-xs gap-2" onClick={onCopyPhone}><Copy className="w-3 h-3" /> Copiar telefone</DropdownMenuItem>
                  {lead.phone && <DropdownMenuItem className="text-xs gap-2" asChild><a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-3 h-3" /> WhatsApp</a></DropdownMenuItem>}
                  <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={onMarkLost}><XCircle className="w-3 h-3" /> Marcar perdido</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-primary">{lead.value ? `R$ ${Number(lead.value).toLocaleString()}` : "—"}</span>
            <div className="flex items-center gap-1">
              <div onClick={e => e.stopPropagation()}>
                {(() => {
                  const temps = ["Frio", "Morno", "Quente"] as const;
                  const current = lead.temperature || "Morno";
                  const idx = temps.indexOf(current as any);
                  const next = temps[(idx + 1) % temps.length];
                  const cfg: Record<string, { bg: string; icon: React.ReactNode }> = {
                    Frio: { bg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400", icon: <Snowflake className="w-3 h-3" /> },
                    Morno: { bg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400", icon: <Sun className="w-3 h-3" /> },
                    Quente: { bg: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400", icon: <Flame className="w-3 h-3" /> },
                  };
                  const c = cfg[current] || cfg.Morno;
                  return <button title={`${current} → ${next}`} onClick={() => onUpdateTemperature(next)} className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-150 ${c.bg} hover:brightness-90`}>{c.icon}</button>;
                })()}
              </div>
              {lead.source && <Badge variant="secondary" className="text-[8px] px-1.5 py-0 font-normal">{lead.source}</Badge>}
            </div>
          </div>
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {lead.tags.slice(0, 2).map(tag => <Badge key={tag} variant="outline" className="text-[8px] px-1 py-0 font-normal">{tag}</Badge>)}
            </div>
          )}
          <div className="flex items-center gap-2 pt-1.5 border-t border-border/40">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(lead.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CrmExpansao() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: funnelsData, isLoading: funnelsLoading } = useCrmFunnels();
  const { data: crmSettings } = useCrmSettings();
  const { data: team } = useCrmTeam();

  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
  const accessibleFunnels = useMemo(() => funnelsData ?? [], [funnelsData]);

  useEffect(() => {
    if (!selectedFunnelId && accessibleFunnels.length > 0) {
      const def = accessibleFunnels.find(f => f.is_default) || accessibleFunnels[0];
      setSelectedFunnelId(def.id);
    }
  }, [accessibleFunnels, selectedFunnelId]);

  const { data: leads, isLoading: leadsLoading } = useCrmLeads(selectedFunnelId || undefined);
  const { updateLead, deleteLead, markAsLost, bulkUpdateLeads, bulkDeleteLeads } = useCrmLeadMutations();

  const [activeTab, setActiveTab] = useState<"pipeline" | "contatos">("pipeline");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkDeleteLeadsOpen, setBulkDeleteLeadsOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [tutorialOpen, setTutorialOpen] = useState(() => !localStorage.getItem("crm_tutorial_seen"));

  const [filterSource, setFilterSource] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterAssigned, setFilterAssigned] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterValueMin, setFilterValueMin] = useState("");
  const [filterValueMax, setFilterValueMax] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const selectedFunnel = useMemo(() => funnelsData?.find(f => f.id === selectedFunnelId) || null, [funnelsData, selectedFunnelId]);

  const stages: FunnelStage[] = useMemo(() => {
    if (selectedFunnel) {
      const dbStages = selectedFunnel.stages as any[];
      if (Array.isArray(dbStages) && dbStages.length > 0) {
        return dbStages.map((s: any) => ({ key: s.key || s.label?.toLowerCase().replace(/\s+/g, "_"), label: s.label || "Etapa", color: s.color || "blue", icon: s.icon || "circle-dot" }));
      }
    }
    return DEFAULT_STAGES;
  }, [selectedFunnel]);

  const allLeads = (leads ?? []) as LeadRow[];
  const allTags = useMemo(() => { const t = new Set<string>(); allLeads.forEach(l => l.tags?.forEach(tag => t.add(tag))); return Array.from(t).sort(); }, [allLeads]);
  const isLoading = leadsLoading || funnelsLoading;
  const activeFilterCount = [filterSource, filterTag, filterAssigned, filterStatus, filterValueMin, filterValueMax, filterDateFrom, filterDateTo].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0;
  const clearAllFilters = () => { setFilterSource(""); setFilterTag(""); setFilterAssigned(""); setFilterStatus(""); setFilterValueMin(""); setFilterValueMax(""); setFilterDateFrom(""); setFilterDateTo(""); };

  const filteredLeads = useMemo(() => {
    let result = allLeads;
    if (search) { const q = search.toLowerCase(); result = result.filter(l => l.name.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.phone?.includes(q) || l.company?.toLowerCase().includes(q)); }
    if (filterSource) result = result.filter(l => l.source === filterSource);
    if (filterTag) result = result.filter(l => l.tags?.includes(filterTag));
    if (filterAssigned) result = result.filter(l => l.assigned_to === filterAssigned);
    if (filterStatus === "won") result = result.filter(l => l.won_at);
    else if (filterStatus === "lost") result = result.filter(l => l.lost_at);
    else if (filterStatus === "active") result = result.filter(l => !l.won_at && !l.lost_at);
    if (filterValueMin) result = result.filter(l => (l.value || 0) >= parseFloat(filterValueMin));
    if (filterValueMax) result = result.filter(l => (l.value || 0) <= parseFloat(filterValueMax));
    if (filterDateFrom) result = result.filter(l => new Date(l.created_at) >= new Date(filterDateFrom));
    if (filterDateTo) { const to = new Date(filterDateTo); to.setHours(23, 59, 59, 999); result = result.filter(l => new Date(l.created_at) <= to); }
    return result;
  }, [allLeads, search, filterSource, filterTag, filterAssigned, filterStatus, filterValueMin, filterValueMax, filterDateFrom, filterDateTo]);

  const leadsByStage = useMemo(() => {
    const map: Record<string, LeadRow[]> = {};
    stages.forEach(s => { map[s.key] = []; });
    filteredLeads.forEach(l => { if (map[l.stage]) map[l.stage].push(l); else if (stages.length > 0) map[stages[0].key]?.push(l); });
    return map;
  }, [filteredLeads, stages]);

  const handleDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = e;
    if (!over) return;
    const leadId = String(active.id);
    const overId = String(over.id);
    const validStageKeys = stages.map(s => s.key);
    let newStage: string | null = null;
    if (validStageKeys.includes(overId)) newStage = overId;
    else {
      const targetLead = allLeads.find(l => l.id === overId);
      if (targetLead && validStageKeys.includes(targetLead.stage)) newStage = targetLead.stage;
    }
    if (!newStage) return;
    const lead = allLeads.find(l => l.id === leadId);
    if (lead && lead.stage !== newStage) updateLead.mutate({ id: leadId, stage: newStage });
  };

  const someLeadsSelected = selectedLeadIds.size > 0;
  const toggleLeadSelection = (id: string) => { const next = new Set(selectedLeadIds); if (next.has(id)) next.delete(id); else next.add(id); setSelectedLeadIds(next); };
  const toggleAllLeads = () => { if (filteredLeads.every(l => selectedLeadIds.has(l.id))) setSelectedLeadIds(new Set()); else setSelectedLeadIds(new Set(filteredLeads.map(l => l.id))); };

  const handleBulkMoveStage = (stage: string) => { bulkUpdateLeads.mutate({ ids: Array.from(selectedLeadIds), fields: { stage } }); setSelectedLeadIds(new Set()); toast({ title: `Leads movidos para "${stages.find(s => s.key === stage)?.label || stage}"` }); };
  const handleBulkAssign = (userId: string) => { bulkUpdateLeads.mutate({ ids: Array.from(selectedLeadIds), fields: { assigned_to: userId } }); setSelectedLeadIds(new Set()); toast({ title: "Responsável atribuído em massa" }); };
  const handleBulkAddTag = () => { if (!bulkTagInput.trim()) return; const tag = bulkTagInput.trim(); allLeads.filter(l => selectedLeadIds.has(l.id) && !(l.tags || []).includes(tag)).forEach(l => updateLead.mutate({ id: l.id, tags: [...(l.tags || []), tag] })); setBulkTagInput(""); setSelectedLeadIds(new Set()); toast({ title: "Tag adicionada em massa" }); };
  const handleBulkMarkLost = () => { bulkUpdateLeads.mutate({ ids: Array.from(selectedLeadIds), fields: { lost_at: new Date().toISOString(), stage: "perdido" } }); setSelectedLeadIds(new Set()); toast({ title: "Leads marcados como perdidos" }); };
  const handleBulkDeleteLeads = () => { bulkDeleteLeads.mutate(Array.from(selectedLeadIds)); setSelectedLeadIds(new Set()); setBulkDeleteLeadsOpen(false); toast({ title: "Leads excluídos" }); };

  const pipelineSummary = useMemo(() => {
    const activeLeads = filteredLeads.filter(l => !l.won_at && !l.lost_at);
    const totalValue = activeLeads.reduce((s, l) => s + (l.value || 0), 0);
    const wonLeads = filteredLeads.filter(l => l.won_at);
    const convRate = filteredLeads.length > 0 ? Math.round((wonLeads.length / filteredLeads.length) * 100) : 0;
    const avgValue = activeLeads.length > 0 ? Math.round(totalValue / activeLeads.length) : 0;
    return { totalLeads: activeLeads.length, totalValue, wonLeads: wonLeads.length, convRate, avgValue };
  }, [filteredLeads]);

  const stageValues = useMemo(() => {
    const map: Record<string, number> = {};
    stages.forEach(s => { map[s.key] = (leadsByStage[s.key] || []).reduce((sum, l) => sum + (l.value || 0), 0); });
    return map;
  }, [leadsByStage, stages]);
  const totalPipelineValue = useMemo(() => Object.values(stageValues).reduce((a, b) => a + b, 0), [stageValues]);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="CRM" subtitle="Gerencie leads e oportunidades" icon={<Users className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      </div>
    );
  }

  const draggingLead = draggingId ? allLeads.find(l => l.id === draggingId) : null;

  return (
    <div className="w-full space-y-5">
      <CrmTutorial open={tutorialOpen} onOpenChange={setTutorialOpen} />
      <PageHeader
        title="CRM"
        subtitle={activeTab === "pipeline" ? `${allLeads.length} leads · Gerencie leads e oportunidades` : "Base de dados de contatos"}
        icon={<Users className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            {crmSettings?.lead_roulette_enabled && activeTab === "pipeline" && <Badge variant="outline" className="text-[10px] gap-1"><Shuffle className="w-3 h-3" /> Roleta ativa</Badge>}
            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setTutorialOpen(true)}><HelpCircle className="w-4 h-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent>Tutorial do CRM</TooltipContent></Tooltip></TooltipProvider>
            <Button variant={activeTab === "contatos" ? "default" : "outline"} size="sm" className="gap-1.5 h-8" onClick={() => setActiveTab(activeTab === "contatos" ? "pipeline" : "contatos")}><BookUser className="w-3.5 h-3.5" />Contatos</Button>
            {activeTab === "pipeline" && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button size="sm" className="gap-1"><Plus className="w-3.5 h-3.5" /> Novo Lead<ChevronDown className="w-3 h-3 ml-0.5" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setNewLeadOpen(true)} className="gap-2 text-xs"><Plus className="w-3.5 h-3.5" /> Criar Lead</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCsvImportOpen(true)} className="gap-2 text-xs"><FileSpreadsheet className="w-3.5 h-3.5" /> Importar Planilha</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50 border">
                  <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setView("kanban")}><LayoutGrid className="w-3.5 h-3.5" /></Button>
                  <Button variant={view === "list" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setView("list")}><List className="w-3.5 h-3.5" /></Button>
                </div>
              </>
            )}
            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => navigate("/franqueadora/crm/config")}><Settings2 className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent>Configurações do CRM</TooltipContent></Tooltip></TooltipProvider>
          </div>
        }
      />

      {activeTab === "contatos" && <CrmContactsView onCreateLeadFromContact={() => { setActiveTab("pipeline"); setNewLeadOpen(true); }} />}

      {activeTab === "pipeline" && (
        <>
          {/* Empty State: No funnels */}
          {!funnelsLoading && accessibleFunnels.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Settings2 className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Configure seu primeiro funil</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  Antes de adicionar leads, crie pelo menos um funil com as etapas do seu processo comercial.
                </p>
                <Button onClick={() => navigate("/franqueadora/crm/config")} className="gap-2">
                  <Settings2 className="w-4 h-4" /> Criar Funil
                </Button>
              </CardContent>
            </Card>
          ) : (
          <>
          {/* Pipeline Summary */}
          {allLeads.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Leads ativos</p>
                <p className="text-xl font-bold mt-1">{pipelineSummary.totalLeads}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Valor no pipeline</p>
                <p className="text-xl font-bold text-primary mt-1">R$ {pipelineSummary.totalValue.toLocaleString()}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Ticket médio</p>
                <p className="text-xl font-bold mt-1">R$ {pipelineSummary.avgValue.toLocaleString()}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Conversão</p>
                <p className="text-xl font-bold mt-1">{pipelineSummary.convRate}%</p>
                <p className="text-[10px] text-muted-foreground">{pipelineSummary.wonLeads} vendidos</p>
              </CardContent></Card>
            </div>
          )}

          {/* Funnel selector + Search + Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {accessibleFunnels.length > 1 && (
              <Select value={selectedFunnelId || ""} onValueChange={setSelectedFunnelId}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Funil" /></SelectTrigger>
                <SelectContent>{accessibleFunnels.map(f => <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-8" />
            </div>
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Filter className="w-3.5 h-3.5" /> Filtros
                  {activeFilterCount > 0 && <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-0.5">{activeFilterCount}</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Filtros</p>
                    {hasFilters && <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={clearAllFilters}><X className="w-3 h-3" /> Limpar tudo</Button>}
                  </div>
                  {team && team.length > 0 && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Responsável</Label>
                      <Select value={filterAssigned} onValueChange={v => setFilterAssigned(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-8 text-xs"><UserCircle className="w-3 h-3 mr-1" /><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">Todos</SelectItem>
                          {team.map(m => <SelectItem key={m.user_id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-[10px] text-muted-foreground">Data de</Label><Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="h-8 text-xs" /></div>
                    <div><Label className="text-[10px] text-muted-foreground">Data até</Label><Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="h-8 text-xs" /></div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Origem</Label>
                    <Select value={filterSource} onValueChange={v => setFilterSource(v === "all" ? "" : v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent><SelectItem value="all" className="text-xs">Todas origens</SelectItem>{SOURCES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {allTags.length > 0 && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Tag</Label>
                      <Select value={filterTag} onValueChange={v => setFilterTag(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent><SelectItem value="all" className="text-xs">Todas tags</SelectItem>{allTags.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Status</Label>
                    <Select value={filterStatus} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Todos</SelectItem>
                        <SelectItem value="active" className="text-xs">Ativo</SelectItem>
                        <SelectItem value="won" className="text-xs">Vendido</SelectItem>
                        <SelectItem value="lost" className="text-xs">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-[10px] text-muted-foreground">Valor mín</Label><Input type="number" value={filterValueMin} onChange={e => setFilterValueMin(e.target.value)} className="h-8 text-xs" placeholder="0" /></div>
                    <div><Label className="text-[10px] text-muted-foreground">Valor máx</Label><Input type="number" value={filterValueMax} onChange={e => setFilterValueMax(e.target.value)} className="h-8 text-xs" placeholder="∞" /></div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {hasFilters && <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={clearAllFilters}><X className="w-3 h-3" /> Limpar filtros</Button>}
            <Button variant={selectionMode ? "default" : "outline"} size="sm" className="h-8 text-xs gap-1.5" onClick={() => { setSelectionMode(!selectionMode); if (selectionMode) setSelectedLeadIds(new Set()); }}>
              <Checkbox className="w-3.5 h-3.5 pointer-events-none" checked={selectionMode} /> Selecionar
            </Button>
          </div>

          {/* Bulk Actions Bar */}
          {someLeadsSelected && (
            <div className="sticky top-0 z-30 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-2 shadow-lg animate-fade-in">
              <span className="text-xs font-semibold">{selectedLeadIds.size} lead(s) selecionado(s)</span>
              <Separator orientation="vertical" className="h-5 bg-primary-foreground/20" />
              <Select value="" onValueChange={handleBulkMoveStage}>
                <SelectTrigger className="h-7 w-32 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"><ArrowRightLeft className="w-3 h-3 mr-1" /><SelectValue placeholder="Mover etapa" /></SelectTrigger>
                <SelectContent>{stages.map(s => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
              </Select>
              {team && team.length > 0 && (
                <Select value="" onValueChange={handleBulkAssign}>
                  <SelectTrigger className="h-7 w-32 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"><UserCircle className="w-3 h-3 mr-1" /><SelectValue placeholder="Atribuir" /></SelectTrigger>
                  <SelectContent>{team.map(m => <SelectItem key={m.user_id} value={m.user_id} className="text-xs">{m.full_name}</SelectItem>)}</SelectContent>
                </Select>
              )}
              <div className="flex items-center gap-1">
                <Input placeholder="Tag..." value={bulkTagInput} onChange={e => setBulkTagInput(e.target.value)} className="h-7 w-24 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50" />
                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleBulkAddTag} disabled={!bulkTagInput.trim()}><Tag className="w-3 h-3 mr-1" /> Tag</Button>
              </div>
              <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleBulkMarkLost}><XCircle className="w-3 h-3 mr-1" /> Perdido</Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setBulkDeleteLeadsOpen(true)}><Trash2 className="w-3 h-3 mr-1" /> Excluir</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-primary-foreground hover:text-primary-foreground/80 ml-auto" onClick={() => setSelectedLeadIds(new Set())}><X className="w-3 h-3" /></Button>
            </div>
          )}

          {allLeads.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium">Nenhum lead cadastrado</p>
                <p className="text-xs text-muted-foreground mt-1">Adicione leads para começar a gerenciar suas vendas.</p>
                <Button size="sm" className="mt-4 gap-1" onClick={() => setNewLeadOpen(true)}><Plus className="w-3.5 h-3.5" /> Novo Lead</Button>
              </CardContent>
            </Card>
          ) : view === "kanban" ? (
            <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}> collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}> onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {stages.map(stage => {
                  const stageLeads = leadsByStage[stage.key] || [];
                  const colorStyle = getColorStyle(stage.color);
                  return (
                    <div key={stage.key} className="min-w-[260px] max-w-[280px] flex-shrink-0 flex flex-col">
                      <div className={`px-3 py-2 rounded-t-xl border-b-2 ${colorStyle.border} bg-gradient-to-r ${colorStyle.gradient}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md ${colorStyle.light} flex items-center justify-center ${colorStyle.text}`}>
                            {STAGE_ICONS[stage.icon] || <CircleDot className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-xs font-semibold flex-1">{stage.label}</span>
                          {selectionMode && stageLeads.length > 0 && (
                            <Checkbox
                              className="w-3.5 h-3.5"
                              checked={stageLeads.every(l => selectedLeadIds.has(l.id))}
                              onCheckedChange={() => {
                                const ids = stageLeads.map(l => l.id);
                                const allSelected = ids.every(id => selectedLeadIds.has(id));
                                const next = new Set(selectedLeadIds);
                                if (allSelected) ids.forEach(id => next.delete(id));
                                else ids.forEach(id => next.add(id));
                                setSelectedLeadIds(next);
                              }}
                            />
                          )}
                          <Badge variant="outline" className="text-[9px] h-5">{stageLeads.length}</Badge>
                        </div>
                        {(stageValues[stage.key] > 0 || totalPipelineValue > 0) && (
                          <div className="mt-1.5 space-y-1">
                            <span className="text-[10px] font-bold text-primary">R$ {stageValues[stage.key].toLocaleString()}</span>
                            {totalPipelineValue > 0 && <Progress value={(stageValues[stage.key] / totalPipelineValue) * 100} className="h-1" />}
                          </div>
                        )}
                      </div>
                      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                      <DroppableColumn stageKey={stage.key}>
                        {stageLeads.map(lead => (
                          <div key={lead.id} className="relative group/check">
                            {selectionMode && (
                              <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
                                <Checkbox checked={selectedLeadIds.has(lead.id)} onCheckedChange={() => toggleLeadSelection(lead.id)} />
                              </div>
                            )}
                            <DraggableLeadCard lead={lead}
                              onClick={() => setSelectedLead(lead)}
                              stageColor={stage.color}
                              onCopyPhone={() => { if (lead.phone) { navigator.clipboard.writeText(lead.phone); toast({ title: "Telefone copiado" }); } else toast({ title: "Sem telefone", variant: "destructive" }); }}
                              onMarkLost={() => { markAsLost.mutate({ id: lead.id }); toast({ title: "Lead marcado como perdido" }); }}
                              onDelete={() => { deleteLead.mutate(lead.id); toast({ title: "Lead excluído" }); }}
                              onUpdateTemperature={temp => updateLead.mutate({ id: lead.id, temperature: temp })}
                            />
                          </div>
                        ))}
                        {stageLeads.length === 0 && <div className="text-center py-8 text-[11px] text-muted-foreground/50">Arraste leads aqui</div>}
                      </DroppableColumn>
                      </div>
                    </div>
                  );
                })}
              </div>
              <DragOverlay dropAnimation={null} zIndex={100} modifiers={[snapCenterToCursor]}>
                {draggingLead && (
                  <Card className="shadow-xl border-primary/30 w-[260px]">
                    <CardContent className="p-3"><p className="text-sm font-semibold">{draggingLead.name}</p><p className="text-xs text-muted-foreground">{draggingLead.phone}</p></CardContent>
                  </Card>
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30">
                  <Checkbox checked={filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.has(l.id))} onCheckedChange={toggleAllLeads} />
                  <span className="text-[10px] text-muted-foreground font-medium">Selecionar todos</span>
                </div>
                <div className="divide-y">
                  {filteredLeads.map(lead => {
                    const stage = stages.find(s => s.key === lead.stage);
                    const colorStyle = stage ? getColorStyle(stage.color) : getColorStyle("blue");
                    return (
                      <div key={lead.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedLead(lead)}>
                        <Checkbox checked={selectedLeadIds.has(lead.id)} onCheckedChange={() => toggleLeadSelection(lead.id)} onClick={e => e.stopPropagation()} />
                        <div className={`w-2.5 h-2.5 rounded-full ${colorStyle.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{lead.name}</p>
                          <p className="text-[11px] text-muted-foreground">{lead.email || lead.phone || "—"}</p>
                        </div>
                        <Badge variant="outline" className={`text-[9px] ${colorStyle.text} ${colorStyle.border}`}>{stage?.label || lead.stage}</Badge>
                        <span className="text-sm font-semibold text-primary whitespace-nowrap">{lead.value ? `R$ ${Number(lead.value).toLocaleString()}` : "—"}</span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          </>
          )}
        </>
      )}

      <CrmLeadDetailSheet lead={selectedLead} onClose={() => setSelectedLead(null)} stages={stages} />
      <CrmNewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} defaultStage={stages[0]?.key || "novo"} funnelId={selectedFunnelId || undefined} />
      <CrmCsvImportDialog open={csvImportOpen} onOpenChange={setCsvImportOpen} />

      <AlertDialog open={bulkDeleteLeadsOpen} onOpenChange={setBulkDeleteLeadsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedLeadIds.size} lead(s)?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todos os dados associados serão perdidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteLeads} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
