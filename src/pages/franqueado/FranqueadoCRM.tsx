import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/KpiCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CrmKanbanCard } from "@/components/franqueado/CrmKanbanCard";
import { CrmLeadDetailSheet } from "@/components/franqueado/CrmLeadDetailSheet";
import {
  Users, DollarSign, Target, TrendingUp, Plus, LayoutGrid, List,
  Search, Inbox,
} from "lucide-react";
import { useCrmLeads, useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { useCrmActivities } from "@/hooks/useCrmActivities";
import { useProspections } from "@/hooks/useFranqueadoProspections";
import { useStrategies } from "@/hooks/useFranqueadoStrategies";
import { useCrmProposals } from "@/hooks/useCrmProposals";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const STAGES = [
  "Novo Lead", "Primeiro Contato", "Follow-up", "Diagnóstico",
  "Apresentação de Estratégia", "Proposta", "Venda", "Oportunidade Perdida",
];

const STAGE_COLORS: Record<string, string> = {
  "Novo Lead": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "Primeiro Contato": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
  "Follow-up": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  "Diagnóstico": "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  "Apresentação de Estratégia": "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
  "Proposta": "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  "Venda": "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  "Oportunidade Perdida": "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

const SOURCES = ["Indicação", "Site", "LinkedIn", "WhatsApp", "Meta Leads", "Eventos", "Orgânico"];

type ViewType = "kanban" | "list";

export default function FranqueadoCRM() {
  const { data: leads, isLoading } = useCrmLeads();
  const { createLead, updateLead } = useCrmLeadMutations();
  const { data: prospections } = useProspections();
  const { data: strategies } = useStrategies();
  const { data: proposals } = useCrmProposals();

  const [view, setView] = useState<ViewType>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [newLeadDialog, setNewLeadDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", company: "", source: "", value: "" });

  const { data: activities } = useCrmActivities(selectedLead?.id);

  // Build lookup sets for indicators
  const leadProspections = useMemo(() => {
    const set = new Set<string>();
    (prospections ?? []).forEach((p) => { if (p.lead_id && p.status === "completed") set.add(p.lead_id); });
    return set;
  }, [prospections]);

  const leadStrategies = useMemo(() => {
    const set = new Set<string>();
    (strategies ?? []).forEach((s) => { if (s.lead_id && s.status === "completed") set.add(s.lead_id); });
    return set;
  }, [strategies]);

  const leadProposals = useMemo(() => {
    const map = new Map<string, string>();
    (proposals ?? []).forEach((p) => { if (p.lead_id) map.set(p.lead_id, p.status); });
    return map;
  }, [proposals]);

  const filtered = useMemo(() => {
    return (leads ?? []).filter(l => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !l.company?.toLowerCase().includes(q) && !l.email?.toLowerCase().includes(q) && !l.phone?.toLowerCase().includes(q)) return false;
      }
      if (filterStage && l.stage !== filterStage) return false;
      if (filterSource && l.source !== filterSource) return false;
      return true;
    });
  }, [leads, searchQuery, filterStage, filterSource]);

  const pipelineValue = filtered.filter(l => l.stage !== "Oportunidade Perdida" && l.stage !== "Venda").reduce((s, l) => s + (Number(l.value) || 0), 0);
  const vendas = filtered.filter(l => l.stage === "Venda" || l.won_at).length;
  const totalActive = (leads ?? []).filter(l => !l.lost_at).length;
  const conversionRate = totalActive > 0 ? Math.round((vendas / totalActive) * 100) : 0;

  function handleCreateLead() {
    if (!newLead.name.trim()) { toast.error("Informe o nome do lead"); return; }
    createLead.mutate({
      name: newLead.name,
      email: newLead.email || undefined,
      phone: newLead.phone || undefined,
      company: newLead.company || undefined,
      source: newLead.source || undefined,
      value: newLead.value ? Number(newLead.value) : undefined,
      stage: "Novo Lead",
    }, {
      onSuccess: () => {
        setNewLeadDialog(false);
        setNewLead({ name: "", email: "", phone: "", company: "", source: "", value: "" });
        toast.success("Lead criado!");
      },
    });
  }

  function openLeadDetail(lead: any) {
    setSelectedLead(lead);
    setDetailOpen(true);
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">CRM de Vendas</h1>
          <p className="text-sm text-muted-foreground">Gerencie leads, oportunidades e negociações</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
            <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} className="text-xs h-7" onClick={() => setView("kanban")}>
              <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Kanban
            </Button>
            <Button size="sm" variant={view === "list" ? "default" : "ghost"} className="text-xs h-7" onClick={() => setView("list")}>
              <List className="w-3.5 h-3.5 mr-1" /> Lista
            </Button>
          </div>
          <Button size="sm" onClick={() => setNewLeadDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total de Leads" value={String((leads ?? []).length)} icon={Users} delay={0} />
        <KpiCard label="Pipeline" value={`R$ ${pipelineValue.toLocaleString()}`} icon={DollarSign} delay={1} variant="accent" />
        <KpiCard label="Vendas" value={String(vendas)} icon={Target} delay={2} />
        <KpiCard label="Taxa Conversão" value={`${conversionRate}%`} icon={TrendingUp} delay={3} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStage} onValueChange={v => setFilterStage(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Todas etapas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas etapas</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={v => setFilterSource(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Todas origens" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhum lead encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro lead para começar a prospectar.</p>
          <Button size="sm" className="mt-4" onClick={() => setNewLeadDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Criar Lead
          </Button>
        </div>
      )}

      {/* Kanban */}
      {view === "kanban" && filtered.length > 0 && (
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-4 min-w-max">
            {STAGES.map(stage => {
              const stageLeads = filtered.filter(l => l.stage === stage);
              return (
                <div key={stage} className="w-[270px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <Badge className={`${STAGE_COLORS[stage]} text-[11px]`}>{stage}</Badge>
                    <span className="text-xs text-muted-foreground font-medium">{stageLeads.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[120px] bg-muted/20 rounded-lg p-2">
                    {stageLeads.map(lead => (
                      <CrmKanbanCard
                        key={lead.id}
                        lead={lead}
                        hasProspection={leadProspections.has(lead.id)}
                        hasStrategy={leadStrategies.has(lead.id)}
                        hasProposal={leadProposals.has(lead.id)}
                        proposalAccepted={leadProposals.get(lead.id) === "accepted"}
                        onClick={() => openLeadDetail(lead)}
                      />
                    ))}
                    {stageLeads.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/40 text-center py-8">Sem leads</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* List */}
      {view === "list" && filtered.length > 0 && (
        <Card className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openLeadDetail(l)}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.company || "—"}</TableCell>
                  <TableCell>{l.phone || "—"}</TableCell>
                  <TableCell><Badge className={`${STAGE_COLORS[l.stage]} text-[11px]`}>{l.stage}</Badge></TableCell>
                  <TableCell>{l.value ? `R$ ${Number(l.value).toLocaleString()}` : "—"}</TableCell>
                  <TableCell>{l.source || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Lead Detail Sheet */}
      <CrmLeadDetailSheet
        lead={selectedLead}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        activities={activities ?? []}
      />

      {/* New Lead Dialog */}
      <Dialog open={newLeadDialog} onOpenChange={setNewLeadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Empresa</Label><Input value={newLead.company} onChange={e => setNewLead(p => ({ ...p, company: e.target.value }))} /></div>
              <div><Label>Valor potencial (R$)</Label><Input type="number" value={newLead.value} onChange={e => setNewLead(p => ({ ...p, value: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={newLead.source} onValueChange={v => setNewLead(p => ({ ...p, source: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a origem" /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLeadDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateLead} disabled={createLead.isPending}>
              {createLead.isPending ? "Criando..." : "Criar Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
