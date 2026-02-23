import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/KpiCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, DollarSign, Target, TrendingUp, Plus, Phone, Mail,
  Building2, LayoutGrid, List, Eye, ArrowRight, ArrowLeft,
  XCircle, Search, Inbox,
} from "lucide-react";
import { useCrmLeads, useCrmLeadMutations } from "@/hooks/useCrmLeads";
import { toast } from "sonner";

const etapasCRM = ["novo", "contato", "qualificado", "proposta", "negociacao", "ganho", "perdido"];
const etapaLabels: Record<string, string> = {
  novo: "Novo Lead", contato: "Primeiro Contato", qualificado: "Qualificado",
  proposta: "Proposta", negociacao: "Negociação", ganho: "Ganho", perdido: "Perdido",
};
const etapaColors: Record<string, string> = {
  novo: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  contato: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
  qualificado: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  proposta: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  negociacao: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  ganho: "bg-green-500/20 text-green-700 dark:text-green-400",
  perdido: "bg-red-500/20 text-red-700 dark:text-red-400",
};

type ViewType = "kanban" | "list";

export default function FranqueadoCRM() {
  const navigate = useNavigate();
  const { data: leads, isLoading } = useCrmLeads();
  const { createLead, updateLead } = useCrmLeadMutations();

  const [view, setView] = useState<ViewType>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [newLeadDialog, setNewLeadDialog] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", company: "", source: "" });

  const filtered = useMemo(() => {
    return (leads ?? []).filter(l => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !l.company?.toLowerCase().includes(q) && !l.email?.toLowerCase().includes(q)) return false;
      }
      if (filterStage && l.stage !== filterStage) return false;
      return true;
    });
  }, [leads, searchQuery, filterStage]);

  const totalValor = filtered.filter(l => l.stage !== "perdido").reduce((s, l) => s + (Number(l.value) || 0), 0);
  const ganhos = filtered.filter(l => l.stage === "ganho").length;

  function handleCreateLead() {
    if (!newLead.name.trim()) { toast.error("Informe o nome do lead"); return; }
    createLead.mutate({ name: newLead.name, email: newLead.email || undefined, phone: newLead.phone || undefined, company: newLead.company || undefined, source: newLead.source || undefined }, {
      onSuccess: () => { setNewLeadDialog(false); setNewLead({ name: "", email: "", phone: "", company: "", source: "" }); toast.success("Lead criado!"); },
    });
  }

  function handleMoveStage(leadId: string, stage: string) {
    updateLead.mutate({ id: leadId, stage }, { onSuccess: () => toast.success(`Lead movido para "${etapaLabels[stage] || stage}"`) });
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
          <h1 className="page-header-title">CRM</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus leads e oportunidades</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
            <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} className="text-xs h-7" onClick={() => setView("kanban")}><LayoutGrid className="w-3.5 h-3.5 mr-1" /> Kanban</Button>
            <Button size="sm" variant={view === "list" ? "default" : "ghost"} className="text-xs h-7" onClick={() => setView("list")}><List className="w-3.5 h-3.5 mr-1" /> Lista</Button>
          </div>
          <Button size="sm" onClick={() => setNewLeadDialog(true)}><Plus className="w-4 h-4 mr-1" /> Novo Lead</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total de Leads" value={String((leads ?? []).length)} icon={Users} delay={0} />
        <KpiCard label="Pipeline" value={`R$ ${totalValor.toLocaleString()}`} icon={DollarSign} delay={1} variant="accent" />
        <KpiCard label="Ganhos" value={String(ganhos)} icon={Target} delay={2} />
        <KpiCard label="Taxa Conversão" value={`${(leads ?? []).length > 0 ? Math.round((ganhos / (leads ?? []).length) * 100) : 0}%`} icon={TrendingUp} delay={3} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStage} onValueChange={v => setFilterStage(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Todas etapas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas etapas</SelectItem>
            {etapasCRM.map(s => <SelectItem key={s} value={s}>{etapaLabels[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhum lead encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro lead para começar a prospectar.</p>
          <Button size="sm" className="mt-4" onClick={() => setNewLeadDialog(true)}><Plus className="w-4 h-4 mr-1" /> Criar Lead</Button>
        </div>
      )}

      {/* Kanban */}
      {view === "kanban" && filtered.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {etapasCRM.map(stage => {
            const stageLeads = filtered.filter(l => l.stage === stage);
            return (
              <div key={stage} className="min-w-[260px] flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={etapaColors[stage]}>{etapaLabels[stage]}</Badge>
                  <span className="text-xs text-muted-foreground">{stageLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {stageLeads.map(lead => (
                    <Card key={lead.id} className="glass-card hover-lift cursor-pointer group">
                      <CardContent className="p-3">
                        <p className="font-medium text-sm">{lead.name}</p>
                        {lead.company && <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />{lead.company}</p>}
                        {lead.value && Number(lead.value) > 0 && <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" />R$ {Number(lead.value).toLocaleString()}</p>}
                        <div className="hidden group-hover:flex items-center gap-1 mt-2 pt-2 border-t border-border">
                          <Select onValueChange={v => handleMoveStage(lead.id, v)}>
                            <SelectTrigger className="h-6 text-xs"><SelectValue placeholder="Mover..." /></SelectTrigger>
                            <SelectContent>
                              {etapasCRM.filter(s => s !== stage).map(s => <SelectItem key={s} value={s} className="text-xs">{etapaLabels[s]}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {view === "list" && filtered.length > 0 && (
        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id} className="cursor-pointer hover:bg-muted/30">
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.company || "—"}</TableCell>
                  <TableCell>{l.email || "—"}</TableCell>
                  <TableCell><Badge className={etapaColors[l.stage]}>{etapaLabels[l.stage] || l.stage}</Badge></TableCell>
                  <TableCell>{l.value ? `R$ ${Number(l.value).toLocaleString()}` : "—"}</TableCell>
                  <TableCell>{l.source || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* New Lead Dialog */}
      <Dialog open={newLeadDialog} onOpenChange={setNewLeadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Telefone</Label><Input value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>Empresa</Label><Input value={newLead.company} onChange={e => setNewLead(p => ({ ...p, company: e.target.value }))} /></div>
            <div><Label>Origem</Label><Input value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))} placeholder="Ex: Indicação, Site, LinkedIn" /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateLead} disabled={createLead.isPending}>{createLead.isPending ? "Criando..." : "Criar Lead"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
