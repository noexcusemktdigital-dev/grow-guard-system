import { useState, useMemo } from "react";
import { TrendingUp, LayoutGrid, List, Settings, Plus, Upload, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CrmAlerts } from "@/components/crm/CrmAlerts";
import { CrmKanban } from "@/components/crm/CrmKanban";
import { CrmList } from "@/components/crm/CrmList";
import { CrmLeadDetail } from "@/components/crm/CrmLeadDetail";
import { CrmConfig } from "@/components/crm/CrmConfig";
import type { Lead, Activity, Task, LeadFile, LeadProposal, FunnelType } from "@/data/crmData";
import {
  mockLeads, mockActivities, mockTasks, mockFiles, mockProposals,
  getAlerts, LEAD_ORIGINS, RESPONSAVEIS, TEMPERATURES, CONTACT_STATUSES,
} from "@/data/crmData";

type ViewType = "kanban" | "list" | "detail" | "config";

export default function CrmExpansao() {
  const { toast } = useToast();
  const [view, setView] = useState<ViewType>("kanban");
  const [activeFunnel, setActiveFunnel] = useState<FunnelType>("franchise");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Data state
  const [leads, setLeads] = useState<Lead[]>([...mockLeads]);
  const [activities, setActivities] = useState<Activity[]>([...mockActivities]);
  const [tasks, setTasks] = useState<Task[]>([...mockTasks]);
  const [files, setFiles] = useState<LeadFile[]>([...mockFiles]);
  const [proposals, setProposals] = useState<LeadProposal[]>([...mockProposals]);

  // Filters
  const [filterResp, setFilterResp] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterTemp, setFilterTemp] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterContact, setFilterContact] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // New Lead dialog
  const [newLeadDialog, setNewLeadDialog] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({ funnel: activeFunnel });

  // Conversion dialog
  const [convertDialog, setConvertDialog] = useState(false);
  const [convertLeadId, setConvertLeadId] = useState<string | null>(null);
  const [convertChecks, setConvertChecks] = useState({ unit: true, contract: true, task: true });

  const hasFilters = filterResp || filterOrigin || filterTemp || filterCity || filterContact || searchQuery;

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (view !== "list" && l.funnel !== activeFunnel) return false;
      if (filterResp && l.responsavel !== filterResp) return false;
      if (filterOrigin && l.origin !== filterOrigin) return false;
      if (filterTemp && l.temperature !== filterTemp) return false;
      if (filterCity && !`${l.cidade} ${l.uf}`.toLowerCase().includes(filterCity.toLowerCase())) return false;
      if (filterContact && l.contactStatus !== filterContact) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!l.nome.toLowerCase().includes(q) && !l.telefone.includes(q) && !l.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [leads, activeFunnel, filterResp, filterOrigin, filterTemp, filterCity, filterContact, searchQuery, view]);

  const alerts = useMemo(() => getAlerts(leads, tasks), [leads, tasks]);

  const clearFilters = () => {
    setFilterResp(""); setFilterOrigin(""); setFilterTemp(""); setFilterCity(""); setFilterContact(""); setSearchQuery("");
  };

  const handleOpenLead = (id: string) => { setSelectedLeadId(id); setView("detail"); };

  const handleMoveLead = (leadId: string, newStage: string) => {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stage: newStage, atualizadoEm: new Date().toISOString() } : l));
    toast({ title: "Lead movido", description: `Movido para "${newStage}"` });
  };

  const handleMarkLost = (leadId: string) => {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, leadStatus: "Perdido", stage: "Oportunidade Perdida", atualizadoEm: new Date().toISOString() } : l));
    toast({ title: "Lead marcado como perdido" });
  };

  const handleConvertStart = (leadId: string) => {
    setConvertLeadId(leadId);
    setConvertChecks({ unit: true, contract: true, task: true });
    setConvertDialog(true);
  };

  const handleConvertConfirm = () => {
    if (!convertLeadId) return;
    const lead = leads.find((l) => l.id === convertLeadId);
    if (!lead) return;

    setLeads((prev) => prev.map((l) => l.id === convertLeadId ? { ...l, leadStatus: "Vendido", stage: "Venda", atualizadoEm: new Date().toISOString() } : l));

    if (lead.funnel === "franchise") {
      if (convertChecks.unit) toast({ title: "Unidade", description: "Criar unidade no módulo Unidades (placeholder)" });
      if (convertChecks.contract) toast({ title: "Contrato", description: "Criar contrato de franquia (placeholder)" });
      if (convertChecks.task) toast({ title: "Onboarding", description: "Tarefa de onboarding criada (placeholder)" });
    } else {
      if (convertChecks.unit) toast({ title: "Cliente", description: "Criar cliente em Receitas (placeholder)" });
      if (convertChecks.contract) toast({ title: "Contrato", description: "Criar contrato de cliente (placeholder)" });
      if (convertChecks.task) toast({ title: "Cobrança", description: "Tarefa: Criar cobrança no Asaas (placeholder)" });
    }

    toast({ title: "Lead convertido!", description: `${lead.nome} marcado como Vendido.` });
    setConvertDialog(false);
    setConvertLeadId(null);
  };

  const handleCreateLead = () => {
    const nl: Lead = {
      id: `lead-${Date.now()}`,
      nome: newLead.nome || "Novo Lead",
      telefone: newLead.telefone || "",
      whatsapp: newLead.whatsapp || "",
      email: newLead.email || "",
      cidade: newLead.cidade || "",
      uf: newLead.uf || "",
      funnel: newLead.funnel || activeFunnel,
      stage: "Novo Lead",
      origin: (newLead.origin as any) || "Orgânico",
      responsavel: newLead.responsavel || RESPONSAVEIS[0],
      temperature: (newLead.temperature as any) || "Frio",
      contactStatus: "Sem contato",
      leadStatus: "Ativo",
      tags: [],
      observacoes: newLead.observacoes || "",
      valorPotencial: newLead.valorPotencial,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      perfil: newLead.perfil,
      capitalDisponivel: newLead.capitalDisponivel,
      prazoDecisao: newLead.prazoDecisao,
      cidadeInteresse: newLead.cidadeInteresse,
      empresa: newLead.empresa,
      segmento: newLead.segmento,
      ticketPotencial: newLead.ticketPotencial,
      dorPrincipal: newLead.dorPrincipal,
    };
    setLeads((prev) => [nl, ...prev]);
    setNewLeadDialog(false);
    setNewLead({ funnel: activeFunnel });
    toast({ title: "Lead criado", description: nl.nome });
  };

  const selectedLead = selectedLeadId ? leads.find((l) => l.id === selectedLeadId) : null;

  // Detail view
  if (view === "detail" && selectedLead) {
    return (
      <div>
        <CrmLeadDetail
          lead={selectedLead}
          onBack={() => setView("kanban")}
          onUpdateLead={(updated) => setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l))}
          onConvert={handleConvertStart}
          allActivities={activities}
          allTasks={tasks}
          allFiles={files}
          allProposals={proposals}
          onAddActivity={(a) => setActivities((prev) => [...prev, a])}
          onAddTask={(t) => setTasks((prev) => [...prev, t])}
          onToggleTask={(tid) => setTasks((prev) => prev.map((t) => t.id === tid ? { ...t, status: t.status === "Concluída" ? "Aberta" : "Concluída" } : t))}
          onAddFile={(f) => setFiles((prev) => [...prev, f])}
          onAddProposal={(p) => setProposals((prev) => [...prev, p])}
        />
        {/* Conversion Dialog */}
        <ConvertDialog
          open={convertDialog}
          onOpenChange={setConvertDialog}
          lead={convertLeadId ? leads.find((l) => l.id === convertLeadId) : undefined}
          checks={convertChecks}
          setChecks={setConvertChecks}
          onConfirm={handleConvertConfirm}
        />
      </div>
    );
  }

  // Config view
  if (view === "config") {
    return (
      <div>
        <CrmConfig onBack={() => setView("kanban")} />
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
      </div>

      {/* Alerts */}
      <CrmAlerts alerts={alerts} />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Funnel selector */}
        <div className="flex bg-muted rounded-lg p-0.5">
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFunnel === "franchise" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveFunnel("franchise")}
          >
            Franquia
          </button>
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFunnel === "clients" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveFunnel("clients")}
          >
            Clientes
          </button>
        </div>

        {/* View toggle */}
        <div className="flex bg-muted rounded-lg p-0.5">
          <button
            className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${view === "kanban" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </button>
          <button
            className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${view === "list" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setView("list")}
          >
            <List className="w-4 h-4" /> Lista
          </button>
        </div>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={() => setView("config")}>
          <Settings className="w-4 h-4 mr-1" /> Configurações
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast({ title: "Importar CSV", description: "Funcionalidade em desenvolvimento" })}>
          <Upload className="w-4 h-4 mr-1" /> Importar CSV
        </Button>
        <Button size="sm" onClick={() => { setNewLead({ funnel: activeFunnel }); setNewLeadDialog(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Novo Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 w-48 text-sm"
          />
        </div>
        <Select value={filterResp} onValueChange={setFilterResp}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>{RESPONSAVEIS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>{LEAD_ORIGINS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterTemp} onValueChange={setFilterTemp}>
          <SelectTrigger className="h-8 w-32 text-sm"><SelectValue placeholder="Temperatura" /></SelectTrigger>
          <SelectContent>{TEMPERATURES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterContact} onValueChange={setFilterContact}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Status contato" /></SelectTrigger>
          <SelectContent>{CONTACT_STATUSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Cidade/UF" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="h-8 w-32 text-sm" />
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
            <X className="w-3 h-3 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Content */}
      {view === "kanban" && (
        <CrmKanban
          leads={filteredLeads}
          funnel={activeFunnel}
          tasks={tasks}
          onOpenLead={handleOpenLead}
          onMoveLead={handleMoveLead}
          onMarkLost={handleMarkLost}
          onConvert={handleConvertStart}
        />
      )}
      {view === "list" && (
        <CrmList
          leads={filteredLeads}
          tasks={tasks}
          onOpenLead={handleOpenLead}
          onMoveLead={handleMoveLead}
        />
      )}

      {/* New Lead Dialog */}
      <Dialog open={newLeadDialog} onOpenChange={setNewLeadDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input value={newLead.nome || ""} onChange={(e) => setNewLead({ ...newLead, nome: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={newLead.telefone || ""} onChange={(e) => setNewLead({ ...newLead, telefone: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={newLead.whatsapp || ""} onChange={(e) => setNewLead({ ...newLead, whatsapp: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={newLead.email || ""} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} /></div>
              <div><Label>Cidade</Label><Input value={newLead.cidade || ""} onChange={(e) => setNewLead({ ...newLead, cidade: e.target.value })} /></div>
              <div><Label>UF</Label><Input value={newLead.uf || ""} onChange={(e) => setNewLead({ ...newLead, uf: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Funil</Label>
                <Select value={newLead.funnel || activeFunnel} onValueChange={(v) => setNewLead({ ...newLead, funnel: v as FunnelType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="franchise">Franquia</SelectItem>
                    <SelectItem value="clients">Clientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Origem</Label>
                <Select value={newLead.origin || ""} onValueChange={(v) => setNewLead({ ...newLead, origin: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{LEAD_ORIGINS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsável</Label>
                <Select value={newLead.responsavel || ""} onValueChange={(v) => setNewLead({ ...newLead, responsavel: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{RESPONSAVEIS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Temperatura</Label>
                <Select value={newLead.temperature || ""} onValueChange={(v) => setNewLead({ ...newLead, temperature: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{TEMPERATURES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Observações</Label><Textarea value={newLead.observacoes || ""} onChange={(e) => setNewLead({ ...newLead, observacoes: e.target.value })} /></div>

            {/* Conditional fields */}
            {(newLead.funnel || activeFunnel) === "franchise" && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <Label>Perfil</Label>
                  <Select value={newLead.perfil || ""} onValueChange={(v) => setNewLead({ ...newLead, perfil: v as any })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investidor">Investidor</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Capital Disponível</Label><Input value={newLead.capitalDisponivel || ""} onChange={(e) => setNewLead({ ...newLead, capitalDisponivel: e.target.value })} /></div>
                <div><Label>Prazo de Decisão</Label><Input value={newLead.prazoDecisao || ""} onChange={(e) => setNewLead({ ...newLead, prazoDecisao: e.target.value })} /></div>
                <div><Label>Cidade de Interesse</Label><Input value={newLead.cidadeInteresse || ""} onChange={(e) => setNewLead({ ...newLead, cidadeInteresse: e.target.value })} /></div>
              </div>
            )}
            {(newLead.funnel || activeFunnel) === "clients" && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div><Label>Empresa</Label><Input value={newLead.empresa || ""} onChange={(e) => setNewLead({ ...newLead, empresa: e.target.value })} /></div>
                <div><Label>Segmento</Label><Input value={newLead.segmento || ""} onChange={(e) => setNewLead({ ...newLead, segmento: e.target.value })} /></div>
                <div><Label>Ticket Potencial</Label><Input type="number" value={newLead.ticketPotencial || ""} onChange={(e) => setNewLead({ ...newLead, ticketPotencial: Number(e.target.value) })} /></div>
                <div><Label>Dor Principal</Label><Input value={newLead.dorPrincipal || ""} onChange={(e) => setNewLead({ ...newLead, dorPrincipal: e.target.value })} /></div>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={handleCreateLead}>Criar Lead</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conversion Dialog */}
      <ConvertDialog
        open={convertDialog}
        onOpenChange={setConvertDialog}
        lead={convertLeadId ? leads.find((l) => l.id === convertLeadId) : undefined}
        checks={convertChecks}
        setChecks={setConvertChecks}
        onConfirm={handleConvertConfirm}
      />
    </div>
  );
}

function ConvertDialog({ open, onOpenChange, lead, checks, setChecks, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void; lead?: Lead;
  checks: { unit: boolean; contract: boolean; task: boolean };
  setChecks: (c: { unit: boolean; contract: boolean; task: boolean }) => void;
  onConfirm: () => void;
}) {
  if (!lead) return null;
  const isFranchise = lead.funnel === "franchise";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Converter Lead — Venda</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Confirme as ações para converter <strong>{lead.nome}</strong>:
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={checks.unit} onCheckedChange={(v) => setChecks({ ...checks, unit: !!v })} />
            {isFranchise ? "Criar Unidade no módulo Unidades" : "Criar Cliente em Receitas"}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={checks.contract} onCheckedChange={(v) => setChecks({ ...checks, contract: !!v })} />
            {isFranchise ? "Criar Contrato de Franquia" : "Criar Contrato de Cliente"}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={checks.task} onCheckedChange={(v) => setChecks({ ...checks, task: !!v })} />
            {isFranchise ? 'Criar tarefa "Iniciar Onboarding"' : 'Criar tarefa "Criar cobrança no Asaas"'}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onConfirm}>Confirmar Venda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
